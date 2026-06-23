import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://agent-gw.kimi.com/coding'
const AI_API_KEY = process.env.AI_API_KEY
const AI_MODEL = process.env.AI_MODEL || 'stepfun/step-3.7-flash'

// POST /api/tags/analyze - AI analysis of a tag/sector
export async function POST(request: NextRequest) {
  try {
    const { tagId, tagName, category } = await request.json()

    if (!tagName) {
      return NextResponse.json({ error: 'tagName required' }, { status: 400 })
    }

    // Get stocks for this tag
    const { data: tagStocks } = await supabaseAdmin()
      .from('tai_tags')
      .select(`
        *,
        stocks:tai_stocks(*)
      `)
      .eq('id', tagId)
      .single()

    const stocks = (tagStocks as any)?.stocks || []

    // Get recent news mentioning this tag
    const { data: news } = await supabaseAdmin()
      .from('tai_news')
      .select('title, summary, importance, published_at')
      .or(`tags.cs.{${tagName}},title.ilike.%${tagName}%`)
      .order('published_at', { ascending: false })
      .limit(10)

    const stockContext = stocks.length > 0
      ? stocks.map((s: any) => `${s.name}(${s.code}): ${s.core_logic || '暂无分析'}`).join('\n')
      : '暂无关联股票'

    const newsContext = (news || []).map((n: any) =>
      `[${n.importance}级] ${n.title} - ${n.summary || '无摘要'}`
    ).join('\n') || '暂无相关新闻'

    const prompt = `你是一个专业的AI科技投资分析师。请对"${tagName}"(${category})赛道进行深度分析。

=== 关联股票 ===
${stockContext}

=== 相关新闻 ===
${newsContext}

请生成一份结构化分析，包含以下内容（用中文）：
1. 赛道概况（100字以内）
2. 核心驱动因素（3条）
3. 投资逻辑（2-3条）
4. 主要风险（2条）
5. 重点关注标的（从关联股票中选出2-3只，说明理由）

格式要求：用简洁的段落式中文，不要用JSON。`

    const response = await fetch(`${AI_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('AI analysis API error:', error)
      return NextResponse.json({ error: 'AI API failed' }, { status: 500 })
    }

    const data = await response.json()
    const analysis = data.choices?.[0]?.message?.content || '分析生成失败'

    return NextResponse.json({ analysis })
  } catch (e: any) {
    console.error('Tag analysis error:', e)
    return NextResponse.json({ error: e.message || 'Analysis failed' }, { status: 500 })
  }
}
