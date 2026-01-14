import type { AuditResult } from './schema';
import type { EntitlementContext, EntitlementPlan } from './entitlements';
import { createEntitlementContext } from './entitlements';

export interface EntitlementInputs {
  audit?: AuditResult | null;
  isShareLink: boolean;
  isOwner: boolean;
  planOverride?: EntitlementPlan;
  userId?: string | null;
}

export function resolveEntitlements(inputs: EntitlementInputs): EntitlementContext {
  const plan = inputs.planOverride ?? inputs.audit?.limits.plan ?? 'free';

  return createEntitlementContext({
    plan,
    isShareLink: inputs.isShareLink,
    isOwner: inputs.isOwner,
  });
}
