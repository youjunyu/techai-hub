import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logApiError } from '@/lib/logger'

const CRON_SECRET = process.env.CRON_SECRET || 'techai-hub-cron-secret-2026'

export async function POST(request: NextRequest) {
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

    const { data, error } = await supabaseAdmin()
      .from('tai_error_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // delete all

    if (error) throw error

    return NextResponse.json({ message: 'Logs cleared', count: data?.length || 0 })
  } catch (e: any) {
    await logApiError('/api/log/clear', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
