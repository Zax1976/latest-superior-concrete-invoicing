/**
 * === SAFE-HOTFIX: INVOICE CONTEXT DETECTION FIX (BEGIN)
 * Fix context detection getting stuck in estimate mode
 * Fix trash button not working in invoice
 * Ensure Use Selected Price works consistently
 */

(function() {
    'use strict';
    
    console.log('[CONTEXT-FIX:INIT] Loading context detection fix...');
    
    // Override isEstimateContext to be more accurate
    function fixContextDetection() {
        if (!window.SlabManager) {
            setTimeout(fixContextDetection, 100);
            return;
        }
        
        // Store original function
        const originalIsEstimateContext = window.SlabManager.isEstimateContext;
        
        // Create improved context detection
        window.isEstimateContext = function() {
            // MOST RELIABLE: Check which view is active
            const invoiceView = document.getElementById('invoice-creation');
            const estimateView = document.getElementById('estimate-creation');
            
            // If invoice view is active and visible
            if (invoiceView && invoiceView.classList.contains('active') && 
                invoiceView.style.display !== 'none') {
                console.log('[CONTEXT-FIX:INVOICE] Invoice view is active');
                return false;
            }
            
            // If estimate view is active and visible
            if (estimateView && estimateView.classList.contains('active') && 
                estimateView.style.display !== 'none') {
                console.log('[CONTEXT-FIX:ESTIMATE] Estimate view is active');
                return true;
            }
            
            // Secondary check: business type radios
            const estimateRadio = document.querySelector('input[name="estimateBusinessType"][value="concrete"]:checked');
            const invoiceRadio = document.querySelector('input[name="businessType"][value="concrete"]:checked');
            
            if (estimateRadio) {
                console.log('[CONTEXT-FIX:ESTIMATE] Estimate radio checked');
                return true;
            }
            
            if (invoiceRadio) {
                console.log('[CONTEXT-FIX:INVOICE] Invoice radio checked');
                return false;
            }
            
            // Tertiary check: look for unique elements
            if (document.querySelector('.estimate-concrete-section')) {
                return true;
            }
            
            if (document.querySelector('.invoice-concrete-section')) {
                return false;
            }
            
            // Default to invoice if unclear
            console.log('[CONTEXT-FIX:DEFAULT] Defaulting to invoice context');
            return false;
        };
        
        // Patch SlabManager's context detection
        if (window.SlabManager && window.SlabManager.onUseSelectedPriceClick) {
            const originalClick = window.SlabManager.onUseSelectedPriceClick;
            
            window.SlabManager.onUseSelectedPriceClick = function(evt) {
                // Use global context detection
                const isEstimate = window.isEstimateContext();
                console.log('[CONTEXT-FIX:USE_CLICK]', { context: isEstimate ? 'estimate' : 'invoice' });
                
                // Call original with proper context
                return originalClick.call(this, evt);
            };
        }
    }
    
    // Fix trash button in invoice
    function fixInvoiceTrashButton() {
        console.log('[CONTEXT-FIX:TRASH] Setting up invoice trash button fix...');
        
        // Add delegated listener for invoice trash buttons
        document.addEventListener('click', function(e) {
            // Check if it's a remove service button in invoice
            if (e.target.closest('.remove-service') && !window.isEstimateContext()) {
                e.preventDefault();
                const button = e.target.closest('.remove-service');
                const serviceId = button.dataset.serviceId;
                
                console.log('[CONTEXT-FIX:TRASH_CLICK]', { serviceId, context: 'invoice' });
                
                // Find the service row
                const row = button.closest('.service-row');
                if (row) {
                    // Remove from DOM
                    row.remove();
                    
                    // Update invoice manager if available
                    if (window.InvoiceManager && window.InvoiceManager.currentInvoice) {
                        const services = window.InvoiceManager.currentInvoice.services || [];
                        const index = services.findIndex(s => s.id === serviceId);
                        if (index !== -1) {
                            services.splice(index, 1);
                            console.log('[CONTEXT-FIX:TRASH_REMOVED]', { 
                                serviceId, 
                                remaining: services.length 
                            });
                            
                            // Update totals
                            if (window.InvoiceManager.updateInvoiceTotals) {
                                window.InvoiceManager.updateInvoiceTotals();
                            }
                        }
                    }
                    
                    // Check if list is now empty
                    const servicesList = document.getElementById('services-list');
                    if (servicesList && servicesList.children.length === 0) {
                        // Add empty message
                        const emptyRow = document.createElement('tr');
                        emptyRow.className = 'empty-services';
                        emptyRow.innerHTML = `
                            <td colspan="6" class="text-center text-muted">
                                No services added yet. Use the calculator above to add concrete services.
                            </td>
                        `;
                        servicesList.appendChild(emptyRow);
                    }
                }
            }
        }, true);
    }
    
    // Monitor view changes to update context
    function monitorViewChanges() {
        if (window.App && window.App.showView) {
            const originalShowView = window.App.showView;
            
            if (!originalShowView._contextFixed) {
                window.App.showView = function(viewId) {
                    console.log('[CONTEXT-FIX:VIEW_CHANGE]', { viewId });
                    
                    // Call original
                    const result = originalShowView.apply(this, arguments);
                    
                    // Force context update
                    setTimeout(() => {
                        const context = window.isEstimateContext() ? 'estimate' : 'invoice';
                        console.log('[CONTEXT-FIX:VIEW_UPDATED]', { view: viewId, context });
                    }, 100);
                    
                    return result;
                };
                window.App.showView._contextFixed = true;
            }
        }
    }
    
    // Patch the main SlabManager isEstimateContext directly
    function patchSlabManager() {
        if (!window.SlabManager) {
            setTimeout(patchSlabManager, 100);
            return;
        }
        
        // Override the isEstimateContext method in the SlabManager object
        window.SlabManager.isEstimateContext = function() {
            return window.isEstimateContext();
        };
        
        console.log('[CONTEXT-FIX:PATCHED] SlabManager.isEstimateContext patched');
    }
    
    // Initialize all fixes
    function initFixes() {
        fixContextDetection();
        fixInvoiceTrashButton();
        monitorViewChanges();
        patchSlabManager();
        
        console.log('[CONTEXT-FIX:READY] Context detection fix initialized');
    }
    
    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFixes);
    } else {
        initFixes();
    }
    
    // Also run after delays to catch dynamic content
    setTimeout(initFixes, 500);
    setTimeout(initFixes, 1000);
    
})();

// === SAFE-HOTFIX: INVOICE CONTEXT DETECTION FIX (END)