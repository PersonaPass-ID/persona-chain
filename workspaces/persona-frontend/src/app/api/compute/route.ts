/**
 * PersonaChain Compute/Health Check API Route
 * Checks PersonaChain blockchain status
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://54.92.180.187:26657'
    
    console.log('🔗 Checking PersonaChain health:', RPC_URL)
    
    // Try to connect to PersonaChain RPC
    const healthResponse = await fetch(`${RPC_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text()
      console.log('✅ PersonaChain health check passed')
      
      return NextResponse.json({
        status: 'healthy',
        services: [
          {
            name: 'PersonaChain RPC',
            status: 'online',
            url: RPC_URL,
            response: healthData
          }
        ],
        timestamp: new Date().toISOString()
      })
    } else {
      console.log('⚠️ PersonaChain health check failed:', healthResponse.status)
      
      return NextResponse.json({
        status: 'unhealthy',
        services: [
          {
            name: 'PersonaChain RPC',
            status: 'offline',
            url: RPC_URL,
            error: `HTTP ${healthResponse.status}`
          }
        ],
        timestamp: new Date().toISOString(),
        error: `PersonaChain RPC returned status ${healthResponse.status}`
      })
    }
    
  } catch (error) {
    console.error('❌ PersonaChain health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      services: [
        {
          name: 'PersonaChain RPC',
          status: 'offline',
          url: process.env.NEXT_PUBLIC_RPC_URL || 'http://54.92.180.187:26657',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      ],
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Connection failed'
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}