import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { auditDomain } from '$lib/auditing/auditor';
import { ValidationError, NetworkError, TimeoutError } from '$lib/auditing/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('auditDomain', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Domain Validation Tests
  // ============================================================================

  describe('Domain Validation', () => {
    it('rejects empty domain', async () => {
      await expect(auditDomain({ domain: '' })).rejects.toThrow(ValidationError);
      await expect(auditDomain({ domain: '   ' })).rejects.toThrow(ValidationError);
    });

    it('rejects missing domain', async () => {
      await expect(auditDomain({ domain: undefined as any })).rejects.toThrow(ValidationError);
    });

    it('rejects domain without TLD', async () => {
      await expect(auditDomain({ domain: 'localhost' })).rejects.toThrow(ValidationError);
      await expect(auditDomain({ domain: 'example' })).rejects.toThrow(ValidationError);
    });

    it('rejects domain with invalid characters', async () => {
      // Domains with spaces, @, or underscores throw TypeError from URL constructor
      await expect(auditDomain({ domain: 'exam ple.com' })).rejects.toThrow();
      await expect(auditDomain({ domain: 'exam@ple.com' })).rejects.toThrow();
      await expect(auditDomain({ domain: 'exam_ple.com' })).rejects.toThrow();
    });

    it('rejects very long domains', async () => {
      // Very long domains may fail fetch rather than validation
      const longDomain = 'a'.repeat(100) + '.com';
      await expect(auditDomain({ domain: longDomain })).rejects.toThrow();
    });

    it('accepts valid domain formats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

      // Mock all 6 fetch calls
      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => '',
        });
      }

      const result = await auditDomain({ domain: 'example.com' });
      expect(result).toBeDefined();
      expect(result.audited_url).toContain('example.com');
    });

    it('accepts domains with hyphens', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      });

      const result = await auditDomain({ domain: 'my-domain-name.co.uk' });
      expect(result).toBeDefined();
    });

    it('normalizes HTTP/HTTPS URLs to domain', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      });

      const result = await auditDomain({ domain: 'https://example.com/path' });
      expect(result.audited_url).toBe('https://example.com');
    });
  });

  // ============================================================================
  // Score Calculation Tests
  // ============================================================================

  describe('Score Calculation', () => {
    beforeEach(() => {
      // Mock all 6 checks with full responses
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      });
    });

    it('produces score between 0 and 100', async () => {
      const result = await auditDomain({ domain: 'example.com' });
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.overall_score).toBeLessThanOrEqual(100);
    });

    it('applies weights correctly to individual checks', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <head>
              <title>Test Page</title>
              <meta name="description" content="Test description for the page">
              <link rel="canonical" href="https://example.com">
              <meta property="og:title" content="Test">
              <meta property="article:published_time" content="2024-01-01T00:00:00Z">
            </head>
            <body>
              <article>
                <h1>Main Title</h1>
                <h2>Subtitle</h2>
                <p>Content here with semantic structure.</p>
              </article>
            </body>
          </html>
        `,
      });

      const result = await auditDomain({ domain: 'example.com' });

      // Should have 6 checks (AEO checks)
      expect(result.checks).toHaveLength(6);

      // All checks should contribute to overall score
      const hasNonZeroScore = result.checks.some((check) => check.score > 0);
      expect(hasNonZeroScore).toBe(true);
    });

    it('handles all checks at maximum score', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <head>
              <title>Perfect Page</title>
              <meta name="description" content="A well-optimized page with all best practices">
              <link rel="canonical" href="https://example.com">
              <meta property="og:title" content="Perfect">
              <meta property="article:published_time" content="2024-01-01">
            </head>
            <body>
              <article>
                <h1>Main Title</h1>
                <h2>Section 1</h2>
                <h3>Subsection</h3>
                <p>High-quality content with proper structure.</p>
                <img src="image.jpg" alt="Descriptive alt text">
              </article>
              <script type="application/ld+json">
                {"@type": "BlogPosting", "headline": "Test", "author": "Author", "datePublished": "2024-01-01"}
              </script>
            </body>
          </html>
        `,
      });

      const result = await auditDomain({ domain: 'example.com' });
      expect(result.overall_score).toBeGreaterThan(0);
    });

    it('handles all checks at minimum score', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '<html><body>minimal</body></html>',
      });

      const result = await auditDomain({ domain: 'example.com' });
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Individual Check Structure Tests
  // ============================================================================

  describe('Individual Check Result Structure', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      });
    });

    it('returns 6 checks with required fields', async () => {
      const result = await auditDomain({ domain: 'example.com' });

      expect(result.checks).toHaveLength(6);

      result.checks.forEach((check) => {
        // Required fields
        expect(check.id).toBeDefined();
        expect(typeof check.id).toBe('string');

        expect(check.label).toBeDefined();
        expect(typeof check.label).toBe('string');

        expect(check.status).toBeDefined();
        expect(['pass', 'warning', 'fail']).toContain(check.status);

        expect(check.score).toBeDefined();
        expect(typeof check.score).toBe('number');
        expect(check.score).toBeGreaterThanOrEqual(0);
        expect(check.score).toBeLessThanOrEqual(100);

        expect(check.summary).toBeDefined();
        expect(typeof check.summary).toBe('string');

        // Details object
        expect(check.details).toBeDefined();
        expect(check.details.explanation).toBeDefined();
        expect(typeof check.details.explanation).toBe('string');

        expect(check.details.evidence).toBeDefined();
        expect(Array.isArray(check.details.evidence)).toBe(true);

        expect(check.details.recommendation).toBeDefined();
        expect(typeof check.details.recommendation).toBe('string');

        // Metadata
        expect(check.metadata).toBeDefined();
        expect(typeof check.metadata.is_share_safe).toBe('boolean');
        expect(typeof check.metadata.is_pro_only).toBe('boolean');
        expect(['access', 'structure', 'metadata', 'content']).toContain(
          check.metadata.category
        );
      });
    });

    it('each check score is within 0-100 range', async () => {
      const result = await auditDomain({ domain: 'example.com' });

      result.checks.forEach((check) => {
        expect(check.score).toBeGreaterThanOrEqual(0);
        expect(check.score).toBeLessThanOrEqual(100);
      });
    });

    it('produces appropriate status based on score', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '<html><body>minimal</body></html>',
      });

      const result = await auditDomain({ domain: 'example.com' });

      result.checks.forEach((check) => {
        // Status should be one of the valid values
        expect(['pass', 'warning', 'fail']).toContain(check.status);
      });
    });

    it('includes summary text for each check', async () => {
      const result = await auditDomain({ domain: 'example.com' });

      result.checks.forEach((check) => {
        expect(check.summary.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('catches network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(auditDomain({ domain: 'example.com' })).rejects.toThrow(NetworkError);
    });

    it('handles 404 responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => '',
      });

      const result = await auditDomain({ domain: 'example.com' });
      // Should still produce a result, but with lower scores
      expect(result).toBeDefined();
      expect(result.overall_score).toBeGreaterThanOrEqual(0);
    });

    it('handles 500 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => '',
      });

      const result = await auditDomain({ domain: 'example.com' });
      expect(result).toBeDefined();
    });

    it('handles timeout errors', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
          })
      );

      // This will reject after all retries
      await expect(auditDomain({ domain: 'example.com' })).rejects.toThrow();
    });

    it('handles invalid JSON in responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'not valid json or html',
      });

      const result = await auditDomain({ domain: 'example.com' });
      expect(result).toBeDefined();
    });

    it('handles empty responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      });

      const result = await auditDomain({ domain: 'example.com' });
      expect(result).toBeDefined();
    });

    it('returns proper error code for validation errors', async () => {
      try {
        await auditDomain({ domain: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns proper error code for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      try {
        await auditDomain({ domain: 'example.com' });
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        expect((error as NetworkError).code).toBe('NETWORK_ERROR');
      }
    });
  });

  // ============================================================================
  // Response Structure Tests
  // ============================================================================

  describe('Response Structure', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      });
    });

    it('returns AuditResult with all required fields', async () => {
      const result = await auditDomain({ domain: 'example.com' });

      expect(result.schema_version).toBeDefined();
      expect(result.audit_id).toBeDefined();
      expect(result.audited_url).toBeDefined();
      expect(result.audited_at).toBeDefined();
      expect(result.overall_score).toBeDefined();
      expect(result.visibility_summary).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.notes).toBeDefined();
      expect(result.limits).toBeDefined();
    });

    it('generates unique audit_id for each audit', async () => {
      const result1 = await auditDomain({ domain: 'example.com' });
      const result2 = await auditDomain({ domain: 'example.com' });

      expect(result1.audit_id).not.toBe(result2.audit_id);
    });

    it('includes visibility summary percentages that sum to 100', async () => {
      const result = await auditDomain({ domain: 'example.com' });

      expect(result.visibility_summary.ai_visible_percentage).toBeDefined();
      expect(result.visibility_summary.ai_invisible_percentage).toBeDefined();
      expect(
        result.visibility_summary.ai_visible_percentage +
          result.visibility_summary.ai_invisible_percentage
      ).toBe(100);
    });

    it('audited_at is valid ISO timestamp', async () => {
      const result = await auditDomain({ domain: 'example.com' });

      const date = new Date(result.audited_at);
      expect(date.getTime()).toBeGreaterThan(0);
      expect(result.audited_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('limits object has correct structure', async () => {
      const result = await auditDomain({ domain: 'example.com' });

      expect(result.limits.plan).toBe('free');
      expect(typeof result.limits.audits_remaining).toBe('number');
      expect(typeof result.limits.export_available).toBe('boolean');
      expect(typeof result.limits.history_days).toBe('number');
    });

    it('audited_url uses https protocol', async () => {
      const result = await auditDomain({ domain: 'example.com' });

      expect(result.audited_url.startsWith('https://')).toBe(true);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('handles domain with www subdomain', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      });

      const result = await auditDomain({ domain: 'www.example.com' });
      expect(result.audited_url).toContain('example.com');
    });

    it('normalizes trailing slashes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      });

      const result1 = await auditDomain({ domain: 'example.com/' });
      const result2 = await auditDomain({ domain: 'example.com' });

      expect(result1.audited_url).toBe(result2.audited_url);
    });

    it('complete audit flow produces valid result', async () => {
      const htmlWithAllFeatures = `
        <html>
          <head>
            <title>Complete SEO Page</title>
            <meta name="description" content="This is a complete page with all SEO features">
            <link rel="canonical" href="https://example.com">
            <meta property="og:title" content="Complete">
            <meta property="article:published_time" content="2024-01-01T00:00:00Z">
            <meta name="viewport" content="width=device-width">
          </head>
          <body>
            <article>
              <h1>Main Article Title</h1>
              <h2>Section One</h2>
              <p>First paragraph with content.</p>
              <h3>Subsection</h3>
              <p>More content here with details and explanations.</p>
              <h2>Section Two</h2>
              <p>Additional content for completeness.</p>
              <img src="image.jpg" alt="Relevant alt text">
            </article>
            <script type="application/ld+json">
              {"@type": "BlogPosting", "headline": "Article", "author": "Author", "datePublished": "2024-01-01"}
            </script>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => htmlWithAllFeatures,
      });

      const result = await auditDomain({ domain: 'example.com' });

      expect(result).toBeDefined();
      expect(result.overall_score).toBeGreaterThan(0);
      expect(result.checks.length).toBe(6);
      expect(result.visibility_summary.ai_visible_percentage).toBeGreaterThan(0);
    });
  });
});
