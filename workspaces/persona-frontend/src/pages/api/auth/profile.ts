/**
 * User Profile API
 * Returns authenticated user profile information
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get session from NextAuth
    const session = await getSession({ req })
    
    if (!session || !session.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authenticated',
        message: 'Please sign in to access profile information'
      })
    }

    // Return user profile information
    return res.status(200).json({
      success: true,
      user: {
        id: session.user.id || session.user.email,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        githubUsername: session.user.githubUsername || session.user.name,
        githubId: session.user.githubId,
        provider: 'github'
      },
      session: {
        expires: session.expires,
        accessToken: session.accessToken ? 'provided' : 'not_provided'
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