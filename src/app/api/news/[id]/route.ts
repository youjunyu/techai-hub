import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/news/[id] - Get single news item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: news, error } = await supabaseAdmin
      .from('tai_news')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !news) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 })
    }

    // Increment view count
    await supabaseAdmin
      .from('tai_news')
      .update({ view_count: (news.view_count || 0) + 1 })
      .eq('id', id)

    return NextResponse.json({ news })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
