import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if email exists in users table
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if email doesn't exist
      console.error('Database error checking email:', error)
      return NextResponse.json({
        success: false,
        error: 'Database error'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      exists: !!existingUser,
      message: existingUser ? 'Email already exists' : 'Email is available'
    })

  } catch (error: any) {
    console.error('Email check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}