// API Route to verify credentials
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lgx05f1fwg.execute-api.us-east-1.amazonaws.com/prod'

export async function GET(
  request: NextRequest,
  { params }: { params: { credentialId: string } }
) {
  try {
    const { credentialId } = params
    
    // Make the request server-side (no CORS issues) - Fixed endpoint path
    const response = await fetch(`${API_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credentialId })
    })

    if (!response.ok) {
      // Return actual error instead of fake verification
      console.error(`PersonaChain verify API error: ${response.status}`)
      return NextResponse.json({
        verified: false,
        error: `PersonaChain verification unavailable (${response.status})`
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error verifying credential:', error)
    // Return actual error instead of fake verification
    return NextResponse.json({
      verified: false,
      error: 'PersonaChain verification connection failed'
    })
  }
}