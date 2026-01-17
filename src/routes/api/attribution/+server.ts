import { json, type RequestHandler } from '@sveltejs/kit';
import { ensureEntitlement, setEntitlementReferral } from '$lib/server/entitlements-store';

export const POST: RequestHandler = async ({ request, locals }): Promise<Response> => {
	try {
		const body = (await request.json()) as { referralId?: string };
		const referralId = body.referralId?.trim();

		if (!locals.entitlementKey) {
			return json({ error: 'Missing entitlement key' }, { status: 400 });
		}

		if (!referralId) {
			return json({ ok: true }, { status: 200 });
		}

		await ensureEntitlement(locals.entitlementKey);
		await setEntitlementReferral(locals.entitlementKey, referralId);

		return json({ ok: true }, { status: 200 });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Unable to record referral' },
			{ status: 500 }
		);
	}
};
