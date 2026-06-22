import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: report, error } = await supabaseAdmin
      .from('tai_daily_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
