import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: chain, error } = await supabaseAdmin
      .from('tai_industry_chains')
      .select(`
        *,
        layers:tai_chain_layers(
          *,
          nodes:tai_chain_nodes(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !chain) {
      return NextResponse.json({ error: 'Chain not found' }, { status: 404 })
    }

    return NextResponse.json({ chain })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch chain' }, { status: 500 })
  }
}
