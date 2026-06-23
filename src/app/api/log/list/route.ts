import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logApiError } from '@/lib/logger'

const CRON_SECRET = process.env.CRON_SECRET || 'techai-hub-cron-secret-2026'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      const token = authHeader?.split(' ')[1]
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const { data: { user } } = await supabaseAdmin().auth.getUser(token)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = request.nextUrl
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const source = searchParams.get('source')

    let query = supabaseAdmin()
      .from('tai_error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (source) {
      query = query.eq('source', source)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ logs: data || [], count })
  } catch (e: any) {
    await logApiError('/api/log/list', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}