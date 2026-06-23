/**
 * AI News Summary Service
 * Generates summaries for news articles using Kimi API
 */

import { logCrawlerError } from './logger'

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.stepfun.com/v1'
const AI_API_KEY = process.env.AI_API_KEY
const AI_MODEL = process.env.AI_MODEL || 'stepfun/step-3.7-flash'

// Smart URL builder: handles various base URL formats
function getChatUrl(): string {
  const base = AI_BASE_URL.trim().replace(/\/$/, '')
  if (base.endsWith('/v1')) {
    return `${base}/chat/completions`
  }
  if (base.includes('/v1/')) {
    return `${base}/chat/completions`
  }
  return `${base}/v1/chat/completions`
}

export async function generateNewsSummary(title: string, content: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(getChatUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的科技新闻编辑。请为以下新闻生成简洁的中文摘要（100字以内），突出核心信息和投资相关要点。',
          },
          {
            role: 'user',
            content: `标题：${title}\n\n正文：${content || title}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown')
      console.error('AI summary API error:', response.status, errorText)
      await logCrawlerError('ai-summary', new Error(`AI API ${response.status}: ${errorText}`), {
        title,
        url: getChatUrl(),
        status: response.status,
      })
      return '' // fallback: return empty, crawler will use original content
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch (e: any) {
    if (e.name === 'AbortError') {
      console.error('AI summary timeout')
      await logCrawlerError('ai-summary', new Error('AI summary timeout'), { title })
    } else {
      console.error('AI summary error:', e)
      await logCrawlerError('ai-summary', e, { title, url: getChatUrl() })
    }
    return ''
  }
}

export async function batchSummarizeNews(newsItems: { id: string; title: string; content?: string }[], batchSize = 5): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  
  for (let i = 0; i < newsItems.length; i += batchSize) {
    const batch = newsItems.slice(i, i + batchSize)
    const promises = batch.map(async (item) => {
      const summary = await generateNewsSummary(item.title, item.content || '')
      results.set(item.id, summary)
    })
    await Promise.all(promises)
    // Small delay between batches
    if (i + batchSize < newsItems.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return results
}
