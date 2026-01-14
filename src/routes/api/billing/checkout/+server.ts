import { json, type RequestHandler } from '@sveltejs/kit';
import { getStripe } from '$lib/server/stripe';
import { getEntitlementByKey } from '$lib/server/entitlements-store';

export const POST: RequestHandler = async ({ request, url, locals }): Promise<Response> => {
	try {
		const body = (await request.json()) as { auditId?: string };
		const auditId = body.auditId;

		if (!locals.entitlementKey) {
			return json(
				{ error: 'Missing entitlement key' },
				{ status: 400 }
			);
		}

		const priceId = process.env.STRIPE_PRICE_ID;
		if (!priceId) {
			return json(
				{ error: 'Stripe price is not configured' },
				{ status: 500 }
			);
		}

		const stripe = getStripe();
		const record = getEntitlementByKey(locals.entitlementKey);

		const successUrl = auditId
			? `${url.origin}/report/${auditId}?checkout=success`
			: `${url.origin}/?checkout=success`;
		const cancelUrl = auditId
			? `${url.origin}/report/${auditId}?checkout=cancel`
			: `${url.origin}/?checkout=cancel`;

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: successUrl,
			cancel_url: cancelUrl,
			client_reference_id: locals.entitlementKey,
			customer: record?.stripe_customer_id ?? undefined,
			allow_promotion_codes: true,
			metadata: {
				entitlement_key: locals.entitlementKey
			}
		});

		return json({ url: session.url }, { status: 200 });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Unable to create checkout session' },
			{ status: 500 }
		);
	}
};
