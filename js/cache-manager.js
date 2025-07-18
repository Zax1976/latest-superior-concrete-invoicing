/**
 * Cache Manager for J. Stark Invoicing System
 * Handles cache invalidation and updates
 */

const CacheManager = {
    currentVersion: 'v1.6',
    
    init: function() {
        this.checkForUpdates();
        this.setupUpdateListener();
    },
    
    checkForUpdates: function() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            console.log('Checking for app updates...');
            
            // Check if a new service worker is waiting
            navigator.serviceWorker.ready.then(registration => {
                if (registration.waiting) {
                    this.promptUpdate(registration.waiting);
                }
                
                // Listen for new service workers
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.promptUpdate(newWorker);
                        }
                    });
                });
            });
        }
    },
    
    promptUpdate: function(worker) {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <span>A new version is available!</span>
                <button class="btn btn-primary btn-sm" onclick="CacheManager.applyUpdate()">
                    Update Now
                </button>
                <button class="btn btn-secondary btn-sm" onclick="this.parentElement.parentElement.remove()">
                    Later
                </button>
            </div>
        `;
        updateBanner.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #DC143C;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            animation: slideDown 0.3s ease-out;
        `;
        
        document.body.appendChild(updateBanner);
        
        // Store worker reference
        this.waitingWorker = worker;
    },
    
    applyUpdate: function() {
        if (this.waitingWorker) {
            // Tell waiting service worker to skip waiting
            this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            
            // Reload once the new service worker takes control
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });
        }
    },
    
    setupUpdateListener: function() {
        // Listen for messages from service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data && event.data.type === 'CACHE_UPDATED') {
                    console.log('Cache updated to version:', event.data.version);
                }
            });
        }
    },
    
    // Manual cache clearing functions
    clearCache: async function() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            const deletePromises = cacheNames.map(cacheName => {
                console.log('Deleting cache:', cacheName);
                return caches.delete(cacheName);
            });
            
            await Promise.all(deletePromises);
            console.log('All caches cleared');
            
            // Unregister service worker
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
            
            return true;
        }
        return false;
    },
    
    forceUpdate: async function() {
        try {
            // Clear all caches
            await this.clearCache();
            
            // Clear localStorage version
            localStorage.setItem('jstark_app_version', this.currentVersion);
            
            // Show success message
            if (window.App && window.App.showSuccess) {
                window.App.showSuccess('Cache cleared! Refreshing app...');
            }
            
            // Reload after a short delay
            setTimeout(() => {
                window.location.reload(true); // Force reload from server
            }, 1000);
            
        } catch (error) {
            console.error('Force update failed:', error);
            if (window.App && window.App.showError) {
                window.App.showError('Failed to clear cache. Please try manual refresh.');
            }
        }
    },
    
    // Add version check on load
    checkVersion: function() {
        const storedVersion = localStorage.getItem('jstark_app_version');
        if (storedVersion !== this.currentVersion) {
            console.log(`Version mismatch: stored ${storedVersion}, current ${this.currentVersion}`);
            this.forceUpdate();
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CacheManager.init();
        CacheManager.checkVersion();
    });
} else {
    CacheManager.init();
    CacheManager.checkVersion();
}

// Export for global access
window.CacheManager = CacheManager;

// Add styles for update banner
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    .update-banner .update-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .update-banner .btn-sm {
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
    }
`;
document.head.appendChild(style);