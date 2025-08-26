/**
 * === STABLE NAVIGATION FIX (BEGIN)
 * Final fix that doesn't cause instability
 */

(function() {
    'use strict';
    
    console.log('[STABLE-FIX:INIT] Loading stable navigation fix...');
    
    let fixApplied = false;
    
    function applyStableFix() {
        if (fixApplied) return;
        
        console.log('[STABLE-FIX:APPLY] Applying stable fix...');
        
        // Override the global functions without touching the buttons
        window.showCreateEstimateOptions = function() {
            console.log('[STABLE-FIX:ESTIMATE] Create Estimate triggered');
            
            // Get the current view
            const currentView = document.querySelector('.view.active');
            if (currentView) {
                currentView.classList.remove('active');
                currentView.style.display = 'none';
            }
            
            // Show estimate creation
            const estimateCreation = document.getElementById('estimate-creation');
            if (estimateCreation) {
                // Hide all views first
                document.querySelectorAll('.view').forEach(v => {
                    v.classList.remove('active');
                    v.style.display = 'none';
                });
                
                // Show estimate creation
                estimateCreation.classList.add('active');
                estimateCreation.style.display = 'block';
                
                // Update app state
                if (window.App && window.App.AppState) {
                    window.App.AppState.currentView = 'estimate-creation';
                }
                
                // Set business type
                const lastType = 'concrete'; // Default to concrete
                const radio = document.querySelector(`input[name="estimateBusinessType"][value="${lastType}"]`);
                if (radio) {
                    setTimeout(() => {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }, 100);
                }
                
                window.scrollTo(0, 0);
                console.log('[STABLE-FIX:SUCCESS] Estimate creation view shown');
            }
        };
        
        window.showCreateInvoiceOptions = function() {
            console.log('[STABLE-FIX:INVOICE] Create Invoice triggered');
            
            // Hide all views
            document.querySelectorAll('.view').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });
            
            // Show invoice creation
            const invoiceCreation = document.getElementById('invoice-creation');
            if (invoiceCreation) {
                invoiceCreation.classList.add('active');
                invoiceCreation.style.display = 'block';
                
                if (window.App && window.App.AppState) {
                    window.App.AppState.currentView = 'invoice-creation';
                }
                
                // Set business type
                const lastType = 'concrete';
                const radio = document.getElementById(`business-${lastType}`);
                if (radio) {
                    setTimeout(() => {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }, 100);
                }
                
                window.scrollTo(0, 0);
                console.log('[STABLE-FIX:SUCCESS] Invoice creation view shown');
            }
        };
        
        window.createNewEstimate = function(businessType) {
            console.log('[STABLE-FIX:CREATE_EST] createNewEstimate:', businessType);
            
            // Hide all views
            document.querySelectorAll('.view').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });
            
            // Show estimate creation
            const estimateCreation = document.getElementById('estimate-creation');
            if (estimateCreation) {
                estimateCreation.classList.add('active');
                estimateCreation.style.display = 'block';
                
                if (window.App && window.App.AppState) {
                    window.App.AppState.currentView = 'estimate-creation';
                }
                
                // Set business type
                const radio = document.querySelector(`input[name="estimateBusinessType"][value="${businessType}"]`);
                if (radio) {
                    setTimeout(() => {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }, 100);
                }
                
                window.scrollTo(0, 0);
            }
        };
        
        window.createNewInvoice = function(businessType) {
            console.log('[STABLE-FIX:CREATE_INV] createNewInvoice:', businessType);
            
            // Hide all views
            document.querySelectorAll('.view').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });
            
            // Show invoice creation
            const invoiceCreation = document.getElementById('invoice-creation');
            if (invoiceCreation) {
                invoiceCreation.classList.add('active');
                invoiceCreation.style.display = 'block';
                
                if (window.App && window.App.AppState) {
                    window.App.AppState.currentView = 'invoice-creation';
                }
                
                // Set business type
                const radio = document.getElementById(`business-${businessType}`);
                if (radio) {
                    setTimeout(() => {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }, 100);
                }
                
                window.scrollTo(0, 0);
            }
        };
        
        fixApplied = true;
        console.log('[STABLE-FIX:DONE] Stable fix applied');
    }
    
    // Apply once when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyStableFix);
    } else {
        applyStableFix();
    }
    
    // Apply again after a delay to override other scripts
    setTimeout(applyStableFix, 1000);
    setTimeout(applyStableFix, 2000);
    
})();

// === STABLE NAVIGATION FIX (END)