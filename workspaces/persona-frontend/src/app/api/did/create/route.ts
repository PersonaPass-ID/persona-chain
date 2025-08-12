/**
 * DID Creation API Route
 * Creates new DIDs on PersonaChain blockchain
 */

import { NextRequest, NextResponse } from 'next/server'
import { personaChainService } from '../../../../lib/personachain-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { publicKey, mnemonic, metadata } = body

    // Validate required fields
    if (!publicKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Public key is required' 
        },
        { status: 400 }
      )
    }

    console.log('🔐 Creating DID with public key:', publicKey.substring(0, 20) + '...')

    // Create DID on PersonaChain
    const result = await personaChainService.createDID(publicKey, mnemonic)
    
    if (result.success) {
      console.log('✅ DID created successfully:', result.did)
      
      return NextResponse.json({
        success: true,
        did: result.did,
        txHash: result.txHash,
        document: result.document,
        message: 'DID created successfully on PersonaChain'
      })
    } else {
      throw new Error(result.error || 'Failed to create DID')
    }

  } catch (error) {
    console.error('❌ DID creation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error',
        error: 'Failed to create DID on PersonaChain'
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}