import { test, expect } from '@playwright/test';

/**
 * Debug test to figure out why connection dialog is showing
 */

test.describe('Debug Connection Dialog', () => {
  test('take screenshot and inspect page', async ({ page }) => {
    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Capture network requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(`${request.method()} ${request.url()}`);
    });
    
    console.log('📸 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait a bit for React to render
    await page.waitForTimeout(3000);
    
    // Check what's visible on the page
    console.log('\n🔍 Checking page elements...');
    
    // Check for connection dialog (vanilla JS version)
    const connectionDialog = page.locator('#config, .connection-dialog');
    const connectionDialogVisible = await connectionDialog.isVisible().catch(() => false);
    console.log(`Connection dialog visible: ${connectionDialogVisible}`);
    
    // Check for auth dialog (React version)
    const authDialog = page.locator('.auth-dialog');
    const authDialogVisible = await authDialog.isVisible().catch(() => false);
    console.log(`Auth dialog visible: ${authDialogVisible}`);
    
    // Check for game UI
    const gameUI = page.locator('.app .header, .app .main-output');
    const gameUIVisible = await gameUI.isVisible().catch(() => false);
    console.log(`Game UI visible: ${gameUIVisible}`);
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Get all visible text
    const bodyText = await page.locator('body').textContent();
    console.log(`\n📄 Page content preview (first 500 chars):`);
    console.log(bodyText?.substring(0, 500));
    
    // Check for React root
    const reactRoot = page.locator('#root');
    const reactRootExists = await reactRoot.count() > 0;
    console.log(`\nReact root (#root) exists: ${reactRootExists}`);
    
    // Check what scripts are loaded
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script')).map(s => s.src || s.textContent?.substring(0, 100));
    });
    console.log(`\n📜 Scripts loaded: ${scripts.length}`);
    scripts.forEach((script, i) => {
      console.log(`  ${i + 1}. ${script}`);
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/debug-connection-dialog.png',
      fullPage: true 
    });
    console.log('\n✅ Screenshot saved to screenshots/debug-connection-dialog.png');
    
    // Save console logs
    const fs = await import('fs');
    const path = await import('path');
    const screenshotsDir = path.default.join(process.cwd(), 'screenshots');
    if (!fs.default.existsSync(screenshotsDir)) {
      fs.default.mkdirSync(screenshotsDir, { recursive: true });
    }
    fs.default.writeFileSync(
      path.default.join(screenshotsDir, 'debug-console-logs.txt'),
      logs.join('\n')
    );
    fs.default.writeFileSync(
      path.default.join(screenshotsDir, 'debug-network-requests.txt'),
      requests.join('\n')
    );
    
    console.log('\n📝 Console logs saved to screenshots/debug-console-logs.txt');
    console.log('🌐 Network requests saved to screenshots/debug-network-requests.txt');
    
    // Check if we're on the React app or vanilla JS
    const isReactApp = await page.evaluate(() => {
      return !!window.React || !!document.querySelector('#root');
    });
    console.log(`\n⚛️  React app detected: ${isReactApp}`);
    
    // Final assertion - connection dialog should NOT be visible
    if (connectionDialogVisible) {
      console.log('\n❌ PROBLEM FOUND: Connection dialog is visible!');
      console.log('This suggests you might be viewing the vanilla JS version (index.html)');
      console.log('instead of the React app (index-react.html served by Vite)');
    } else {
      console.log('\n✅ Connection dialog is not visible (good!)');
    }
  });
});
