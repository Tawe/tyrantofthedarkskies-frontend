/**
 * Quick screenshot script
 * 
 * Run this to take a screenshot of the current app state.
 * Make sure the dev server is running first: npm run dev
 * 
 * Usage: npx tsx scripts/screenshot.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function takeScreenshot() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📸 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotsDir, `app-${timestamp}.png`);
    
    console.log('📷 Taking screenshot...');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`✅ Screenshot saved to: ${screenshotPath}`);
    
    // Also capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    const logsPath = path.join(screenshotsDir, `console-${timestamp}.txt`);
    fs.writeFileSync(logsPath, logs.join('\n'));
    console.log(`📝 Console logs saved to: ${logsPath}`);
    
  } catch (error) {
    console.error('❌ Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshot();
