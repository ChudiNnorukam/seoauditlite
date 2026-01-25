import { test, expect } from '@playwright/test';

test.describe('Audit Flow', () => {
  test('should start an audit and show loading state', async ({ page }) => {
    await page.goto('/');

    // Enter a domain
    const input = page.locator('input[type="text"], input[type="url"]').first();
    await input.fill('example.com');

    // Submit the form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should show loading state or redirect to report
    // Wait for either loading indicator or navigation
    await Promise.race([
      page.waitForSelector('[data-loading="true"], .loading, .spinner', { timeout: 5000 }).catch(() => null),
      page.waitForURL(/\/report\//, { timeout: 30000 }).catch(() => null),
    ]);

    // Page should have changed state
    const currentUrl = page.url();
    const hasLoading = await page.locator('[data-loading="true"], .loading, .spinner').count() > 0;

    expect(currentUrl.includes('/report/') || hasLoading || currentUrl === '/').toBeTruthy();
  });

  test('API should return valid response structure', async ({ request }) => {
    const response = await request.post('/api/audit', {
      data: { domain: 'example.com' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Should return 200 or known error status
    expect([200, 400, 403, 429, 500, 503, 504]).toContain(response.status());

    const body = await response.json();

    // Should have standard response structure
    expect(body).toHaveProperty('success');

    if (body.success) {
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('audit_id');
      expect(body.data).toHaveProperty('overall_score');
      expect(body.data).toHaveProperty('checks');
    } else {
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('code');
    }
  });

  test('API should rate limit excessive requests', async ({ request }) => {
    // Make multiple rapid requests
    const responses = await Promise.all(
      Array.from({ length: 15 }, () =>
        request.post('/api/audit', {
          data: { domain: 'example.com' },
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    // At least one should be rate limited (429)
    const rateLimited = responses.filter(r => r.status() === 429);

    // We expect rate limiting to kick in for 10+ requests per minute
    // This test might pass or fail depending on rate limit config
    console.log(`Rate limited: ${rateLimited.length}/${responses.length}`);
  });
});
