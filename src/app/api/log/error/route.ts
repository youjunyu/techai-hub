import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

// 接收客户端错误日志
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source, endpoint, error_message, error_stack, details } = body

    if (!error_message) {
      return NextResponse.json({ error: 'error_message is required' }, { status: 400 })
    }

    await logError({
      source: source || 'client',
      endpoint,
      error_message,
      error_stack,
      details: details || {},
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[Error Log API] Failed:', e.message)
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 })
  }
}
