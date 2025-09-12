/**
 * === ITERATIVE FIX: CREATE ESTIMATE BUTTON (BEGIN)
 * Force Create Estimate to open creation form, not list
 */

(function() {
    'use strict';
    
    console.log('[ITERATIVE-FIX:INIT] Fixing Create Estimate button...');
    
    // Override ALL methods that might be interfering
    function forceEstimateCreation() {
        console.log('[ITERATIVE-FIX:OVERRIDE] Overriding estimate functions...');
        
        // Main fix - override showCreateEstimateOptions
        window.showCreateEstimateOptions = function() {
            console.log('[ITERATIVE-FIX:CLICKED] Create Estimate quick action triggered');
            
            // FORCE estimate creation view, not list
            // Hide ALL views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
                view.style.display = 'none';
                view.setAttribute('data-view-state', 'inactive');
            });
            
            // Get estimate creation view
            const estimateCreation = document.getElementById('estimate-creation');
            if (!estimateCreation) {
                console.error('[ITERATIVE-FIX:ERROR] estimate-creation element not found!');
                return;
            }
            
            console.log('[ITERATIVE-FIX:SHOW] Showing estimate-creation view');
            
            // Show estimate creation
            estimateCreation.classList.add('active');
            estimateCreation.style.display = 'block';
            estimateCreation.style.visibility = 'visible';
            estimateCreation.style.opacity = '1';
            estimateCreation.setAttribute('data-view-state', 'active');
            
            // Update app state
            if (window.App && window.App.AppState) {
                window.App.AppState.currentView = 'estimate-creation';
                console.log('[ITERATIVE-FIX:STATE] Updated AppState.currentView to estimate-creation');
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
            
            console.log('[ITERATIVE-FIX:TYPE] Setting business type to:', lastType);
            
            // Set business type after short delay
            setTimeout(() => {
                // Try all possible radio selectors
                const selectors = [
                    `#estimate-business-${lastType}`,
                    `input[name="estimateBusinessType"][value="${lastType}"]`,
                    `#estimate-creation input[name="estimateBusinessType"][value="${lastType}"]`,
                    `#estimate-creation #estimate-business-${lastType}`
                ];
                
                let radio = null;
                for (const selector of selectors) {
                    radio = document.querySelector(selector);
                    if (radio) {
                        console.log('[ITERATIVE-FIX:RADIO] Found radio with selector:', selector);
                        break;
                    }
                }
                
                if (radio) {
                    radio.checked = true;
                    radio.click();
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('[ITERATIVE-FIX:RADIO] Set business type successfully');
                } else {
                    console.warn('[ITERATIVE-FIX:RADIO] Could not find business type radio');
                }
                
                // Initialize form if needed
                if (window.EstimateManager && window.EstimateManager.initializeForm) {
                    window.EstimateManager.initializeForm();
                }
            }, 200);
            
            console.log('[ITERATIVE-FIX:SUCCESS] Estimate creation view should now be visible');
        };
        
        // Also override createNewEstimate for dropdown clicks
        window.createNewEstimate = function(businessType) {
            console.log('[ITERATIVE-FIX:CREATE] createNewEstimate called with:', businessType);
            
            // Hide all views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
                view.style.display = 'none';
            });
            
            // Show estimate creation
            const estimateCreation = document.getElementById('estimate-creation');
            if (estimateCreation) {
                estimateCreation.classList.add('active');
                estimateCreation.style.display = 'block';
                
                // Update app state
                if (window.App && window.App.AppState) {
                    window.App.AppState.currentView = 'estimate-creation';
                }
                
                // Set business type
                setTimeout(() => {
                    const radio = document.querySelector(`input[name="estimateBusinessType"][value="${businessType}"]`);
                    if (radio) {
                        radio.checked = true;
                        radio.click();
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, 100);
                
                window.scrollTo(0, 0);
                console.log('[ITERATIVE-FIX:SUCCESS] Opened estimate creation from dropdown');
            }
        };
        
        // Override App.showEstimateCreation if it exists and is broken
        if (window.App && window.App.showEstimateCreation) {
            const originalShowEstimateCreation = window.App.showEstimateCreation;
            
            window.App.showEstimateCreation = function(businessType) {
                console.log('[ITERATIVE-FIX:APP] Intercepting App.showEstimateCreation');
                
                // Call original first
                const result = originalShowEstimateCreation.call(this, businessType);
                
                // Then ensure we're really showing creation, not list
                setTimeout(() => {
                    const estimateCreation = document.getElementById('estimate-creation');
                    const estimateList = document.getElementById('estimate-list');
                    
                    if (estimateList && estimateList.classList.contains('active')) {
                        console.log('[ITERATIVE-FIX:CORRECTION] Estimate list was shown, correcting to creation');
                        
                        estimateList.classList.remove('active');
                        estimateList.style.display = 'none';
                        
                        if (estimateCreation) {
                            estimateCreation.classList.add('active');
                            estimateCreation.style.display = 'block';
                            window.App.AppState.currentView = 'estimate-creation';
                        }
                    }
                }, 100);
                
                return result;
            };
        }
    }
    
    // Apply fixes immediately and repeatedly
    forceEstimateCreation();
    
    // Reapply after delays to catch late-loading scripts
    setTimeout(forceEstimateCreation, 100);
    setTimeout(forceEstimateCreation, 500);
    setTimeout(forceEstimateCreation, 1000);
    setTimeout(forceEstimateCreation, 2000);
    setTimeout(forceEstimateCreation, 3000);
    
    // Monitor for any changes that might break it
    const observer = new MutationObserver(() => {
        const estimateBtn = document.getElementById('create-estimate-btn');
        if (estimateBtn && estimateBtn.onclick !== window.showCreateEstimateOptions) {
            console.log('[ITERATIVE-FIX:MONITOR] Detected change, reapplying fix');
            forceEstimateCreation();
        }
    });
    
    // Start observing when ready
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    console.log('[ITERATIVE-FIX:READY] Create Estimate button fix applied');
    
})();

// === ITERATIVE FIX: CREATE ESTIMATE BUTTON (END)