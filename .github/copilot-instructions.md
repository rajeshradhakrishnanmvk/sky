# Copilot Instructions for Sky Project - Offline Task Manager

## 🏗️ Architecture Overview

This project is a **single-file offline-first task management application** (`index.html`) with zero external dependencies, designed with progressive enhancement and vanilla web technologies.

### **Core Application: Offline Task Manager** (`index.html`)
- **Offline-first task management** with IndexedDB persistence and Service Worker caching
- **2 main classes**: `TaskDatabase`, `TaskManager` 
- **Advanced features**: Task dependencies, categories, cross-tab sync, background operations
- **PWA capabilities**: Service worker (`sw.js`), offline functionality, installable app
- **Optimistic UI**: Instant updates with database rollback on failure
- **Single-file architecture**: 9,600+ lines embedding HTML, CSS, JavaScript, and PWA manifest

## 🎯 Current Implementation Status

**✅ Completed Features:**
- Complete task CRUD operations with optimistic UI
- IndexedDB storage with transaction-based operations
- Task dependencies system (blocking/reference relationships)
- Category management with color/icon customization  
- Real-time cross-tab synchronization via BroadcastChannel
- Service Worker with intelligent caching strategies
- Advanced filtering (category, status, priority, dependencies)
- Responsive design with dark/light theme support
- PWA manifest with offline capabilities

**🚧 Key Technical Patterns:**
- **Database versioning**: Handles schema migrations (currently v3)
- **Dependency engine**: Complex task relationship management with blocking logic
- **Optimistic updates**: UI updates immediately, rolls back on database errors
- **Cross-tab sync**: Real-time updates across multiple browser tabs
- **Background operations**: Service Worker handles offline queue and sync

## 🏛️ Architecture Principles

- **Single-file packaging**: All HTML, CSS, JavaScript, and PWA manifest embedded in `index.html` (~9,600 lines)
- **Zero dependencies**: No external libraries, frameworks, or CDN resources
- **Progressive enhancement**: Baseline functionality works without advanced APIs, enhanced features layer on top
- **Offline-first design**: All operations work offline, sync enhances but isn't required
- **Vanilla web technologies**: Uses only standard browser APIs (IndexedDB, Service Workers, BroadcastChannel)

## 💾 Data and State

### **IndexedDB as Primary Storage** (`TaskDatabase` class)
The app uses IndexedDB for persistent, offline-first data storage with these object stores:
- **tasks**: Main task data with dependencies, categories, priorities
- **categories**: Custom user-defined categories with colors/icons
- **settings**: User preferences and configuration

```javascript
// Example transaction pattern from the codebase
class TaskDatabase {
    async createTask(data) {
        const task = this.validateTaskData(data);
        const tx = this.db.transaction(['tasks'], 'readwrite');
        const store = tx.objectStore('tasks');
        await store.put(task);
        await tx.done;
        
        // Cross-tab sync notification
        this.broadcastChange('task-created', task);
    }
}
```

### **In-Memory State Management** (`TaskManager` class)
- **tasks array**: Live task list with optimistic updates
- **categories Map**: Category definitions with metadata  
- **Cross-tab sync**: BroadcastChannel API for real-time updates
- **Filter state**: Current view filters (status, category, priority, dependencies)

## 🖥️ DOM and Rendering

### **Batch DOM Updates with DocumentFragment**
Construct and populate off-DOM to avoid layout thrashing, then append once to minimize reflows and paint work.

```javascript
const frag = document.createDocumentFragment();
items.forEach((item) => {
  const el = renderItem(item);
  frag.appendChild(el);
});
listEl.appendChild(frag);
```

### **Use requestAnimationFrame for Visual Updates**
Schedule UI updates on the browser's animation tick for smooth rendering and throttling in background contexts.

```javascript
let last = 0;
function tick(ts) {
  const dt = ts - last;
  last = ts;
  update(dt);
  render();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

### **Event Delegation for Dynamic UIs**
Attach a single listener to a stable ancestor and dispatch by inspecting event targets, leveraging bubbling for efficiency and resilience to dynamic content.

```javascript
document.addEventListener('click', (e) => {
  const button = e.target.closest('[data-action]');
  if (!button) return;
  handleAction(button.dataset.action);
});
```

## 🧩 Web Components

### **Custom Elements with Shadow DOM**
Encapsulate markup, styles, and behavior using attachShadow and slots to prevent style leakage and simplify reuse.

```javascript
class AppShell extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>:host { display: block; }</style>
      <header><slot name="header"></slot></header>
      <main><slot></slot></main>
    `;
  }
}
customElements.define('app-shell', AppShell);
```

### **Templates and Slots**
Compose flexible layouts while maintaining encapsulation; place light DOM content through slot where appropriate.

## 🔒 Security-First Patterns

### **Never Use eval or Function**
Prefer sandboxing, structured messaging, and controlled surfaces to avoid DOM-based XSS sinks.

```javascript
// XSS prevention - ALWAYS sanitize user input
sanitizeHTML(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}
```

### **Sandbox Execution**
Run untrusted content in sandboxed iframes and avoid allow-same-origin with allow-scripts when isolation is required to prevent sandbox escape.

```html
<iframe sandbox="allow-scripts" srcdoc="<!doctype html><script>/* isolated */</script>"></iframe>
```

### **Sanitize and Encode**
Treat all input as untrusted, encode on output, and isolate unsafe rendering paths; prefer textContent over innerHTML for plain text insertion.

## 📱 Key Implementation Patterns

### **Optimistic UI Updates**
The app uses optimistic UI for instant feedback with database rollback:
```javascript
// Pattern: Update UI immediately, persist to storage, rollback on failure
async createTask() {
    // 1. Optimistic UI update
    this.tasks.unshift(optimisticTask);
    this.render();
    
    try {
        // 2. Persist to database
        const savedTask = await this.database.createTask(formData);
        // 3. Replace optimistic with real data
        this.tasks[0] = savedTask;
    } catch (error) {
        // 4. Rollback on failure
        this.tasks = this.tasks.filter(t => t.id !== optimisticTask.id);
        this.showError('Failed to create task');
    }
}
```

### **Cross-Tab Synchronization**
Real-time sync across browser tabs using BroadcastChannel:
```javascript
// TaskManager broadcasts changes
this.channel = new BroadcastChannel('task-updates');
this.channel.postMessage({ type: 'task-created', task });

// Other tabs listen and update
this.channel.addEventListener('message', (event) => {
    if (event.data.type === 'task-created') {
        this.addTaskToList(event.data.task);
    }
});
```

### **Dependency Management System**
Complex task relationships with blocking logic:
- **Blocking dependencies**: Task cannot be completed until dependencies finish
- **Reference dependencies**: Informational links between tasks
- **Dependency chains**: Visual representation of task relationships
- **Blocked task detection**: Automatic status calculation based on dependencies

## 🔧 Development Guidelines

### **Database Operations**
- Always wrap operations in IndexedDB transactions for data integrity
- Use database versioning for schema migrations (currently v3)
- Handle migration gracefully for existing users
- Implement proper error handling with user-friendly messages

### **UI/UX Patterns**
- Use DocumentFragment for batch DOM updates to minimize reflows
- Implement debounced input handling for search/filter operations
- Show loading states and progress indicators for long operations
- Provide visual feedback for user actions (success/error states)

### **Security & Validation**
- Sanitize all user input before displaying (use `textContent` not `innerHTML`)
- Validate data at both UI and database layers
- Implement proper error boundaries and graceful degradation
- Never use `eval()` or similar dangerous functions

### **Performance Optimization**
- Use `requestAnimationFrame` for smooth animations and UI updates
- Implement virtual scrolling for large task lists
- Optimize IndexedDB queries with proper indexes
- Cache frequently accessed data in memory

## 🚨 Common Patterns in This Codebase

### **Task Operations**
```javascript
// Create task with validation
async addTask(taskData) {
    const task = {
        id: this.generateUUID(),
        title: this.sanitizeInput(taskData.title),
        status: 'pending',
        createdAt: new Date().toISOString(),
        dependencies: [],
        isBlocked: false
    };
    
    await this.database.createTask(task);
    this.broadcastChange('task-created', task);
}
```

### **Dependency Management**
```javascript
// Check if task is blocked by dependencies
isTaskBlocked(task) {
    return task.dependencies.some(depId => {
        const depTask = this.getTaskById(depId.taskId);
        return depTask && depTask.status !== 'completed' && depId.type === 'blocking';
    });
}
```

### **Cross-Tab Communication**
```javascript
// Broadcast changes to other tabs
broadcastChange(type, data) {
    this.channel.postMessage({ type, data, timestamp: Date.now() });
}

// Listen for changes from other tabs
this.channel.addEventListener('message', (event) => {
    this.handleRemoteChange(event.data);
});
```

## 🌐 Browser Compatibility

### **Feature Detection**
Check for Service Worker and IndexedDB presence before activation; default to baseline behaviors when absent.

### **Manifest Support**
Link the manifest in documents that should be installable and validate fields via DevTools to ensure correct parsing and install behavior.

### **Shadow DOM Usage**
Rely on standard Shadow DOM APIs and slots for encapsulation rather than global styles to minimize cross-component breakage.

## 🧪 Testing and Debugging Hooks

### **Service Worker Verification**
Use DevTools Application panels to inspect service worker state, ensuring correct registration and caching semantics before release.

### **IndexedDB Transaction Testing**
Validate error paths by forcing IndexedDB aborts to confirm optimistic UI rollbacks and consistency under failure.

### **Cross-Tab Communication Testing**
Open multiple tabs to verify BroadcastChannel synchronization works correctly across browser instances.

```javascript
// Enable debug mode via URL parameters
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('debug')) {
    window.taskManager = taskManager; // Expose for debugging
}
```


## 🚨 Security Checklists

### **Inputs**
- Encode/sanitize at output boundaries
- Never concatenate untrusted content into HTML
- Avoid dangerous sinks including eval, setInnerHTML on untrusted input, and Function

### **Isolation**
- If running generated code, prefer sandboxed iframe or worker with minimal allowlists
- Do not pair allow-scripts with allow-same-origin for same-origin content

### **Policies**
- Apply CSP sandbox directive in controlled contexts to restrict script, navigation, and plugin capabilities at the response level

## 🛡️ Operational Guardrails

### **Failure-First Flow**
Design UI to optimistically update, then confirm persistence, and roll back on transaction abort or service worker failures to keep state consistent.

### **Caching Strategy Reviews**
Validate staleness windows and update paths in Cache API logic to ensure correct offline and online behaviors under intermittent connectivity.

### **Component Encapsulation**
Keep styles and DOM isolated via Shadow DOM to prevent regressions from global CSS or script collisions during incremental feature additions.

## 📁 File Organization

```
sky/
├── index.html                  # Single-file task manager application (9,600+ lines)
├── sw.js                      # Service Worker for offline functionality
├── feature-list.md            # Comprehensive feature specification
├── AGENTS.md                  # AI development guidelines
├── README.md                  # Project overview
└── archive/                   # Historical documentation and research
    ├── autonomous-marketplace.html  # Archived AI app generator
    ├── project_proposal.md     # Original project proposal
    ├── technical-research.md   # Implementation patterns research
    └── testing-strategy.md     # Testing approaches
```

### **When Adding New Features**
1. **Read existing patterns** in the codebase before implementing
2. **Follow single-file architecture** - embed everything in `index.html`
3. **Implement security-first** - sanitize inputs, validate data
4. **Use optimistic UI** - immediate feedback with rollback capability
5. **Test cross-tab sync** - ensure changes propagate across browser tabs
6. **Handle offline mode** - all features must work without network connection
7. **Update service worker** if new assets/API endpoints are added
8. **Follow dependency patterns** when implementing task relationships