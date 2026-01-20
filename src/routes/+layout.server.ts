import type { LayoutServerLoad } from './$types';
import { getEntitlementByKey } from '$lib/server/entitlements-store';

export const load: LayoutServerLoad = async ({ locals }) => {
	const entitlement = locals.entitlementKey
		? await getEntitlementByKey(locals.entitlementKey)
		: null;

	return {
		user: locals.user ?? null,
		plan: (entitlement?.plan ?? 'free') as 'free' | 'pro'
	};
};
