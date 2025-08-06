import { NextApiRequest, NextApiResponse } from 'next'

interface WalletCredential {
  id: string
  did: string
  type: string
  status: string
  walletAddress: string
  firstName: string
  lastName: string
  walletType: string
  createdAt: string
  blockchain?: {
    txHash: string
    blockHeight: number
    network: string
  }
  verification?: {
    method: string
    walletType: string
  }
}

interface GetCredentialsResponse {
  success: boolean
  credentials?: WalletCredential[]
  blockchain?: {
    network: string
    nodeUrl: string
    totalCredentials: number
    activeCredentials: number
    latestBlockHeight: number
  }
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<GetCredentialsResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { address } = req.query

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      })
    }

    console.log(`🔍 Fetching credentials for wallet: ${address}`)

    const PERSONACHAIN_RPC = process.env.PERSONACHAIN_RPC_URL || 'http://personachain-alb-37941478.us-east-1.elb.amazonaws.com:26657'
    
    let credentials: WalletCredential[] = []
    let blockHeight = 1
    let blockchainSuccess = false

    try {
      // Query PersonaChain for credentials
      console.log(`📡 Querying PersonaChain: ${PERSONACHAIN_RPC}`)

      // Query for DID documents
      const queryData = {
        jsonrpc: '2.0',
        id: 1,
        method: 'abci_query',
        params: {
          path: '/custom/persona/did',
          data: Buffer.from(address).toString('hex'),
          prove: false
        }
      }

      const response = await fetch(PERSONACHAIN_RPC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`📊 PersonaChain query result:`, result)

        // Get latest block height
        const statusQuery = {
          jsonrpc: '2.0',
          id: 2,
          method: 'status'
        }

        const statusResponse = await fetch(PERSONACHAIN_RPC, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(statusQuery)
        })

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json()
          if (statusResult.result?.sync_info?.latest_block_height) {
            blockHeight = parseInt(statusResult.result.sync_info.latest_block_height)
            blockchainSuccess = true
          }
        }

        // Parse credentials from blockchain response
        if (result.result?.response?.value) {
          try {
            const decodedValue = Buffer.from(result.result.response.value, 'base64').toString()
            const didDocument = JSON.parse(decodedValue)
            
            // Convert DID document to credential format
            const credential: WalletCredential = {
              id: `cred_${didDocument.did}_${Date.now()}`,
              did: didDocument.did,
              type: 'WalletIdentityCredential',
              status: 'verified',
              walletAddress: address,
              firstName: didDocument.firstName || 'Unknown',
              lastName: didDocument.lastName || 'User',
              walletType: didDocument.walletType || 'keplr',
              createdAt: didDocument.createdAt || new Date().toISOString(),
              blockchain: {
                txHash: didDocument.txHash || 'unknown',
                blockHeight: blockHeight,
                network: 'personachain-1'
              },
              verification: {
                method: 'wallet-signature',
                walletType: didDocument.walletType || 'keplr'
              }
            }

            credentials.push(credential)
            console.log(`✅ Found credential on PersonaChain: ${credential.did}`)
          } catch (parseError) {
            console.warn(`⚠️ Failed to parse DID document:`, parseError)
          }
        } else {
          console.log(`📭 No credentials found on PersonaChain for ${address}`)
        }
      } else {
        console.warn(`⚠️ PersonaChain query failed: ${response.status}`)
      }
    } catch (blockchainError) {
      console.warn(`⚠️ PersonaChain connection failed:`, blockchainError)
    }

    // If no blockchain credentials found, check for recently created DIDs
    if (credentials.length === 0) {
      // TODO: Check local storage/database for recent DID creations
      // For now, we'll return empty array when no credentials exist
      console.log(`📭 No credentials found for wallet ${address}`)
    }

    const response: GetCredentialsResponse = {
      success: true,
      credentials,
      blockchain: {
        network: 'personachain-1',
        nodeUrl: PERSONACHAIN_RPC,
        totalCredentials: credentials.length,
        activeCredentials: credentials.filter(c => c.status === 'verified').length,
        latestBlockHeight: blockHeight
      }
    }

    console.log(`✅ Returning ${credentials.length} credentials for ${address}`)
    
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Credentials fetch failed:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}