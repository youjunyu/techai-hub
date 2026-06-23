import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Create user via Supabase Auth
    const { data, error } = await supabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Insert into our users table
    const { error: profileError } = await supabaseAdmin()
      .from('tai_users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        name: name || email.split('@')[0],
        report_email: '5581012@qq.com'
      })

    if (profileError) {
      // Rollback auth user
      await supabaseAdmin().auth.admin.deleteUser(data.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      user: { id: data.user.id, email: data.user.email, name: name },
      message: 'User created successfully'
    })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
