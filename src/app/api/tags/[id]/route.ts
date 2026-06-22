import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: tag, error } = await supabaseAdmin
      .from('tai_tags')
      .select('*, stocks:tai_stocks(*)')
      .eq('id', id)
      .single()

    if (error || !tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json({ tag })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch tag' }, { status: 500 })
  }
}
