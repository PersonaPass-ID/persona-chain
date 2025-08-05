import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent, recordVerificationUsage } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';

// Stripe webhook handler
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event;

  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', { error: err });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as any;
      logger.info('Subscription updated', {
        customerId: subscription.customer,
        status: subscription.status
      });
      // Update merchant's subscription status in database
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as any;
      logger.info('Payment succeeded', {
        customerId: invoice.customer,
        amount: invoice.amount_paid
      });
      // Reset usage counters for new billing period
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as any;
      logger.warn('Payment failed', {
        customerId: failedInvoice.customer,
        attemptCount: failedInvoice.attempt_count
      });
      // Notify merchant and potentially suspend service
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object as any;
      logger.info('Subscription cancelled', {
        customerId: deletedSub.customer
      });
      // Downgrade merchant to starter plan
      break;

    default:
      logger.debug('Unhandled webhook event', { type: event.type });
  }

  return NextResponse.json({ received: true });
}