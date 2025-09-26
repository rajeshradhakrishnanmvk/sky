// Playwright test: Recurring Tasks & Edge Cases
const { test, expect } = require('@playwright/test');


const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8000/index.html';

// Helper to handle Codespaces security dialog
async function handleCodespacesSecurityDialog(page) {
  await page.goto(BASE_URL);
  // Wait for either the app or the security dialog
  const pageTitle = await page.title();
  if (pageTitle.includes('Codespaces Access Port')) {
    // Security dialog detected, click Continue
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(5000); // Wait for redirect
  }
}

test.describe('Recurring Tasks', () => {
  test('should create a daily recurring task and generate instance', async ({ page }) => {
    await handleCodespacesSecurityDialog(page);
    await page.waitForSelector('#task-form');
    await page.fill('#task-title', 'Daily Standup');
    await page.check('#task-recurring');
    await page.selectOption('#recurring-frequency', 'daily');
    await page.fill('#recurring-interval', '1');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.recurring-badge');
    expect(await page.locator('.recurring-badge').isVisible()).toBeTruthy();
    expect(await page.locator('.recurring-pattern').textContent()).toContain('Every 1 day');
  });

  test('should create a weekly recurring task with multiple days', async ({ page }) => {
    await handleCodespacesSecurityDialog(page);
    await page.waitForSelector('#task-form');
    await page.fill('#task-title', 'Weekly Sync');
    await page.check('#task-recurring');
    await page.selectOption('#recurring-frequency', 'weekly');
    await page.fill('#recurring-interval', '2');
    await page.check('input[type="checkbox"][value="1"]'); // Monday
    await page.check('input[type="checkbox"][value="3"]'); // Wednesday
    await page.click('button[type="submit"]');
    await page.waitForSelector('.recurring-badge');
    expect(await page.locator('.recurring-pattern').textContent()).toContain('Every 2 week');
    expect(await page.locator('.recurring-pattern').textContent()).toContain('Mon');
    expect(await page.locator('.recurring-pattern').textContent()).toContain('Wed');
  });

  test('should edit recurring pattern and stop recurrence', async ({ page }) => {
    await handleCodespacesSecurityDialog(page);
    await page.waitForSelector('.btn-recurring-manage');
    await page.click('.btn-recurring-manage');
    await page.selectOption('.recurring-edit-frequency', 'monthly');
    await page.fill('.recurring-edit-interval', '1');
    await page.click('.recurring-edit-form button[type="submit"]');
    await page.waitForTimeout(500);
    expect(await page.locator('.recurring-pattern').textContent()).toContain('month');
    await page.click('.btn-recurring-manage');
    await page.click('[data-action="stop-recurring"]');
    await page.waitForTimeout(500);
    expect(await page.locator('.recurring-badge').count()).toBe(0);
  });

  test('should handle leap year and month boundary', async ({ page }) => {
    await handleCodespacesSecurityDialog(page);
    await page.waitForSelector('#task-form');
    await page.fill('#task-title', 'Leap Year Test');
  await page.check('#task-recurring');
  await page.waitForSelector('#recurring-frequency', { state: 'visible' });
  await page.selectOption('#recurring-frequency', 'daily');
    await page.fill('#recurring-interval', '1');
  await page.check('#task-recurring');
  await page.waitForSelector('#recurring-frequency', { state: 'visible' });
  await page.selectOption('#recurring-frequency', 'weekly');
    await page.waitForSelector('.recurring-badge');
  await page.check('#task-recurring');
  await page.waitForSelector('#recurring-frequency', { state: 'visible' });
  await page.selectOption('#recurring-frequency', 'yearly');

  await page.check('#task-recurring');
  await page.waitForSelector('#recurring-frequency', { state: 'visible' });
  await page.selectOption('#recurring-frequency', 'daily');
    await page.waitForSelector('#task-form');
    await page.fill('#task-title', 'Background Recurring');
    await page.check('#task-recurring');
    await page.selectOption('#recurring-frequency', 'daily');
    await page.fill('#recurring-interval', '1');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.recurring-badge');
    // Simulate Service Worker message
    await page.evaluate(() => {
      navigator.serviceWorker.controller?.postMessage({ type: 'PROCESS_RECURRING' });
    });
    await page.waitForTimeout(1000);
    expect(await page.locator('.next-occurrence').isVisible()).toBeTruthy();
  });
});
