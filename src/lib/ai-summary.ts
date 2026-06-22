/**
 * AI News Summary Service
 * Generates summaries for news articles using Kimi API
 */

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://agent-gw.kimi.com/coding'
const AI_API_KEY = process.env.AI_API_KEY
const AI_MODEL = process.env.AI_MODEL || 'stepfun/step-3.7-flash'

export async function generateNewsSummary(title: string, content: string): Promise<string> {
  try {
    const response = await fetch(`${AI_BASE_URL}/v1/chat/completions`, {
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
    })

    if (!response.ok) {
      console.error('AI summary API error:', response.status)
      return ''
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch (e) {
    console.error('AI summary error:', e)
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
