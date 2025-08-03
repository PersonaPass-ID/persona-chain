import { NextRequest, NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { personaChainService } from '@/lib/personachain-service'

// Session interface
export interface SessionData {
  siwe?: {
    address: string
    chainId: number
    nonce: string
  }
  user?: {
    address: string
    did: string
    createdAt: string
  }
}

// Session config
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

// Generate nonce
function generateNonce() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let nonce = ''
  for (let i = 0; i < 16; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return nonce
}

// GET - Generate nonce for signing
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    
    // Generate new nonce
    const nonce = generateNonce()
    
    // Store nonce in session
    session.siwe = {
      address: '',
      chainId: 1,
      nonce
    }
    await session.save()
    
    return NextResponse.json({ nonce })
  } catch (error) {
    console.error('Failed to generate nonce:', error)
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    )
  }
}

// POST - Verify signature and create session
export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json()
    
    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Missing message or signature' },
        { status: 400 }
      )
    }
    
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    
    // Parse SIWE message
    const siweMessage = new SiweMessage(message)
    
    // Verify the signature
    const { data: verifiedMessage, success, error } = await siweMessage.verify({
      signature,
      nonce: session.siwe?.nonce
    })
    
    if (!success || error) {
      return NextResponse.json(
        { error: error?.message || 'Invalid signature' },
        { status: 400 }
      )
    }
    
    // Create user session
    const userAddress = verifiedMessage.address
    const userDID = `did:personapass:${userAddress.slice(-8).toLowerCase()}`
    
    session.user = {
      address: userAddress,
      did: userDID,
      createdAt: new Date().toISOString()
    }
    
    await session.save()
    
    // Try to initialize user on PersonaChain if not exists
    try {
      await personaChainService.initializeUser(userAddress)
    } catch (error) {
      console.log('PersonaChain initialization note:', error)
      // Non-critical - user can still proceed
    }
    
    return NextResponse.json({
      success: true,
      user: {
        address: userAddress,
        did: userDID
      }
    })
    
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// DELETE - Logout
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    
    session.destroy()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}