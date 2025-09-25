# Task Manager Test Suite

This directory contains comprehensive Playwright test cases for the Offline Task Manager application.

## Test Structure

### Test Files

- **`task-creation.spec.js`** - Core functionality tests for task creation, validation, and basic operations
- **`visual-regression.spec.js`** - Visual regression tests with screenshot comparisons
- **`advanced-functionality.spec.js`** - Advanced scenarios, edge cases, and stress tests
- **`test-helpers.js`** - Utility functions and test data for reuse across test files

### Supporting Files

- **`global-setup.js`** - Global test setup and teardown configuration
- **`../playwright.config.js`** - Playwright configuration with browser settings and test options
- **`../package.json`** - Project dependencies and npm scripts

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install browser binaries:
   ```bash
   npx playwright install
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run specific test file
npx playwright test task-creation.spec.js

# Run tests with specific browser
npx playwright test --project=chromium

# Generate test report
npm run test:report
```

## Test Coverage

### Core Functionality Tests (`task-creation.spec.js`)

✅ **Application Loading**
- Verifies app loads successfully
- Checks page title and UI elements
- Validates online/sync status indicators

✅ **Task Creation**
- Basic task creation with title and description
- Task creation with different priorities
- Form validation for required fields
- Special character handling
- Multiple task creation

✅ **Data Persistence**
- Tasks persist after page refresh
- Form clearing after successful submission
- Task ordering and display

✅ **UI Interactions**
- Form element availability and states
- Empty state handling
- Task list updates

### Visual Regression Tests (`visual-regression.spec.js`)

📸 **Layout Screenshots**
- Initial app layout
- Task form (empty and filled states)
- Task list with single and multiple items
- Filter bar appearance

📱 **Responsive Design**
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop layout variations

🎨 **Theme Testing**
- Light theme (default)
- Dark theme (if available)
- Error states and validation styling

### Advanced Functionality Tests (`advanced-functionality.spec.js`)

🚀 **Performance & Stress Testing**
- Rapid task creation
- Large text input handling
- Multiple concurrent operations
- Stress test with 20+ tasks

🔧 **Edge Cases**
- Network interruption simulation
- Special character handling
- Form validation edge cases
- Rapid user interactions

💾 **Data Management**
- Task completion and deletion
- Data persistence across sessions
- Application status monitoring

## Test Utilities

The `TestHelpers` class provides reusable utilities:

### Helper Methods

- `generateTaskData()` - Generate test task objects
- `generateMultipleTasks()` - Create multiple test tasks
- `waitForAppReady()` - Ensure application is fully loaded
- `handleSecurityDialog()` - Handle GitHub Codespaces security prompt
- `takeTimestampedScreenshot()` - Capture screenshots with timestamps
- `clearAllTasks()` - Clean up tasks for test isolation
- `addTask()` - Fill form and create a task
- `verifyTaskExists()` - Assert task presence in UI
- `performTaskAction()` - Execute task actions (complete, delete, edit)

### Test Data Constants

- `TEST_DATA.PRIORITIES` - Available priority levels
- `TEST_DATA.SAMPLE_TASKS` - Pre-defined test tasks
- `TEST_DATA.SPECIAL_CHARACTERS` - Edge case text data
- `TEST_DATA.LONG_TEXT` - Long text for testing limits

## Screenshot Management

Screenshots are automatically captured:
- On test failures (configured in `playwright.config.js`)
- During visual regression tests
- For manual verification using `takeTimestampedScreenshot()`

Screenshots are saved to the `../screenshots/` directory with timestamps.

## Configuration

### Browser Support

Tests run on multiple browsers:
- Chromium (Desktop Chrome)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)
- Microsoft Edge
- Google Chrome

### Test Settings

- **Timeout**: 10s for actions, 30s for navigation
- **Retries**: 2 on CI, 0 locally  
- **Parallel**: Full parallelism enabled
- **Screenshots**: Captured on failure
- **Videos**: Recorded on failure
- **Traces**: Collected on first retry

## Best Practices

### Writing Tests

1. **Use Page Objects**: Encapsulate UI interactions in reusable classes
2. **Test Isolation**: Each test should be independent
3. **Wait Strategies**: Use proper waits instead of fixed delays
4. **Error Handling**: Handle expected failures gracefully
5. **Screenshots**: Capture screenshots for debugging and verification

### Naming Conventions

- Test files: `*.spec.js`
- Helper files: `test-helpers.js`, `*-utils.js`
- Screenshot names: Include test context and timestamp

### Debugging Tips

```bash
# Run tests in headed mode to see browser
npx playwright test --headed

# Debug specific test
npx playwright test --debug task-creation.spec.js

# Run with trace viewer
npx playwright test --trace on

# Show test results
npx playwright show-report
```

## GitHub Codespaces Integration

Tests are configured to work with the GitHub Codespaces environment:

- **Base URL**: Points to the Codespaces development server
- **Security Dialog**: Automatically handled in test setup
- **Network Configuration**: Ignores HTTPS errors for development
- **Viewport**: Configured for consistent screenshots

## Troubleshooting

### Common Issues

1. **Security Dialog**: If tests hang on the security dialog, check that `handleSecurityDialog()` is called
2. **App Initialization**: If tests fail on app load, increase the timeout in `waitForAppReady()`
3. **Screenshots**: If screenshots don't match, adjust the threshold in visual regression tests
4. **Network Issues**: For offline tests, ensure `setOffline()` is properly restored

### Debug Commands

```bash
# Check browser installation
npx playwright install --dry-run

# List available browsers
npx playwright test --list

# Run with maximum logging
DEBUG=pw:api npx playwright test
```

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Use helper utilities from `test-helpers.js`
3. Add screenshots for visual verification where appropriate
4. Include both positive and negative test cases
5. Update this README with new test coverage

For questions or issues, refer to the [Playwright documentation](https://playwright.dev/docs/intro).