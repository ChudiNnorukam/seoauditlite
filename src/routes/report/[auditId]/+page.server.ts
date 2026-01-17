import type { PageServerLoad } from './$types';
import type { AuditApiResponse, AuditResult } from '$lib/auditing/schema';
import { resolveEntitlementsForRequest } from '$lib/server/entitlements-resolver';
import { getAuditOgImageUrl } from '$lib/server/image-store';

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
			entitlements,
			ogImageUrl: null as string | null
		};
	}

	const payload = (await response.json()) as AuditApiResponse;

	// Fetch OG image URL
	let ogImageUrl: string | null = null;
	try {
		ogImageUrl = await getAuditOgImageUrl(params.auditId);
	} catch (err) {
		console.error('Failed to fetch OG image URL:', err);
	}

	return {
		audit: payload.data ?? null,
		error: payload.success ? null : payload.error ?? 'Unable to load audit',
		entitlements,
		ogImageUrl
	};
};
