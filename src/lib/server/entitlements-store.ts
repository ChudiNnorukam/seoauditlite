import { getDb } from './db';
import type { EntitlementPlan } from '$lib/auditing/entitlements';

export interface EntitlementRecord {
  entitlement_key: string;
  lemonsqueezy_customer_id: string | null;
  lemonsqueezy_subscription_id: string | null;
  referral_id: string | null;
  plan: EntitlementPlan;
  status: string;
  updated_at: string;
}

function normalizePlan(plan?: string | null): EntitlementPlan {
  return plan === 'pro' ? 'pro' : 'free';
}

export async function ensureEntitlement(entitlementKey: string): Promise<void> {
  const db = await getDb();

  await db.execute({
    sql: `INSERT OR IGNORE INTO entitlements (
            entitlement_key,
            lemonsqueezy_customer_id,
            lemonsqueezy_subscription_id,
            referral_id,
            plan,
            status,
            updated_at
          ) VALUES (?, NULL, NULL, NULL, 'free', 'free', ?)`,
    args: [entitlementKey, new Date().toISOString()],
  });
}

export async function getEntitlementByKey(entitlementKey: string): Promise<EntitlementRecord | null> {
  const db = await getDb();

  const result = await db.execute({
    sql: `SELECT entitlement_key, lemonsqueezy_customer_id, lemonsqueezy_subscription_id, referral_id, plan, status, updated_at
          FROM entitlements WHERE entitlement_key = ?`,
    args: [entitlementKey],
  });

  const row = result.rows[0];
  if (!row) return null;

  return {
    entitlement_key: row.entitlement_key as string,
    lemonsqueezy_customer_id: row.lemonsqueezy_customer_id as string | null,
    lemonsqueezy_subscription_id: row.lemonsqueezy_subscription_id as string | null,
    referral_id: row.referral_id as string | null,
    plan: normalizePlan(row.plan as string | null),
    status: row.status as string,
    updated_at: row.updated_at as string,
  };
}

export async function getEntitlementByCustomerId(customerId: string): Promise<EntitlementRecord | null> {
  const db = await getDb();

  const result = await db.execute({
    sql: `SELECT entitlement_key, lemonsqueezy_customer_id, lemonsqueezy_subscription_id, referral_id, plan, status, updated_at
          FROM entitlements WHERE lemonsqueezy_customer_id = ?`,
    args: [customerId],
  });

  const row = result.rows[0];
  if (!row) return null;

  return {
    entitlement_key: row.entitlement_key as string,
    lemonsqueezy_customer_id: row.lemonsqueezy_customer_id as string | null,
    lemonsqueezy_subscription_id: row.lemonsqueezy_subscription_id as string | null,
    referral_id: row.referral_id as string | null,
    plan: normalizePlan(row.plan as string | null),
    status: row.status as string,
    updated_at: row.updated_at as string,
  };
}

export async function upsertEntitlement(params: {
  entitlementKey: string;
  plan: EntitlementPlan;
  status: string;
  lemonSqueezyCustomerId?: string | null;
  lemonSqueezySubscriptionId?: string | null;
}): Promise<void> {
  const db = await getDb();

  await db.execute({
    sql: `INSERT INTO entitlements (
            entitlement_key,
            lemonsqueezy_customer_id,
            lemonsqueezy_subscription_id,
            referral_id,
            plan,
            status,
            updated_at
          ) VALUES (?, ?, ?, NULL, ?, ?, ?)
          ON CONFLICT(entitlement_key) DO UPDATE SET
            lemonsqueezy_customer_id = COALESCE(excluded.lemonsqueezy_customer_id, entitlements.lemonsqueezy_customer_id),
            lemonsqueezy_subscription_id = COALESCE(excluded.lemonsqueezy_subscription_id, entitlements.lemonsqueezy_subscription_id),
            referral_id = COALESCE(excluded.referral_id, entitlements.referral_id),
            plan = excluded.plan,
            status = excluded.status,
            updated_at = excluded.updated_at`,
    args: [
      params.entitlementKey,
      params.lemonSqueezyCustomerId ?? null,
      params.lemonSqueezySubscriptionId ?? null,
      params.plan,
      params.status,
      new Date().toISOString(),
    ],
  });
}

export async function updateEntitlementByCustomer(params: {
  lemonSqueezyCustomerId: string;
  plan: EntitlementPlan;
  status: string;
}): Promise<boolean> {
  const db = await getDb();

  const result = await db.execute({
    sql: `UPDATE entitlements
          SET plan = ?, status = ?, updated_at = ?
          WHERE lemonsqueezy_customer_id = ?`,
    args: [params.plan, params.status, new Date().toISOString(), params.lemonSqueezyCustomerId],
  });

  return result.rowsAffected > 0;
}

export async function setEntitlementReferral(entitlementKey: string, referralId: string): Promise<void> {
  const db = await getDb();

  await db.execute({
    sql: `UPDATE entitlements
          SET referral_id = ?, referral_updated_at = ?
          WHERE entitlement_key = ?`,
    args: [referralId, new Date().toISOString(), entitlementKey],
  });
}

export async function updateEntitlementBySubscription(params: {
  lemonSqueezySubscriptionId: string;
  plan: EntitlementPlan;
  status: string;
}): Promise<boolean> {
  const db = await getDb();

  const result = await db.execute({
    sql: `UPDATE entitlements
          SET plan = ?, status = ?, updated_at = ?
          WHERE lemonsqueezy_subscription_id = ?`,
    args: [params.plan, params.status, new Date().toISOString(), params.lemonSqueezySubscriptionId],
  });

  return result.rowsAffected > 0;
}

/**
 * Delete entitlement data for a customer (GDPR compliance).
 * Called when a customer is deleted from LemonSqueezy.
 */
export async function deleteEntitlementByCustomer(lemonSqueezyCustomerId: string): Promise<boolean> {
  const db = await getDb();

  const result = await db.execute({
    sql: `UPDATE entitlements
          SET lemonsqueezy_customer_id = NULL,
              lemonsqueezy_subscription_id = NULL,
              plan = 'free',
              status = 'deleted',
              updated_at = ?
          WHERE lemonsqueezy_customer_id = ?`,
    args: [new Date().toISOString(), lemonSqueezyCustomerId],
  });

  return result.rowsAffected > 0;
}
