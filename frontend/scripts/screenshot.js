import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, '..', '..', 'תיק אפיון', 'design', 'screenshots');
const BASE_URL = 'http://localhost:5173';
const API_LOGIN_URL = 'http://localhost:5000/api/v1/auth/login';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const PUBLIC_PAGES = [
  { name: 'login', path: '/login', waitFor: 'input[type="email"]' },
  { name: 'register', path: '/register', waitFor: 'input[type="email"]' },
  { name: 'forgot-password', path: '/forgot-password', waitFor: 'input[type="email"]' },
  { name: 'reset-password', path: '/reset-password?token=invalid', waitFor: 'input[type="password"]' },
];

const AUTH_PAGES = [
  { name: 'dashboard', path: '/dashboard', waitForText: 'Dashboard', waitMs: 3500 },
  { name: 'transactions', path: '/transactions', waitForText: 'Transactions', waitMs: 3500 },
  { name: 'budgets', path: '/budgets', waitForText: 'Budgets', waitMs: 3500 },
  { name: 'goals', path: '/goals', waitForText: 'Savings Goals', waitMs: 3500 },
  { name: 'analytics', path: '/analytics', waitForText: 'Analytics', waitMs: 4000 },
  { name: 'notifications', path: '/notifications', waitForText: 'Notifications', waitMs: 3500 },
  { name: 'settings', path: '/settings', waitForText: 'Settings', waitMs: 3500 },
];

function encryptAuthState(state) {
  const raw = Buffer.from(JSON.stringify(state)).toString('base64');
  return 'v2:' + raw.split('').reverse().join('');
}

function exists(filepath) {
  try {
    const stat = fs.statSync(filepath);
    return stat.size > 10000; // skip if already captured and non-trivial
  } catch {
    return false;
  }
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  // Login via API to get accessToken + user
  let accessToken, encryptedAuth;
  try {
    console.log('Logging in via API...');
    const loginRaw = execSync(
      `curl -s -X POST "${API_LOGIN_URL}" -H "Content-Type: application/json" -d "{\\"email\\":\\"user@cointoss.app\\",\\"password\\":\\"Password123\\"}"`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    const loginData = JSON.parse(loginRaw);
    if (!loginData.success) throw new Error(loginData.message);
    const { user } = loginData.data;
    accessToken = loginData.data.accessToken;
    encryptedAuth = encryptAuthState({ user, isAuthenticated: true, rememberMe: false });
    console.log(`Login successful. User: ${user.email}`);
  } catch (err) {
    console.error('Login failed:', err.message);
    return;
  }

  const browser = await chromium.launch({ headless: true });

  for (const [sizeName, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\n=== ${sizeName} (${viewport.width}x${viewport.height}) ===`);

    // --- Context 1: Public pages (no auth) ---
    const pubCtx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    const pubPage = await pubCtx.newPage();

    for (const pageInfo of PUBLIC_PAGES) {
      const suffix = sizeName === 'desktop' ? '' : `-${sizeName}`;
      const filename = `${pageInfo.name}${suffix}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);

      if (exists(filepath)) {
        console.log(`  Exists: ${filename}`);
        continue;
      }

      try {
        await pubPage.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        try { await pubPage.waitForSelector(pageInfo.waitFor, { timeout: 5000 }); } catch {}
        await pubPage.waitForTimeout(1500);
        await pubPage.screenshot({ path: filepath, fullPage: true });
        console.log(`  Captured: ${filename}`);
      } catch (err) {
        console.log(`  Skipped: ${filename} (${err.message})`);
      }
    }
    await pubCtx.close();

    // --- Context 2: Authenticated pages (with auth injection) ---
    const authCtx = await browser.newContext({ viewport, deviceScaleFactor: 2 });

    await authCtx.addInitScript((auth) => {
      sessionStorage.setItem('auth-storage', auth);
    }, encryptedAuth);

    await authCtx.route('**/api/v1/**', async (route) => {
      const headers = {
        ...route.request().headers(),
        authorization: `Bearer ${accessToken}`,
      };
      await route.continue({ headers });
    });

    const authPage = await authCtx.newPage();

    for (const pageInfo of AUTH_PAGES) {
      const suffix = sizeName === 'desktop' ? '' : `-${sizeName}`;
      const filename = `${pageInfo.name}${suffix}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);

      if (exists(filepath)) {
        console.log(`  Exists: ${filename}`);
        continue;
      }

      try {
        await authPage.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        try { await authPage.waitForSelector(`text=${pageInfo.waitForText}`, { timeout: 8000 }); } catch {}
        await authPage.waitForTimeout(pageInfo.waitMs || 3500);
        await authPage.screenshot({ path: filepath, fullPage: true });
        console.log(`  Captured: ${filename}`);
      } catch (err) {
        console.log(`  Skipped: ${filename} (${err.message})`);
      }
    }
    await authCtx.close();
  }

  await browser.close();
  console.log('\nDone! Screenshots saved to תיק אפיון/design/screenshots/');
}

main().catch(console.error);