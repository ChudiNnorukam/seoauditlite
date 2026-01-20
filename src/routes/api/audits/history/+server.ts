import { json, type RequestHandler } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

/**
 * GET /api/audits/history
 *
 * Returns user's audit history.
 * - If authenticated: returns audits linked via entitlements_user_map
 * - If anonymous: returns audits linked via entitlement_key cookie
 *
 * Query params:
 * - limit: max results (default 10, max 50)
 * - offset: pagination offset (default 0)
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50);
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);

	const db = await getDb();
	let audits: Array<{
		auditId: string;
		auditedUrl: string;
		createdAt: string;
		overallScore: number | null;
	}> = [];

	if (locals.user) {
		// Authenticated user - get audits via user mapping
		const result = await db.execute({
			sql: `SELECT a.audit_id, a.audited_url, a.created_at,
			             json_extract(a.payload_json, '$.overall_score') as overall_score
			      FROM audits a
			      INNER JOIN entitlements_user_map eum ON a.entitlement_key = eum.entitlement_key
			      WHERE eum.user_id = ?
			      ORDER BY a.created_at DESC
			      LIMIT ? OFFSET ?`,
			args: [locals.user.id, limit, offset]
		});

		audits = result.rows.map((row) => ({
			auditId: row.audit_id as string,
			auditedUrl: row.audited_url as string,
			createdAt: row.created_at as string,
			overallScore: row.overall_score as number | null
		}));
	} else if (locals.entitlementKey) {
		// Anonymous user - get audits via entitlement key
		const result = await db.execute({
			sql: `SELECT audit_id, audited_url, created_at,
			             json_extract(payload_json, '$.overall_score') as overall_score
			      FROM audits
			      WHERE entitlement_key = ?
			      ORDER BY created_at DESC
			      LIMIT ? OFFSET ?`,
			args: [locals.entitlementKey, limit, offset]
		});

		audits = result.rows.map((row) => ({
			auditId: row.audit_id as string,
			auditedUrl: row.audited_url as string,
			createdAt: row.created_at as string,
			overallScore: row.overall_score as number | null
		}));
	}

	return json({
		audits,
		pagination: {
			limit,
			offset,
			hasMore: audits.length === limit
		}
	});
};
