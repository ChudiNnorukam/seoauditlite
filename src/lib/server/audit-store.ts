import type { AuditResult } from '$lib/auditing/schema';
import { getDb } from './db';

const DEFAULT_TTL_DAYS = 7;
const PRO_TTL_DAYS = 30;

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
export async function countRecentAudits(entitlementKey: string): Promise<number> {
  const db = await getDb();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const result = await db.execute({
    sql: `SELECT COUNT(*) as count FROM audits
          WHERE entitlement_key = ?
          AND created_at > ?`,
    args: [entitlementKey, sevenDaysAgo],
  });

  const row = result.rows[0];
  return (row?.count as number) ?? 0;
}

/**
 * Check if an entitlement key can create a new audit.
 * Returns { allowed: boolean, remaining: number, limit: number }
 */
export async function canCreateAudit(
  entitlementKey: string | null,
  plan: 'free' | 'pro'
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Pro users have unlimited audits
  if (plan === 'pro') {
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  // Anonymous users (no entitlement key) get 1 audit
  if (!entitlementKey) {
    return { allowed: true, remaining: 1, limit: 1 };
  }

  const count = await countRecentAudits(entitlementKey);
  const remaining = Math.max(0, FREE_AUDIT_LIMIT - count);

  return {
    allowed: remaining > 0,
    remaining,
    limit: FREE_AUDIT_LIMIT,
  };
}

export async function saveAudit(
  result: AuditResult,
  meta?: { entitlementKey?: string | null; referralId?: string | null }
): Promise<void> {
  const db = await getDb();

  await db.execute({
    sql: `INSERT OR IGNORE INTO audits (
            audit_id,
            audited_url,
            schema_version,
            payload_json,
            created_at,
            expires_at,
            entitlement_key,
            referral_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      result.audit_id,
      result.audited_url,
      result.schema_version,
      JSON.stringify(result),
      result.audited_at,
      resolveExpiry(result.audited_at),
      meta?.entitlementKey ?? null,
      meta?.referralId ?? null,
    ],
  });
}

export async function getAudit(auditId: string): Promise<AuditResult | null> {
  const db = await getDb();

  const result = await db.execute({
    sql: 'SELECT payload_json, expires_at FROM audits WHERE audit_id = ?',
    args: [auditId],
  });

  const row = result.rows[0];
  if (!row) return null;

  const expiresAt = row.expires_at as string | null;
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
    await db.execute({
      sql: 'DELETE FROM audits WHERE audit_id = ?',
      args: [auditId],
    });
    return null;
  }

  try {
    return JSON.parse(row.payload_json as string) as AuditResult;
  } catch {
    await db.execute({
      sql: 'DELETE FROM audits WHERE audit_id = ?',
      args: [auditId],
    });
    return null;
  }
}

export async function pruneExpiredAudits(): Promise<number> {
  const db = await getDb();

  const result = await db.execute({
    sql: 'DELETE FROM audits WHERE expires_at IS NOT NULL AND expires_at <= ?',
    args: [new Date().toISOString()],
  });

  return result.rowsAffected;
}
