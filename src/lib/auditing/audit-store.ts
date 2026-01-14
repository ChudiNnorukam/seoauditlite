import type { AuditResult } from './schema';

const AUDIT_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const auditStore = new Map<string, { result: AuditResult; createdAt: number }>();

function isExpired(createdAt: number): boolean {
  return Date.now() - createdAt > AUDIT_TTL_MS;
}

export function saveAudit(result: AuditResult): void {
  auditStore.set(result.audit_id, { result, createdAt: Date.now() });
}

export function getAudit(auditId: string): AuditResult | null {
  const entry = auditStore.get(auditId);
  if (!entry) return null;
  if (isExpired(entry.createdAt)) {
    auditStore.delete(auditId);
    return null;
  }
  return entry.result;
}

export function pruneAudits(): void {
  for (const [auditId, entry] of auditStore.entries()) {
    if (isExpired(entry.createdAt)) {
      auditStore.delete(auditId);
    }
  }
}
