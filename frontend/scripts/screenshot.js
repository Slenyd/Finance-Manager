import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, '..', 'Documentation', 'design', 'screenshots');
const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const PAGES = [
  { name: 'login', path: '/login', auth: false },
  { name: 'register', path: '/register', auth: false },
  { name: 'forgot-password', path: '/forgot-password', auth: false },
  { name: 'reset-password', path: '/reset-password?token=invalid', auth: false },
  { name: 'dashboard', path: '/dashboard', auth: true },
  { name: 'transactions', path: '/transactions', auth: true },
  { name: 'budgets', path: '/budgets', auth: true },
  { name: 'goals', path: '/goals', auth: true },
  { name: 'analytics', path: '/analytics', auth: true },
  { name: 'notifications', path: '/notifications', auth: true },
  { name: 'settings', path: '/settings', auth: true },
];

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', 'user@cointoss.app');
  await page.fill('input[type="password"]', 'Password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const [sizeName, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
    });

    const page = await context.newPage();
    let isLoggedIn = false;

    for (const pageInfo of PAGES) {
      const filename = sizeName === 'desktop'
        ? `${pageInfo.name}.png`
        : `${pageInfo.name}-${sizeName}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);

      try {
        if (pageInfo.auth && !isLoggedIn) {
          await login(page);
          isLoggedIn = true;
        }

        await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1500);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log(`  Captured: ${filename}`);
      } catch (err) {
        console.log(`  Skipped: ${filename} (${err.message})`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to Documentation/design/screenshots/');
}

main().catch(console.error);