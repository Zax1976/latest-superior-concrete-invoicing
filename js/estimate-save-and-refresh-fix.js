/**
 * === SAFE-HOTFIX: ESTIMATE SAVE AND REFRESH FIX
 * Ensures new estimates appear immediately in Estimates tab after saving
 * ultrathink - complete fix for estimate visibility
 */

(function() {
    'use strict';
    
    console.log('[EST-SAVE-REFRESH] Loading comprehensive fix...');
    
    // Store original save function
    const originalSaveCurrentEstimate = window.EstimateManager && window.EstimateManager.prototype.saveCurrentEstimate;
    
    // Enhanced save that ensures immediate list refresh
    if (window.EstimateManager && window.EstimateManager.prototype) {
        const originalSave = window.EstimateManager.prototype.saveCurrentEstimate;
        
        window.EstimateManager.prototype.saveCurrentEstimate = function() {
            console.log('[EST-SAVE-REFRESH] Intercepting estimate save...');
            
            // Call original save
            const result = originalSave ? originalSave.apply(this, arguments) : true;
            
            // Force immediate refresh of AppState from localStorage
            setTimeout(() => {
                console.log('[EST-SAVE-REFRESH] Post-save refresh triggered');
                
                // Reload estimates from localStorage
                const savedEstimates = localStorage.getItem('jstark_estimates');
                if (savedEstimates) {
                    try {
                        const freshEstimates = JSON.parse(savedEstimates);
                        
                        // Update AppState
                        if (window.App && window.App.AppState) {
                            window.App.AppState.estimates = freshEstimates;
                            console.log('[EST-SAVE-REFRESH] ✅ AppState updated with', freshEstimates.length, 'estimates');
                            
                            // If we're on the estimate list view, refresh it
                            const estimateListView = document.getElementById('estimate-list');
                            if (estimateListView && estimateListView.style.display !== 'none') {
                                if (window.App.populateEstimateList) {
                                    window.App.populateEstimateList();
                                    console.log('[EST-SAVE-REFRESH] ✅ List view refreshed');
                                }
                            }
                        }
                    } catch (e) {
                        console.error('[EST-SAVE-REFRESH] Error parsing estimates:', e);
                    }
                }
            }, 100);
            
            return result;
        };
    }
    
    // Monitor localStorage changes directly
    let lastEstimateCount = 0;
    const checkForNewEstimates = function() {
        try {
            const savedEstimates = localStorage.getItem('jstark_estimates');
            if (savedEstimates) {
                const estimates = JSON.parse(savedEstimates);
                const currentCount = estimates.length;
                
                if (currentCount > lastEstimateCount) {
                    console.log('[EST-SAVE-REFRESH] New estimate detected! Count:', currentCount);
                    
                    // Update AppState
                    if (window.App && window.App.AppState) {
                        window.App.AppState.estimates = estimates;
                        
                        // Refresh list if visible
                        const estimateListView = document.getElementById('estimate-list');
                        if (estimateListView && estimateListView.style.display !== 'none') {
                            if (window.App.populateEstimateList) {
                                window.App.populateEstimateList();
                                console.log('[EST-SAVE-REFRESH] List auto-refreshed');
                            }
                        }
                    }
                }
                
                lastEstimateCount = currentCount;
            }
        } catch (e) {
            // Silent fail
        }
    };
    
    // Check every second for new estimates
    setInterval(checkForNewEstimates, 1000);
    
    // Enhanced tab click to always show fresh data
    const enhanceEstimateTab = function() {
        const estimateTab = document.querySelector('#estimate-tab-btn');
        if (estimateTab && !estimateTab.hasAttribute('data-refresh-enhanced')) {
            const originalOnclick = estimateTab.onclick;
            
            estimateTab.onclick = function(e) {
                console.log('[EST-SAVE-REFRESH] Tab clicked - ensuring fresh data');
                
                // Force reload from localStorage FIRST
                const savedEstimates = localStorage.getItem('jstark_estimates');
                if (savedEstimates) {
                    try {
                        const freshEstimates = JSON.parse(savedEstimates);
                        if (window.App && window.App.AppState) {
                            window.App.AppState.estimates = freshEstimates;
                            console.log('[EST-SAVE-REFRESH] Pre-loaded', freshEstimates.length, 'estimates for display');
                        }
                    } catch (err) {
                        console.error('[EST-SAVE-REFRESH] Error loading estimates:', err);
                    }
                }
                
                // Call original handler
                if (originalOnclick) {
                    originalOnclick.call(this, e);
                }
            };
            
            estimateTab.setAttribute('data-refresh-enhanced', 'true');
            console.log('[EST-SAVE-REFRESH] ✅ Enhanced estimate tab');
        }
    };
    
    // Apply enhancement multiple times
    setTimeout(enhanceEstimateTab, 500);
    setTimeout(enhanceEstimateTab, 1000);
    setTimeout(enhanceEstimateTab, 2000);
    setTimeout(enhanceEstimateTab, 3000);
    
    // Monitor for tab recreation
    const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
            if (mutation.addedNodes) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.id === 'estimate-tab-btn') {
                        console.log('[EST-SAVE-REFRESH] Tab recreated');
                        setTimeout(enhanceEstimateTab, 100);
                    }
                }
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Override App.populateEstimateList to always use fresh data
    if (window.App) {
        const originalPopulate = window.App.populateEstimateList;
        
        window.App.populateEstimateList = function() {
            console.log('[EST-SAVE-REFRESH] Populating list - loading fresh data');
            
            // Always reload from localStorage
            const savedEstimates = localStorage.getItem('jstark_estimates');
            if (savedEstimates) {
                try {
                    const freshEstimates = JSON.parse(savedEstimates);
                    window.App.AppState.estimates = freshEstimates;
                    console.log('[EST-SAVE-REFRESH] Using', freshEstimates.length, 'fresh estimates');
                } catch (e) {
                    console.error('[EST-SAVE-REFRESH] Error:', e);
                }
            }
            
            // Call original
            if (originalPopulate) {
                return originalPopulate.apply(this, arguments);
            }
        };
    }
    
    // Global refresh function for testing
    window.refreshEstimateList = function() {
        const saved = localStorage.getItem('jstark_estimates');
        if (saved) {
            const estimates = JSON.parse(saved);
            if (window.App && window.App.AppState) {
                window.App.AppState.estimates = estimates;
                if (window.App.populateEstimateList) {
                    window.App.populateEstimateList();
                }
            }
            console.log('[EST-SAVE-REFRESH] Manual refresh complete:', estimates.length, 'estimates');
        }
    };
    
    console.log('[EST-SAVE-REFRESH] ✅ Comprehensive fix loaded');
    console.log('[EST-SAVE-REFRESH] Use window.refreshEstimateList() to manually refresh');
    
    // Initial count
    checkForNewEstimates();
})();