import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local.'
  )
}

// Client for browser (respects RLS)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side only (bypasses RLS)
// Lazily initialized to avoid accessing server-only env vars in the browser
let _supabaseAdmin: ReturnType<typeof createClient> | null = null
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. This client can only be used in server-side code.')
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _supabaseAdmin
}

// Export a callable that also supports property access (for backward compat with both supabaseAdmin() and supabaseAdmin.from)
export const supabaseAdmin: any = new Proxy(
  getSupabaseAdmin,
  {
    get(_target, prop) {
      return Reflect.get(getSupabaseAdmin(), prop)
    },
  }
)
