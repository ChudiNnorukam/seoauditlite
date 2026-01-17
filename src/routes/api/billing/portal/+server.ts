import { json, type RequestHandler } from '@sveltejs/kit';
import { getStripe } from '$lib/server/stripe';
import { getEntitlementByKey } from '$lib/server/entitlements-store';

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * Users can:
 * - View and download invoices
 * - Update payment methods
 * - Cancel subscription
 * - View billing history
 */
export const POST: RequestHandler = async ({ url, locals }): Promise<Response> => {
	try {
		if (!locals.entitlementKey) {
			return json({ error: 'Missing entitlement key' }, { status: 400 });
		}

		const record = getEntitlementByKey(locals.entitlementKey);

		if (!record?.stripe_customer_id) {
			return json(
				{ error: 'No subscription found. Please subscribe first.' },
				{ status: 400 }
			);
		}

		const stripe = getStripe();

		// Create portal session
		const portalSession = await stripe.billingPortal.sessions.create({
			customer: record.stripe_customer_id,
			return_url: `${url.origin}/?portal=return`
		});

		return json({ url: portalSession.url }, { status: 200 });
	} catch (error) {
		console.error('Billing portal error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unable to create portal session' },
			{ status: 500 }
		);
	}
};
