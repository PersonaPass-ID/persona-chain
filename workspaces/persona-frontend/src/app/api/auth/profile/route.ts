import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { personaChainService } from '@/lib/personachain-service'
import type { SessionData } from '../wallet/route'

// Session config (same as wallet route)
const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'personapass-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    
    if (!session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Get user credentials from PersonaChain
    let credentials = []
    try {
      credentials = await personaChainService.getCredentials(session.user.address)
    } catch (error) {
      console.log('Failed to fetch credentials:', error)
      // Non-critical - user profile still works
    }
    
    return NextResponse.json({
      success: true,
      user: {
        ...session.user,
        credentialCount: Array.isArray(credentials) ? credentials.length : 0
      }
    })
    
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile (placeholder for future features)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    
    if (!session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const updates = await request.json()
    
    // Placeholder for profile updates
    // In the future, this could update user preferences, display name, etc.
    
    return NextResponse.json({
      success: true,
      message: 'Profile update endpoint ready for future implementation'
    })
    
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}