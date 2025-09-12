/**
 * === SAFE-HOTFIX: ESTIMATE COUNT UPDATE FIX (BEGIN)
 * Ensures estimate count in tabs updates after new estimates are created
 */

(function() {
    'use strict';
    
    console.log('[EST:COUNT_FIX] Loading estimate count fix...');
    
    // Function to update all estimate counts in the UI
    function updateAllEstimateCounts() {
        const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
        const actualCount = estimates.length;
        
        console.log('[EST:COUNT_UPDATE] Updating counts to:', actualCount);
        
        // Update count in specific span elements (these are inside "Estimates (n)" format)
        const estimateCountSpans = [
            document.getElementById('estimate-count'),
            document.getElementById('estimates-count'),
            document.getElementById('estimates-count-2')
        ];
        
        estimateCountSpans.forEach(element => {
            if (element) {
                // Just update the number in the span, don't add parentheses
                element.textContent = actualCount;
                console.log('[EST:COUNT_UPDATE] Updated span:', element.id);
            }
        });
        
        // Update standalone count elements (like in tab badges)
        const standaloneCountElements = [
            document.querySelector('#estimate-tab-btn span'),
            document.querySelector('#estimates-tab > span')
        ];
        
        standaloneCountElements.forEach(element => {
            if (element && !element.id) { // Skip if it has an ID (already handled above)
                element.textContent = actualCount;
                console.log('[EST:COUNT_UPDATE] Updated element:', element.className);
            }
        });
        
        // Update AppState if available
        if (window.App && window.App.AppState) {
            window.App.AppState.estimates = estimates;
        }
    }
    
    // Hook into estimate save operations
    function enhanceEstimateSave() {
        if (!window.EstimateManager) return;
        
        const originalSave = window.EstimateManager.saveEstimate;
        const originalSubmission = window.EstimateManager.handleEstimateSubmission;
        
        // Wrap saveEstimate
        if (originalSave && !originalSave.toString().includes('[COUNT_ENHANCED]')) {
            window.EstimateManager.saveEstimate = function() {
                const result = originalSave.apply(this, arguments);
                
                // Update counts after save
                setTimeout(updateAllEstimateCounts, 100);
                
                return result;
            };
            // Mark as enhanced
            window.EstimateManager.saveEstimate._enhanced = '[COUNT_ENHANCED]';
        }
        
        // Wrap handleEstimateSubmission
        if (originalSubmission && !originalSubmission.toString().includes('[COUNT_ENHANCED]')) {
            window.EstimateManager.handleEstimateSubmission = function() {
                const result = originalSubmission.apply(this, arguments);
                
                // Update counts after submission
                setTimeout(updateAllEstimateCounts, 500);
                
                return result;
            };
            // Mark as enhanced
            window.EstimateManager.handleEstimateSubmission._enhanced = '[COUNT_ENHANCED]';
        }
    }
    
    // Hook into list population
    function enhanceListPopulation() {
        if (!window.App) return;
        
        const originalPopulate = window.App.populateEstimateList;
        
        if (originalPopulate && !originalPopulate.toString().includes('[COUNT_ENHANCED]')) {
            window.App.populateEstimateList = function() {
                const result = originalPopulate.apply(this, arguments);
                
                // Update counts after populating list
                updateAllEstimateCounts();
                
                return result;
            };
            // Mark as enhanced
            window.App.populateEstimateList._enhanced = '[COUNT_ENHANCED]';
        }
        
        // Also enhance showEstimateList
        const originalShow = window.App.showEstimateList;
        
        if (originalShow && !originalShow.toString().includes('[COUNT_ENHANCED]')) {
            window.App.showEstimateList = function() {
                const result = originalShow.apply(this, arguments);
                
                // Update counts after showing list
                setTimeout(updateAllEstimateCounts, 300);
                
                return result;
            };
            // Mark as enhanced
            window.App.showEstimateList._enhanced = '[COUNT_ENHANCED]';
        }
    }
    
    // Apply enhancements when ready
    function applyEnhancements() {
        enhanceEstimateSave();
        enhanceListPopulation();
        updateAllEstimateCounts();
    }
    
    // Wait for required objects
    if (window.EstimateManager && window.App) {
        applyEnhancements();
    } else {
        // Try again after DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(applyEnhancements, 500);
            setTimeout(applyEnhancements, 1000);
            setTimeout(applyEnhancements, 2000);
        });
    }
    
    // Also update counts periodically to catch any changes
    setInterval(function() {
        const stored = localStorage.getItem('jstark_estimates');
        if (stored) {
            const estimates = JSON.parse(stored);
            const currentCount = estimates.length;
            
            // Check if count element exists and is different
            const countElement = document.getElementById('estimate-count');
            if (countElement) {
                const displayedCount = parseInt(countElement.textContent);
                if (displayedCount !== currentCount) {
                    console.log('[EST:COUNT_FIX] Count mismatch detected:', displayedCount, 'vs', currentCount);
                    updateAllEstimateCounts();
                }
            }
        }
    }, 2000);
    
    // Export for manual use
    window.updateEstimateCounts = updateAllEstimateCounts;
    
    console.log('[EST:COUNT_FIX] ✅ Count fix loaded');
    console.log('[EST:COUNT_FIX] Use window.updateEstimateCounts() to manually update');
    
})();

// === SAFE-HOTFIX: ESTIMATE COUNT UPDATE FIX (END)