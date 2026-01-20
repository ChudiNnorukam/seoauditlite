import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getEntitlementByKey } from '$lib/server/entitlements-store';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/?error=auth_required');
	}

	const entitlement = locals.entitlementKey
		? await getEntitlementByKey(locals.entitlementKey)
		: null;

	return {
		hasSubscription: !!entitlement?.lemonsqueezy_customer_id
	};
};
