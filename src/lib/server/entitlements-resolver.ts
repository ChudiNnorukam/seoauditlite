import type { AuditResult } from '$lib/auditing/schema';
import type { EntitlementContext } from '$lib/auditing/entitlements';
import { resolveEntitlements } from '$lib/auditing/resolve-entitlements';
import { ensureEntitlement, getEntitlementByKey } from './entitlements-store';

export function resolveEntitlementsForRequest(input: {
  entitlementKey?: string | null;
  audit?: AuditResult | null;
  isShareLink: boolean;
  isOwner: boolean;
}): EntitlementContext {
  let planOverride: EntitlementContext['plan'] | undefined;

  if (input.entitlementKey) {
    ensureEntitlement(input.entitlementKey);
    const record = getEntitlementByKey(input.entitlementKey);
    planOverride = record?.plan;
  }

  return resolveEntitlements({
    audit: input.audit ?? null,
    isShareLink: input.isShareLink,
    isOwner: input.isOwner,
    planOverride,
  });
}
