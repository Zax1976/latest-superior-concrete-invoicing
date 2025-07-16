/**
 * Service Worker for J. Stark Business Invoicing System
 * Enables offline functionality and app-like experience
 */

const CACHE_NAME = 'jstark-invoicing-v1.3';
const urlsToCache = [
  '/superior-concrete-invoicing/',
  '/superior-concrete-invoicing/index.html',
  '/superior-concrete-invoicing/css/styles.css',
  '/superior-concrete-invoicing/css/print.css',
  '/superior-concrete-invoicing/js/app.js',
  '/superior-concrete-invoicing/js/calculator.js',
  '/superior-concrete-invoicing/js/invoice.js',
  '/superior-concrete-invoicing/js/storage.js',
  '/superior-concrete-invoicing/js/pdf.js',
  '/superior-concrete-invoicing/js/cloud-sync.js',
  '/superior-concrete-invoicing/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap',
  'https://i.imgur.com/u294xgL.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(error => {
        console.error('Fetch failed:', error);
        // Return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync any pending data when connection is restored
      syncPendingData()
    );
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: 'https://i.imgur.com/u294xgL.png',
      badge: 'https://i.imgur.com/u294xgL.png',
      tag: 'jstark-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync pending data function
async function syncPendingData() {
  try {
    // Get pending invoices from localStorage
    const pendingInvoices = JSON.parse(localStorage.getItem('jstark_pending_sync') || '[]');
    
    if (pendingInvoices.length > 0) {
      // Sync with cloud service when connection is restored
      console.log('Syncing pending invoices:', pendingInvoices.length);
      
      // Clear pending sync after successful upload
      localStorage.removeItem('jstark_pending_sync');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Install prompt handling
self.addEventListener('beforeinstallprompt', event => {
  // Prevent the mini-infobar from appearing on mobile
  event.preventDefault();
  
  // Store the event so it can be triggered later
  window.deferredPrompt = event;
  
  // Show custom install button
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
  }
});

// Handle app installation
self.addEventListener('appinstalled', event => {
  console.log('App was installed');
  
  // Track installation
  if (typeof gtag !== 'undefined') {
    gtag('event', 'app_install', {
      event_category: 'PWA',
      event_label: 'J. Stark Invoicing'
    });
  }
});

// Handle app updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache management utilities
const cacheUtils = {
  // Add item to cache
  async addToCache(request, response) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
  },
  
  // Remove item from cache
  async removeFromCache(request) {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(request);
  },
  
  // Get cache size
  async getCacheSize() {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    return keys.length;
  }
};

// Export utilities for use in main app
self.cacheUtils = cacheUtils;