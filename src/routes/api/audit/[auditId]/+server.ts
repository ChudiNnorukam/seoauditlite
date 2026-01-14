import { json, type RequestHandler } from '@sveltejs/kit';
import { getAudit } from '$lib/server/audit-store';
import type { AuditApiResponse } from '$lib/auditing/schema';
import { redactAudit } from '$lib/auditing/redact';
import { createEntitlementContext } from '$lib/auditing/entitlements';

export const GET: RequestHandler = async ({ params }): Promise<Response> => {
  const auditId = params.auditId;
  if (!auditId) {
    const response: AuditApiResponse = {
      success: false,
      error: 'Missing audit id',
      code: 'INVALID_REQUEST',
    };
    return json(response, { status: 400 });
  }

  const audit = getAudit(auditId);
  if (!audit) {
    const response: AuditApiResponse = {
      success: false,
      error: 'Audit not found',
      code: 'NOT_FOUND',
    };
    return json(response, { status: 404 });
  }

  const entitlements = createEntitlementContext({
    plan: audit.limits.plan,
    isShareLink: true,
    isOwner: false,
  });
  const redacted = redactAudit(audit, entitlements);
  const response: AuditApiResponse = {
    success: true,
    data: redacted,
  };

  return json(response, { status: 200 });
};
