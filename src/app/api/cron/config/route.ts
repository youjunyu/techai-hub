import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CRON_SECRET = process.env.CRON_SECRET || 'techai-hub-cron-secret-2026'

// GET - 获取定时任务配置
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      // 也允许已登录用户查看（只读）
      const token = request.headers.get('authorization')?.split(' ')[1]
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const { data: { user } } = await supabaseAdmin().auth.getUser(token)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { data: config, error } = await supabaseAdmin()
      .from('tai_cron_config')
      .select('*')
      .eq('id', 'default')
      .single()

    if (error || !config) {
      // 返回默认配置
      return NextResponse.json({
        config: {
          id: 'default',
          enabled: true,
          morning_time: '08:00',
          evening_time: '20:00',
          sources: ['36kr', 'jiqizhixin', 'qbitai', 'cailian', 'ithome', 'leifeng', 'icviews', 'mydrivers', 'eastmoney', 'netease'],
          generate_report: true,
          send_email: false,
          updated_at: new Date().toISOString(),
        }
      })
    }

    return NextResponse.json({ config })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST/PUT - 更新定时任务配置
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

    const body = await request.json()
    const { enabled, morning_time, evening_time, sources, generate_report, send_email } = body

    const { data: config, error } = await supabaseAdmin()
      .from('tai_cron_config')
      .upsert({
        id: 'default',
        enabled: enabled !== undefined ? enabled : true,
        morning_time: morning_time || '08:00',
        evening_time: evening_time || '20:00',
        sources: sources || ['36kr', 'jiqizhixin', 'qbitai', 'cailian'],
        generate_report: generate_report !== undefined ? generate_report : true,
        send_email: send_email !== undefined ? send_email : false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ config, message: '定时任务配置已更新' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  return POST(request)
}
