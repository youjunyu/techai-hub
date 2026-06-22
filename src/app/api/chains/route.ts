import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: chains, error } = await supabaseAdmin
      .from('tai_industry_chains')
      .select('*, creator:tai_users(name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ chains: chains || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch chains' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, is_public, layers } = await request.json()
    
    const { data: chain, error } = await supabaseAdmin
      .from('tai_industry_chains')
      .insert({
        name,
        description: description || '',
        is_public: is_public ?? true,
        creator_id: user.id
      })
      .select()
      .single()

    if (error) throw error

    // Insert layers if provided
    if (layers && Array.isArray(layers)) {
      const layerRows = layers.map((l: any) => ({
        chain_id: chain.id,
        layer_name: l.layer_name,
        layer_order: l.layer_order,
        description: l.description || '',
        key_metrics: l.key_metrics || ''
      }))
      await supabaseAdmin.from('tai_chain_layers').insert(layerRows)
    }

    return NextResponse.json({ chain })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create chain' }, { status: 500 })
  }
}
