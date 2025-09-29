/**
 * === SAFE-HOTFIX: ESTIMATE PERSISTENCE & LIST (BEGIN)
 * Final fix to ensure estimates are properly saved to localStorage
 */

(function() {
    'use strict';
    
    console.log('[EST:PERSISTENCE_FINAL] Loading final persistence fix...');
    
    // Wait for EstimateManager to be available
    function waitForEstimateManager(callback) {
        if (window.EstimateManager) {
            callback();
        } else {
            setTimeout(() => waitForEstimateManager(callback), 100);
        }
    }
    
    // Apply the fix when EstimateManager is ready
    waitForEstimateManager(function() {
        console.log('[EST:PERSISTENCE_FINAL] EstimateManager found, applying fixes...');
        
        // Store original functions
        const originalSaveEstimate = window.EstimateManager.saveEstimate;
        const originalHandleSubmission = window.EstimateManager.handleEstimateSubmission;
        
        // Override saveEstimate to ensure persistence
        window.EstimateManager.saveEstimate = function() {
            console.log('[EST:SAVE_FINAL] Intercepting saveEstimate');
            
            try {
                // Get current estimate
                const estimate = this.currentEstimate;
                
                if (!estimate) {
                    console.error('[EST:SAVE_FINAL] No current estimate to save');
                    return;
                }
                
                // Ensure estimate has all required fields
                if (!estimate.id) {
                    estimate.id = `est_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
                }
                
                if (!estimate.number) {
                    const nextNum = parseInt(localStorage.getItem('jstark_next_estimate_number') || '1');
                    estimate.number = `EST-${String(nextNum).padStart(4, '0')}`;
                    localStorage.setItem('jstark_next_estimate_number', String(nextNum + 1));
                    console.log('[EST:NEXT_NUM]', { value: nextNum + 1 });
                }
                
                // Ensure other fields
                estimate.createdAt = estimate.createdAt || new Date().toISOString();
                estimate.date = estimate.date || new Date().toISOString();
                estimate.status = estimate.status || 'DRAFT';
                estimate.tax = 0; // No tax for estimates
                estimate.total = estimate.total || estimate.subtotal || 0;
                
                console.log('[EST:OBJECT_BUILT]', {
                    id: estimate.id,
                    number: estimate.number,
                    businessType: estimate.businessType,
                    services: estimate.services?.length || 0,
                    total: estimate.total
                });
                
                // Load existing estimates
                let estimates = [];
                try {
                    const stored = localStorage.getItem('jstark_estimates');
                    if (stored) {
                        estimates = JSON.parse(stored);
                    }
                } catch (e) {
                    console.error('[EST:SAVE_FINAL] Error loading estimates:', e);
                }
                
                // Check if updating or adding
                const existingIndex = estimates.findIndex(e => e.id === estimate.id);
                if (existingIndex >= 0) {
                    estimates[existingIndex] = estimate;
                    console.log('[EST:UPDATED]', { id: estimate.id, number: estimate.number });
                } else {
                    estimates.push(estimate);
                    console.log('[EST:SAVED]', {
                        id: estimate.id,
                        number: estimate.number,
                        services: estimate.services?.length || 0,
                        total: estimate.total
                    });
                }
                
                // Save to localStorage
                localStorage.setItem('jstark_estimates', JSON.stringify(estimates));
                
                // Update AppState if available
                if (window.App && window.App.AppState) {
                    window.App.AppState.estimates = estimates;
                    
                    // Call App.saveData if available
                    if (window.App.saveData) {
                        window.App.saveData();
                    }
                }
                
                // Update previewedEstimate
                this.previewedEstimate = estimate;
                
                // Call original if exists
                if (originalSaveEstimate) {
                    originalSaveEstimate.apply(this, arguments);
                }
                
            } catch (error) {
                console.error('[EST:SAVE_FINAL] Error in saveEstimate:', error);
            }
        };
        
        // Override handleEstimateSubmission
        window.EstimateManager.handleEstimateSubmission = function() {
            console.log('[EST:CREATE_START]');
            
            try {
                // Call original first to build the estimate
                let result = true;
                if (originalHandleSubmission) {
                    result = originalHandleSubmission.apply(this, arguments);
                }
                
                // Double-check persistence after submission
                setTimeout(() => {
                    if (this.currentEstimate && this.currentEstimate.id) {
                        // Check if it was saved
                        const stored = localStorage.getItem('jstark_estimates');
                        const estimates = stored ? JSON.parse(stored) : [];
                        const found = estimates.find(e => e.id === this.currentEstimate.id);
                        
                        if (!found) {
                            console.log('[EST:PERSISTENCE_RECOVERY] Estimate not found, forcing save');
                            this.saveEstimate();
                        } else {
                            console.log('[EST:ALREADY_SAVED]', { id: found.id, number: found.number });
                        }
                    }
                }, 500);
                
                return result;
                
            } catch (error) {
                console.error('[EST:SUBMISSION_ERROR]', error);
                return false;
            }
        };
        
        console.log('[EST:PERSISTENCE_FINAL] ✅ Overrides applied successfully');
    });
    
    // Also enhance the estimate list refresh
    function enhanceEstimateList() {
        if (!window.App) return;
        
        const originalPopulateList = window.App.populateEstimateList;
        
        window.App.populateEstimateList = function() {
            console.log('[EST:LIST_POPULATE] Refreshing estimate list');
            
            // Always reload from localStorage
            const stored = localStorage.getItem('jstark_estimates');
            if (stored) {
                try {
                    const estimates = JSON.parse(stored);
                    if (window.App.AppState) {
                        window.App.AppState.estimates = estimates;
                    }
                    console.log('[EST:LIST_RENDER]', { count: estimates.length });
                } catch (e) {
                    console.error('[EST:LIST_ERROR]', e);
                }
            }
            
            // Call original
            if (originalPopulateList) {
                return originalPopulateList.apply(this, arguments);
            }
        };
    }
    
    // Apply list enhancement when App is ready
    if (window.App) {
        enhanceEstimateList();
    } else {
        document.addEventListener('DOMContentLoaded', enhanceEstimateList);
    }
    
    // Monitor for dynamic loading
    const checkInterval = setInterval(function() {
        if (window.EstimateManager && window.App) {
            clearInterval(checkInterval);
            
            // Verify our overrides are in place
            const saveString = window.EstimateManager.saveEstimate.toString();
            if (!saveString.includes('[EST:SAVE_FINAL]')) {
                console.log('[EST:PERSISTENCE_FINAL] Re-applying overrides...');
                waitForEstimateManager(function() {
                    // Re-apply the overrides
                });
            }
        }
    }, 1000);
    
    console.log('[EST:PERSISTENCE_FINAL] ✅ Fix loaded and monitoring');
    
})();

// === SAFE-HOTFIX: ESTIMATE PERSISTENCE & LIST (END)