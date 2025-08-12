import { NextRequest, NextResponse } from 'next/server';
import { 
  createOrUpdateCustomer, 
  createSubscription, 
  createSetupIntent,
  hasActiveSubscription,
  getUsageStatistics,
  PRICING_TIERS 
} from '@/lib/stripe/client';
import { verifyApiKey } from '@/lib/auth/api-key';

// Get billing information
export async function GET(request: NextRequest) {
  try {
    // Verify merchant API key
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
    const merchant = await verifyApiKey(apiKey);
    
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const startDate = new Date(searchParams.get('start') || new Date().setDate(1));
    const endDate = new Date(searchParams.get('end') || new Date());

    // Get usage statistics
    const usage = await getUsageStatistics(
      merchant.stripeCustomerId,
      startDate,
      endDate
    );

    // Check subscription status
    const hasSubscription = await hasActiveSubscription(merchant.stripeCustomerId);

    return NextResponse.json({
      billing: {
        plan: hasSubscription ? 'growth' : 'starter',
        customerId: merchant.stripeCustomerId,
        hasPaymentMethod: merchant.hasPaymentMethod || false
      },
      usage,
      pricing: PRICING_TIERS
    });

  } catch (error) {
    console.error('Error fetching billing info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    );
  }
}

// Update billing (upgrade/downgrade plan)
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
    const merchant = await verifyApiKey(apiKey);
    
    if (!merchant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, plan } = await request.json();

    switch (action) {
      case 'upgrade':
        // Create or get Stripe customer
        const customer = await createOrUpdateCustomer(
          merchant.email,
          {
            merchantId: merchant.id,
            company: merchant.company || ''
          }
        );

        // Create subscription
        const subscription = await createSubscription(
          customer.id,
          PRICING_TIERS[plan as keyof typeof PRICING_TIERS].priceId
        );

        return NextResponse.json({
          subscription,
          clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret
        });

      case 'add_payment_method':
        // Create setup intent for adding payment method
        const setupIntent = await createSetupIntent(merchant.stripeCustomerId);
        
        return NextResponse.json({
          clientSecret: setupIntent.client_secret
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error updating billing:', error);
    return NextResponse.json(
      { error: 'Failed to update billing' },
      { status: 500 }
    );
  }
}