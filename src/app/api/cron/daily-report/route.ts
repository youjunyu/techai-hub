import { NextRequest, NextResponse } from 'next/server'
import { generateDailyReport } from '@/lib/ai-report'
import { supabaseAdmin } from '@/lib/supabase'

// Cron endpoint for daily report generation
// Protected by a secret token
const CRON_SECRET = process.env.CRON_SECRET || 'techai-hub-cron-secret-2026'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const secret = request.nextUrl.searchParams.get('secret')

    if (authHeader !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin()
      .from('tai_users')
      .select('id, report_email')

    if (usersError) throw usersError

    const results = []

    // Generate and send report for each user
    for (const user of users || []) {
      try {
        // Check if report already exists for today
        const today = new Date().toISOString().split('T')[0]
        const { data: existing } = await supabaseAdmin()
          .from('tai_daily_reports')
          .select('id, is_sent')
          .eq('user_id', user.id)
          .eq('report_date', today)
          .single()

        if (existing) {
          results.push({ userId: user.id, status: 'skipped', reason: 'already exists' })
          continue
        }

        // Generate report
        const reportResult = await generateDailyReport(user.id, user.report_email || '5581012@qq.com')

        if (reportResult.success && reportResult.reportId) {
          results.push({ userId: user.id, status: 'generated', reportId: reportResult.reportId })
        } else {
          results.push({ userId: user.id, status: 'failed', error: reportResult.error })
        }
      } catch (e: any) {
        results.push({ userId: user.id, status: 'error', error: e.message })
      }
    }

    return NextResponse.json({
      message: 'Daily report cron completed',
      results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Cron failed' }, { status: 500 })
  }
}
