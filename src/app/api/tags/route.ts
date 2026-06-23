import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - List tags with optional stock count
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let query = supabaseAdmin
      .from('tai_tags')
      .select('*')
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: tags, error } = await query

    if (error) throw error

    // Get stock counts for each tag
    const tagsWithStocks = await Promise.all(
      (tags || []).map(async (tag: any) => {
        const { data: stocks } = await supabaseAdmin
          .from('tai_stocks')
          .select('id')
          .eq('tag_id', tag.id)
        
        return {
          ...tag,
          stocks: stocks || []
        }
      })
    )

    return NextResponse.json({ tags: tagsWithStocks })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}
