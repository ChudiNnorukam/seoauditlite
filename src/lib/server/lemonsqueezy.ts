import {
  lemonSqueezySetup,
  getCustomer,
  type Customer,
} from '@lemonsqueezy/lemonsqueezy.js';
import crypto from 'crypto';
import {
  LEMONSQUEEZY_API_KEY,
  LEMONSQUEEZY_STORE_ID,
  LEMONSQUEEZY_VARIANT_ID,
} from '$env/static/private';

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;

  if (!LEMONSQUEEZY_API_KEY) {
    throw new Error('LEMONSQUEEZY_API_KEY is not set');
  }

  lemonSqueezySetup({ apiKey: LEMONSQUEEZY_API_KEY });
  initialized = true;
}

export interface CheckoutParams {
  entitlementKey: string;
  userId?: string;
  email?: string;
  successUrl: string;
  cancelUrl?: string;
}

export function createCheckoutUrl(params: CheckoutParams): string {
  ensureInitialized();

  if (!LEMONSQUEEZY_STORE_ID || !LEMONSQUEEZY_VARIANT_ID) {
    throw new Error('LEMONSQUEEZY_STORE_ID or LEMONSQUEEZY_VARIANT_ID is not set');
  }

  const checkoutUrl = new URL(
    `https://${LEMONSQUEEZY_STORE_ID}.lemonsqueezy.com/checkout/buy/${LEMONSQUEEZY_VARIANT_ID}`
  );

  // Custom metadata for webhook processing
  checkoutUrl.searchParams.set('checkout[custom][entitlement_key]', params.entitlementKey);
  if (params.userId) {
    checkoutUrl.searchParams.set('checkout[custom][user_id]', params.userId);
  }

  // Pre-fill email if provided
  if (params.email) {
    checkoutUrl.searchParams.set('checkout[email]', params.email);
  }

  // Redirect URLs
  checkoutUrl.searchParams.set('checkout[success_url]', params.successUrl);

  return checkoutUrl.toString();
}

export async function getCustomerPortalUrl(customerId: string): Promise<string | null> {
  ensureInitialized();

  try {
    const response = await getCustomer(customerId);
    if (response.error) {
      console.error('Failed to get customer:', response.error);
      return null;
    }

    const customer = response.data?.data as Customer['data'] | undefined;
    const urls = customer?.attributes?.urls;

    return urls?.customer_portal ?? null;
  } catch (error) {
    console.error('Error fetching customer portal URL:', error);
    return null;
  }
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}
