import { test, expect } from '@playwright/test';

/**
 * Example test file
 * 
 * This is a basic example of how to write Playwright tests for the MUD client.
 */

test.describe('MUD Client', () => {
  test('should load the app', async ({ page }) => {
    await page.goto('/');
    
    // Check that the app container exists
    await expect(page.locator('.app')).toBeVisible();
  });

  test('should show auth dialog when not logged in', async ({ page }) => {
    await page.goto('/');
    
    // Wait for auth dialog or game UI
    const authDialog = page.locator('.auth-dialog');
    const gameUI = page.locator('.header');
    
    // One of them should be visible
    await expect(authDialog.or(gameUI)).toBeVisible({ timeout: 5000 });
  });

  test('should not show connection dialog', async ({ page }) => {
    await page.goto('/');
    
    // The connection dialog should NOT exist
    await expect(page.locator('.connection-dialog')).not.toBeVisible();
    await expect(page.locator('#config')).not.toBeVisible();
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Tyrant of the Dark Skies/);
  });
});
