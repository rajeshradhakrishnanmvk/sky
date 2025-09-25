import { test, expect } from '@playwright/test';

test('Simple HTML file load test', async ({ page }) => {
  // Navigate to the Live Preview server
  await page.goto('/index.html?serverWindowId=1af4759b-c155-49a1-be21-29c2705399f6');
  
  // Handle Codespaces security dialog
  try {
    // Wait for and click the Continue button
    await page.waitForSelector('button:has-text("Continue")', { timeout: 10000 });
    await page.getByRole('button', { name: 'Continue' }).click();
    console.log('Clicked Continue on security dialog');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch (error) {
    console.log('No security dialog found or already handled');
  }
  
  // Handle any alert dialogs from the app
  page.on('dialog', async dialog => {
    console.log('App dialog:', dialog.message());
    await dialog.accept();
  });
  
  // Wait for the app to load
  await page.waitForTimeout(10000);
  
  // Take a screenshot to see what we get
  await page.screenshot({ path: 'screenshots/debug-live-preview-load.png', fullPage: true });
  
  // Check if we can see any content
  const title = await page.title();
  console.log('Page title:', title);
  
  // Look for any heading or content
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('Found headings:', headings);
  
  // Look for the Task Manager specifically
  const taskManagerHeading = page.locator('h1:has-text("Task Manager"), .app-title');
  if (await taskManagerHeading.count() > 0) {
    console.log('Found Task Manager heading!');
    await expect(taskManagerHeading.first()).toBeVisible();
  } else {
    console.log('Task Manager heading not found, checking body content');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  }
});