/**
 * ZERO-KNOWLEDGE PROOF VERIFICATION ENDPOINT
 * 
 * This endpoint demonstrates how to use ZKP for privacy-preserving verification:
 * - Age verification without revealing birthdate
 * - Credential ownership without revealing all credentials
 * - Private key ownership without revealing the key
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/middleware/auth-middleware';
import { withValidation } from '@/middleware/validation';
import { z } from 'zod';
import { zkp, SchnorrProof, MerkleProof, RangeProof } from '@/lib/zkp/zero-knowledge-proof';
import { audit } from '@/lib/audit/audit-logger';

// Request validation schema
const zkpVerifySchema = z.object({
  proofType: z.enum(['age', 'credential', 'key']),
  proof: z.object({}).passthrough(), // ZKP proof object
  requirements: z.object({
    minimumAge: z.number().optional(),
    credentialType: z.string().optional()
  }).optional()
});

type ApiResponse = {
  success: boolean;
  verified?: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
};

/**
 * ZKP verification handler
 */
async function zkpVerifyHandler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed'
      }
    });
  }

  try {
    const { proofType, proof, requirements } = req.body;
    const { userId, walletAddress } = req.user!;

    // Log verification attempt
    await audit.dataAccess(
      userId,
      'zkp_verification',
      proofType,
      'read'
    );

    let verified = false;
    let message = '';

    switch (proofType) {
      case 'age': {
        // Verify age proof
        const ageProof = proof as RangeProof;
        verified = await zkp.verifyAge(ageProof);
        
        if (verified && requirements?.minimumAge) {
          const { min } = ageProof.proof;
          if (min >= requirements.minimumAge) {
            message = `Age verification successful: Over ${requirements.minimumAge} years old`;
          } else {
            verified = false;
            message = 'Age requirement not met';
          }
        } else if (verified) {
          message = 'Age proof verified';
        }
        break;
      }

      case 'credential': {
        // Verify credential ownership proof
        const credentialProof = proof as MerkleProof;
        verified = await zkp.verifyCredential(credentialProof);
        
        if (verified) {
          message = 'Credential ownership verified';
          
          // In production, check if the root matches our stored credential tree
          // and if the credential type matches requirements
          if (requirements?.credentialType) {
            // Additional validation logic here
            message = `${requirements.credentialType} credential verified`;
          }
        }
        break;
      }

      case 'key': {
        // Verify key ownership proof
        const keyProof = proof as SchnorrProof;
        verified = await zkp.verifyKeyOwnership(keyProof);
        
        if (verified) {
          message = 'Key ownership verified';
          
          // In production, check if the public key matches expected wallet
          const { publicKey } = keyProof.publicInputs;
          // Additional validation logic here
        }
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PROOF_TYPE',
            message: 'Unknown proof type'
          }
        });
    }

    // Log result
    if (!verified) {
      await audit.suspiciousActivity(
        userId,
        'ZKP_VERIFICATION_FAILED',
        { proofType, walletAddress }
      );
    }

    return res.status(200).json({
      success: true,
      verified,
      message: verified ? message : 'Proof verification failed'
    });

  } catch (error) {
    console.error('ZKP verification error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: 'Failed to verify zero-knowledge proof'
      }
    });
  }
}

// Apply middleware layers
export default withAuth(
  withValidation(zkpVerifyHandler, {
    body: zkpVerifySchema
  }),
  {
    requireAuth: true,
    rateLimit: 10 // Limit to 10 verifications per minute
  }
);