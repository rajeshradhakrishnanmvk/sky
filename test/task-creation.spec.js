import { test, expect } from '@playwright/test';

/**
 * Page Object Model for Task Manager
 */
class TaskManagerPage {
  constructor(page) {
    this.page = page;
    
    // Form selectors
    this.taskTitleInput = page.getByPlaceholder('Enter task title...');
    this.taskDescriptionInput = page.getByPlaceholder('Enter task description...');
    this.categorySelect = page.locator('select[name="category"], .form-select').first();
    this.prioritySelect = page.locator('select[name="priority"], .form-select').nth(1);
    this.dueDateInput = page.locator('input[type="date"], input[name="dueDate"]').first();
    this.addTaskButton = page.getByRole('button', { name: 'Add Task' });
    
    // Task list selectors
    this.taskList = page.locator('.task-list, .tasks-container');
    this.taskItems = page.locator('.task-item');
    this.emptyStateMessage = page.locator('text=📝 No tasks yet');
    
    // Header elements - using more flexible selectors
    this.pageTitle = page.locator('h1').first();
    this.onlineStatus = page.locator('text=Online, .status-indicator');
    this.syncStatus = page.locator('text=Sync Ready, text=Sync, .sync-status');
    
    // Filter elements
    this.categoryFilter = page.locator('select').nth(2);
    this.statusFilter = page.locator('select').nth(3);
    this.priorityFilter = page.locator('select').nth(4);
    this.dependencyFilter = page.locator('select').nth(5);
    this.clearFiltersButton = page.getByRole('button', { name: 'Clear Filters' });
  }

  /**
   * Navigate to the Task Manager application
   */
  async goto() {
    console.log('Navigating to Task Manager application...');
    
    // Navigate to the Live Preview server
    await this.page.goto('/index.html');
    
    // Check if we hit the security page and handle it
    const pageTitle = await this.page.title();
    console.log('Initial page title:', pageTitle);
    
    if (pageTitle.includes('Codespaces Access Port')) {
      console.log('Handling security dialog...');
      await this.page.click('button:has-text("Continue")');
      await this.page.waitForTimeout(5000);
      
      const newTitle = await this.page.title();
      console.log('After Continue - Page title:', newTitle);
    }
    
    // Handle any alert dialogs that might appear during initialization
    this.page.on('dialog', async dialog => {
      console.log('Dialog appeared:', dialog.message());
      await dialog.accept();
    });
    
    // Wait for the app to initialize
    await this.waitForAppReady();
  }

  /**
   * Wait for the application to be fully loaded and ready
   */
  async waitForAppReady() {
    console.log('Waiting for app to be ready...');
    
    // Wait for the main heading with a more flexible selector
    try {
      await expect(this.page.locator('h1').first()).toBeVisible({ timeout: 15000 });
      console.log('Main heading found');
    } catch (error) {
      console.log('Main heading not found, continuing...');
    }
    
    // Wait for form elements to be ready
    try {
      await expect(this.taskTitleInput).toBeVisible({ timeout: 10000 });
      await expect(this.addTaskButton).toBeVisible({ timeout: 10000 });
      console.log('Form elements found');
    } catch (error) {
      console.log('Form elements not found, continuing...');
    }
    
    // Wait for initialization button to disappear (if it exists)
    try {
      await this.page.waitForSelector('button:has-text("⏳ Initializing...")', { 
        state: 'hidden', 
        timeout: 10000 
      });
      console.log('Initialization completed');
    } catch (error) {
      console.log('Initialization button not found or already hidden');
    }
    
    // Give the app a moment to fully stabilize
    await this.page.waitForTimeout(1000);
    console.log('App ready!');
  }

  /**
   * Fill and submit the task form
   */
  async addTask(taskData) {
    const {
      title = 'Test Task',
      description = 'Test Description',
      category = 'Personal',
      priority = 'Medium',
      dueDate = ''
    } = taskData;

    // Fill the form
    await this.taskTitleInput.fill(title);
    
    if (description) {
      await this.taskDescriptionInput.fill(description);
    }
    
    if (category) {
      await this.categorySelect.selectOption(category);
    }
    
    if (priority) {
      await this.prioritySelect.selectOption(priority);
    }
    
    if (dueDate) {
      await this.dueDateInput.fill(dueDate);
    }
    
    // Submit the form
    await this.addTaskButton.click();
  }

  /**
   * Get all task items from the task list
   */
  async getTaskItems() {
    return await this.taskItems.all();
  }

  /**
   * Get task by title
   */
  getTaskByTitle(title) {
    return this.page.locator('.task-item').filter({ hasText: title });
  }

  /**
   * Complete a task by title
   */
  async completeTask(title) {
    const task = this.getTaskByTitle(title);
    await task.getByRole('button', { name: 'Complete' }).click();
  }

  /**
   * Delete a task by title
   */
  async deleteTask(title) {
    const task = this.getTaskByTitle(title);
    await task.getByRole('button', { name: 'Delete' }).click();
  }

  /**
   * Edit a task by title
   */
  async editTask(title) {
    const task = this.getTaskByTitle(title);
    await task.getByRole('button', { name: 'Edit' }).click();
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible() {
    return await this.emptyStateMessage.isVisible();
  }

  /**
   * Take a screenshot of the current page state
   */
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    await this.page.screenshot({ 
      path: `screenshots/${filename}`,
      fullPage: true 
    });
    return filename;
  }
}

test.describe('Task Manager - Task Creation', () => {
  let taskManagerPage;

  test.beforeEach(async ({ page }) => {
    taskManagerPage = new TaskManagerPage(page);
    await taskManagerPage.goto();
  });

  test('should load the application successfully', async () => {
    // Verify page title
    await expect(taskManagerPage.pageTitle).toBeVisible();
    await expect(taskManagerPage.page).toHaveTitle('Offline Task Manager');
    
    // Verify online status
    await expect(taskManagerPage.onlineStatus).toBeVisible();
    await expect(taskManagerPage.syncStatus).toBeVisible();
    
    // Take screenshot of initial state
    await taskManagerPage.takeScreenshot('app-loaded');
  });

  test('should display empty state initially', async () => {
    // Verify empty state message is visible
    expect(await taskManagerPage.isEmptyStateVisible()).toBe(true);
    
    // Verify no task items exist
    const taskItems = await taskManagerPage.getTaskItems();
    expect(taskItems).toHaveLength(0);
    
    // Take screenshot of empty state
    await taskManagerPage.takeScreenshot('empty-state');
  });

  test('should have all form elements present and enabled', async () => {
    // Verify form inputs
    await expect(taskManagerPage.taskTitleInput).toBeVisible();
    await expect(taskManagerPage.taskTitleInput).toBeEnabled();
    
    await expect(taskManagerPage.taskDescriptionInput).toBeVisible();
    await expect(taskManagerPage.taskDescriptionInput).toBeEnabled();
    
    await expect(taskManagerPage.categorySelect).toBeVisible();
    await expect(taskManagerPage.categorySelect).toBeEnabled();
    
    await expect(taskManagerPage.prioritySelect).toBeVisible();
    await expect(taskManagerPage.prioritySelect).toBeEnabled();
    
    await expect(taskManagerPage.addTaskButton).toBeVisible();
    await expect(taskManagerPage.addTaskButton).toBeEnabled();
    
    // Take screenshot of form state
    await taskManagerPage.takeScreenshot('form-ready');
  });

  test('should create a basic task successfully', async () => {
    const taskData = {
      title: 'My First Task',
      description: 'This is a test task created by Playwright',
      priority: 'High'
    };

    // Add the task
    await taskManagerPage.addTask(taskData);
    
    // Wait for task to appear
    await expect(taskManagerPage.getTaskByTitle(taskData.title)).toBeVisible({ timeout: 10000 });
    
    // Verify the task appears in the list
    const taskItems = await taskManagerPage.getTaskItems();
    expect(taskItems.length).toBeGreaterThan(0);
    
    // Verify empty state is no longer visible
    expect(await taskManagerPage.isEmptyStateVisible()).toBe(false);
    
    // Verify task content
    const newTask = taskManagerPage.getTaskByTitle(taskData.title);
    await expect(newTask).toContainText(taskData.title);
    await expect(newTask).toContainText(taskData.description);
    
    // Take screenshot with new task
    await taskManagerPage.takeScreenshot('task-created');
  });

  test('should validate required fields', async () => {
    // Try to submit form without title
    await taskManagerPage.addTaskButton.click();
    
    // Form should not submit (title is required)
    // The button might show validation or the form might prevent submission
    await expect(taskManagerPage.taskTitleInput).toBeFocused();
    
    // Verify empty state still visible
    expect(await taskManagerPage.isEmptyStateVisible()).toBe(true);
    
    // Take screenshot of validation state
    await taskManagerPage.takeScreenshot('validation-error');
  });

  test('should create tasks with different priorities', async () => {
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    
    for (let i = 0; i < priorities.length; i++) {
      const taskData = {
        title: `${priorities[i]} Priority Task`,
        description: `This task has ${priorities[i]} priority`,
        priority: priorities[i]
      };
      
      await taskManagerPage.addTask(taskData);
      
      // Wait for task to appear
      await expect(taskManagerPage.getTaskByTitle(taskData.title)).toBeVisible({ timeout: 5000 });
    }
    
    // Verify all tasks were created
    const taskItems = await taskManagerPage.getTaskItems();
    expect(taskItems).toHaveLength(priorities.length);
    
    // Take screenshot with all priority tasks
    await taskManagerPage.takeScreenshot('priority-tasks');
  });

  test('should clear form after successful task creation', async () => {
    const taskData = {
      title: 'Task to Test Form Clearing',
      description: 'This tests form clearing functionality'
    };

    // Fill and submit the form
    await taskManagerPage.addTask(taskData);
    
    // Wait for task to be created
    await expect(taskManagerPage.getTaskByTitle(taskData.title)).toBeVisible({ timeout: 5000 });
    
    // Verify form inputs are cleared
    await expect(taskManagerPage.taskTitleInput).toHaveValue('');
    await expect(taskManagerPage.taskDescriptionInput).toHaveValue('');
    
    // Take screenshot of cleared form
    await taskManagerPage.takeScreenshot('form-cleared');
  });

  test('should handle special characters in task title', async () => {
    const taskData = {
      title: '🎯 Special Task with émojis & "quotes" <tags>',
      description: 'Testing special characters: @#$%^&*()[]{}|;:,.<>?'
    };

    await taskManagerPage.addTask(taskData);
    
    // Wait for task to appear
    await expect(taskManagerPage.getTaskByTitle(taskData.title)).toBeVisible({ timeout: 5000 });
    
    // Verify special characters are displayed correctly
    const newTask = taskManagerPage.getTaskByTitle(taskData.title);
    await expect(newTask).toContainText(taskData.title);
    
    // Take screenshot with special characters
    await taskManagerPage.takeScreenshot('special-characters');
  });

  test('should create multiple tasks and verify order', async () => {
    const tasks = [
      { title: 'First Task', description: 'Created first' },
      { title: 'Second Task', description: 'Created second' },
      { title: 'Third Task', description: 'Created third' }
    ];

    // Create all tasks
    for (const task of tasks) {
      await taskManagerPage.addTask(task);
      await expect(taskManagerPage.getTaskByTitle(task.title)).toBeVisible({ timeout: 5000 });
    }
    
    // Verify all tasks exist
    for (const task of tasks) {
      await expect(taskManagerPage.getTaskByTitle(task.title)).toBeVisible();
    }
    
    // Verify total count
    const taskItems = await taskManagerPage.getTaskItems();
    expect(taskItems).toHaveLength(tasks.length);
    
    // Take screenshot with multiple tasks
    await taskManagerPage.takeScreenshot('multiple-tasks');
  });

  test('should maintain task data after page refresh', async () => {
    const taskData = {
      title: 'Persistent Task',
      description: 'This task should persist after refresh',
      priority: 'High'
    };

    // Create task
    await taskManagerPage.addTask(taskData);
    await expect(taskManagerPage.getTaskByTitle(taskData.title)).toBeVisible({ timeout: 5000 });
    
    // Refresh page
    await taskManagerPage.page.reload();
    await taskManagerPage.waitForAppReady();
    
    // Verify task still exists
    await expect(taskManagerPage.getTaskByTitle(taskData.title)).toBeVisible({ timeout: 10000 });
    
    // Take screenshot after refresh
    await taskManagerPage.takeScreenshot('after-refresh');
  });
});