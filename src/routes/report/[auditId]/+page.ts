import type { PageLoad } from './$types';
import type { AuditApiResponse, AuditResult } from '$lib/auditing/schema';

export const load: PageLoad = async ({ fetch, params }) => {
	const response = await fetch(`/api/audit/${params.auditId}`);
	if (!response.ok) {
		return {
			audit: null as AuditResult | null,
			error: response.status === 404 ? 'Audit not found' : 'Unable to load audit'
		};
	}

	const payload = (await response.json()) as AuditApiResponse;
	return {
		audit: payload.data ?? null,
		error: payload.success ? null : payload.error ?? 'Unable to load audit'
	};
};
