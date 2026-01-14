import { json, type RequestHandler } from '@sveltejs/kit';
import type Stripe from 'stripe';
import { getStripe } from '$lib/server/stripe';
import { updateEntitlementByCustomer, upsertEntitlement } from '$lib/server/entitlements-store';

function planFromStatus(status?: string | null): 'free' | 'pro' {
  if (status === 'active' || status === 'trialing') return 'pro';
  return 'free';
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return json({ error: 'Stripe webhook secret is not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const entitlementKey =
        session.client_reference_id ?? session.metadata?.entitlement_key ?? null;
      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

      if (entitlementKey) {
        upsertEntitlement({
          entitlementKey,
          stripeCustomerId: customerId,
          plan: 'pro',
          status: session.payment_status ?? 'paid',
        });
      } else if (customerId) {
        updateEntitlementByCustomer({
          stripeCustomerId: customerId,
          plan: 'pro',
          status: session.payment_status ?? 'paid',
        });
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id ?? null;
      if (!customerId) break;
      updateEntitlementByCustomer({
        stripeCustomerId: customerId,
        plan: planFromStatus(subscription.status),
        status: subscription.status ?? 'unknown',
      });
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null;
      if (!customerId) break;
      updateEntitlementByCustomer({
        stripeCustomerId: customerId,
        plan: 'free',
        status: 'payment_failed',
      });
      break;
    }
    default:
      break;
  }

  return json({ received: true }, { status: 200 });
};
