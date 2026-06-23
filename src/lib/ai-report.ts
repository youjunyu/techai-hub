/**
 * AI Report Generation Service
 * Uses Kimi API to generate daily investment analysis reports
 */

import { supabaseAdmin } from '@/lib/supabase'
import { logApiError } from '@/lib/logger'

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

export interface NewsItem {
  id: string
  title: string
  source: string
  url: string
  summary: string | null
  content: string | null
  published_at: string | null
  category: string | null
  importance: number
  tags: string[] | null
}

export interface TagInfo {
  id: string
  name: string
  category: string
  stocks: { id: string; code: string; name: string; market: string; sector: string | null; core_logic: string | null }[]
}

export interface ChainInfo {
  id: string
  name: string
  description: string
  layers: {
    layer_name: string
    layer_order: number
    description: string | null
    nodes: { node_name: string; node_type: string; related_stocks: string[] }[]
  }[]
}

export interface ReportContent {
  headline_summary: {
    title: string
    source: string
    importance: number
    summary: string
  }[]
  industry_updates: {
    chain_name: string
    updates: string[]
  }[]
  tag_analysis: {
    tag_name: string
    outlook: string
    stocks: {
      code: string
      name: string
      analysis: string
      risk: string
    }[]
  }[]
  investment_advice: string
}

async function callAI(prompt: string): Promise<string> {
  const response = await fetch(getChatUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
      'User-Agent': 'Kimi Claw Plugin',
      'X-Kimi-Claw-ID': '19cdc7d5-20b2-8533-8000-00002b74f06c',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的AI科技投资分析师。你的任务是基于最新的科技资讯和产业链数据，生成每日投资分析报告。
报告要求：
1. 头条摘要：选取3-5条最重要的新闻，给出简洁的标题+摘要+重要性评级
2. 产业链动态：分析各产业链的最新进展和影响
3. 标签分析：针对HBM存储、光模块、人形机器人等标签进行深度分析
4. 投资建议：给出具体的操作建议和风险提示
格式：请用JSON格式返回，包含 headline_summary, industry_updates, tag_analysis, investment_advice 四个字段。
注意：风险提示必须包含至少3条具体风险因素。`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown')
    console.error('AI API error:', errorText)
    await logApiError('/api/reports/generate', new Error(`AI API ${response.status}: ${errorText}`), {
      url: getChatUrl(),
      status: response.status,
    })
    throw new Error(`AI API failed: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function generateDailyReport(userId: string, reportEmail: string): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    // 1. Fetch latest news (last 24 hours)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { data: news, error: newsError } = await supabaseAdmin()
      .from('tai_news')
      .select('*')
      .gte('published_at', oneDayAgo.toISOString())
      .order('importance', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(30)

    if (newsError) throw newsError

    // 2. Fetch tags with stocks
    const { data: tags, error: tagsError } = await supabaseAdmin()
      .from('tai_tags')
      .select(`
        *,
        stocks:tai_stocks(*)
      `)

    if (tagsError) throw tagsError

    // 3. Fetch industry chains with layers
    const { data: chains, error: chainsError } = await supabaseAdmin()
      .from('tai_industry_chains')
      .select(`
        *,
        layers:tai_chain_layers(
          *,
          nodes:tai_chain_nodes(*)
        )
      `)
      .eq('is_public', true)

    if (chainsError) throw chainsError

    // 4. Build prompt
    const newsContext = (news || []).map((n: NewsItem) =>
      `[${n.importance}级] ${n.title}\n来源: ${n.source}\n摘要: ${n.summary || '无'}\n分类: ${n.category || '其他'}\n`
    ).join('\n')

    const tagContext = (tags || []).map((t: TagInfo) =>
      `标签: ${t.name} (${t.category})\n关联标的: ${t.stocks?.map((s: any) => `${s.name}(${s.code})`).join(', ') || '无'}\n`
    ).join('\n')

    const chainContext = (chains || []).map((c: ChainInfo) =>
      `产业链: ${c.name}\n层级: ${c.layers?.map((l: any) => `${l.layer_name}: ${l.nodes?.map((n: any) => n.node_name).join(', ')}`).join(' | ')}\n`
    ).join('\n')

    const prompt = `请基于以下数据生成今日AI科技投资分析日报：

=== 今日头条资讯 ===
${newsContext || '暂无新资讯'}

=== 科技标签 ===
${tagContext || '暂无标签'}

=== 产业链 ===
${chainContext || '暂无产业链数据'}

请以专业的投资分析师视角，生成一份结构化的日报。`

    // 5. Call AI
    const aiResponse = await callAI(prompt)

    // 6. Parse AI response
    let reportContent: ReportContent
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        reportContent = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON in response')
      }
    } catch {
      // Fallback: wrap plain text
      reportContent = {
        headline_summary: (news || []).slice(0, 5).map((n: NewsItem) => ({
          title: n.title,
          source: n.source,
          importance: n.importance,
          summary: n.summary || n.title,
        })),
        industry_updates: [],
        tag_analysis: [],
        investment_advice: aiResponse,
      }
    }

    // 7. Save report to database
    const today = new Date().toISOString().split('T')[0]
    const { data: report, error: saveError } = await supabaseAdmin()
      .from('tai_daily_reports')
      .insert({
        user_id: userId,
        report_date: today,
        title: `AI科技投资日报 ${today}`,
        content: reportContent,
        is_sent: false,
      })
      .select()
      .single()

    if (saveError) throw saveError

    return { success: true, reportId: report.id }
  } catch (e: any) {
    console.error('Report generation error:', e)
    return { success: false, error: e.message }
  }
}
