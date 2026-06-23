import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CRON_SECRET = process.env.CRON_SECRET || 'techai-hub-cron-secret-2026'

// 手动触发定时任务：爬取 + 生成报告
export async function POST(request: NextRequest) {
  try {
    // 验证权限
    const authHeader = request.headers.get('authorization')
    const secret = request.nextUrl.searchParams.get('secret')

    if (authHeader !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET) {
      // 也允许已登录管理员触发
      const token = authHeader?.split(' ')[1]
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const { data: { user } } = await supabaseAdmin().auth.getUser(token)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json().catch(() => ({}))
    const { runCrawler = true, runReport = true, sources = 'all' } = body

    const results: any = {}

    // 1. 运行爬虫
    if (runCrawler) {
      console.log('[Cron] Running crawler...')
      const crawlerRes = await fetch(`${request.nextUrl.origin}/api/crawler/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources }),
      })
      results.crawler = await crawlerRes.json()
    }

    // 2. 生成日报
    if (runReport) {
      console.log('[Cron] Running daily report...')
      const reportRes = await fetch(`${request.nextUrl.origin}/api/cron/daily-report?secret=${CRON_SECRET}`, {
        headers: { 'Authorization': `Bearer ${CRON_SECRET}` },
      })
      results.report = await reportRes.json()
    }

    return NextResponse.json({
      message: '定时任务执行完成',
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (e: any) {
    console.error('[Cron Execute] Error:', e)
    return NextResponse.json({ error: e.message || 'Cron execution failed' }, { status: 500 })
  }
}

// GET - 检查定时任务状态（用于外部 cron 服务调用）
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret')
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取配置
    const { data: config } = await supabaseAdmin()
      .from('tai_cron_config')
      .select('*')
      .eq('id', 'default')
      .single()

    // 获取上次执行时间
    const { data: lastRun } = await supabaseAdmin()
      .from('tai_cron_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      config: config || {
        enabled: true,
        morning_time: '08:00',
        evening_time: '20:00',
      },
      lastRun: lastRun || null,
      serverTime: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
