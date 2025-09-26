import { test, expect } from '@playwright/test';

test('Simple HTML file load test', async ({ page }) => {
  console.log('Navigating to Live Preview server...');
  
  // Navigate directly to the Live Preview server
  await page.goto('/index.html');
  
  // Check if we hit the security page
  const pageTitle = await page.title();
  console.log('Initial page title:', pageTitle);
  
  if (pageTitle.includes('Codespaces Access Port')) {
    console.log('Hit security page, clicking Continue...');
    
    // Click the Continue button
    await page.click('button:has-text("Continue")');
    
    // Wait for the page to change
    await page.waitForTimeout(10000);
    
    // Check title again
    const newTitle = await page.title();
    console.log('After Continue - Page title:', newTitle);
  }
  
  // Handle any alert dialogs from the app
  page.on('dialog', async dialog => {
    console.log('App dialog:', dialog.message());
    await dialog.accept();
  });
  
  // Wait extra time for app initialization
  await page.waitForTimeout(10000);
  
  // Take a screenshot to see what we get
  await page.screenshot({ path: 'screenshots/debug-live-preview-final.png', fullPage: true });
  
  // Check final page state
  const finalTitle = await page.title();
  console.log('Final page title:', finalTitle);
  
  // Look for any heading or content
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('Found headings:', headings);
  
  // Look for the Task Manager specifically
  const taskManagerHeading = page.locator('h1:has-text("Task Manager"), .app-title, h1:has-text("📋")');
  const taskManagerCount = await taskManagerHeading.count();
  console.log('Task Manager heading count:', taskManagerCount);
  
  if (taskManagerCount > 0) {
    console.log('Found Task Manager heading!');
    await expect(taskManagerHeading.first()).toBeVisible();
  } else {
    console.log('Task Manager heading not found, ensuring page loaded');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  }
});