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
            event.waitUntil(clients.openWindow(`/?task=${data.taskId}`));
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
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create syncQueue object store if it doesn't exist
            if (!db.objectStoreNames.contains('syncQueue')) {
                const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
                syncStore.createIndex('timestamp', 'timestamp');
                syncStore.createIndex('type', 'type');
            }
        };
    });
}

async function getPendingOperations(db) {
    return new Promise((resolve, reject) => {
        try {
            // Check if syncQueue object store exists
            if (!db.objectStoreNames.contains('syncQueue')) {
                console.log('🔄 SyncQueue object store not found, returning empty array');
                resolve([]);
                return;
            }
            
            const transaction = db.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (error) {
            console.log('🔄 SyncQueue access failed, returning empty array:', error.message);
            resolve([]);
        }
    });
}

async function markOperationComplete(db, operationId) {
    return new Promise((resolve, reject) => {
        try {
            // Check if syncQueue object store exists
            if (!db.objectStoreNames.contains('syncQueue')) {
                console.log('🔄 SyncQueue object store not found, skipping delete');
                resolve();
                return;
            }
            
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.delete(operationId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (error) {
            console.log('🔄 SyncQueue delete failed:', error.message);
            resolve(); // Don't fail the sync operation
        }
    });
}