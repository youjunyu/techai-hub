import { NextRequest, NextResponse } from 'next/server'
import { generateDailyReport } from '@/lib/ai-report'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Generate a new daily report
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

    // Get user's report email
    const { data: userData } = await supabaseAdmin
      .from('tai_users')
      .select('report_email, name')
      .eq('id', user.id)
      .single()

    const reportEmail = userData?.report_email || '5581012@qq.com'

    // Generate report
    const result = await generateDailyReport(user.id, reportEmail)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Report generation failed' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Report generated successfully',
      reportId: result.reportId,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
