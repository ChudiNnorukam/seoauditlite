import { json, type RequestHandler } from '@sveltejs/kit';
import { createCheckoutUrl } from '$lib/server/lemonsqueezy';

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

		const successUrl = auditId
			? `${url.origin}/report/${auditId}?checkout=success`
			: `${url.origin}/?checkout=success`;

		const checkoutUrl = createCheckoutUrl({
			entitlementKey: locals.entitlementKey,
			userId: locals.user?.id,
			email: locals.user?.email ?? undefined,
			successUrl,
		});

		return json({ url: checkoutUrl }, { status: 200 });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Unable to create checkout URL' },
			{ status: 500 }
		);
	}
};
