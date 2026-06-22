import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {} as Record<string, { status: string; detail?: string }>,
  }

  // Check Supabase connection
  try {
    const { error } = await supabaseAdmin
      .from('tai_users')
      .select('count')
      .limit(1)
    
    checks.services.supabase = {
      status: error ? 'error' : 'ok',
      detail: error?.message || 'connected',
    }
  } catch (e: any) {
    checks.services.supabase = {
      status: 'error',
      detail: e.message,
    }
  }

  // Check AI service
  const aiUrl = process.env.AI_BASE_URL
  checks.services.ai = {
    status: aiUrl ? 'configured' : 'not_configured',
    detail: aiUrl || 'AI_BASE_URL not set',
  }

  // Check email service
  const emailUser = process.env.EMAIL_USER
  checks.services.email = {
    status: emailUser ? 'configured' : 'not_configured',
    detail: emailUser || 'EMAIL_USER not set',
  }

  const allOk = Object.values(checks.services).every(s => s.status === 'ok' || s.status === 'configured')
  checks.status = allOk ? 'healthy' : 'degraded'

  return NextResponse.json(checks, {
    status: allOk ? 200 : 503,
  })
}
