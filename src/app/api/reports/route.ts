import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - List reports (with optional userId filter)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin()
      .from('tai_daily_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: reports, error } = await query

    if (error) throw error

    return NextResponse.json({ reports: reports || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
