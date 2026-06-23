import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateNewsSummary } from '@/lib/ai-summary'
import { logApiError } from '@/lib/logger'

// Process unprocessed news items with AI summary
// Can be called by cron or manually from admin
export async function POST(request: NextRequest) {
  try {
    // Auth check (same as crawler)
    const authHeader = request.headers.get('authorization')
    const isCron = request.headers.get('x-cron-secret') === process.env.CRON_SECRET
    const isAdmin = authHeader?.startsWith('Bearer ')

    if (!isCron && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get batch size from query param (default 10)
    const url = new URL(request.url)
    const batchSize = parseInt(url.searchParams.get('batch') || '10')

    // Fetch unprocessed news
    const { data: news, error } = await supabaseAdmin()
      .from('tai_news')
      .select('id, title, summary')
      .eq('is_processed', false)
      .order('published_at', { ascending: false })
      .limit(batchSize)

    if (error) {
      return NextResponse.json({ error: 'DB error: ' + error.message }, { status: 500 })
    }

    if (!news || news.length === 0) {
      return NextResponse.json({ message: 'No unprocessed news', processed: 0 })
    }

    // Process each with AI
    const results = []
    for (const item of news) {
      try {
        const aiSummary = await generateNewsSummary(item.title, item.summary || '')
        const { error: updateError } = await supabaseAdmin()
          .from('tai_news')
          .update({
            summary: aiSummary || item.summary || item.title,
            is_processed: true,
          })
          .eq('id', item.id)

        results.push({
          id: item.id,
          title: item.title.substring(0, 50),
          status: updateError ? 'db_error' : 'ok',
        })
      } catch (e: any) {
        await logApiError('ai-summary', e, { newsId: item.id, title: item.title })
        results.push({
          id: item.id,
          title: item.title.substring(0, 50),
          status: 'ai_error: ' + e.message,
        })
      }
    }

    const successCount = results.filter(r => r.status === 'ok').length

    return NextResponse.json({
      message: `Processed ${successCount}/${news.length} news items`,
      processed: successCount,
      total: news.length,
      results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'AI process failed' }, { status: 500 })
  }
}
