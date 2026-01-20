import { json, type RequestHandler } from '@sveltejs/kit';
import { getCustomerPortalUrl } from '$lib/server/lemonsqueezy';
import { getEntitlementByKey } from '$lib/server/entitlements-store';

/**
 * POST /api/billing/portal
 *
 * Returns the LemonSqueezy Customer Portal URL for managing subscriptions.
 * Users can:
 * - View and download invoices
 * - Update payment methods
 * - Cancel subscription
 * - View billing history
 */
export const POST: RequestHandler = async ({ locals }): Promise<Response> => {
	try {
		if (!locals.entitlementKey) {
			return json({ error: 'Missing entitlement key' }, { status: 400 });
		}

		const record = await getEntitlementByKey(locals.entitlementKey);

		if (!record?.lemonsqueezy_customer_id) {
			return json(
				{ error: 'No subscription found. Please subscribe first.' },
				{ status: 400 }
			);
		}

		const portalUrl = await getCustomerPortalUrl(record.lemonsqueezy_customer_id);

		if (!portalUrl) {
			return json(
				{ error: 'Unable to retrieve customer portal URL' },
				{ status: 500 }
			);
		}

		return json({ url: portalUrl }, { status: 200 });
	} catch (error) {
		console.error('Billing portal error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unable to create portal session' },
			{ status: 500 }
		);
	}
};
