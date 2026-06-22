import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: tags, error } = await supabaseAdmin
      .from('tai_tags')
      .select('*, stocks:tai_stocks(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ tags: tags || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, category, description } = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('tai_tags')
      .insert({ name, category, description })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ tag: data })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
