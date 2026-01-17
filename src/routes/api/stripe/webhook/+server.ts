import { json, type RequestHandler } from '@sveltejs/kit';
import type Stripe from 'stripe';
import { getStripe } from '$lib/server/stripe';
import {
  setEntitlementReferral,
  updateEntitlementByCustomer,
  upsertEntitlement,
  deleteEntitlementByCustomer,
} from '$lib/server/entitlements-store';

function planFromStatus(status?: string | null): 'free' | 'pro' {
  if (status === 'active' || status === 'trialing') return 'pro';
  return 'free';
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
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
    console.error('Webhook signature verification failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const entitlementKey = session.metadata?.entitlement_key ?? null;
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

        const referralId = session.client_reference_id ?? null;
        if (entitlementKey) {
          await upsertEntitlement({
            entitlementKey,
            stripeCustomerId: customerId,
            plan: 'pro',
            status: session.payment_status ?? 'paid',
          });
          if (referralId) {
            await setEntitlementReferral(entitlementKey, referralId);
          }
          console.log(`Checkout completed: ${entitlementKey} upgraded to pro`);
        } else if (customerId) {
          await updateEntitlementByCustomer({
            stripeCustomerId: customerId,
            plan: 'pro',
            status: session.payment_status ?? 'paid',
          });
          console.log(`Checkout completed: customer ${customerId} upgraded to pro`);
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

        const newPlan = planFromStatus(subscription.status);
        await updateEntitlementByCustomer({
          stripeCustomerId: customerId,
          plan: newPlan,
          status: subscription.status ?? 'unknown',
        });
        console.log(`Subscription ${event.type}: customer ${customerId} → ${newPlan}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null;
        if (!customerId) break;

        // Only update if this is a subscription invoice
        if (invoice.subscription) {
          await updateEntitlementByCustomer({
            stripeCustomerId: customerId,
            plan: 'pro',
            status: 'active',
          });
          console.log(`Payment succeeded: customer ${customerId} confirmed pro`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null;
        if (!customerId) break;

        await updateEntitlementByCustomer({
          stripeCustomerId: customerId,
          plan: 'free',
          status: 'payment_failed',
        });
        console.log(`Payment failed: customer ${customerId} downgraded to free`);
        // TODO: Send email notification to user about failed payment
        break;
      }

      case 'customer.deleted': {
        const customer = event.data.object as Stripe.Customer;
        const customerId = customer.id;

        if (customerId) {
          // Clear customer's subscription data (GDPR compliance)
          await deleteEntitlementByCustomer(customerId);
          console.log(`Customer deleted: ${customerId} entitlement cleared`);
        }
        break;
      }

      default:
        // Log unhandled events for debugging
        console.log(`Unhandled webhook event: ${event.type}`);
        break;
    }

    return json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook ${event.type}:`, error);
    // Return 500 so Stripe will retry the webhook
    return json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
};
