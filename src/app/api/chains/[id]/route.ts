import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { data: chain, error } = await supabaseAdmin
      .from('tai_industry_chains')
      .select('*, creator:tai_users(name)')
      .eq('id', id)
      .single()

    if (error || !chain) {
      return NextResponse.json({ error: 'Chain not found' }, { status: 404 })
    }

    // Check if user can access (public or owner)
    const authHeader = request.headers.get('authorization')
    let isOwner = false
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      if (user?.id === chain.creator_id) isOwner = true
    }

    if (!chain.is_public && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get layers and nodes
    const { data: layers } = await supabaseAdmin
      .from('tai_chain_layers')
      .select('*')
      .eq('chain_id', id)
      .order('layer_order', { ascending: true })

    if (layers) {
      for (const layer of layers) {
        const { data: nodes } = await supabaseAdmin
          .from('tai_chain_nodes')
          .select('*')
          .eq('layer_id', layer.id)
          .order('created_at', { ascending: true })
        layer.nodes = nodes || []
      }
    }

    return NextResponse.json({ chain: { ...chain, layers } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch chain' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params
    const { name, description, is_public, layers } = await request.json()

    const { data: chain, error } = await supabaseAdmin
      .from('tai_industry_chains')
      .update({ name, description, is_public: is_public ?? true })
      .eq('id', id)
      .eq('creator_id', user.id)
      .select()
      .single()

    if (error || !chain) {
      return NextResponse.json({ error: 'Chain not found or not authorized' }, { status: 404 })
    }

    // Update layers if provided
    if (layers && Array.isArray(layers)) {
      // Delete old layers and nodes
      const { data: oldLayers } = await supabaseAdmin
        .from('tai_chain_layers')
        .select('id')
        .eq('chain_id', id)
      
      if (oldLayers) {
        for (const l of oldLayers) {
          await supabaseAdmin.from('tai_chain_nodes').delete().eq('layer_id', l.id)
        }
        await supabaseAdmin.from('tai_chain_layers').delete().eq('chain_id', id)
      }

      // Insert new layers
      const layerRows = layers.map((l: any) => ({
        chain_id: id,
        layer_name: l.layer_name,
        layer_order: l.layer_order,
        description: l.description || '',
        key_metrics: l.key_metrics || ''
      }))
      await supabaseAdmin.from('tai_chain_layers').insert(layerRows)
    }

    return NextResponse.json({ chain })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update chain' }, { status: 500 })
  }
}
