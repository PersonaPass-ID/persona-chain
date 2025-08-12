/**
 * User Profile API
 * Returns authenticated wallet user profile information
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getIronSession } from 'iron-session'
import { personaChainService } from '@/lib/personachain-service'

// Session interface (matching wallet auth)
interface SessionData {
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

// Session config (matching wallet auth)
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get wallet session from iron-session
    const session = await getIronSession<SessionData>(req, res, sessionOptions)
    
    if (!session.user || !session.user.address) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authenticated',
        message: 'Please connect your wallet to access profile information'
      })
    }

    // Get additional user data from PersonaChain
    let credentials = []
    let credentialCount = 0
    try {
      credentials = await personaChainService.getCredentials(session.user.address)
      credentialCount = Array.isArray(credentials) ? credentials.length : 0
    } catch (error) {
      console.log('Failed to fetch credentials:', error)
      // Non-critical - profile still works
    }

    // Return wallet user profile information
    return res.status(200).json({
      success: true,
      user: {
        id: session.user.address,
        address: session.user.address,
        did: session.user.did,
        credentialCount,
        createdAt: session.user.createdAt,
        provider: 'wallet'
      },
      session: {
        authenticated: true,
        type: 'wallet',
        chainId: session.siwe?.chainId || 1
      }
    })

  } catch (error: any) {
    console.error('❌ Profile API error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve profile information',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}