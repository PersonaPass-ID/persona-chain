/**
 * Wallet Signature Verification Service
 * CRITICAL: Replaces placeholder authentication with real signature verification
 */

import { verifyMessage } from 'viem'
import { SiweMessage } from 'siwe'

export class WalletSignatureVerifier {
  /**
   * Verify wallet signature for authentication
   * Fixes the critical vulnerability in persona-api.controller.ts
   */
  async verifyWalletSignature(
    address: string,
    message: string,
    signature: string,
    chainId: number
  ): Promise<boolean> {
    try {
      // For SIWE (Sign-In With Ethereum) messages
      if (message.includes('wants you to sign in')) {
        const siweMessage = new SiweMessage(message)
        const fields = await siweMessage.verify({ signature })
        return fields.success && fields.data.address === address
      }
      
      // For standard message verification
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })
      
      return isValid
    } catch (error) {
      console.error('Signature verification failed:', error)
      return false
    }
  }

  /**
   * Generate cryptographic proof (replaces placeholder)
   * Fixes the vulnerability in github-verification.ts:243
   */
  async generateJWS(payload: any, privateKey: string): Promise<string> {
    const jose = await import('jose')
    const key = await jose.importPKCS8(privateKey, 'ES256')
    
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(key)
    
    return jwt
  }
}