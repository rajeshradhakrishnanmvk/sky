import { test, expect } from '@playwright/test';
import { TestHelpers, TEST_DATA } from './test-helpers.js';

/**
 * Advanced Task Manager tests using helper utilities
 * These tests cover edge cases, error handling, and complex scenarios
 */

test.describe('Task Manager - Advanced Functionality', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to the app
    await page.goto('/index.html?serverWindowId=d0171922-62e6-40ee-8415-fe70b3a97991');
    
    // Handle security dialog
    await TestHelpers.handleSecurityDialog(page);
    
    // Wait for app to be ready
    await TestHelpers.waitForAppReady(page);
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should handle rapid task creation', async () => {
    const tasks = TestHelpers.generateMultipleTasks(5, { title: 'Rapid Task' });
    
    // Create tasks rapidly
    for (const task of tasks) {
      await TestHelpers.addTask(page, task);
    }
    
    // Wait for all tasks to appear
    for (const task of tasks) {
      await TestHelpers.waitForTask(page, task.title);
    }
    
    // Verify all tasks exist
    const taskCount = await TestHelpers.getTaskCount(page);
    expect(taskCount).toBe(tasks.length);
    
    // Take screenshot
    await TestHelpers.takeTimestampedScreenshot(page, 'rapid-task-creation');
  });

  test('should handle long text input gracefully', async () => {
    const longTask = {
      title: TEST_DATA.LONG_TEXT.substring(0, 100),
      description: TEST_DATA.LONG_TEXT
    };
    
    await TestHelpers.addTask(page, longTask);
    await TestHelpers.waitForTask(page, longTask.title);
    
    // Verify the task appears with truncated or wrapped text
    await TestHelpers.verifyTaskExists(page, longTask.title);
    
    // Take screenshot to see how long text is handled
    await TestHelpers.takeTimestampedScreenshot(page, 'long-text-handling');
  });

  test('should handle special characters correctly', async () => {
    await TestHelpers.addTask(page, TEST_DATA.SPECIAL_CHARACTERS);
    await TestHelpers.waitForTask(page, TEST_DATA.SPECIAL_CHARACTERS.title);
    
    // Verify special characters are preserved
    const taskItem = page.locator(`.task-item:has-text("${TEST_DATA.SPECIAL_CHARACTERS.title}")`);
    await expect(taskItem).toBeVisible();
    
    await TestHelpers.takeTimestampedScreenshot(page, 'special-characters');
  });

  test('should maintain task order across different priorities', async () => {
    // Create tasks with different priorities
    for (const sampleTask of TEST_DATA.SAMPLE_TASKS) {
      await TestHelpers.addTask(page, sampleTask);
      await TestHelpers.waitForTask(page, sampleTask.title);
    }
    
    // Get all task titles in order
    const taskTitles = await TestHelpers.getTaskTitles(page);
    
    // Verify all tasks are present
    expect(taskTitles).toHaveLength(TEST_DATA.SAMPLE_TASKS.length);
    
    // Take screenshot of ordered tasks
    await TestHelpers.takeTimestampedScreenshot(page, 'task-ordering');
  });

  test('should handle task completion and deletion', async () => {
    // Create a test task
    const testTask = TestHelpers.generateTaskData({ title: 'Task for Actions' });
    await TestHelpers.addTask(page, testTask);
    await TestHelpers.waitForTask(page, testTask.title);
    
    // Complete the task
    await TestHelpers.performTaskAction(page, testTask.title, 'complete');
    
    // Wait a moment for completion to process
    await page.waitForTimeout(1000);
    
    // Take screenshot after completion
    await TestHelpers.takeTimestampedScreenshot(page, 'task-completed');
    
    // Delete the task
    await TestHelpers.performTaskAction(page, testTask.title, 'delete');
    
    // Wait for deletion to process
    await page.waitForTimeout(1000);
    
    // Verify task is removed
    await TestHelpers.verifyTaskExists(page, testTask.title, false);
    
    // Take screenshot after deletion
    await TestHelpers.takeTimestampedScreenshot(page, 'task-deleted');
  });

  test('should persist tasks after browser refresh', async () => {
    // Create multiple tasks
    const tasks = TestHelpers.generateMultipleTasks(3, { title: 'Persistent Task' });
    
    for (const task of tasks) {
      await TestHelpers.addTask(page, task);
      await TestHelpers.waitForTask(page, task.title);
    }
    
    const initialCount = await TestHelpers.getTaskCount(page);
    
    // Refresh the page
    await page.reload();
    await TestHelpers.waitForAppReady(page);
    
    // Wait for tasks to be restored
    await page.waitForTimeout(2000);
    
    // Verify tasks persist
    const persistedCount = await TestHelpers.getTaskCount(page);
    expect(persistedCount).toBe(initialCount);
    
    // Verify specific tasks exist
    for (const task of tasks) {
      await TestHelpers.verifyTaskExists(page, task.title);
    }
    
    await TestHelpers.takeTimestampedScreenshot(page, 'tasks-persisted');
  });

  test('should handle form validation and error states', async () => {
    // Try to submit empty form
    await TestHelpers.submitTaskForm(page);
    
    // Verify form doesn't submit with empty title
    expect(await TestHelpers.isEmptyStateVisible(page)).toBe(true);
    
    // Take screenshot of potential error state
    await TestHelpers.takeTimestampedScreenshot(page, 'form-validation-empty');
    
    // Fill only title and submit
    await TestHelpers.fillTaskForm(page, { title: 'Title Only Task' });
    await TestHelpers.submitTaskForm(page);
    
    // Verify task is created (description is optional)
    await TestHelpers.waitForTask(page, 'Title Only Task');
    
    await TestHelpers.takeTimestampedScreenshot(page, 'form-validation-success');
  });

  test('should handle network interruption gracefully', async () => {
    // Create a task
    const testTask = TestHelpers.generateTaskData({ title: 'Network Test Task' });
    await TestHelpers.addTask(page, testTask);
    await TestHelpers.waitForTask(page, testTask.title);
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to create another task while offline
    const offlineTask = TestHelpers.generateTaskData({ title: 'Offline Task' });
    await TestHelpers.addTask(page, offlineTask);
    
    // Wait a moment for offline handling
    await page.waitForTimeout(2000);
    
    // Task might still be created locally due to offline-first design
    await TestHelpers.takeTimestampedScreenshot(page, 'offline-mode');
    
    // Restore network
    await page.context().setOffline(false);
    
    // Wait for network restoration
    await page.waitForTimeout(2000);
    
    await TestHelpers.takeTimestampedScreenshot(page, 'network-restored');
  });

  test('should handle rapid form interactions', async () => {
    // Rapid form filling and clearing
    for (let i = 0; i < 5; i++) {
      const taskData = TestHelpers.generateTaskData({ title: `Rapid Input ${i}` });
      
      await TestHelpers.fillTaskForm(page, taskData);
      
      // Clear form without submitting
      await page.getByPlaceholder('Enter task title...').fill('');
      await page.getByPlaceholder('Enter task description...').fill('');
    }
    
    // Finally submit a valid task
    const finalTask = TestHelpers.generateTaskData({ title: 'Final Valid Task' });
    await TestHelpers.addTask(page, finalTask);
    await TestHelpers.waitForTask(page, finalTask.title);
    
    // Verify only one task was created
    const taskCount = await TestHelpers.getTaskCount(page);
    expect(taskCount).toBe(1);
    
    await TestHelpers.takeTimestampedScreenshot(page, 'rapid-interactions');
  });

  test('should check application status indicators', async () => {
    // Check initial status
    const status = await TestHelpers.checkAppStatus(page);
    
    expect(status.initialized).toBe(true);
    console.log('App status:', status);
    
    // Create a task to verify sync status
    const testTask = TestHelpers.generateTaskData({ title: 'Status Check Task' });
    await TestHelpers.addTask(page, testTask);
    await TestHelpers.waitForTask(page, testTask.title);
    
    // Check status after task creation
    const statusAfter = await TestHelpers.checkAppStatus(page);
    console.log('Status after task creation:', statusAfter);
    
    await TestHelpers.takeTimestampedScreenshot(page, 'app-status');
  });

  test('should handle stress test with many tasks', async () => {
    const TASK_COUNT = 20;
    
    // Create many tasks
    for (let i = 0; i < TASK_COUNT; i++) {
      const task = TestHelpers.generateTaskData({ 
        title: `Stress Test Task ${i + 1}`,
        priority: TEST_DATA.PRIORITIES[i % TEST_DATA.PRIORITIES.length]
      });
      
      await TestHelpers.addTask(page, task);
      
      // Wait briefly between tasks to avoid overwhelming the system
      if (i % 5 === 0) {
        await page.waitForTimeout(500);
      }
    }
    
    // Wait for all tasks to appear
    await page.waitForTimeout(2000);
    
    // Verify task count
    const finalCount = await TestHelpers.getTaskCount(page);
    expect(finalCount).toBe(TASK_COUNT);
    
    // Take screenshot of stress test result
    await TestHelpers.takeTimestampedScreenshot(page, 'stress-test', { fullPage: true });
  });
});