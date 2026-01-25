import { json, type RequestHandler } from '@sveltejs/kit';
import { auditDomain } from '$lib/auditing/auditor';
import { saveAudit, canCreateAudit } from '$lib/server/audit-store';
import { getEntitlementByKey } from '$lib/server/entitlements-store';
import { checkRateLimit, getClientIP } from '$lib/server/rate-limiter';
import type { AuditRequest, AuditApiResponse } from '$lib/auditing/schema';
import type { AuditError } from '$lib/auditing/types';
import { redactAudit } from '$lib/auditing/redact';
import { resolveEntitlementsForRequest } from '$lib/server/entitlements-resolver';
import { queueOgImageGeneration } from '$lib/server/og-image-generator';

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
			? await getEntitlementByKey(locals.entitlementKey)
			: null;
		const plan = entitlement?.plan ?? 'free';
		const auditLimit = await canCreateAudit(locals.entitlementKey ?? null, plan);

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
		await saveAudit(result, {
			entitlementKey: locals.entitlementKey ?? null,
			referralId: entitlement?.referral_id ?? null
		});

		// Queue OG image generation (non-blocking)
		queueOgImageGeneration(result).catch((err) => {
			console.error('Failed to queue OG image generation:', err);
		});

		const entitlements = await resolveEntitlementsForRequest({
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
		// Structured error logging
		const errorContext = {
			timestamp: new Date().toISOString(),
			type: error instanceof Error ? error.constructor.name : 'Unknown',
			message: error instanceof Error ? error.message : String(error),
			entitlementKey: locals.entitlementKey?.slice(0, 8) + '...' // Partial for privacy
		};

		// Handle known audit errors
		if (error instanceof Error && 'code' in error) {
			const auditErr = error as unknown as AuditError;
			console.error('[audit] Known error:', { ...errorContext, code: auditErr.code });

			const response: AuditApiResponse = {
				success: false,
				error: auditErr.message,
				code: auditErr.code
			};
			return json(response, { status: auditErr.statusCode || 500 });
		}

		// Log unexpected errors with full context
		console.error('[audit] Unexpected error:', {
			...errorContext,
			stack: error instanceof Error ? error.stack : undefined
		});

		// Generic error (don't expose internal details)
		const response: AuditApiResponse = {
			success: false,
			error: 'Internal server error',
			code: 'INTERNAL_ERROR'
		};
		return json(response, { status: 500 });
	}
};
