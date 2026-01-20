import { json, type RequestHandler } from '@sveltejs/kit';
import { verifyWebhookSignature } from '$lib/server/lemonsqueezy';
import {
  setEntitlementReferral,
  updateEntitlementByCustomer,
  updateEntitlementBySubscription,
  upsertEntitlement,
  deleteEntitlementByCustomer,
} from '$lib/server/entitlements-store';
import { LEMONSQUEEZY_WEBHOOK_SECRET } from '$env/static/private';

interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      entitlement_key?: string;
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status?: string;
      customer_id?: number;
      subscription_id?: number;
      order_id?: number;
      first_order_item?: {
        variant_id?: number;
      };
    };
  };
}

function planFromStatus(status?: string | null): 'free' | 'pro' {
  if (status === 'active' || status === 'on_trial') return 'pro';
  return 'free';
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
  const webhookSecret = LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not configured');
    return json({ error: 'Webhook secret is not configured' }, { status: 500 });
  }

  const signature = request.headers.get('x-signature');
  if (!signature) {
    return json({ error: 'Missing webhook signature' }, { status: 400 });
  }

  const payload = await request.text();

  if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
    console.error('Webhook signature verification failed');
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  let webhookData: LemonSqueezyWebhookPayload;
  try {
    webhookData = JSON.parse(payload);
  } catch {
    return json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const eventName = webhookData.meta.event_name;
  const customData = webhookData.meta.custom_data;
  const entitlementKey = customData?.entitlement_key ?? null;
  const customerId = webhookData.data.attributes.customer_id?.toString() ?? null;
  const subscriptionId = webhookData.data.attributes.subscription_id?.toString() ?? null;

  try {
    switch (eventName) {
      case 'order_created': {
        // Initial order - upgrade to pro
        if (entitlementKey) {
          await upsertEntitlement({
            entitlementKey,
            lemonSqueezyCustomerId: customerId,
            lemonSqueezySubscriptionId: subscriptionId,
            plan: 'pro',
            status: 'paid',
          });
          console.log(`Order created: ${entitlementKey} upgraded to pro`);
        } else if (customerId) {
          await updateEntitlementByCustomer({
            lemonSqueezyCustomerId: customerId,
            plan: 'pro',
            status: 'paid',
          });
          console.log(`Order created: customer ${customerId} upgraded to pro`);
        }
        break;
      }

      case 'subscription_created': {
        // Link customer and subscription IDs
        if (entitlementKey && customerId) {
          await upsertEntitlement({
            entitlementKey,
            lemonSqueezyCustomerId: customerId,
            lemonSqueezySubscriptionId: subscriptionId,
            plan: 'pro',
            status: webhookData.data.attributes.status ?? 'active',
          });
          console.log(`Subscription created: ${entitlementKey} linked to customer ${customerId}`);
        }
        break;
      }

      case 'subscription_updated': {
        // Update plan based on status
        const status = webhookData.data.attributes.status;
        const newPlan = planFromStatus(status);

        if (subscriptionId) {
          const updated = await updateEntitlementBySubscription({
            lemonSqueezySubscriptionId: subscriptionId,
            plan: newPlan,
            status: status ?? 'unknown',
          });
          if (updated) {
            console.log(`Subscription updated: subscription ${subscriptionId} → ${newPlan}`);
          }
        } else if (customerId) {
          await updateEntitlementByCustomer({
            lemonSqueezyCustomerId: customerId,
            plan: newPlan,
            status: status ?? 'unknown',
          });
          console.log(`Subscription updated: customer ${customerId} → ${newPlan}`);
        }
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        // Downgrade to free
        if (subscriptionId) {
          await updateEntitlementBySubscription({
            lemonSqueezySubscriptionId: subscriptionId,
            plan: 'free',
            status: eventName === 'subscription_cancelled' ? 'cancelled' : 'expired',
          });
          console.log(`${eventName}: subscription ${subscriptionId} downgraded to free`);
        } else if (customerId) {
          await updateEntitlementByCustomer({
            lemonSqueezyCustomerId: customerId,
            plan: 'free',
            status: eventName === 'subscription_cancelled' ? 'cancelled' : 'expired',
          });
          console.log(`${eventName}: customer ${customerId} downgraded to free`);
        }
        break;
      }

      case 'subscription_payment_success': {
        // Confirm active status
        if (subscriptionId) {
          await updateEntitlementBySubscription({
            lemonSqueezySubscriptionId: subscriptionId,
            plan: 'pro',
            status: 'active',
          });
          console.log(`Payment succeeded: subscription ${subscriptionId} confirmed pro`);
        } else if (customerId) {
          await updateEntitlementByCustomer({
            lemonSqueezyCustomerId: customerId,
            plan: 'pro',
            status: 'active',
          });
          console.log(`Payment succeeded: customer ${customerId} confirmed pro`);
        }
        break;
      }

      case 'subscription_payment_failed': {
        // Set payment failed status
        if (subscriptionId) {
          await updateEntitlementBySubscription({
            lemonSqueezySubscriptionId: subscriptionId,
            plan: 'free',
            status: 'payment_failed',
          });
          console.log(`Payment failed: subscription ${subscriptionId} downgraded to free`);
        } else if (customerId) {
          await updateEntitlementByCustomer({
            lemonSqueezyCustomerId: customerId,
            plan: 'free',
            status: 'payment_failed',
          });
          console.log(`Payment failed: customer ${customerId} downgraded to free`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventName}`);
        break;
    }

    return json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook ${eventName}:`, error);
    return json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
};
