import { json, type RequestHandler } from '@sveltejs/kit';
import { getAudit } from '$lib/auditing/audit-store';
import type { AuditApiResponse } from '$lib/auditing/schema';

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

  const response: AuditApiResponse = {
    success: true,
    data: audit,
  };

  return json(response, { status: 200 });
};
