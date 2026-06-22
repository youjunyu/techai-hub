import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin().auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('tai_users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({ 
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile
      },
      session: data.session
    })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
