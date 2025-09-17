# Copilot Instructions for Sky Project

## 🏗️ Architecture Overview

This project contains **two distinct single-file applications** with zero external dependencies:

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

## 🎯 Key Patterns & Conventions

### **Single-File Architecture**
- **Everything embedded**: HTML, CSS, JavaScript, PWA manifest, Service Workers
- **No build tools**: Direct browser execution, zero external dependencies
- **Self-contained**: Each HTML file is a complete, deployable application

### **Database Patterns**
```javascript
// IndexedDB with transaction safety (Task Manager)
class TaskDatabase {
    async createTask(data) {
        const task = this.validateTaskData(data);
        const transaction = this.db.transaction(['tasks'], 'readwrite');
        // Always use transactions for data integrity
    }
}

// In-memory Map storage (Autonomous Marketplace)
const AppMarketplace = {
    apps: new Map(),              // Live application instances
    runningApps: new Set(),       // Track execution state
    save: () => localStorage.setItem('autonomous-marketplace-apps', ...)
};
```

### **Security-First Development**
```javascript
// XSS prevention - ALWAYS sanitize user input
sanitizeHTML(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Safe code execution (Autonomous Marketplace)
executeInSandbox(code) {
    // Never use eval() directly - use iframe sandbox
}
```

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

## 🔧 Development Workflows

### **Testing Strategy**
- **No external frameworks**: Embedded testing with URL parameters (`?test=true`)
- **Browser-native**: Test real IndexedDB, Service Workers, PWA features
- **Cross-browser**: Playwright scripts for automated testing across browsers

### **Debugging**
```javascript
// Enable debug mode via URL parameters
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('debug')) {
    window.taskManager = taskManager; // Expose for debugging
}
```

### **Version Control**
- **Commit single files**: Each HTML file is a complete feature
- **Document major function points**: Use detailed commit messages for architecture changes
- **Branch strategy**: Main branch contains production-ready single-file apps

## 🎨 UI/UX Patterns

### **CSS Architecture**
```css
/* Custom properties for theming */
:root {
    --color-primary: #2563eb;
    --space-md: 1rem;
    --transition-fast: 150ms ease-in-out;
}

/* Mobile-first responsive design */
.app-container {
    display: grid;
    grid-template-areas: "header" "main" "footer";
}

@media (min-width: 768px) {
    .app-container {
        grid-template-areas: "header header" "sidebar main" "footer footer";
    }
}
```

### **Component-Like Structure**
```javascript
// Vanilla JS component pattern without frameworks
class Component {
    constructor(element) {
        this.element = element;
        this.state = {};
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }
    
    render() {
        this.element.innerHTML = this.template();
    }
}
```

## 📡 AI Integration Patterns

### **Google Gemini Integration** (Autonomous Marketplace)
```javascript
static async processWithGemini(userRequest) {
    // Structured prompts for better AI responses
    const systemPrompt = "You are a web application generator...";
    
    // API key management
    const apiKey = localStorage.getItem('gemini-api-key');
    
    // Response parsing with fallbacks
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : fallbackResponse;
}
```

### **API Tracking & Analytics**
```javascript
// Track all AI interactions for optimization
class AIApiTracker {
    startTracking(requestId, userRequest) {
        // Log request metadata, tokens, performance
    }
    
    completeTracking(requestId, response) {
        // Analyze deviation, quality, suggest improvements
    }
}
```

## 🚨 Critical Considerations

### **Browser Compatibility**
- **IndexedDB**: Check availability before use
- **Service Workers**: Progressive enhancement pattern
- **CSS Grid**: Fallback layouts for older browsers

### **Performance**
- **Virtual scrolling**: Handle large datasets (1000+ items)
- **Document fragments**: Batch DOM updates
- **Memory management**: Clean up event listeners and observers

### **Security**
- **Never use eval()**: Use iframe sandboxes for code execution
- **Sanitize all inputs**: HTML escaping, input validation
- **CSP headers**: Content Security Policy for production deployment

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