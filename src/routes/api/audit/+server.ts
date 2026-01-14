import { json, type RequestHandler } from '@sveltejs/kit';
import { auditDomain } from '$lib/auditing/auditor';
import { saveAudit } from '$lib/server/audit-store';
import type { AuditRequest, AuditApiResponse } from '$lib/auditing/schema';
import type { AuditError } from '$lib/auditing/types';
import { redactAudit } from '$lib/auditing/redact';
import { resolveEntitlementsForRequest } from '$lib/server/entitlements-resolver';

export const POST: RequestHandler = async ({ request, locals }): Promise<Response> => {
	try {
		// Parse request body
		const body = await request.json() as AuditRequest;

		// Run audit
		const result = await auditDomain(body);
		saveAudit(result);
		const entitlements = resolveEntitlementsForRequest({
			entitlementKey: locals.entitlementKey,
			audit: result,
			isShareLink: false,
			isOwner: true
		});
		const redacted = redactAudit(result, entitlements);

		// Return success response
		const response: AuditApiResponse = {
			success: true,
			data: redacted
		};

		return json(response, { status: 200 });
	} catch (error) {
		// Handle errors
		if (error instanceof Error && 'code' in error) {
			const auditErr = error as unknown as AuditError;
			const response: AuditApiResponse = {
				success: false,
				error: auditErr.message,
				code: auditErr.code
			};
			return json(response, { status: auditErr.statusCode || 500 });
		}

		// Generic error
		const response: AuditApiResponse = {
			success: false,
			error: 'Internal server error',
			code: 'INTERNAL_ERROR'
		};
		return json(response, { status: 500 });
	}
};
