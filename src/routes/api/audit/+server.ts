import { json, type RequestHandler } from '@sveltejs/kit';
import { auditDomain } from '$lib/auditing/auditor';
import { saveAudit, canCreateAudit } from '$lib/server/audit-store';
import { getEntitlementByKey } from '$lib/server/entitlements-store';
import { checkRateLimit, getClientIP } from '$lib/server/rate-limiter';
import type { AuditRequest, AuditApiResponse } from '$lib/auditing/schema';
import type { AuditError } from '$lib/auditing/types';
import { redactAudit } from '$lib/auditing/redact';
import { resolveEntitlementsForRequest } from '$lib/server/entitlements-resolver';

export const POST: RequestHandler = async ({ request, locals }): Promise<Response> => {
	try {
		// 1. Rate limit check (per IP)
		const clientIP = getClientIP(request);
		const rateCheck = checkRateLimit(clientIP, 'audit');

		if (!rateCheck.allowed) {
			const response: AuditApiResponse = {
				success: false,
				error: `Rate limit exceeded. Try again in ${Math.ceil(rateCheck.resetIn / 1000)} seconds.`,
				code: 'RATE_LIMITED'
			};
			return json(response, {
				status: 429,
				headers: {
					'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000)),
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': String(Math.ceil(rateCheck.resetIn / 1000))
				}
			});
		}

		// 2. Get entitlement and check subscription limits
		const entitlement = locals.entitlementKey
			? getEntitlementByKey(locals.entitlementKey)
			: null;
		const plan = entitlement?.plan ?? 'free';
		const auditLimit = canCreateAudit(locals.entitlementKey ?? null, plan);

		if (!auditLimit.allowed) {
			const response: AuditApiResponse = {
				success: false,
				error: `Audit limit reached (${auditLimit.limit} per week). Upgrade to Pro for unlimited audits.`,
				code: 'LIMIT_REACHED'
			};
			return json(response, { status: 403 });
		}

		// Parse request body
		const body = await request.json() as AuditRequest;

		// Run audit
		const result = await auditDomain(body);
		saveAudit(result, {
			entitlementKey: locals.entitlementKey ?? null,
			referralId: entitlement?.referral_id ?? null
		});
		const entitlements = resolveEntitlementsForRequest({
			entitlementKey: locals.entitlementKey,
			audit: result,
			isShareLink: false,
			isOwner: true
		});
		const redacted = redactAudit(result, entitlements);

		// Return success response with remaining audits info
		const response: AuditApiResponse = {
			success: true,
			data: redacted
		};

		return json(response, {
			status: 200,
			headers: {
				'X-Audits-Remaining': String(auditLimit.remaining - 1),
				'X-Audits-Limit': String(auditLimit.limit)
			}
		});
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
