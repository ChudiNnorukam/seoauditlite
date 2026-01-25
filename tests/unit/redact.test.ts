import { describe, it, expect } from 'vitest';
import { redactAudit } from '$lib/auditing/redact';
import type { AuditResult } from '$lib/auditing/schema';
import type { EntitlementContext } from '$lib/auditing/entitlements';

const mockAudit: AuditResult = {
  schema_version: '2.0.0',
  audit_id: 'test-audit-123',
  audited_url: 'https://example.com',
  audited_at: '2024-01-15T00:00:00Z',
  overall_score: 75,
  visibility_summary: {
    ai_visible_percentage: 75,
    ai_invisible_percentage: 25,
  },
  checks: [
    {
      id: 'ai_crawler_access',
      label: 'AI Crawler Access',
      status: 'pass',
      score: 85,
      summary: '5/5 AI crawlers allowed',
      details: {
        explanation: 'All AI crawlers can access your site.',
        evidence: ['GPTBot: allowed', 'ClaudeBot: allowed'],
        recommendation: 'No changes needed.',
      },
      metadata: {
        is_share_safe: true,
        is_pro_only: false,
        category: 'access',
      },
    },
    {
      id: 'structured_data',
      label: 'Structured Data',
      status: 'warning',
      score: 60,
      summary: 'Some schemas missing',
      details: {
        explanation: 'Missing FAQ schema.',
        evidence: ['WebSite schema present', 'BlogPosting missing'],
        recommendation: 'Add BlogPosting schema.',
      },
      metadata: {
        is_share_safe: true,
        is_pro_only: true,
        category: 'metadata',
      },
    },
  ],
  notes: [],
  limits: {
    plan: 'free',
    audits_remaining: 2,
    export_available: false,
    history_days: 0,
  },
};

describe('redactAudit', () => {
  it('should return full audit for pro users who are owners', () => {
    const entitlements: EntitlementContext = {
      plan: 'pro',
      isShareLink: false,
      isOwner: true,
    };

    const result = redactAudit(mockAudit, entitlements);

    expect(result.checks).toHaveLength(2);
    expect(result.checks[1].details.recommendation).toBe('Add BlogPosting schema.');
  });

  it('should redact pro-only check details for free users', () => {
    const entitlements: EntitlementContext = {
      plan: 'free',
      isShareLink: false,
      isOwner: true,
    };

    const result = redactAudit(mockAudit, entitlements);

    expect(result.checks).toHaveLength(2);
    // Pro-only check should have redacted recommendation
    const proCheck = result.checks.find(c => c.id === 'structured_data');
    expect(proCheck?.details.recommendation).toContain('Upgrade');
  });

  it('should handle share links appropriately', () => {
    const entitlements: EntitlementContext = {
      plan: 'free',
      isShareLink: true,
      isOwner: false,
    };

    const result = redactAudit(mockAudit, entitlements);

    // Share links should still work but with free tier redaction
    expect(result.audit_id).toBe('test-audit-123');
    expect(result.overall_score).toBe(75);
  });
});
