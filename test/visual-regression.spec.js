import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for Task Manager
 * These tests capture and compare screenshots to detect visual changes
 */

test.describe('Task Manager - Visual Regression Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for it to load
    await page.goto('/index.html?serverWindowId=d0171922-62e6-40ee-8415-fe70b3a97991');
    
    // Handle security dialog if present
    try {
      await page.getByRole('button', { name: 'Continue' }).click({ timeout: 5000 });
    } catch (error) {
      console.log('No security dialog found, proceeding...');
    }
    
    // Wait for app to be ready
    await expect(page.getByRole('heading', { name: '📋 Task Manager' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Task' })).toBeEnabled();
    await expect(page.getByRole('button', { name: '⏳ Initializing...' })).not.toBeVisible({ timeout: 15000 });
  });

  test('should match initial app layout screenshot', async ({ page }) => {
    // Wait for any animations to complete
    await page.waitForTimeout(1000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('app-initial-layout.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('should match task form screenshot', async ({ page }) => {
    // Focus on the task form area
    const taskForm = page.locator('.task-form').first();
    
    // Take screenshot of just the form
    await expect(taskForm).toHaveScreenshot('task-form-empty.png', {
      threshold: 0.2,
    });
  });

  test('should match task form with filled data screenshot', async ({ page }) => {
    // Fill the form with test data
    await page.getByPlaceholder('Enter task title...').fill('Visual Test Task');
    await page.getByPlaceholder('Enter task description...').fill('This is for visual testing');
    
    // Select priority
    await page.locator('select').filter({ hasText: 'Priority' }).selectOption('High');
    
    const taskForm = page.locator('.task-form').first();
    
    // Take screenshot of filled form
    await expect(taskForm).toHaveScreenshot('task-form-filled.png', {
      threshold: 0.2,
    });
  });

  test('should match task list with one task screenshot', async ({ page }) => {
    // Add a task
    await page.getByPlaceholder('Enter task title...').fill('Single Test Task');
    await page.getByPlaceholder('Enter task description...').fill('Description for visual test');
    await page.getByRole('button', { name: 'Add Task' }).click();
    
    // Wait for task to appear
    await expect(page.locator('.task-item')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot of the task list area
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toHaveScreenshot('task-list-single-item.png', {
      threshold: 0.2,
    });
  });

  test('should match task list with multiple tasks screenshot', async ({ page }) => {
    // Add multiple tasks with different priorities
    const tasks = [
      { title: 'High Priority Task', description: 'Important task', priority: 'High' },
      { title: 'Medium Priority Task', description: 'Regular task', priority: 'Medium' },
      { title: 'Low Priority Task', description: 'Can wait task', priority: 'Low' }
    ];
    
    for (const task of tasks) {
      await page.getByPlaceholder('Enter task title...').fill(task.title);
      await page.getByPlaceholder('Enter task description...').fill(task.description);
      await page.locator('select').filter({ hasText: 'Priority' }).selectOption(task.priority);
      await page.getByRole('button', { name: 'Add Task' }).click();
      
      // Wait for task to appear before adding the next one
      await expect(page.locator('.task-item').filter({ hasText: task.title })).toBeVisible({ timeout: 5000 });
    }
    
    // Take screenshot of multiple tasks
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toHaveScreenshot('task-list-multiple-items.png', {
      threshold: 0.2,
    });
  });

  test('should match filter bar screenshot', async ({ page }) => {
    // Focus on the filter bar
    const filterBar = page.locator('.filter-bar');
    
    await expect(filterBar).toHaveScreenshot('filter-bar.png', {
      threshold: 0.2,
    });
  });

  test('should match mobile viewport screenshot', async ({ page }) => {
    // Change to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for responsive layout to adjust
    await page.waitForTimeout(500);
    
    // Take full page screenshot in mobile view
    await expect(page).toHaveScreenshot('mobile-layout.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('should match tablet viewport screenshot', async ({ page }) => {
    // Change to tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Wait for responsive layout to adjust
    await page.waitForTimeout(500);
    
    // Take full page screenshot in tablet view
    await expect(page).toHaveScreenshot('tablet-layout.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('should match dark theme screenshot (if available)', async ({ page }) => {
    // Try to toggle dark theme if the feature exists
    const themeToggle = page.locator('[data-theme-toggle]').first();
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
      
      await expect(page).toHaveScreenshot('dark-theme-layout.png', {
        fullPage: true,
        threshold: 0.2,
      });
    } else {
      console.log('Dark theme toggle not found, skipping dark theme test');
    }
  });

  test('should match error state screenshot', async ({ page }) => {
    // Try to trigger an error state by submitting empty form
    await page.getByRole('button', { name: 'Add Task' }).click();
    
    // Wait a bit to see if any error styling appears
    await page.waitForTimeout(1000);
    
    // Take screenshot of potential error state
    const taskForm = page.locator('.task-form').first();
    await expect(taskForm).toHaveScreenshot('task-form-error-state.png', {
      threshold: 0.2,
    });
  });
});