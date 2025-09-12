/**
 * === SAFE-HOTFIX: INVOICE PREVIEW FIX (BEGIN)
 * Fix concrete invoice not showing preview after creation
 */

(function() {
    'use strict';
    
    console.log('[PREVIEW-FIX:INIT] Loading invoice preview fix...');
    
    // Function to fix the invoice submission flow
    function fixInvoicePreviewFlow() {
        if (!window.App || !window.App.handleInvoiceSubmission) {
            setTimeout(fixInvoicePreviewFlow, 100);
            return;
        }
        
        // Store original function
        const originalHandleSubmission = window.App.handleInvoiceSubmission;
        
        // Override with fix
        window.App.handleInvoiceSubmission = function() {
            // STEP 0: Global submission guard
            if (this.SUBMITTING) {
                console.log('[SUBMIT_SKIP] Already processing');
                return;
            }
            this.SUBMITTING = true;
            
            const submitBtn = document.querySelector('#invoice-form button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            
            let step = 'STEP_INIT';
            try {
                console.log('📝 [STEP_INIT] Processing invoice submission...');
                
                // Get form
                const form = document.getElementById('invoice-form');
                if (!form) {
                    throw new Error('Invoice form not found');
                }
                
                // Validate form
                if (!form.checkValidity()) {
                    form.reportValidity();
                    if (submitBtn) submitBtn.disabled = false;
                    this.SUBMITTING = false;
                    return;
                }
                
                const formData = new FormData(form);
                
                // STEP 1: Build invoice from STATE
                step = 'STEP_BUILD';
                const inv = window.InvoiceManager?.currentInvoice || {};
                
                // Capture customer from form
                this.captureCustomerFromForm(inv);
                
                // Get business type
                let businessType = formData.get('businessType');
                if (!businessType) {
                    const concreteRadio = document.getElementById('business-concrete');
                    const masonryRadio = document.getElementById('business-masonry');
                    if (concreteRadio?.checked) businessType = 'concrete';
                    else if (masonryRadio?.checked) businessType = 'masonry';
                }
                
                // Ensure required fields
                if (!inv.id) inv.id = 'INV_' + Date.now();
                inv.businessType = businessType || inv.businessType || 'concrete';
                if (!inv.services) inv.services = [];
                inv.customerName = inv.customer?.name || formData.get('customerName') || inv.customerName || 'Customer';
                
                console.log(`[${step}] Invoice: ${inv.id}, Type: ${inv.businessType}, Services: ${inv.services.length}`);
                console.log('[PREVIEW-FIX:BUSINESS_TYPE]', { businessType: inv.businessType });
                
                // STEP 2: Validate
                step = 'STEP_VALIDATE';
                const servicesInDOM = document.querySelectorAll('#services-list .service-item, #services-list .service-row').length;
                console.log(`[${step}] Services - Array: ${inv.services.length}, DOM: ${servicesInDOM}`);
                
                if (!inv.customerName || inv.customerName.trim().length < 2) {
                    throw new Error('Please enter a valid customer name');
                }
                
                if (!inv.businessType) {
                    throw new Error('Please select a business type');
                }
                
                if (inv.services.length === 0 && servicesInDOM === 0) {
                    throw new Error('Please add at least one service');
                }
                
                // STEP 3: Single-path save
                step = 'STEP_SAVE';
                let ok = false;
                
                // Complete invoice fields
                inv.number = inv.number || (window.App.AppState.nextInvoiceNumber || 1);
                inv.date = inv.date || new Date().toISOString();
                inv.status = inv.status || 'paid';
                inv.subtotal = inv.services.reduce((sum, s) => sum + (s.amount || s.price || s.total || 0), 0);
                inv.total = inv.subtotal;
                
                console.log(`[${step}] Saving invoice #${inv.number}...`);
                console.log('[PREVIEW-FIX:INVOICE_DATA]', { 
                    id: inv.id, 
                    businessType: inv.businessType, 
                    services: inv.services.length,
                    total: inv.total 
                });
                
                try {
                    // Get current invoices from localStorage
                    const stored = localStorage.getItem('jstark_invoices');
                    const invoices = stored ? JSON.parse(stored) : [];
                    
                    // Add/update invoice
                    const idx = invoices.findIndex(i => i.id === inv.id);
                    if (idx >= 0) invoices[idx] = inv;
                    else invoices.push(inv);
                    
                    // Save to localStorage (canonical source)
                    localStorage.setItem('jstark_invoices', JSON.stringify(invoices));
                    
                    // Update memory immediately (no reload needed)
                    window.App.AppState.invoices = invoices;
                    if (window.InvoiceManager) {
                        window.InvoiceManager.invoices = invoices;
                        window.InvoiceManager.currentInvoice = inv;
                    }
                    
                    // Update next invoice number
                    window.App.AppState.nextInvoiceNumber = (window.App.AppState.nextInvoiceNumber || 1) + 1;
                    localStorage.setItem('jstark_next_invoice_number', window.App.AppState.nextInvoiceNumber.toString());
                    
                    console.log(`✅ [${step}] Saved to localStorage and memory`);
                    ok = true;
                } catch (e) {
                    console.error(`[${step}] Save failed:`, e.message);
                    ok = false;
                }
                
                // STEP 4: Show result
                step = 'STEP_RESULT';
                if (ok) {
                    // === PREVIEW-FIX: Main change - show preview for BOTH concrete and masonry invoices
                    if (inv.businessType === 'concrete' || inv.businessType === 'masonry') {
                        console.log('[PREVIEW-FIX:SHOWING_PREVIEW] Showing preview for', inv.businessType, 'invoice');
                        
                        // Show success toast
                        if (window.NotificationSystem) {
                            window.NotificationSystem.showSuccess('Invoice created successfully!');
                        }
                        
                        // Navigate to preview
                        setTimeout(() => {
                            try {
                                console.log('[PREVIEW-FIX:CALLING_PREVIEW]', { invoice: inv });
                                this.showInvoicePreview(inv);
                            } catch (e) {
                                console.error('[PREVIEW-FIX:PREVIEW_ERROR]', e);
                                // Fallback to dashboard if preview fails
                                this.showDashboardWithoutReload();
                            }
                        }, 500);
                    } else {
                        // For any other business type, use original behavior
                        if (window.NotificationSystem) {
                            window.NotificationSystem.showSuccess('Invoice created successfully!');
                        }
                        
                        setTimeout(() => {
                            try {
                                this.showDashboardWithoutReload();
                            } catch (e) {
                                console.warn('Navigation failed:', e.message);
                            }
                        }, 500);
                    }
                    
                    console.log(`✅ [${step}] Invoice submission complete`);
                } else {
                    throw new Error('Failed to save invoice');
                }
                
            } catch (error) {
                console.error(`❌ [SUBMIT_FAIL:${step}]`, error.message);
                
                // Only show error if we didn't succeed
                const msg = error.message || 'An error occurred. Please try again.';
                if (window.NotificationSystem) {
                    window.NotificationSystem.showError(msg);
                } else if (window.ErrorHandler) {
                    window.ErrorHandler.showUserError(msg);
                } else {
                    alert(msg);
                }
            } finally {
                // Reset submission state
                this.SUBMITTING = false;
                const submitBtn = document.querySelector('#invoice-form button[type="submit"]');
                if (submitBtn) submitBtn.disabled = false;
            }
        };
        
        // Mark as fixed
        window.App.handleInvoiceSubmission._previewFixed = true;
        console.log('[PREVIEW-FIX:PATCHED] handleInvoiceSubmission patched to show preview for concrete and masonry invoices');
    }
    
    // Also ensure showDashboardWithoutReload exists
    function ensureDashboardMethod() {
        if (window.App && !window.App.showDashboardWithoutReload) {
            window.App.showDashboardWithoutReload = function() {
                console.log('[PREVIEW-FIX:DASHBOARD] Showing dashboard without reload');
                this.showDashboard();
            };
        }
    }
    
    // Initialize fixes
    function initFixes() {
        fixInvoicePreviewFlow();
        ensureDashboardMethod();
        console.log('[PREVIEW-FIX:READY] Invoice preview fix initialized');
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

// === SAFE-HOTFIX: INVOICE PREVIEW FIX (END)