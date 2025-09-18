# Copilot Instructions for Sky Project - Engineering Edition

## 🏗️ Architecture Overview

This project contains **two distinct single-file applications** with zero external dependencies, designed with engineering-first principles for production-grade vanilla HTML/CSS/JavaScript development.

### 1. **Autonomous Marketplace** (`autonomous-marketplace.html`)
- **AI-powered app generator** that creates web applications through natural language
- **Google Gemini integration** with API key management (`/api-key` command)
- **7 core classes**: ConversationManager, AppManager, SecurityValidator, ComplexityAnalyzer, QueueManager, AppExecutor, AIService
- **State management**: Global `AppMarketplace` object with Map-based app storage
- **Security**: Multi-layer validation, XSS prevention, safe code execution sandbox

### 2. **Offline Task Manager** (`offline-task-manager.html`)  
- **Offline-first task management** with IndexedDB persistence
- **2 core classes**: TaskDatabase, TaskManager
- **PWA capabilities**: Installable app with embedded manifest
- **Optimistic UI**: Instant updates with database rollback on failure

## 🎯 Engineering Goals

Favor standard platform features, progressive enhancement, and deterministic behaviors that work in constrained environments and degrade gracefully when APIs are unavailable. Minimize surface area by keeping apps self-contained while using manifests and service workers to bundle install-time metadata and caching strategies for reliability and performance.

## 🏛️ Architecture Principles

- **Single-file packaging**: embed HTML, CSS, JS, and PWA manifest to ship self-contained apps that the browser can parse and execute directly using standard loading rules for documents and scripts.
- **Progressive enhancement**: render meaningful baseline HTML, layer interactivity and offline capabilities via feature detection for service workers and related APIs to avoid breaking baseline functionality.
- **Separation of concerns in vanilla JS**: isolate DOM rendering and state transitions in small units, and keep cross-cutting concerns (security validation, analytics, and sandbox execution) independent to reduce coupling.

## 💾 Data and State

### **IndexedDB as the Durable Store**
All reads and writes must run within transactions, enabling atomic commit/rollback and consistency across object stores when scoped correctly.

```javascript
// Transaction usage: open transactions from IDBDatabase, operate through IDBObjectStore
class TaskDatabase {
    async createTask(data) {
        const task = this.validateTaskData(data);
        const tx = this.db.transaction(['tasks'], 'readwrite');
        const store = tx.objectStore('tasks');
        await store.put(task);
        await tx.done; // or await completion via event/callback if using callbacks
    }
}
```

### **In-Memory Caches**
Prefer immutable snapshots or Map-based stores for live data with explicit synchronization points to reduce incidental writes outside transactional boundaries.

```javascript
// In-memory Map storage (Autonomous Marketplace)
const AppMarketplace = {
    apps: new Map(),              // Live application instances
    runningApps: new Set(),       // Track execution state
    save: () => localStorage.setItem('autonomous-marketplace-apps', ...)
};
```

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

## 📱 PWA Packaging and Lifecycle

### **Web App Manifest**
Include a manifest with name, icons, start_url, scope, and display to enable installation and standardized metadata for app-like behavior.

```html
<link rel="manifest" href="/app.webmanifest">
```

### **Service Worker Lifecycle**
Register a service worker for offline reliability and programmable caching; treat this as progressive enhancement when unsupported.

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### **Programmable Caching**
Use Cache API strategies to control fetch handling, background updating, and fallbacks to optimize perceived performance and resilience.

## ⚡ Performance and Memory

### **Minimize Layout Thrash**
Construct lists with DocumentFragment and append once to reduce reflow/paint cycles in large renders.

### **Animation Cadence**
Perform per-frame work in requestAnimationFrame and compute deltas from the timestamp for refresh-rate independence.

### **Off-Main-Thread Work**
Move heavy logic to Web Workers when needed to keep the UI responsive and isolate computations from the rendering thread.

### **Optimistic UI Updates**
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
        this.tasks[index] = savedTask;
    } catch (error) {
        // 4. Rollback on failure
        this.tasks = this.tasks.filter(t => t.id !== optimisticTask.id);
    }
}
```

## ✅ Acceptance Criteria Patterns

### **Data Integrity**
All durable writes run within IndexedDB transactions with explicit abort on validation failure and commit on success.

### **Rendering Safety**
No direct HTML injection from untrusted sources; use text nodes or sanitized templates and avoid unsafe sinks known to enable DOM XSS.

### **Isolation**
All dynamically executed user or AI-generated code runs in a sandboxed iframe or worker boundary with capability minimization.

## 🌐 Browser Compatibility

### **Feature Detection**
Check for Service Worker and IndexedDB presence before activation; default to baseline behaviors when absent.

### **Manifest Support**
Link the manifest in documents that should be installable and validate fields via DevTools to ensure correct parsing and install behavior.

### **Shadow DOM Usage**
Rely on standard Shadow DOM APIs and slots for encapsulation rather than global styles to minimize cross-component breakage.

## 🧪 Testing and Debugging Hooks

### **Service Worker Verification**
Use DevTools Application panels to inspect manifest and service worker state, ensuring correct registration and caching semantics before release.

### **Transactional Testing**
Validate error paths by forcing IndexedDB aborts to confirm optimistic UI rollbacks and consistency under failure.

### **Shadow DOM Validation**
Verify slotting, scoping, and host styling behaviors through ShadowRoot inspection to ensure component encapsulation is preserved.

```javascript
// Enable debug mode via URL parameters
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('debug')) {
    window.taskManager = taskManager; // Expose for debugging
}
```

## 📡 AI Integration Patterns

### **Client-Side AI API Integration**
Implement secure API communication with flexible service management:

```javascript
class AIServiceManager {
    constructor(apiKey, provider = 'openai') {
        this.apiKey = apiKey;
        this.provider = provider;
        this.baseURL = this.getProviderURL(provider);
    }
   
    async generateApp(prompt) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }],
                    model: this.getProviderModel()
                })
            });
           
            return await response.json();
        } catch (error) {
            console.error('AI service error:', error);
            return this.getFallbackResponse();
        }
    }
}
```

### **Code Processing and Sandboxing**
```javascript
class CodeProcessor {
    processAIResponse(response) {
        const codeBlocks = this.extractCodeBlocks(response.content);
        return {
            html: codeBlocks.html || '',
            css: codeBlocks.css || '',
            javascript: codeBlocks.javascript || ''
        };
    }
   
    sandboxCode(jsCode) {
        // Implement code sandboxing for security
        return `(function() { ${jsCode} })();`;
    }
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
├── autonomous-marketplace.html     # AI-powered app generator (2,789 lines)
├── offline-task-manager.html      # Offline-first task manager (1,800+ lines)
├── features_list.md               # 20 browser API application ideas
├── technical-research.md          # Implementation patterns & architecture
├── testing-strategy.md            # Multi-tier testing approach
├── project_proposal.md            # Human-AI workflow documentation
└── task-management-features.md    # Feature specifications
```

### **When Adding New Features**
1. **Read existing patterns** in technical-research.md
2. **Follow single-file architecture** - embed everything
3. **Implement security-first** - sanitize inputs, validate data
4. **Use optimistic UI** - immediate feedback with rollback
5. **Document major function points** - explain complex architecture decisions
6. **Apply progressive enhancement** - ensure baseline functionality without advanced APIs
7. **Use feature detection** - check for API availability before use
8. **Implement proper error boundaries** - graceful degradation and recovery