// API Route to check PersonaChain status
import { NextResponse } from 'next/server'

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://98.86.107.175:26657'

export async function GET() {
  try {
    // Try to fetch status from RPC
    const response = await fetch(`${RPC_URL}/status`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Return actual offline status instead of fake data
      return NextResponse.json({
        online: false,
        error: `PersonaChain RPC unavailable (${response.status})`,
        chainId: 'personachain-1'
      })
    }

    const data = await response.json()
    return NextResponse.json({
      online: true,
      chainId: data.result?.node_info?.network || 'persona-testnet',
      blockHeight: parseInt(data.result?.sync_info?.latest_block_height || '0')
    })
    
  } catch (error) {
    console.error('Error checking network status:', error)
    // Return actual error status instead of fake data
    return NextResponse.json({
      online: false,
      error: 'PersonaChain RPC connection failed',
      chainId: 'persona-testnet'
    })
  }
}