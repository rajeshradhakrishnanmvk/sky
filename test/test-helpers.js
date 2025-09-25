/**
 * Test utilities and helper functions for Task Manager tests
 */

export class TestHelpers {
  /**
   * Generate test data for tasks
   */
  static generateTaskData(overrides = {}) {
    const defaults = {
      title: `Test Task ${Date.now()}`,
      description: 'Generated test task description',
      priority: 'Medium',
      category: 'Personal',
      dueDate: ''
    };
    
    return { ...defaults, ...overrides };
  }

  /**
   * Generate multiple task data objects
   */
  static generateMultipleTasks(count = 3, overrides = {}) {
    return Array.from({ length: count }, (_, index) => ({
      ...this.generateTaskData(overrides),
      title: `${overrides.title || 'Test Task'} ${index + 1}`,
      description: `${overrides.description || 'Test description'} ${index + 1}`
    }));
  }

  /**
   * Wait for application to be fully loaded
   */
  static async waitForAppReady(page) {
    // Wait for main heading
    await page.waitForSelector('h1:has-text("📋 Task Manager")', { timeout: 30000 });
    
    // Wait for form to be ready
    await page.waitForSelector('input[placeholder="Enter task title..."]', { timeout: 10000 });
    await page.waitForSelector('button:has-text("Add Task"):not([disabled])', { timeout: 10000 });
    
    // Wait for initialization to complete
    try {
      await page.waitForSelector('button:has-text("⏳ Initializing...")', { state: 'hidden', timeout: 20000 });
    } catch (error) {
      console.log('Initialization button not found or already hidden');
    }
    
    // Wait for categories to load
    await page.waitForFunction(() => {
      const select = document.querySelector('select');
      return select && !select.textContent.includes('Loading categories...');
    }, { timeout: 10000 });
  }

  /**
   * Handle the GitHub Codespaces security dialog
   */
  static async handleSecurityDialog(page) {
    try {
      await page.getByRole('button', { name: 'Continue' }).click({ timeout: 5000 });
      console.log('Security dialog handled');
    } catch (error) {
      console.log('No security dialog found, proceeding...');
    }
  }

  /**
   * Take a timestamped screenshot
   */
  static async takeTimestampedScreenshot(page, name, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    
    await page.screenshot({ 
      path: `screenshots/${filename}`,
      fullPage: true,
      ...options
    });
    
    return filename;
  }

  /**
   * Clear all tasks from the application (for cleanup)
   */
  static async clearAllTasks(page) {
    try {
      // Get all delete buttons and click them
      const deleteButtons = page.locator('button:has-text("Delete")');
      const count = await deleteButtons.count();
      
      for (let i = 0; i < count; i++) {
        await deleteButtons.first().click();
        // Wait a bit between deletions
        await page.waitForTimeout(500);
      }
      
      console.log(`Cleared ${count} tasks`);
    } catch (error) {
      console.log('Error clearing tasks or no tasks to clear:', error.message);
    }
  }

  /**
   * Verify task exists in the list
   */
  static async verifyTaskExists(page, title, shouldExist = true) {
    const taskSelector = `.task-item:has-text("${title}")`;
    
    if (shouldExist) {
      await expect(page.locator(taskSelector)).toBeVisible();
    } else {
      await expect(page.locator(taskSelector)).not.toBeVisible();
    }
  }

  /**
   * Get task count from the UI
   */
  static async getTaskCount(page) {
    return await page.locator('.task-item').count();
  }

  /**
   * Fill task form with data
   */
  static async fillTaskForm(page, taskData) {
    const {
      title = '',
      description = '',
      category = '',
      priority = '',
      dueDate = ''
    } = taskData;

    if (title) {
      await page.getByPlaceholder('Enter task title...').fill(title);
    }
    
    if (description) {
      await page.getByPlaceholder('Enter task description...').fill(description);
    }
    
    if (category) {
      await page.locator('select').filter({ hasText: 'Category' }).selectOption(category);
    }
    
    if (priority) {
      await page.locator('select').filter({ hasText: 'Priority' }).selectOption(priority);
    }
    
    if (dueDate) {
      await page.getByLabel('Due Date').fill(dueDate);
    }
  }

  /**
   * Submit task form
   */
  static async submitTaskForm(page) {
    await page.getByRole('button', { name: 'Add Task' }).click();
  }

  /**
   * Add a task (fill form and submit)
   */
  static async addTask(page, taskData) {
    await this.fillTaskForm(page, taskData);
    await this.submitTaskForm(page);
  }

  /**
   * Wait for task to appear in the list
   */
  static async waitForTask(page, title, timeout = 10000) {
    await page.waitForSelector(`.task-item:has-text("${title}")`, { timeout });
  }

  /**
   * Check if empty state is visible
   */
  static async isEmptyStateVisible(page) {
    return await page.locator('text=📝 No tasks yet. Add your first task above!').isVisible();
  }

  /**
   * Get the text content of all task titles
   */
  static async getTaskTitles(page) {
    return await page.locator('.task-title').allTextContents();
  }

  /**
   * Perform a task action (complete, delete, edit)
   */
  static async performTaskAction(page, taskTitle, action) {
    const taskItem = page.locator(`.task-item:has-text("${taskTitle}")`);
    
    switch (action.toLowerCase()) {
      case 'complete':
        await taskItem.getByRole('button', { name: 'Complete' }).click();
        break;
      case 'delete':
        await taskItem.getByRole('button', { name: 'Delete' }).click();
        break;
      case 'edit':
        await taskItem.getByRole('button', { name: 'Edit' }).click();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Wait for network to be idle (useful for async operations)
   */
  static async waitForNetworkIdle(page, timeout = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Check application status indicators
   */
  static async checkAppStatus(page) {
    const status = {
      online: await page.locator('text=Online').isVisible(),
      syncReady: await page.locator('text=Sync Ready').isVisible(),
      initialized: await page.getByRole('button', { name: '⏳ Initializing...' }).isHidden()
    };
    
    return status;
  }
}

/**
 * Custom expect matchers for task-specific assertions
 */
export const customMatchers = {
  /**
   * Check if a task with specific properties exists
   */
  async toHaveTask(page, expectedTask) {
    const { title, description, priority } = expectedTask;
    const taskSelector = `.task-item:has-text("${title}")`;
    const task = page.locator(taskSelector);
    
    await expect(task).toBeVisible();
    
    if (description) {
      await expect(task).toContainText(description);
    }
    
    if (priority) {
      await expect(task.locator('.priority-badge')).toContainText(priority);
    }
    
    return {
      pass: true,
      message: () => `Expected to have task with title "${title}"`
    };
  },

  /**
   * Check if task count matches expected
   */
  async toHaveTaskCount(page, expectedCount) {
    const actualCount = await page.locator('.task-item').count();
    const pass = actualCount === expectedCount;
    
    return {
      pass,
      message: () => `Expected ${expectedCount} tasks but found ${actualCount}`
    };
  }
};

/**
 * Test data constants
 */
export const TEST_DATA = {
  PRIORITIES: ['Low', 'Medium', 'High', 'Urgent'],
  
  SAMPLE_TASKS: [
    {
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the task manager project',
      priority: 'High'
    },
    {
      title: 'Review pull requests',
      description: 'Review and merge pending pull requests',
      priority: 'Medium'
    },
    {
      title: 'Update dependencies',
      description: 'Update npm dependencies to latest stable versions',
      priority: 'Low'
    },
    {
      title: 'Fix critical bug',
      description: 'Fix the critical bug reported by QA team',
      priority: 'Urgent'
    }
  ],
  
  LONG_TEXT: 'This is a very long text that should be used to test how the application handles long descriptions and titles. '.repeat(5),
  
  SPECIAL_CHARACTERS: {
    title: '🎯 Task with émojis & "quotes" <tags> @mentions #hashtags',
    description: 'Special chars: !@#$%^&*()[]{}|;:,.<>?/~`'
  }
};