import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - List all tags
export async function GET() {
  try {
    const { data: tags, error } = await supabaseAdmin
      .from('tai_tags')
      .select('*')
      .order('category')
      .order('name')

    if (error) throw error
    return NextResponse.json({ tags })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, description, color } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'name and category required' }, { status: 400 })
    }

    const { data: tag, error } = await supabaseAdmin
      .from('tai_tags')
      .insert({ name, category, description, color })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ tag })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('tai_tags').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
