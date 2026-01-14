import { getDb } from './db';
import type { EntitlementPlan } from '$lib/auditing/entitlements';

export interface EntitlementRecord {
  entitlement_key: string;
  stripe_customer_id: string | null;
  plan: EntitlementPlan;
  status: string;
  updated_at: string;
}

function normalizePlan(plan?: string | null): EntitlementPlan {
  return plan === 'pro' ? 'pro' : 'free';
}

export function ensureEntitlement(entitlementKey: string): void {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO entitlements (
      entitlement_key,
      stripe_customer_id,
      plan,
      status,
      updated_at
    ) VALUES (?, NULL, 'free', 'free', ?)`
  ).run(entitlementKey, new Date().toISOString());
}

export function getEntitlementByKey(entitlementKey: string): EntitlementRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      'SELECT entitlement_key, stripe_customer_id, plan, status, updated_at FROM entitlements WHERE entitlement_key = ?'
    )
    .get(entitlementKey) as EntitlementRecord | undefined;

  if (!row) return null;
  return { ...row, plan: normalizePlan(row.plan) };
}

export function getEntitlementByCustomerId(customerId: string): EntitlementRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      'SELECT entitlement_key, stripe_customer_id, plan, status, updated_at FROM entitlements WHERE stripe_customer_id = ?'
    )
    .get(customerId) as EntitlementRecord | undefined;

  if (!row) return null;
  return { ...row, plan: normalizePlan(row.plan) };
}

export function upsertEntitlement(params: {
  entitlementKey: string;
  plan: EntitlementPlan;
  status: string;
  stripeCustomerId?: string | null;
}): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO entitlements (
      entitlement_key,
      stripe_customer_id,
      plan,
      status,
      updated_at
    ) VALUES (
      @entitlement_key,
      @stripe_customer_id,
      @plan,
      @status,
      @updated_at
    )
    ON CONFLICT(entitlement_key) DO UPDATE SET
      stripe_customer_id = COALESCE(excluded.stripe_customer_id, entitlements.stripe_customer_id),
      plan = excluded.plan,
      status = excluded.status,
      updated_at = excluded.updated_at`
  ).run({
    entitlement_key: params.entitlementKey,
    stripe_customer_id: params.stripeCustomerId ?? null,
    plan: params.plan,
    status: params.status,
    updated_at: new Date().toISOString(),
  });
}

export function updateEntitlementByCustomer(params: {
  stripeCustomerId: string;
  plan: EntitlementPlan;
  status: string;
}): boolean {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE entitlements
      SET plan = ?, status = ?, updated_at = ?
      WHERE stripe_customer_id = ?`
    )
    .run(params.plan, params.status, new Date().toISOString(), params.stripeCustomerId);

  return result.changes > 0;
}
