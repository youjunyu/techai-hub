import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    let query = supabaseAdmin
      .from('tai_daily_reports')
      .select('*')
      .order('report_date', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (date) {
      query = query.eq('report_date', date)
    }

    const { data: reports, error } = await query

    if (error) throw error
    return NextResponse.json({ reports: reports || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
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

    const { title, report_date, content } = await request.json()

    const { data, error } = await supabaseAdmin
      .from('tai_daily_reports')
      .insert({
        user_id: user.id,
        title,
        report_date,
        content
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ report: data })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}
