import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Strong password validation
function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 12) {
    errors.push('Must be at least 12 characters long')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain at least one number')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Must contain at least one special character')
  }
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Cannot contain 3 or more repeated characters')
  }
  if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
    errors.push('Cannot be only letters or only numbers')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, email, password, did } = await request.json()

    // Validate required fields
    if (!walletAddress || !email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address, email, and password are required'
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

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: `Password requirements not met: ${passwordValidation.errors.join(', ')}`
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'An account with this email already exists. Please use a different email or try logging in.'
      }, { status: 409 })
    }

    // Check if wallet address already exists
    const { data: existingWallet } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()

    if (existingWallet) {
      return NextResponse.json({
        success: false,
        error: 'This wallet address is already associated with an account.'
      }, { status: 409 })
    }

    // Hash password with high salt rounds for security
    const saltRounds = 14 // Increased from typical 12 for extra security
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user account
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        wallet_address: walletAddress,
        password_hash: hashedPassword,
        did: did || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_verified: false,
        auth_method: 'password_totp'
      })
      .select()
      .single()

    if (createError) {
      console.error('Database error creating user:', createError)
      
      // Handle specific database errors
      if (createError.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          success: false,
          error: 'An account with this email or wallet address already exists.'
        }, { status: 409 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create account'
      }, { status: 500 })
    }

    // Also create DID record if DID was provided
    if (did && newUser) {
      const { error: didError } = await supabase
        .from('dids')
        .insert({
          did: did,
          wallet_address: walletAddress,
          user_id: newUser.id, // Link to users table
          first_name: 'PersonaPass', // Default values
          last_name: 'User',
          wallet_type: 'keplr',
          auth_method: 'password_totp',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          metadata: {
            created_via: 'account_setup',
            email: email.toLowerCase()
          }
        })

      if (didError) {
        console.error('Warning: DID record creation failed:', didError)
        // Don't fail the entire operation, just log the warning
      } else {
        console.log('✅ DID record created and linked to user account')
      }
    }

    // Log successful account creation (without sensitive data)
    console.log(`Account created successfully for email: ${email}, wallet: ${walletAddress.slice(0, 8)}...`)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        wallet_address: newUser.wallet_address,
        did: newUser.did,
        created_at: newUser.created_at
      },
      message: 'Account created successfully'
    })

  } catch (error: any) {
    console.error('Account creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}