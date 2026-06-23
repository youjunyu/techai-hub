import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendReportEmail } from '@/lib/email'

// POST - Send an existing report via email
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reportId } = await request.json()

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    // Get report
    const { data: report, error: reportError } = await supabaseAdmin()
      .from('tai_daily_reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Get user's email
    const { data: userData } = await supabaseAdmin()
      .from('tai_users')
      .select('report_email, name')
      .eq('id', user.id)
      .single()

    const email = userData?.report_email || '5581012@qq.com'

    // Send email
    const emailResult = await sendReportEmail(
      email,
      report.title,
      report.report_date,
      report.content as any
    )

    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.error || 'Email send failed' }, { status: 500 })
    }

    // Mark as sent
    await supabaseAdmin()
      .from('tai_daily_reports')
      .update({ is_sent: true, sent_at: new Date().toISOString() })
      .eq('id', reportId)

    return NextResponse.json({ message: 'Email sent successfully' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
