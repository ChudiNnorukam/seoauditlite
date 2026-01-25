import type { PageServerLoad } from './$types';
import type { AuditApiResponse, AuditResult } from '$lib/auditing/schema';
import { resolveEntitlementsForRequest } from '$lib/server/entitlements-resolver';
import { env as publicEnv } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ fetch, params, locals }) => {
	const entitlements = await resolveEntitlementsForRequest({
		entitlementKey: locals.entitlementKey,
		isShareLink: true,
		isOwner: false
	});

	const response = await fetch(`/api/audit/${params.auditId}`);
	if (!response.ok) {
		return {
			audit: null as AuditResult | null,
			error: response.status === 404 ? 'Audit not found' : 'Unable to load audit',
			entitlements,
			ogImageUrl: null as string | null
		};
	}

	const payload = (await response.json()) as AuditApiResponse;

	// Construct OG image URL using the compose endpoint
	const appUrl = publicEnv.PUBLIC_APP_URL || 'https://seoauditlite.com';
	const ogImageUrl = `${appUrl}/api/images/og/${params.auditId}`;

	return {
		audit: payload.data ?? null,
		error: payload.success ? null : payload.error ?? 'Unable to load audit',
		entitlements,
		ogImageUrl
	};
};
