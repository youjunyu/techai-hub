import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - List all stocks
export async function GET() {
  try {
    const { data: stocks, error } = await supabaseAdmin()
      .from('tai_stocks')
      .select('*')
      .order('sector')
      .order('name')

    if (error) throw error
    return NextResponse.json({ stocks })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST - Create a new stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, market, sector, description, core_logic, tags } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'name and code required' }, { status: 400 })
    }

    const { data: stock, error } = await supabaseAdmin()
      .from('tai_stocks')
      .insert({ name, code, market, sector, description, core_logic, tags })
      .select()
      .single()

    if (error) throw error

    // If tags provided, link them
    if (tags && tags.length > 0) {
      const { data: tagRecords } = await supabaseAdmin()
        .from('tai_tags')
        .select('id')
        .in('name', tags)

      if (tagRecords && tagRecords.length > 0 && stock.id) {
        const links = tagRecords.map((t: any) => ({
          tag_id: t.id,
          stock_id: stock.id,
        }))
        await supabaseAdmin().from('tai_tag_stocks').insert(links)
      }
    }

    return NextResponse.json({ stock })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
