import type { AuditResult } from '$lib/auditing/schema';
import { getDb } from './db';

const DEFAULT_TTL_DAYS = 7;
const PRO_TTL_DAYS = 30;
const TTL_MS = 1000 * 60 * 60 * 24 * DEFAULT_TTL_DAYS;

// Free tier audit limit (per 7-day period)
const FREE_AUDIT_LIMIT = 3;

function resolveExpiry(auditedAt: string, isPro: boolean = false): string {
  const base = Date.parse(auditedAt);
  const start = Number.isNaN(base) ? Date.now() : base;
  const ttlDays = isPro ? PRO_TTL_DAYS : DEFAULT_TTL_DAYS;
  return new Date(start + 1000 * 60 * 60 * 24 * ttlDays).toISOString();
}

/**
 * Count audits created by an entitlement key in the past 7 days.
 * Used for enforcing free tier limits.
 */
export function countRecentAudits(entitlementKey: string): number {
  const db = getDb();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const result = db
    .prepare(
      `SELECT COUNT(*) as count FROM audits
       WHERE entitlement_key = ?
       AND created_at > ?`
    )
    .get(entitlementKey, sevenDaysAgo) as { count: number };

  return result?.count ?? 0;
}

/**
 * Check if an entitlement key can create a new audit.
 * Returns { allowed: boolean, remaining: number, limit: number }
 */
export function canCreateAudit(
  entitlementKey: string | null,
  plan: 'free' | 'pro'
): { allowed: boolean; remaining: number; limit: number } {
  // Pro users have unlimited audits
  if (plan === 'pro') {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  // Anonymous users (no entitlement key) get 1 audit
  if (!entitlementKey) {
    return { allowed: true, remaining: 1, limit: 1 };
  }

  const count = countRecentAudits(entitlementKey);
  const remaining = Math.max(0, FREE_AUDIT_LIMIT - count);

  return {
    allowed: remaining > 0,
    remaining,
    limit: FREE_AUDIT_LIMIT
  };
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
