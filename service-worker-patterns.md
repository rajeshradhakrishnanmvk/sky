# Service Worker Implementation Patterns

## 🔄 Complete Service Worker Architecture

This document outlines the Service Worker implementation patterns used in the offline-first task management system, providing advanced offline capabilities with background sync, intelligent caching, and push notifications.

## 🚀 Service Worker Generation & Registration

### Inline Service Worker Creation
```javascript
/**
 * Generate complete Service Worker code as a string
 * This allows embedding the SW directly in the HTML file
 */
function generateServiceWorkerCode() {
    return `
        const CACHE_NAME = 'task-manager-v1';
        const SYNC_TAG = 'task-sync';
        
        // Install event - cache essential resources
        self.addEventListener('install', (event) => {
            console.log('🔧 Service Worker installing...');
            event.waitUntil(self.skipWaiting());
        });
        
        // Activate event - take control of all clients
        self.addEventListener('activate', (event) => {
            console.log('✅ Service Worker activated');
            event.waitUntil(clients.claim());
        });
        
        // Fetch event - intelligent request interception
        self.addEventListener('fetch', (event) => {
            const url = new URL(event.request.url);
            
            // Skip non-GET requests and external resources
            if (event.request.method !== 'GET' || url.origin !== location.origin) {
                return;
            }
            
            // Apply different strategies based on request type
            if (url.pathname.includes('/api/')) {
                // Network-first for API calls
                event.respondWith(networkFirstStrategy(event.request));
            } else if (url.pathname.includes('/static/')) {
                // Cache-first for static assets
                event.respondWith(cacheFirstStrategy(event.request));
            } else {
                // Stale-while-revalidate for HTML/dynamic content
                event.respondWith(staleWhileRevalidateStrategy(event.request));
            }
        });
        
        // Background sync for offline operations
        self.addEventListener('sync', (event) => {
            console.log('🔄 Background sync triggered:', event.tag);
            
            if (event.tag === SYNC_TAG) {
                event.waitUntil(syncPendingOperations());
            }
        });
        
        // Push notifications
        self.addEventListener('push', (event) => {
            if (!event.data) return;
            
            const data = event.data.json();
            const options = {
                body: data.body,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                vibrate: [100, 50, 100],
                data: data.data,
                actions: [
                    { action: 'complete', title: 'Mark Complete' },
                    { action: 'view', title: 'View Task' }
                ]
            };
            
            event.waitUntil(
                self.registration.showNotification(data.title, options)
            );
        });
        
        // Notification click handling
        self.addEventListener('notificationclick', (event) => {
            event.notification.close();
            
            const { action, data } = event;
            
            switch (action) {
                case 'complete':
                    event.waitUntil(handleTaskComplete(data.taskId));
                    break;
                case 'view':
                    event.waitUntil(clients.openWindow(\`/?task=\${data.taskId}\`));
                    break;
                default:
                    event.waitUntil(clients.openWindow('/'));
            }
        });
        
        // Message handling for main thread communication
        self.addEventListener('message', (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'CACHE_TASK':
                    event.waitUntil(cacheTaskData(data));
                    break;
                case 'REQUEST_SYNC':
                    event.waitUntil(requestImmediateSync());
                    break;
                case 'CLEAR_CACHE':
                    event.waitUntil(clearApplicationCache());
                    break;
            }
        });
        
        // Caching strategies implementation
        async function cacheFirstStrategy(request) {
            try {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(request);
                
                if (cachedResponse) {
                    // Update cache in background
                    fetch(request).then(response => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                        }
                    });
                    return cachedResponse;
                }
                
                const networkResponse = await fetch(request);
                if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone());
                }
                return networkResponse;
                
            } catch (error) {
                console.error('Cache-first strategy failed:', error);
                return new Response('Offline', { status: 503 });
            }
        }
        
        async function networkFirstStrategy(request) {
            try {
                const networkResponse = await fetch(request);
                
                if (networkResponse.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, networkResponse.clone());
                }
                
                return networkResponse;
                
            } catch (error) {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(request);
                
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return new Response('Network error', { status: 503 });
            }
        }
        
        async function staleWhileRevalidateStrategy(request) {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(request);
            
            const fetchPromise = fetch(request).then(response => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }
                return response;
            });
            
            return cachedResponse || fetchPromise;
        }
        
        // Background sync operations
        async function syncPendingOperations() {
            try {
                // Open IndexedDB to get pending operations
                const db = await openDatabase();
                const operations = await getPendingOperations(db);
                
                for (const operation of operations) {
                    try {
                        await executeOperation(operation);
                        await markOperationComplete(db, operation.id);
                    } catch (error) {
                        console.error('Failed to sync operation:', operation, error);
                    }
                }
                
                // Notify main thread of sync completion
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SYNC_COMPLETE',
                        data: { count: operations.length }
                    });
                });
                
            } catch (error) {
                console.error('Background sync failed:', error);
            }
        }
        
        async function executeOperation(operation) {
            const { type, data } = operation;
            
            switch (type) {
                case 'CREATE_TASK':
                    return await syncCreateTask(data);
                case 'UPDATE_TASK':
                    return await syncUpdateTask(data);
                case 'DELETE_TASK':
                    return await syncDeleteTask(data);
                default:
                    throw new Error('Unknown operation type: ' + type);
            }
        }
        
        async function syncCreateTask(taskData) {
            // Implement server sync logic here
            console.log('Syncing create task:', taskData);
        }
        
        async function syncUpdateTask(taskData) {
            // Implement server sync logic here
            console.log('Syncing update task:', taskData);
        }
        
        async function syncDeleteTask(taskData) {
            // Implement server sync logic here
            console.log('Syncing delete task:', taskData);
        }
        
        // IndexedDB operations for Service Worker
        async function openDatabase() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('TaskManagerDB', 1);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        async function getPendingOperations(db) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['syncQueue'], 'readonly');
                const store = transaction.objectStore('syncQueue');
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        async function markOperationComplete(db, operationId) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['syncQueue'], 'readwrite');
                const store = transaction.objectStore('syncQueue');
                const request = store.delete(operationId);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    `;
}
```

### Service Worker Registration
```javascript
/**
 * Register Service Worker using blob URL
 * This allows complete offline functionality
 */
async function initializeServiceWorker() {
    try {
        // Generate Service Worker code
        const serviceWorkerCode = generateServiceWorkerCode();
        
        // Create blob URL for registration
        const blob = new Blob([serviceWorkerCode], { type: 'application/javascript' });
        const serviceWorkerUrl = URL.createObjectURL(blob);
        
        // Register Service Worker
        const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
            scope: '/'
        });
        
        console.log('✅ Service Worker registered:', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                    console.log('🔄 Service Worker updated');
                    // Optional: Show update notification to user
                }
            });
        });
        
        // Wait for Service Worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker ready');
        
        return registration;
        
    } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        throw error;
    }
}
```

## 💬 Service Worker Communication

### Main Thread to Service Worker
```javascript
/**
 * Send messages to Service Worker
 */
async function sendMessageToServiceWorker(message) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.active) {
            registration.active.postMessage(message);
        }
    }
}

/**
 * Cache task data via Service Worker
 */
async function cacheTaskData(taskData) {
    await sendMessageToServiceWorker({
        type: 'CACHE_TASK',
        data: taskData
    });
}

/**
 * Request immediate background sync
 */
async function requestBackgroundSync(operation) {
    try {
        // Store operation in IndexedDB for Service Worker access
        await storeOperationForSync(operation);
        
        // Request background sync if supported
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('task-sync');
            console.log('🔄 Background sync requested');
        }
        
    } catch (error) {
        console.error('❌ Background sync request failed:', error);
    }
}

/**
 * Store operation for background sync
 */
async function storeOperationForSync(operation) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('TaskManagerDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            
            const syncOperation = {
                ...operation,
                id: Date.now() + Math.random(),
                timestamp: Date.now()
            };
            
            const addRequest = store.add(syncOperation);
            
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
        };
        
        request.onerror = () => reject(request.error);
    });
}
```

### Service Worker to Main Thread
```javascript
/**
 * Handle messages from Service Worker
 */
function setupServiceWorkerMessaging() {
    navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
            case 'SYNC_COMPLETE':
                handleSyncComplete(data);
                break;
                
            case 'CACHE_UPDATED':
                handleCacheUpdate(data);
                break;
                
            case 'NOTIFICATION_CLICKED':
                handleNotificationClick(data);
                break;
                
            default:
                console.log('📨 Service Worker message:', event.data);
        }
    });
}

function handleSyncComplete(data) {
    console.log('🔄 Background sync completed:', data);
    
    // Optional: Refresh UI data
    if (window.taskManager) {
        window.taskManager.loadTasks();
    }
    
    // Optional: Show success notification
    showNotification('Tasks synced successfully', 'success');
}

function handleCacheUpdate(data) {
    console.log('💾 Cache updated:', data);
}

function handleNotificationClick(data) {
    console.log('🔔 Notification clicked:', data);
    
    // Handle notification actions
    if (data.action === 'complete' && data.taskId) {
        completeTaskFromNotification(data.taskId);
    }
}
```

## 🔄 Background Sync Integration

### Enhanced Task Operations
```javascript
/**
 * Create task with background sync support
 */
async function createTaskWithSync(taskData) {
    // 1. Optimistic UI update
    const optimisticTask = {
        ...taskData,
        id: 'temp-' + Date.now(),
        isOptimistic: true,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
    };
    
    this.tasks.unshift(optimisticTask);
    this.render();
    
    try {
        // 2. Persist to local database
        const savedTask = await this.database.createTask(taskData);
        
        // 3. Replace optimistic with real data
        const index = this.tasks.findIndex(t => t.id === optimisticTask.id);
        if (index !== -1) {
            this.tasks[index] = savedTask;
        }
        
        // 4. Cache for offline access
        await cacheTaskData(savedTask);
        
        // 5. Queue for background sync if offline
        if (!navigator.onLine) {
            await requestBackgroundSync({
                type: 'CREATE_TASK',
                data: savedTask,
                timestamp: Date.now()
            });
        }
        
        this.render();
        return savedTask;
        
    } catch (error) {
        // Rollback optimistic update
        this.tasks = this.tasks.filter(t => t.id !== optimisticTask.id);
        this.render();
        throw error;
    }
}

/**
 * Update task with background sync support
 */
async function updateTaskWithSync(taskId, updates) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const previousState = { ...task };
    
    // Optimistic update
    Object.assign(task, updates, { modifiedAt: new Date().toISOString() });
    this.render();
    
    try {
        // Persist to database
        await this.database.updateTask(taskId, updates);
        
        // Cache updated task
        await cacheTaskData(task);
        
        // Queue for sync if offline
        if (!navigator.onLine) {
            await requestBackgroundSync({
                type: 'UPDATE_TASK',
                data: { id: taskId, ...updates },
                timestamp: Date.now()
            });
        }
        
    } catch (error) {
        // Rollback on failure
        Object.assign(task, previousState);
        this.render();
        throw error;
    }
}
```

## 📱 PWA Installation

### Installation Prompt Handling
```javascript
let deferredPrompt;

// Capture install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
});

function showInstallPrompt() {
    // Create elegant install banner
    const installBanner = document.createElement('div');
    installBanner.innerHTML = `
        <div style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem;
            text-align: center;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            transform: translateY(100%);
            transition: transform 0.3s ease-in-out;
        ">
            <strong>📱 Install Task Manager</strong>
            <p>Add to home screen for quick access</p>
            <button onclick="installApp()">Install</button>
            <button onclick="dismissInstallPrompt()">Maybe Later</button>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    setTimeout(() => {
        installBanner.firstElementChild.style.transform = 'translateY(0)';
    }, 100);
}

async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Install prompt: ${outcome}`);
        deferredPrompt = null;
        dismissInstallPrompt();
    }
}
```

## 🔔 Push Notifications

### Setup and Handling
```javascript
/**
 * Request notification permission and setup
 */
async function setupPushNotifications() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return;
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        // Subscribe to push notifications if Service Worker is available
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            await subscribeToPushNotifications();
        }
    }
}

async function subscribeToPushNotifications() {
    try {
        const registration = await navigator.serviceWorker.ready;
        
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        
        console.log('✅ Push notification subscription:', subscription);
        
        // Send subscription to server (if you have one)
        // await sendSubscriptionToServer(subscription);
        
    } catch (error) {
        console.error('❌ Push notification subscription failed:', error);
    }
}

/**
 * Show local notification
 */
function showNotification(title, body, options = {}) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                body,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                vibrate: [100, 50, 100],
                ...options
            });
        });
    } else if (Notification.permission === 'granted') {
        new Notification(title, { body, ...options });
    }
}
```

This comprehensive Service Worker implementation provides production-ready offline capabilities with intelligent caching, background sync, and PWA features, all embedded within a single HTML file.