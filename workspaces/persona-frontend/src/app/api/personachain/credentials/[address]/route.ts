// API Route to proxy PersonaChain requests and handle CORS
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lgx05f1fwg.execute-api.us-east-1.amazonaws.com/prod'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params
    
    // Make the request server-side (no CORS issues) - Fixed endpoint path
    const response = await fetch(`${API_URL}/api/credentials/${address}`, {
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
    
    // Transform credentials to match frontend expectations
    if (data && Array.isArray(data.credentials)) {
      const transformedCredentials = data.credentials.map((cred: any) => {
        // Create base credential structure that matches the frontend expectations
        const transformedCredential = {
          id: cred.id || cred.did,
          did: cred.did,
          type: cred.type || 'PersonaIdentityCredential',
          status: cred.status,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt,
          blockchain: cred.blockchain,
          verification: cred.verification,
          metadata: cred.metadata,
          // Add credentialSubject directly to match dashboard expectations
          credentialSubject: {
            id: cred.did,
            firstName: cred.firstName,
            lastName: cred.lastName,
            authMethod: cred.authMethod,
            verified: true,
            verificationLevel: cred.verification?.level || 'basic',
            // Handle GitHub fields conditionally
            githubUsername: cred.githubUsername || (cred.type === 'PersonaIdentityCredential' ? undefined : 'pending-verification'),
            githubId: cred.githubId,
            accountAgeMonths: cred.accountAgeMonths,
            publicRepos: cred.publicRepos || 0,
            followers: cred.followers || 0
          },
          // Add credentialData for compatibility
          credentialData: {
            '@context': [
              'https://www.w3.org/2018/credentials/v1',
              'https://personapass.com/credentials/identity/v1'
            ],
            type: ['VerifiableCredential', cred.type || 'PersonaIdentityCredential'],
            issuer: 'did:personapass:issuer',
            issuanceDate: cred.createdAt || new Date().toISOString(),
            credentialSubject: {
              id: cred.did,
              firstName: cred.firstName,
              lastName: cred.lastName,
              authMethod: cred.authMethod,
              verified: true,
              verificationLevel: cred.verification?.level || 'basic',
              // Handle different credential types
              githubUsername: cred.githubUsername || (cred.type === 'PersonaIdentityCredential' ? undefined : 'pending-verification'),
              githubId: cred.githubId,
              accountAgeMonths: cred.accountAgeMonths,
              publicRepos: cred.publicRepos || 0,
              followers: cred.followers || 0
            },
            proof: {
              type: 'PersonaBlockchainProof2024',
              created: cred.createdAt || new Date().toISOString(),
              verificationMethod: `did:personapass:issuer#key-1`,
              proofPurpose: 'assertionMethod',
              jws: cred.blockchain?.txHash || 'proof_placeholder'
            }
          }
        }
        
        return transformedCredential
      })
      
      return NextResponse.json(transformedCredentials)
    } else if (Array.isArray(data)) {
      return NextResponse.json(data)
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
    
    // Make the request server-side (no CORS issues) - Use correct issue endpoint
    const response = await fetch(`${API_URL}/api/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: address,
        credentialType: 'GitHubDeveloperCredential',
        credentialData: body.credential,
        verificationMethod: 'wallet'
      })
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