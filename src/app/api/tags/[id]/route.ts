import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/tags/[id] - Get tag detail with stocks and related news
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get tag with stocks
    const { data: tag, error: tagError } = await supabaseAdmin
      .from('tai_tags')
      .select(`
        *,
        stocks:tai_stocks(*)
      `)
      .eq('id', id)
      .single()

    if (tagError || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    // Get related news
    const { data: news } = await supabaseAdmin
      .from('tai_news')
      .select('id, title, source, importance, published_at')
      .or(`tags.cs.{${tag.name}},title.ilike.%${tag.name}%`)
      .order('published_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      tag: {
        ...tag,
        news: news || [],
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
