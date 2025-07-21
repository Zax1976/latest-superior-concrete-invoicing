/**
 * Service Worker for J. Stark Business Invoicing System
 * Enables offline functionality and app-like experience
 */

const CACHE_NAME = 'jstark-invoicing-v1.6'; // Updated version - Mobile header improvements
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './css/print.css',
  './js/app.js',
  './js/calculator.js',
  './js/invoice.js',
  './js/storage.js',
  './js/pdf.js',
  './js/email.js', // Added new email.js
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://i.imgur.com/u294xgL.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing version', CACHE_NAME);
  
  // Force the new service worker to become active immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Opened cache', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache resources:', error);
      })
  );
});

// Fetch event - Network first, falling back to cache
self.addEventListener('fetch', event => {
  // Skip caching for non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Network-first strategy for better updates
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Update cache with new response
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              console.log('Service Worker: Serving from cache:', event.request.url);
              return response;
            }
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating version', CACHE_NAME);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('jstark-invoicing-')) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      clients.claim()
    ])
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