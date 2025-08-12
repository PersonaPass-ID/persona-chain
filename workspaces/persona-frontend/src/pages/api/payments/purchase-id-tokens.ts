/**
 * PersonaID Token Purchase API
 * Handles Stripe payments for ID token purchases
 */

import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

interface PurchaseRequest {
  amount: number // ID tokens to purchase
  usdPrice: number // Price in USD
  paymentMethod: 'stripe' | 'paypal' | 'crypto'
  userAddress: string // PersonaChain address
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { amount, usdPrice, userAddress }: PurchaseRequest = req.body

    // Validate input
    if (!amount || !usdPrice || !userAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, usdPrice, userAddress' 
      })
    }

    if (amount < 100 || amount > 1000000) {
      return res.status(400).json({ 
        error: 'Invalid amount: must be between 100 and 1,000,000 ID tokens' 
      })
    }

    if (usdPrice < 1 || usdPrice > 10000) {
      return res.status(400).json({ 
        error: 'Invalid price: must be between $1.00 and $10,000.00' 
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${amount.toLocaleString()} PersonaID Tokens`,
              description: `Digital identity tokens for PersonaPass operations`,
              images: ['https://personapass.xyz/personaid-token.png'],
            },
            unit_amount: Math.round(usdPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL || 'https://personapass.xyz'}/dashboard?purchase=success&tokens=${amount}`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'https://personapass.xyz'}/dashboard?purchase=cancelled`,
      metadata: {
        userAddress,
        tokenAmount: amount.toString(),
        operationType: 'id_token_purchase'
      },
      customer_email: undefined, // Let user enter email
      allow_promotion_codes: true,
    })

    console.log(`💳 Created payment session for ${amount} ID tokens ($${usdPrice}) for ${userAddress}`)

    return res.status(200).json({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('ID token purchase API error:', error)
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    })
  }
}

/**
 * Webhook handler for successful payments
 * This would be called by Stripe when payment completes
 * TODO: Implement token minting to user's PersonaChain address
 */
export async function handleSuccessfulPayment(sessionId: string, metadata: any) {
  try {
    const { userAddress, tokenAmount } = metadata
    
    console.log(`✅ Payment successful! Minting ${tokenAmount} ID tokens to ${userAddress}`)
    
    // TODO: Integrate with PersonaChain to mint tokens
    // This would call PersonaChain's mint function to add tokens to user's address
    
    return {
      success: true,
      tokensIssued: tokenAmount,
      recipient: userAddress
    }
    
  } catch (error) {
    console.error('Token minting failed:', error)
    return {
      success: false,
      error: 'Token issuance failed'
    }
  }
}