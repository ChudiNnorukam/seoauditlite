import type { AuditResult } from './schema';
import type { EntitlementContext } from './entitlements';

const SHARE_EXPLANATION = 'Details are hidden in the share view.';
const SHARE_RECOMMENDATION = 'Upgrade to unlock detailed recommendations.';
const FREE_RECOMMENDATION_FALLBACK = 'Upgrade to unlock recommendations.';
const FREE_RECOMMENDATION_SUFFIX = 'Upgrade to unlock the full recommendation.';

function teaseRecommendation(text: string, isProOnly: boolean): string {
  if (isProOnly) {
    return 'Upgrade to unlock this recommendation.';
  }

  const cleaned = text.trim();
  if (!cleaned) return FREE_RECOMMENDATION_FALLBACK;

  const words = cleaned.split(/\s+/);
  const preview = words.slice(0, 10).join(' ');
  const truncated = words.length > 10;

  return `Preview: ${preview}${truncated ? '...' : ''} ${FREE_RECOMMENDATION_SUFFIX}`;
}

export function redactAudit(audit: AuditResult, context: EntitlementContext): AuditResult {
  const shareMode = context.isShareLink;
  const showPro = context.plan === 'pro' && !shareMode;
  let hiddenShareChecks = 0;

  const checks = audit.checks.flatMap((check) => {
    if (shareMode && !check.metadata.is_share_safe) {
      hiddenShareChecks += 1;
      return [];
    }

    if (shareMode) {
      return [
        {
          ...check,
          details: {
            explanation: SHARE_EXPLANATION,
            evidence: [],
            recommendation: SHARE_RECOMMENDATION,
          },
        },
      ];
    }

    if (!showPro) {
      return [
        {
          ...check,
          details: {
            ...check.details,
            evidence: [],
            recommendation: check.metadata.is_pro_only
              ? teaseRecommendation(check.details.recommendation, true)
              : check.details.recommendation,
          },
        },
      ];
    }

    return [{ ...check }];
  });

  const notes = shareMode
    ? hiddenShareChecks > 0
      ? [
          {
            type: 'info' as const,
            message: `${hiddenShareChecks} checks are hidden in the share view.`,
          },
        ]
      : []
    : audit.notes;

  return {
    ...audit,
    checks,
    notes,
  };
}
