import { supabaseAdmin } from './supabase'

export interface LogEntry {
  source: string
  endpoint?: string
  error_message: string
  error_stack?: string
  details?: Record<string, any>
  user_id?: string
}

export async function logError(entry: LogEntry): Promise<void> {
  try {
    await supabaseAdmin()
      .from('tai_error_logs')
      .insert({
        source: entry.source,
        endpoint: entry.endpoint,
        error_message: entry.error_message,
        error_stack: entry.error_stack,
        details: entry.details || {},
        user_id: entry.user_id || null,
      })
  } catch {
    // 如果日志写入也失败，不抛异常，避免死循环
    console.error('[LogError] Failed to write log:', entry.error_message)
  }
}

export async function logApiError(
  endpoint: string,
  error: Error,
  details?: Record<string, any>,
  userId?: string
): Promise<void> {
  await logError({
    source: 'api',
    endpoint,
    error_message: error.message,
    error_stack: error.stack,
    details,
    user_id: userId,
  })
}

export async function logCrawlerError(
  source: string,
  error: Error,
  details?: Record<string, any>
): Promise<void> {
  await logError({
    source: 'crawler',
    endpoint: source,
    error_message: error.message,
    error_stack: error.stack,
    details,
  })
}

export async function logClientError(
  error: Error,
  details?: Record<string, any>
): Promise<void> {
  await logError({
    source: 'client',
    error_message: error.message,
    error_stack: error.stack,
    details,
  })
}
