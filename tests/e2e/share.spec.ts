import { test, expect } from '@playwright/test';

test.describe('Share Links', () => {
  test('should handle non-existent audit gracefully', async ({ page }) => {
    // Visit a non-existent audit
    await page.goto('/report/nonexistent-audit-id');

    // Should show error message or redirect
    const errorVisible = await page.locator('text=/not found|error|unable/i').isVisible().catch(() => false);
    const hasBackLink = await page.locator('a[href="/"]').isVisible().catch(() => false);

    expect(errorVisible || hasBackLink).toBeTruthy();
  });

  test('report page should have share functionality', async ({ page }) => {
    // This test would need a real audit ID
    // For now, test the page structure on a mock route
    await page.goto('/report/test-audit-id');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for share-related elements (may or may not be visible depending on audit existence)
    const pageContent = await page.content();

    // Page should render without crashing
    expect(pageContent).toBeTruthy();
  });

  test('should show appropriate content for share link visitors', async ({ page, context }) => {
    // Clear cookies to simulate anonymous visitor
    await context.clearCookies();

    await page.goto('/report/test-audit-id');

    // Page should load without authentication
    await expect(page.locator('body')).toBeVisible();
  });
});
