import { test, expect } from '@playwright/test';

/**
 * Screenshot utility test
 * 
 * This test can be used to take screenshots of the app for debugging.
 * Run with: npx playwright test tests/screenshot.spec.ts --headed
 */

test.describe('Screenshot Utility', () => {
  test('take screenshot of app', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any animations or async operations
    await page.waitForTimeout(2000);
    
    // Take a full page screenshot
    await page.screenshot({ 
      path: 'screenshots/app-state.png',
      fullPage: true 
    });
    
    // Take a screenshot of just the viewport
    await page.screenshot({ 
      path: 'screenshots/app-viewport.png',
      fullPage: false 
    });
  });

  test('take screenshot of auth dialog', async ({ page }) => {
    await page.goto('/');
    
    // Wait for auth dialog to appear
    await page.waitForSelector('.auth-dialog, .auth-content', { timeout: 5000 }).catch(() => {
      // If auth dialog doesn't appear, take screenshot anyway
    });
    
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/auth-dialog.png',
      fullPage: true 
    });
  });

  test('take screenshot of game view', async ({ page }) => {
    await page.goto('/');
    
    // Wait for game UI to appear (if user is already logged in)
    await page.waitForSelector('.app', { timeout: 5000 });
    
    // Wait a bit for game to load
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: 'screenshots/game-view.png',
      fullPage: true 
    });
  });

  test('take screenshot with console logs', async ({ page }) => {
    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Log console messages to file
    const fs = require('fs');
    fs.writeFileSync('screenshots/console-logs.txt', logs.join('\n'));
    
    await page.screenshot({ 
      path: 'screenshots/app-with-logs.png',
      fullPage: true 
    });
  });
});
