# 🔄 Recurring Tasks - Technical Design Document

## 🗄️ **Data Model Extension**

### **1. Enhanced Task Model (v4 Migration)**

```javascript
TaskModel = {
  // Existing fields (unchanged)
  id: 'uuid-v4',
  title: 'string',
  description: 'string', 
  status: 'pending|completed|archived',
  priority: 'low|medium|high|urgent',
  categoryId: 'uuid-v4',
  dueDate: 'ISO-8601|null',
  createdAt: 'ISO-8601',
  modifiedAt: 'ISO-8601',
  completedAt: 'ISO-8601|null',
  dependencies: 'Array',
  isBlocked: 'boolean',
  
  // NEW: Recurring task fields
  isRecurring: 'boolean',           // Flag for recurring tasks
  parentTaskId: 'uuid-v4|null',    // Parent template task ID
  recurringConfig: 'RecurringConfig|null', // Recurring pattern configuration
  recurringInstanceData: 'InstanceData|null', // Instance-specific data
  recurringStatus: 'template|instance|completed_instance', // Recurring status
  nextDueDate: 'ISO-8601|null',     // Next scheduled occurrence
  lastGeneratedDate: 'ISO-8601|null', // Last instance generation date
  completedInstances: 'number'      // Count of completed instances
}
```

### **2. New Object Store: Recurring Patterns**

```javascript
RecurringPatternsStore = {
  keyPath: 'id',
  indexes: {
    'by-parentTask': { keyPath: 'parentTaskId', unique: false },
    'by-frequency': { keyPath: 'frequency', unique: false },
    'by-nextDue': { keyPath: 'nextDueDate', unique: false },
    'by-active': { keyPath: 'isActive', unique: false }
  }
}

RecurringPatternModel = {
  id: 'uuid-v4',                    // Unique pattern ID
  parentTaskId: 'uuid-v4',          // Parent task template
  frequency: 'daily|weekly|monthly|yearly|custom', // Recurrence type
  interval: 'number',               // Every N units (1=every, 2=every other, etc)
  weekDays: 'Array<0-6>|null',      // For weekly: [0=Sun, 1=Mon, ..., 6=Sat]
  monthDay: 'number|null',          // For monthly: day of month (1-31)
  monthWeek: 'number|null',         // For monthly: which week (1-4, -1=last)
  monthWeekDay: 'number|null',      // For monthly: weekday (0-6)
  yearMonth: 'number|null',         // For yearly: month (1-12)
  yearDay: 'number|null',           // For yearly: day of year (1-365)
  customCron: 'string|null',        // For custom: cron-like expression
  startDate: 'ISO-8601',            // When recurrence starts
  endDate: 'ISO-8601|null',         // When recurrence ends (optional)
  maxInstances: 'number|null',      // Max instances to generate (optional)
  timezoneOffset: 'number',         // Timezone offset in minutes
  isActive: 'boolean',              // Whether pattern is active
  lastExecuted: 'ISO-8601|null',    // Last execution timestamp
  createdAt: 'ISO-8601',
  modifiedAt: 'ISO-8601'
}
```

### **3. Database Schema Migration (v3 → v4)**

```javascript
// Migration strategy for existing data
const MIGRATION_v3_to_v4 = {
  // Add new indexes to tasks store
  newIndexes: [
    'by-recurring': { keyPath: 'isRecurring', unique: false },
    'by-parent-task': { keyPath: 'parentTaskId', unique: false },
    'by-recurring-status': { keyPath: 'recurringStatus', unique: false },
    'by-next-due': { keyPath: 'nextDueDate', unique: false }
  ],
  
  // Create new object store
  newStores: ['recurringPatterns'],
  
  // Data migration for existing tasks
  taskMigration: {
    addFields: {
      isRecurring: false,
      parentTaskId: null,
      recurringConfig: null,
      recurringInstanceData: null,
      recurringStatus: null,
      nextDueDate: null,
      lastGeneratedDate: null,
      completedInstances: 0
    }
  }
}
```

## ⚙️ **Core Classes & Methods**

### **4. RecurringTaskEngine Class**

```javascript
class RecurringTaskEngine {
  constructor(database) {
    this.database = database;
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Pattern calculation methods
  calculateNextOccurrence(pattern, fromDate = new Date()) {}
  generateInstances(pattern, count = 10) {}
  validateRecurringPattern(pattern) {}
  
  // Instance management
  createRecurringTask(taskData, pattern) {}
  generateNextInstance(parentTaskId) {}
  completeRecurringInstance(instanceId) {}
  skipRecurringInstance(instanceId, skipToDate) {}
  
  // Schedule management  
  getUpcomingInstances(daysAhead = 30) {}
  getPendingGenerations() {}
  executeScheduledGeneration() {}
  
  // Pattern modification
  updateRecurringPattern(patternId, updates) {}
  pauseRecurringPattern(patternId) {}
  resumeRecurringPattern(patternId) {}
  deleteRecurringPattern(patternId, deleteInstances = false) {}
}
```

### **5. Frequency Calculation Algorithms**

```javascript
const FrequencyCalculators = {
  daily: (pattern, fromDate) => {
    // Add pattern.interval days
    const next = new Date(fromDate);
    next.setDate(next.getDate() + pattern.interval);
    return next;
  },
  
  weekly: (pattern, fromDate) => {
    // Calculate next occurrence based on selected weekdays
    const next = new Date(fromDate);
    const targetDays = pattern.weekDays || [];
    // Find next occurrence in targetDays array
    return findNextWeeklyOccurrence(next, targetDays, pattern.interval);
  },
  
  monthly: (pattern, fromDate) => {
    // Handle both specific date and relative date patterns
    if (pattern.monthDay) {
      return calculateMonthlyByDate(fromDate, pattern.monthDay, pattern.interval);
    } else {
      return calculateMonthlyByWeek(fromDate, pattern.monthWeek, pattern.monthWeekDay, pattern.interval);
    }
  },
  
  yearly: (pattern, fromDate) => {
    const next = new Date(fromDate);
    next.setFullYear(next.getFullYear() + pattern.interval);
    if (pattern.yearMonth) next.setMonth(pattern.yearMonth - 1);
    if (pattern.yearDay) setDayOfYear(next, pattern.yearDay);
    return next;
  },
  
  custom: (pattern, fromDate) => {
    // Parse custom cron-like expression
    return parseCronExpression(pattern.customCron, fromDate);
  }
};
```

## 🖥️ **User Interface Components**

### **6. UI Form Extensions**

```javascript
// Task creation form additions
const RecurringTaskForm = {
  // Frequency selector
  frequencySelect: ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'],
  
  // Dynamic options based on frequency
  dailyOptions: { interval: 'number' },
  weeklyOptions: { interval: 'number', weekDays: 'checkboxes' },
  monthlyOptions: { 
    interval: 'number', 
    type: 'date|relative',
    monthDay: 'number',
    monthWeek: 'select', 
    monthWeekDay: 'select' 
  },
  yearlyOptions: { interval: 'number', yearMonth: 'select', yearDay: 'number' },
  customOptions: { cronExpression: 'text' },
  
  // Instance management
  endDateOptions: { 
    never: true, 
    onDate: 'date-picker', 
    afterInstances: 'number' 
  }
};
```

### **7. Task Display Enhancements**

```javascript
// Visual indicators for recurring tasks
const RecurringTaskUI = {
  indicators: {
    template: '🔄 Template',
    instance: '📅 Due {date}', 
    completed_instance: '✅ Completed {date}'
  },
  
  badges: {
    'daily': { icon: '📅', color: '#3b82f6' },
    'weekly': { icon: '📆', color: '#10b981' }, 
    'monthly': { icon: '🗓️', color: '#f59e0b' },
    'yearly': { icon: '🎯', color: '#ef4444' }
  },
  
  actions: [
    'Complete Instance',
    'Skip to Next',
    'Modify Pattern', 
    'Pause Recurring',
    'View All Instances'
  ]
};
```

## 🔄 **Background Processing**

### **8. Service Worker Integration**

```javascript
// Background task generation
const RecurringTaskWorker = {
  // Periodic execution (every hour)
  scheduleGeneration: () => {
    setInterval(() => {
      generatePendingInstances();
    }, 60 * 60 * 1000);
  },
  
  // Generate instances for upcoming dates
  generatePendingInstances: async () => {
    const patterns = await getActivePatterns();
    for (const pattern of patterns) {
      await generateInstancesForPattern(pattern);
    }
  },
  
  // Cross-tab synchronization for recurring tasks
  broadcastRecurringUpdates: (action, data) => {
    self.postMessage({
      type: 'RECURRING_TASK_UPDATE',
      action, // 'generated', 'completed', 'skipped', 'pattern_updated'
      data
    });
  }
};
```

## 📊 **Performance Considerations**

### **9. Optimization Strategies**

```javascript
const OptimizationPatterns = {
  // Lazy instance generation
  generateOnDemand: true, // Generate instances only when viewing future dates
  
  // Batch operations  
  batchInstanceGeneration: 50, // Generate max 50 instances at once
  
  // Cleanup completed instances
  cleanupPolicy: {
    keepCompletedDays: 90, // Keep completed instances for 3 months
    maxInstancesPerPattern: 1000 // Limit total instances per pattern
  },
  
  // Caching frequently accessed patterns
  patternCache: new Map(), // Cache active patterns in memory
  
  // Index optimization
  queryOptimization: {
    useCompoundIndexes: true, // For complex recurring queries
    paginateResults: true     // For large recurring task lists
  }
};
```

## 🧪 **Testing Strategy**

### **10. Edge Cases & Validation**

```javascript
const RecurringTaskTests = [
  // Date boundary testing
  'Leap year February 29th recurring yearly',
  'Month-end dates (Jan 31 → Feb 28/29)',
  'Daylight saving time transitions',
  'Timezone changes',
  
  // Pattern validation
  'Invalid cron expressions',
  'Conflicting pattern parameters',  
  'Past start dates',
  'End date before start date',
  
  // Performance testing
  '1000+ recurring patterns performance',
  'Large instance generation batches',
  'Cross-tab synchronization with many instances',
  'Background generation under load'
];
```

---

## ✅ **Phase 1 Complete**

This comprehensive design provides:

1. **🗄️ Database Schema**: Backward-compatible v4 migration
2. **⚙️ Core Engine**: Robust recurring pattern calculations
3. **🎨 UI Components**: Intuitive recurring task management
4. **🔄 Background Processing**: Automated instance generation
5. **📊 Performance**: Optimized for large datasets
6. **🧪 Testing**: Comprehensive edge case coverage

**Next Phase**: Database schema implementation and migration logic.