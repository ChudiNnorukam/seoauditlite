import type { AuditResult } from '$lib/auditing/schema';
import { getDb } from './db';

const DEFAULT_TTL_DAYS = 7;
const TTL_MS = 1000 * 60 * 60 * 24 * DEFAULT_TTL_DAYS;

function resolveExpiry(auditedAt: string): string {
  const base = Date.parse(auditedAt);
  const start = Number.isNaN(base) ? Date.now() : base;
  return new Date(start + TTL_MS).toISOString();
}

export function saveAudit(
  result: AuditResult,
  meta?: { entitlementKey?: string | null; referralId?: string | null }
): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO audits (
      audit_id,
      audited_url,
      schema_version,
      payload_json,
      created_at,
      expires_at,
      entitlement_key,
      referral_id
    ) VALUES (
      @audit_id,
      @audited_url,
      @schema_version,
      @payload_json,
      @created_at,
      @expires_at,
      @entitlement_key,
      @referral_id
    )
  `);

  stmt.run({
    audit_id: result.audit_id,
    audited_url: result.audited_url,
    schema_version: result.schema_version,
    payload_json: JSON.stringify(result),
    created_at: result.audited_at,
    expires_at: resolveExpiry(result.audited_at),
    entitlement_key: meta?.entitlementKey ?? null,
    referral_id: meta?.referralId ?? null,
  });
}

export function getAudit(auditId: string): AuditResult | null {
  const db = getDb();
  const row = db
    .prepare('SELECT payload_json, expires_at FROM audits WHERE audit_id = ?')
    .get(auditId) as { payload_json: string; expires_at: string | null } | undefined;

  if (!row) return null;

  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) {
    db.prepare('DELETE FROM audits WHERE audit_id = ?').run(auditId);
    return null;
  }

  try {
    return JSON.parse(row.payload_json) as AuditResult;
  } catch {
    db.prepare('DELETE FROM audits WHERE audit_id = ?').run(auditId);
    return null;
  }
}

export function pruneExpiredAudits(): number {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM audits WHERE expires_at IS NOT NULL AND expires_at <= ?')
    .run(new Date().toISOString());
  return result.changes;
}
