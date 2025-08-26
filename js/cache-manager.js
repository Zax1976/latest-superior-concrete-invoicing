
/**
 * J. Stark Business Invoicing System - Cache Manager
 * Clears runtime caches and optionally reloads the app.
 * Keeps persisted business data (invoices, customers, settings) intact.
 */
(function () {
  'use strict';

  const CacheManager = {
    /**
     * Clear Cache Storage, unregister Service Workers, clear session cache,
     * and remove non-critical localStorage keys. Then reload.
     * @param {boolean} withReload
     */
    forceUpdate: async function (withReload = true) {
      try {
        // Visual feedback
        try {
          if (window.NotificationSystem && NotificationSystem.showInfo) {
            NotificationSystem.showInfo('Clearing cache…', { duration: 1500 });
          }
        } catch (e) {}

        // 1) Clear Cache Storage (PWA caches)
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
          console.log('[CacheManager] Cache Storage cleared:', keys);
        }

        // 2) Unregister all Service Workers so a fresh copy is fetched next load
        if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
          console.log('[CacheManager] Service workers unregistered:', regs.length);
        }

        // 3) Session storage is safe to clear
        try {
          sessionStorage.clear();
        } catch (e) {
          console.warn('[CacheManager] sessionStorage.clear failed', e);
        }

        // 4) Remove non-critical localStorage keys (keep persisted business data)
        try {
          const preserve = new Set();
          if (window.StorageManager && StorageManager.keys) {
            Object.values(StorageManager.keys).forEach(k => preserve.add(k));
          }
          // Also explicitly preserve last backup marker if present
          preserve.add('jstark_last_backup');

          const toDelete = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!preserve.has(key)) toDelete.push(key);
          }
          toDelete.forEach(k => localStorage.removeItem(k));
          console.log('[CacheManager] Removed localStorage keys:', toDelete);
        } catch (e) {
          console.warn('[CacheManager] localStorage cleanup failed', e);
        }

        // 5) Let the user know we are done
        try {
          if (window.NotificationSystem && NotificationSystem.showSuccess) {
            NotificationSystem.showSuccess('Cache cleared. Reloading…', { duration: 1200 });
          } else {
            alert('Cache cleared. The page will reload.');
          }
        } catch (e) {}

      } catch (err) {
        console.error('[CacheManager] forceUpdate failed', err);
        if (window.NotificationSystem && NotificationSystem.showError) {
          NotificationSystem.showError('Failed to clear cache. See console for details.');
        } else {
          alert('Failed to clear cache. See console for details.');
        }
      } finally {
        if (withReload) {
          try {
            // Some browsers ignore hard reload flags; fallback to assign
            window.location.reload();
          } catch (e) {
            window.location.href = window.location.href;
          }
        }
      }
    }
  };

  // Expose globally
  window.CacheManager = CacheManager;
})();
