import { NextApiRequest, NextApiResponse } from 'next'
import { testIdentityStorage, VerifiableCredential } from '../../../lib/storage/test-identity-storage'

interface DebugStorageResponse {
  success: boolean
  results: any[]
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<DebugStorageResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      results: [],
      error: 'Method not allowed'
    })
  }

  try {
    const results: any[] = []

    // Step 1: Clear storage
    testIdentityStorage.clearTestData()
    results.push({ step: 'clear', result: 'Storage cleared' })

    // Step 2: Create test DID
    const testWallet = 'cosmos1debugtest' + Date.now()
    const testDid = `did:persona:debug:${Date.now()}`
    
    const didDocument = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: testDid,
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      created: new Date().toISOString()
    }

    const didResult = await testIdentityStorage.storeDIDDocument(
      testDid,
      testWallet,
      'keplr',
      didDocument
    )
    results.push({ step: 'store-did', result: didResult })

    // Step 3: Verify DID lookup
    const foundDid = await testIdentityStorage.getDIDByWallet(testWallet)
    results.push({ step: 'lookup-did', result: { found: foundDid, expected: testDid } })

    // Step 4: Store credential
    const testCredential: VerifiableCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: 'debug-credential-' + Date.now(),
      type: ['VerifiableCredential', 'DebugCredential'],
      issuer: 'did:persona:debug-issuer',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: testDid,
        debugAttribute: 'debug-value',
        testValue: true
      },
      proof: {
        type: 'Ed25519Signature2018',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: testDid + '#key-1',
        signature: 'debug-signature-' + Date.now()
      }
    }

    const credResult = await testIdentityStorage.storeVerifiableCredential(
      testCredential,
      testWallet,
      'keplr'
    )
    results.push({ step: 'store-credential', result: credResult })

    // Step 5: Retrieve credentials
    const retrievedCreds = await testIdentityStorage.getVerifiableCredentials(
      testDid,
      testWallet,
      'keplr'
    )
    results.push({ step: 'retrieve-credentials', result: retrievedCreds })

    // Step 6: Check storage state
    const debugInfo = testIdentityStorage.getDebugInfo()
    results.push({ step: 'debug-info', result: debugInfo })

    return res.status(200).json({
      success: true,
      results
    })

  } catch (error) {
    console.error('❌ Storage debug failed:', error)
    return res.status(500).json({
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Debug failed'
    })
  }
}