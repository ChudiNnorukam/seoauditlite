import type { PageServerLoad } from './$types';
import type { AuditApiResponse, AuditResult } from '$lib/auditing/schema';
import { resolveEntitlementsForRequest } from '$lib/server/entitlements-resolver';

export const load: PageServerLoad = async ({ fetch, params, locals }) => {
	const entitlements = resolveEntitlementsForRequest({
		entitlementKey: locals.entitlementKey,
		isShareLink: true,
		isOwner: false
	});

	const response = await fetch(`/api/audit/${params.auditId}`);
	if (!response.ok) {
		return {
			audit: null as AuditResult | null,
			error: response.status === 404 ? 'Audit not found' : 'Unable to load audit',
			entitlements
		};
	}

	const payload = (await response.json()) as AuditApiResponse;
	return {
		audit: payload.data ?? null,
		error: payload.success ? null : payload.error ?? 'Unable to load audit',
		entitlements
	};
};
