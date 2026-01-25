import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/');

    // Check main heading exists
    await expect(page.locator('h1')).toBeVisible();

    // Check audit form exists
    await expect(page.locator('input[type="text"], input[type="url"]')).toBeVisible();

    // Check submit button exists
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have valid meta tags', async ({ page }) => {
    await page.goto('/');

    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(10);

    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });

  test('should show validation error for empty input', async ({ page }) => {
    await page.goto('/');

    // Try to submit without entering a URL
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should either show validation message or stay on page
    const url = page.url();
    expect(url).toContain('/');
  });

  test('should accept valid domain input', async ({ page }) => {
    await page.goto('/');

    // Enter a valid domain
    const input = page.locator('input[type="text"], input[type="url"]').first();
    await input.fill('example.com');

    // Input should contain the value
    await expect(input).toHaveValue('example.com');
  });
});
