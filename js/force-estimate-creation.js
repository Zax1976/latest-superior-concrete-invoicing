/**
 * === FORCE ESTIMATE CREATION FIX (BEGIN)
 * Directly modify button onclick to ensure it opens creation, not list
 */

(function() {
    'use strict';
    
    console.log('[FORCE-FIX:INIT] Forcing estimate creation fix...');
    
    function forceFixEstimateButton() {
        console.log('[FORCE-FIX:APPLY] Applying force fix...');
        
        // Find the Create Estimate button
        const estimateBtn = document.getElementById('create-estimate-btn');
        if (!estimateBtn) {
            console.error('[FORCE-FIX:ERROR] Create Estimate button not found');
            return;
        }
        
        // Remove ALL existing event listeners by cloning
        const newBtn = estimateBtn.cloneNode(true);
        estimateBtn.parentNode.replaceChild(newBtn, estimateBtn);
        
        // Add our own click handler
        newBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[FORCE-FIX:CLICK] Create Estimate clicked - forcing creation view');
            
            // Hide ALL views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
                view.style.display = 'none';
            });
            
            // Force show estimate creation
            const estimateCreation = document.getElementById('estimate-creation');
            if (!estimateCreation) {
                console.error('[FORCE-FIX:ERROR] estimate-creation not found');
                return;
            }
            
            estimateCreation.classList.add('active');
            estimateCreation.style.display = 'block';
            estimateCreation.style.visibility = 'visible';
            estimateCreation.style.opacity = '1';
            
            // Update app state
            if (window.App && window.App.AppState) {
                window.App.AppState.currentView = 'estimate-creation';
            }
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Set business type
            setTimeout(() => {
                const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
                const invoices = JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
                const lastType = [...estimates, ...invoices].length > 0 ? 
                    [...estimates, ...invoices][0].businessType : 'concrete';
                
                const radio = document.querySelector(`input[name="estimateBusinessType"][value="${lastType}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.click();
                }
            }, 100);
            
            console.log('[FORCE-FIX:SUCCESS] Estimate creation should be visible');
            return false;
        };
        
        // Also add addEventListener to be extra sure
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, true);
        
        console.log('[FORCE-FIX:DONE] Button handler replaced');
    }
    
    // Apply immediately
    forceFixEstimateButton();
    
    // Apply repeatedly to ensure it sticks
    setTimeout(forceFixEstimateButton, 100);
    setTimeout(forceFixEstimateButton, 500);
    setTimeout(forceFixEstimateButton, 1000);
    setTimeout(forceFixEstimateButton, 2000);
    
    // Watch for DOM changes and reapply
    if (document.body) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.id === 'create-estimate-btn' || 
                            (node.querySelector && node.querySelector('#create-estimate-btn'))) {
                            console.log('[FORCE-FIX:MUTATION] Button added/changed, reapplying fix');
                            setTimeout(forceFixEstimateButton, 10);
                        }
                    }
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Also fix Create Invoice button the same way
    function forceFixInvoiceButton() {
        const invoiceBtn = document.getElementById('create-invoice-btn');
        if (!invoiceBtn) return;
        
        const newBtn = invoiceBtn.cloneNode(true);
        invoiceBtn.parentNode.replaceChild(newBtn, invoiceBtn);
        
        newBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[FORCE-FIX:CLICK] Create Invoice clicked - forcing creation view');
            
            // Hide ALL views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
                view.style.display = 'none';
            });
            
            // Force show invoice creation
            const invoiceCreation = document.getElementById('invoice-creation');
            if (invoiceCreation) {
                invoiceCreation.classList.add('active');
                invoiceCreation.style.display = 'block';
                
                if (window.App && window.App.AppState) {
                    window.App.AppState.currentView = 'invoice-creation';
                }
                
                window.scrollTo(0, 0);
                
                // Set business type
                setTimeout(() => {
                    const invoices = JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
                    const lastType = invoices.length > 0 ? invoices[invoices.length - 1].businessType : 'concrete';
                    
                    const radio = document.getElementById(`business-${lastType}`);
                    if (radio) {
                        radio.checked = true;
                        radio.click();
                    }
                }, 100);
            }
            
            return false;
        };
    }
    
    // Fix invoice button too
    forceFixInvoiceButton();
    setTimeout(forceFixInvoiceButton, 100);
    setTimeout(forceFixInvoiceButton, 500);
    setTimeout(forceFixInvoiceButton, 1000);
    
    console.log('[FORCE-FIX:READY] Force fix applied to both buttons');
    
})();

// === FORCE ESTIMATE CREATION FIX (END)