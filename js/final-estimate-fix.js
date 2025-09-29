/**
 * === FINAL ESTIMATE FIX (BEGIN)
 * Ultimate fix for Create Estimate button
 */

(function() {
    'use strict';
    
    console.log('[FINAL-FIX:INIT] Loading final estimate fix...');
    
    // Wait for page to fully load
    window.addEventListener('load', function() {
        console.log('[FINAL-FIX:LOADED] Page loaded, applying final fix...');
        
        // Find the Create Estimate button
        const estimateBtn = document.getElementById('create-estimate-btn');
        if (!estimateBtn) {
            console.error('[FINAL-FIX:ERROR] Create Estimate button not found');
            return;
        }
        
        // Remove the onclick attribute
        estimateBtn.removeAttribute('onclick');
        
        // Add direct click handler
        estimateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[FINAL-FIX:CLICK] Create Estimate clicked');
            
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
                
                // Scroll to top
                window.scrollTo(0, 0);
                
                // Set default business type
                setTimeout(() => {
                    const radio = document.querySelector('input[name="estimateBusinessType"][value="concrete"]');
                    if (radio && !radio.checked) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, 100);
                
                console.log('[FINAL-FIX:SUCCESS] Estimate creation view shown');
            }
        });
        
        // Do the same for Create Invoice button
        const invoiceBtn = document.getElementById('create-invoice-btn');
        if (invoiceBtn) {
            invoiceBtn.removeAttribute('onclick');
            
            invoiceBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('[FINAL-FIX:CLICK] Create Invoice clicked');
                
                // Hide all views
                document.querySelectorAll('.view').forEach(view => {
                    view.classList.remove('active');
                    view.style.display = 'none';
                });
                
                // Show invoice creation
                const invoiceCreation = document.getElementById('invoice-creation');
                if (invoiceCreation) {
                    invoiceCreation.classList.add('active');
                    invoiceCreation.style.display = 'block';
                    
                    if (window.App && window.App.AppState) {
                        window.App.AppState.currentView = 'invoice-creation';
                    }
                    
                    window.scrollTo(0, 0);
                    
                    setTimeout(() => {
                        const radio = document.getElementById('business-concrete');
                        if (radio && !radio.checked) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }, 100);
                }
            });
        }
        
        console.log('[FINAL-FIX:DONE] Final fix applied to both buttons');
    });
    
    // Also apply after a delay as backup
    setTimeout(function() {
        const estimateBtn = document.getElementById('create-estimate-btn');
        if (estimateBtn && estimateBtn.onclick) {
            console.log('[FINAL-FIX:LATE] Reapplying fix to estimate button');
            estimateBtn.onclick = null;
            estimateBtn.removeAttribute('onclick');
        }
    }, 3000);
    
})();

// === FINAL ESTIMATE FIX (END)