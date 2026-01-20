import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/?error=auth_required');
	}

	const db = await getDb();

	// Get user's audit history via entitlements_user_map
	const auditsResult = await db.execute({
		sql: `SELECT a.audit_id, a.audited_url, a.created_at,
		             json_extract(a.payload_json, '$.overall_score') as overall_score
		      FROM audits a
		      INNER JOIN entitlements_user_map eum ON a.entitlement_key = eum.entitlement_key
		      WHERE eum.user_id = ?
		      ORDER BY a.created_at DESC
		      LIMIT 20`,
		args: [locals.user.id]
	});

	const audits = auditsResult.rows.map((row) => ({
		auditId: row.audit_id as string,
		auditedUrl: row.audited_url as string,
		createdAt: row.created_at as string,
		overallScore: row.overall_score as number | null
	}));

	return {
		audits
	};
};
