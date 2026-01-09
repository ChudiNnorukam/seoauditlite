import { json, type RequestHandler } from '@sveltejs/kit';
import { auditDomain } from '$lib/auditing/auditor';
import type { AuditRequest, AuditResponse, AuditError } from '$lib/auditing/types';

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
	try {
		// Parse request body
		const body = await request.json() as AuditRequest;

		// Run audit
		const result = await auditDomain(body);

		// Return success response
		const response: AuditResponse = {
			success: true,
			data: result
		};

		return json(response, { status: 200 });
	} catch (error) {
		// Handle errors
		if (error instanceof Error && 'code' in error) {
			const auditErr = error as unknown as AuditError;
			const response: AuditResponse = {
				success: false,
				error: auditErr.message,
				code: auditErr.code
			};
			return json(response, { status: auditErr.statusCode || 500 });
		}

		// Generic error
		const response: AuditResponse = {
			success: false,
			error: 'Internal server error',
			code: 'INTERNAL_ERROR'
		};
		return json(response, { status: 500 });
	}
};
