import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateNewsSummary } from '@/lib/ai-summary'

// POST /api/news/summarize - Generate AI summaries for recent news
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { limit = 20, category } = body

    let query = supabaseAdmin()
      .from('tai_news')
      .select('id, title, content')
      .or('summary.is.null,summary.eq.')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: news, error } = await query

    if (error) throw error

    if (!news || news.length === 0) {
      return NextResponse.json({ message: 'No news items need summarization', updated: 0 })
    }

    const results = []
    for (const item of news) {
      try {
        const summary = await generateNewsSummary(item.title, item.content || item.title)
        if (summary) {
          await supabaseAdmin()
            .from('tai_news')
            .update({ summary })
            .eq('id', item.id)
          results.push({ id: item.id, success: true, summary })
        }
      } catch (e) {
        results.push({ id: item.id, success: false, error: (e as Error).message })
      }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300))
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      message: `Summarized ${successCount}/${news.length} articles`,
      results: results.slice(0, 5),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Summarization failed' }, { status: 500 })
  }
}
