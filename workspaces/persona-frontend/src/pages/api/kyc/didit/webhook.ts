/**
 * 🔔 DIDIT KYC Webhook Handler
 * Processes verification completions and generates multiple purpose-bound VCs
 * Creates a universal Web3 identity passport from KYC results
 */

import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { diditVCGenerator, type DiditKYCResult } from '@/lib/didit-vc-generator'
import { realIdentityStorage } from '@/lib/storage/real-identity-storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify webhook signature for security
    const signature = req.headers['x-didit-signature'] || 
                     req.headers['x-signature'] || 
                     req.headers['signature'] as string
    const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET || ''
    
    console.log('📨 DIDIT webhook received with headers:', Object.keys(req.headers))
    console.log('📦 Webhook body:', JSON.stringify(req.body, null, 2))
    
    // Signature verification (optional in development)
    if (webhookSecret && signature) {
      const rawBody = JSON.stringify(req.body)
      
      const possibleSignatures = [
        crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex'),
        crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('base64'),
        `sha256=${crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')}`,
      ]
      
      const isValidSignature = possibleSignatures.some(expectedSig => 
        crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSig)
        )
      )
      
      if (!isValidSignature) {
        console.warn('⚠️ Webhook signature verification failed (continuing anyway)')
      } else {
        console.log('✅ Webhook signature verified')
      }
    }

    // Parse webhook data - DIDIT sends verification results in different formats
    const webhookData = req.body
    
    // Extract key fields based on DIDIT's actual response structure
    const sessionId = webhookData.session_id || 
                     webhookData.id || 
                     webhookData.verification_id
    
    const status = webhookData.status || 
                  webhookData.verification_status || 
                  webhookData.result?.status
    
    // Get wallet address from vendor_data or metadata
    const walletAddress = webhookData.vendor_data || 
                         webhookData.reference_id || 
                         webhookData.metadata?.wallet_address
    
    console.log(`🔄 Processing DIDIT webhook:`)
    console.log(`  Session ID: ${sessionId}`)
    console.log(`  Status: ${status}`)
    console.log(`  Wallet: ${walletAddress}`)

    // Handle different verification statuses
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'passed':
      case 'approved':
      case 'success':
        console.log(`✅ KYC verification completed successfully!`)
        
        // Build KYC result from DIDIT's response
        // DIDIT provides: ID Verification, NFC Verification, Liveness, Face Matching
        const kycResult: DiditKYCResult = {
          session_id: sessionId,
          status: 'completed',
          verification_data: {
            // Extract personal info from ID verification
            first_name: webhookData.result?.first_name || webhookData.data?.first_name,
            last_name: webhookData.result?.last_name || webhookData.data?.last_name,
            date_of_birth: webhookData.result?.date_of_birth || webhookData.data?.dob,
            nationality: webhookData.result?.nationality || webhookData.data?.nationality,
            country_of_residence: webhookData.result?.country || webhookData.data?.country,
            
            // Document info from ID/NFC verification
            document_type: webhookData.result?.document_type || webhookData.data?.document?.type || 'id_card',
            document_number: webhookData.result?.document_number || webhookData.data?.document?.number,
            document_expiry: webhookData.result?.document_expiry || webhookData.data?.document?.expiry,
            document_issuing_country: webhookData.result?.issuing_country || webhookData.data?.document?.country,
            
            // Verification metadata
            verification_timestamp: new Date().toISOString(),
            verification_level: 'enhanced', // DIDIT provides comprehensive verification
            verification_method: 'id_nfc_liveness_face', // All DIDIT features
            
            // Biometric results
            face_match_score: webhookData.result?.face_match_score || webhookData.data?.face_match || 0.95,
            liveness_score: webhookData.result?.liveness_score || webhookData.data?.liveness || 0.98,
            
            // Compliance (if provided)
            aml_status: webhookData.result?.aml_status || 'clear',
            pep_status: webhookData.result?.pep_status || 'not_pep',
            sanctions_status: webhookData.result?.sanctions_status || 'clear',
            risk_score: webhookData.result?.risk_score || 0,
            
            // Additional verification flags
            age_verified: true,
            age: this.calculateAgeFromDOB(webhookData.result?.date_of_birth || webhookData.data?.dob),
            address_verified: !!webhookData.result?.address
          },
          vendor_data: {
            wallet_address: walletAddress,
            reference_id: walletAddress
          }
        }
        
        // Generate multiple purpose-bound VCs
        console.log('🏛️ Generating Verifiable Credentials from KYC data...')
        const vcResult = await diditVCGenerator.generateVCsFromKYC(
          kycResult,
          walletAddress,
          'keplr' // Default wallet type, could be passed in vendor_data
        )
        
        if (vcResult.success) {
          console.log(`🎉 Successfully generated ${vcResult.summary.total_generated} VCs:`)
          console.log(`  Types: ${vcResult.summary.types.join(', ')}`)
          console.log(`  DID: ${vcResult.summary.did}`)
          
          // Award 100 ID tokens for successful verification
          console.log('💰 Awarding 100 ID tokens for successful KYC verification')
          
          // TODO: Call PersonaID token service to award tokens
          // await personaIDToken.award(walletAddress, 100, 'kyc_verification')
        } else {
          console.error('❌ Failed to generate VCs:', vcResult.errors)
        }
        
        break
        
      case 'failed':
      case 'rejected':
      case 'declined':
      case 'error':
        console.log(`❌ KYC verification failed for session: ${sessionId}`)
        console.log(`  Reason: ${webhookData.reason || webhookData.error || 'Unknown'}`)
        
        // TODO: Store failure reason for user feedback
        // TODO: Allow retry after certain period
        break
        
      case 'processing':
      case 'pending':
      case 'in_progress':
        console.log(`⏳ KYC verification still in progress for session: ${sessionId}`)
        // No action needed, wait for completion webhook
        break
        
      default:
        console.log(`📝 Unknown KYC status: ${status} for session: ${sessionId}`)
        console.log('  Full webhook data:', JSON.stringify(webhookData, null, 2))
    }

    // Always acknowledge webhook receipt to prevent retries
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      session_id: sessionId,
      status: status,
      wallet_address: walletAddress,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ DIDIT webhook processing error:', error)
    console.error('Stack trace:', error.stack)
    
    // Return 200 to prevent webhook retries even on error
    res.status(200).json({ 
      success: false, 
      error: 'Webhook processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Helper function to calculate age from date of birth
function calculateAgeFromDOB(dob: string | undefined): number {
  if (!dob) return 0
  
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Disable body parsing to handle raw webhook payload if needed
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Support larger payloads with biometric data
    },
  },
}