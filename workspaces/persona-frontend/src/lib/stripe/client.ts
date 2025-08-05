// PersonaPass Stripe Billing Integration
// Handles merchant billing for age verification usage

import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe client (lazy initialization to avoid build errors)
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

// Client-side Stripe instance
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Pricing tiers
export const PRICING_TIERS = {
  STARTER: {
    name: 'Starter',
    priceId: 'price_starter',
    monthlyFee: 0,
    perVerification: 0.05,
    description: 'Pay as you go'
  },
  GROWTH: {
    name: 'Growth',
    priceId: 'price_growth',
    monthlyFee: 500,
    perVerification: 0,
    description: 'Unlimited verifications'
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: 'price_enterprise',
    monthlyFee: null, // Custom pricing
    perVerification: null,
    description: 'Custom pricing for high volume'
  }
};

// Create or update customer
export async function createOrUpdateCustomer(
  email: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Customer> {
  if (!stripe) {
    throw new Error('Stripe not configured - STRIPE_SECRET_KEY missing');
  }
  
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1
  });

  if (existingCustomers.data.length > 0) {
    return stripe.customers.update(existingCustomers.data[0].id, {
      metadata
    });
  }

  return stripe.customers.create({
    email,
    metadata: {
      ...metadata,
      platform: 'PersonaPass'
    }
  });
}

// Create subscription for monthly plans
export async function createSubscription(
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe not configured - STRIPE_SECRET_KEY missing');
  }
  
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
}

// Record usage for pay-as-you-go billing
export async function recordVerificationUsage(
  customerId: string,
  quantity: number = 1
): Promise<Stripe.UsageRecord> {
  if (!stripe) {
    throw new Error('Stripe not configured - STRIPE_SECRET_KEY missing');
  }
  
  // Get the subscription item for usage-based billing
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1
  });

  if (subscriptions.data.length === 0) {
    throw new Error('No subscription found for customer');
  }

  const subscriptionItem = subscriptions.data[0].items.data.find(
    item => item.price.recurring?.usage_type === 'metered'
  );

  if (!subscriptionItem) {
    throw new Error('No metered subscription item found');
  }

  return stripe.subscriptionItems.createUsageRecord(
    subscriptionItem.id,
    {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment'
    }
  );
}

// Create payment method setup for future charges
export async function createSetupIntent(
  customerId: string
): Promise<Stripe.SetupIntent> {
  if (!stripe) {
    throw new Error('Stripe not configured - STRIPE_SECRET_KEY missing');
  }
  
  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session'
  });
}

// Get customer billing portal URL
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured - STRIPE_SECRET_KEY missing');
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });

  return session.url;
}

// Webhook signature verification
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe not configured - STRIPE_SECRET_KEY missing');
  }
  
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Get usage statistics for merchant dashboard
export async function getUsageStatistics(
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalVerifications: number;
  totalCost: number;
  dailyUsage: Array<{ date: string; count: number; cost: number }>;
}> {
  // This would query actual usage records
  // For MVP, returning mock data
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyUsage = Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const count = Math.floor(Math.random() * 50) + 10;
    return {
      date: date.toISOString().split('T')[0],
      count,
      cost: count * 0.05
    };
  });

  const totalVerifications = dailyUsage.reduce((sum, day) => sum + day.count, 0);
  const totalCost = dailyUsage.reduce((sum, day) => sum + day.cost, 0);

  return {
    totalVerifications,
    totalCost,
    dailyUsage
  };
}

// Check if customer has active subscription
export async function hasActiveSubscription(customerId: string): Promise<boolean> {
  if (!stripe) {
    return false; // No stripe = no subscription
  }
  
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1
  });

  return subscriptions.data.length > 0;
}

// Calculate estimated monthly cost based on usage
export function estimateMonthlyCost(
  dailyAverage: number,
  tier: keyof typeof PRICING_TIERS = 'STARTER'
): number {
  const pricing = PRICING_TIERS[tier];
  
  if (tier === 'GROWTH') {
    return pricing.monthlyFee;
  }
  
  if (tier === 'STARTER') {
    return dailyAverage * 30 * pricing.perVerification;
  }
  
  // Enterprise - custom pricing
  return 0;
}