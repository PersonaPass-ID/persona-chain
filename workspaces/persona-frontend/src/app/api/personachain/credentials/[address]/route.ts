// API Route to proxy PersonaChain requests and handle CORS
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lgx05f1fwg.execute-api.us-east-1.amazonaws.com/prod'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    
    // Make the request server-side (no CORS issues)
    const response = await fetch(`${API_URL}/credentials/${address}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // If API returns error, return mock data for now
      console.log(`API returned ${response.status}, using mock data`)
      return NextResponse.json([]) // Return array, not object
    }

    const data = await response.json()
    // Ensure we always return an array
    if (Array.isArray(data)) {
      return NextResponse.json(data)
    } else if (data && Array.isArray(data.credentials)) {
      return NextResponse.json(data.credentials)
    } else {
      console.log('Unexpected API response format:', data)
      return NextResponse.json([])
    }
    
  } catch (error) {
    console.error('Error fetching credentials:', error)
    // Return empty array on error
    return NextResponse.json([])
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    const body = await request.json()
    
    // Make the request server-side (no CORS issues)
    const response = await fetch(`${API_URL}/credentials/${address}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      // Return error instead of misleading mock data
      console.error(`PersonaChain API error: ${response.status} - ${response.statusText}`)
      return NextResponse.json({
        success: false,
        error: `PersonaChain API unavailable (${response.status})`,
        note: 'API requires authentication token'
      }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error storing credential:', error)
    // Return error instead of misleading mock data
    return NextResponse.json({
      success: false,
      error: 'PersonaChain API connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}