import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('tai_news')
      .select('*')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: news, error } = await query

    if (error) throw error
    return NextResponse.json({ news: news || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(authHeader.split(' ')[1])
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await request.json()
    const newsItems = Array.isArray(items) ? items : [items]

    const rows = newsItems.map((n: any) => ({
      title: n.title,
      source: n.source || 'unknown',
      url: n.url || '',
      summary: n.summary || '',
      content: n.content || '',
      published_at: n.published_at || new Date().toISOString(),
      category: n.category || 'general',
      importance: n.importance || 3,
      tags: n.tags || [],
      is_processed: false
    }))

    const { data, error } = await supabaseAdmin
      .from('tai_news')
      .insert(rows)
      .select()

    if (error) throw error
    return NextResponse.json({ news: data })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create news' }, { status: 500 })
  }
}
