export type EntitlementPlan = 'free' | 'pro';

export interface EntitlementContext {
  plan: EntitlementPlan;
  isShareLink: boolean;
  isOwner: boolean;
}

export function createEntitlementContext(input: {
  plan?: EntitlementPlan;
  isShareLink: boolean;
  isOwner: boolean;
}): EntitlementContext {
  const isOwner = Boolean(input.isOwner);
  return {
    plan: input.plan ?? 'free',
    isShareLink: input.isShareLink && !isOwner,
    isOwner,
  };
}
