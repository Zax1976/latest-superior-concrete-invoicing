/**
 * === SAFE-HOTFIX: ESTIMATE BUTTON FIX (BEGIN)
 * Ensure Create Estimate button works properly from dashboard
 */

(function() {
    'use strict';
    
    console.log('[ESTIMATE-BTN-FIX:INIT] Loading estimate button fix...');
    
    // Override showCreateEstimateOptions with guaranteed working implementation
    function fixEstimateButton() {
        console.log('[ESTIMATE-BTN-FIX:PATCHING] Fixing estimate button...');
        
        window.showCreateEstimateOptions = function() {
            console.log('[ESTIMATE-BTN-FIX:CLICKED] Create Estimate button clicked');
            
            try {
                // DIRECT METHOD: Force show estimate creation view immediately
                console.log('[ESTIMATE-BTN-FIX:DIRECT] Forcing estimate creation view');
                
                // Hide ALL views first
                document.querySelectorAll('.view').forEach(view => {
                    view.classList.remove('active');
                    view.style.display = 'none';
                    view.setAttribute('data-view-state', 'inactive');
                });
                
                // Show estimate creation view specifically
                const estimateView = document.getElementById('estimate-creation');
                if (estimateView) {
                    console.log('[ESTIMATE-BTN-FIX:SHOW] Showing estimate-creation view');
                    estimateView.classList.add('active');
                    estimateView.style.display = 'block';
                    estimateView.setAttribute('data-view-state', 'active');
                    
                    // Update app state
                    if (window.App && window.App.AppState) {
                        window.App.AppState.currentView = 'estimate-creation';
                    }
                    
                    // Scroll to top
                    window.scrollTo(0, 0);
                    
                    // Get preferred business type
                    const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
                    const invoices = JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
                    const allDocs = [...estimates, ...invoices].sort((a, b) => 
                        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
                    );
                    const lastType = allDocs.length > 0 ? allDocs[0].businessType : 'concrete';
                    
                    console.log('[ESTIMATE-BTN-FIX:TYPE] Setting business type to:', lastType);
                    
                    // Set business type after a short delay
                    setTimeout(() => {
                        // Try multiple selectors for the radio button
                        let radio = document.getElementById(`estimate-business-${lastType}`);
                        if (!radio) {
                            radio = document.querySelector(`#estimate-creation input[name="estimateBusinessType"][value="${lastType}"]`);
                        }
                        if (!radio) {
                            radio = document.querySelector(`input[name="estimateBusinessType"][value="${lastType}"]`);
                        }
                        
                        if (radio) {
                            console.log('[ESTIMATE-BTN-FIX:RADIO] Found and setting radio button');
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                            radio.click();
                        } else {
                            console.warn('[ESTIMATE-BTN-FIX:RADIO] Could not find business type radio');
                        }
                        
                        // Initialize form if needed
                        if (window.EstimateManager && window.EstimateManager.initializeForm) {
                            window.EstimateManager.initializeForm();
                        }
                        
                        // Initialize signature if needed
                        if (window.App && window.App.initSignatureMethodSwitching) {
                            window.App.initSignatureMethodSwitching();
                        }
                    }, 200);
                    
                    console.log('[ESTIMATE-BTN-FIX:SUCCESS] Estimate creation view is now active');
                    return;
                } else {
                    console.error('[ESTIMATE-BTN-FIX:ERROR] estimate-creation view not found in DOM');
                }
                
                // Fallback: Try App.showEstimateCreation if direct method failed
                if (window.App && typeof window.App.showEstimateCreation === 'function') {
                    console.log('[ESTIMATE-BTN-FIX:FALLBACK] Using App.showEstimateCreation');
                    window.App.showEstimateCreation('concrete');
                    return;
                }
                
                // Method 2: Use createNewEstimate if available
                if (window.createNewEstimate && typeof window.createNewEstimate === 'function') {
                    console.log('[ESTIMATE-BTN-FIX:CREATE] Using createNewEstimate');
                    
                    const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
                    const lastType = estimates.length > 0 ? 
                        estimates[estimates.length - 1].businessType : 'concrete';
                    
                    window.createNewEstimate(lastType);
                    return;
                }
                
                // Method 3: Direct DOM manipulation
                console.log('[ESTIMATE-BTN-FIX:DOM] Using direct DOM manipulation');
                
                // Hide all views
                document.querySelectorAll('.view').forEach(view => {
                    view.classList.remove('active');
                    view.style.display = 'none';
                });
                
                // Show estimate creation view
                const estimateView = document.getElementById('estimate-creation');
                if (estimateView) {
                    estimateView.classList.add('active');
                    estimateView.style.display = 'block';
                    
                    // Scroll to top
                    window.scrollTo(0, 0);
                    
                    // Initialize form if needed
                    if (window.EstimateManager && window.EstimateManager.initializeForm) {
                        window.EstimateManager.initializeForm();
                    }
                    
                    // Set default business type
                    const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
                    const lastType = estimates.length > 0 ? 
                        estimates[estimates.length - 1].businessType : 'concrete';
                    
                    setTimeout(() => {
                        const radio = document.querySelector(`#estimate-creation input[value="${lastType}"]`);
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, 100);
                    
                    console.log('[ESTIMATE-BTN-FIX:SUCCESS] Estimate creation view displayed');
                } else {
                    console.error('[ESTIMATE-BTN-FIX:ERROR] Estimate creation view not found');
                }
                
            } catch (error) {
                console.error('[ESTIMATE-BTN-FIX:ERROR] Failed to open estimate creation:', error);
                
                // Last resort - try clicking the New Job button and then Estimate option
                const newJobBtn = document.getElementById('new-job-btn');
                if (newJobBtn) {
                    console.log('[ESTIMATE-BTN-FIX:FALLBACK] Clicking New Job button');
                    newJobBtn.click();
                    
                    setTimeout(() => {
                        const estimateOption = document.querySelector('button[onclick*="createNewEstimate"]');
                        if (estimateOption) {
                            console.log('[ESTIMATE-BTN-FIX:FALLBACK] Clicking estimate option');
                            estimateOption.click();
                        }
                    }, 200);
                }
            }
        };
        
        console.log('[ESTIMATE-BTN-FIX:PATCHED] Estimate button function replaced');
    }
    
    // Also ensure createNewEstimate works if called directly
    function ensureCreateNewEstimate() {
        if (!window.createNewEstimate) {
            window.createNewEstimate = function(businessType) {
                console.log('[ESTIMATE-BTN-FIX:CREATE_NEW] createNewEstimate called with:', businessType);
                
                if (window.App && window.App.showEstimateCreation) {
                    window.App.showEstimateCreation(businessType);
                } else {
                    // Fallback to manual view switch
                    document.querySelectorAll('.view').forEach(v => {
                        v.classList.remove('active');
                        v.style.display = 'none';
                    });
                    
                    const estimateView = document.getElementById('estimate-creation');
                    if (estimateView) {
                        estimateView.classList.add('active');
                        estimateView.style.display = 'block';
                        
                        // Set business type
                        setTimeout(() => {
                            const radio = document.querySelector(`#estimate-creation input[value="${businessType}"]`);
                            if (radio) {
                                radio.checked = true;
                                radio.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, 100);
                    }
                }
            };
        }
    }
    
    // Initialize
    function initialize() {
        fixEstimateButton();
        ensureCreateNewEstimate();
        
        // Re-apply after delays to override any late scripts
        setTimeout(fixEstimateButton, 500);
        setTimeout(fixEstimateButton, 1000);
        setTimeout(fixEstimateButton, 2000);
        
        console.log('[ESTIMATE-BTN-FIX:READY] Estimate button fix ready');
    }
    
    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();

// === SAFE-HOTFIX: ESTIMATE BUTTON FIX (END)