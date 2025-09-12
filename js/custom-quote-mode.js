/**
 * Custom Quote Mode for Masonry Business Type
 * 
 * This module adds a toggle between "Itemized" and "Custom" modes for Masonry services.
 * - Itemized mode: Current behavior with individual line items
 * - Custom mode: Single scope/description with one total amount
 * 
 * To remove this feature: Delete this file and remove the script tag from index.html
 */

(function() {
    'use strict';
    
    // State management for quote modes
    const state = {
        invoice: { mode: 'itemized', stashedServices: [] },
        estimate: { mode: 'itemized', stashedServices: [] }
    };
    
    // CSS for the toggle and visibility controls
    function injectStyles() {
        if (document.getElementById('custom-quote-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'custom-quote-styles';
        style.textContent = `
            /* Toggle Styles */
            .quote-mode-toggle {
                display: inline-flex;
                background: #f0f0f0;
                border-radius: 8px;
                padding: 4px;
                margin: 10px 0;
                gap: 4px;
            }
            
            .quote-mode-toggle input[type="radio"] {
                display: none;
            }
            
            .quote-mode-toggle label {
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
                font-weight: 500;
            }
            
            .quote-mode-toggle input:checked + label {
                background: #2196F3;
                color: white;
            }
            
            /* Visibility controls based on mode */
            [data-quote-mode="custom"] .itemized-only {
                display: none !important;
            }
            
            [data-quote-mode="itemized"] .custom-only {
                display: none !important;
            }
            
            /* Custom total input styling */
            .custom-total-input {
                margin: 10px 0;
            }
            
            .custom-total-input label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
            }
            
            .custom-total-input .input-with-currency {
                display: flex;
                align-items: center;
                position: relative;
            }
            
            .custom-total-input .currency-symbol {
                position: absolute;
                left: 10px;
                pointer-events: none;
            }
            
            .custom-total-input input {
                padding-left: 25px;
                width: 100%;
                padding: 8px 8px 8px 25px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            /* Preserve line breaks in descriptions */
            .service-description,
            .invoice-services .description,
            .estimate-services .description,
            #estimate-preview-content .description,
            #invoice-preview-modal .description,
            .service-item .description {
                white-space: pre-line !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Build toggle UI
    function buildToggle(kind) {
        const toggleId = `quote-mode-toggle-${kind}`;
        const div = document.createElement('div');
        div.className = 'quote-mode-toggle';
        div.innerHTML = `
            <input type="radio" name="${toggleId}" value="itemized" id="${toggleId}-itemized" checked>
            <label for="${toggleId}-itemized">Itemized</label>
            <input type="radio" name="${toggleId}" value="custom" id="${toggleId}-custom">
            <label for="${toggleId}-custom">Custom Quote</label>
        `;
        
        // Add event listeners
        div.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    setMode(kind, e.target.value);
                }
            });
        });
        
        return div;
    }
    
    // Set mode and update UI
    function setMode(kind, mode) {
        state[kind].mode = mode;
        
        // Find the appropriate section
        let section;
        if (kind === 'invoice') {
            section = document.getElementById('masonry-services');
        } else {
            section = document.querySelector('#estimate-services-content .masonry-section') || 
                     document.querySelector('[data-business-type="masonry"]');
        }
        
        if (section) {
            section.setAttribute('data-quote-mode', mode);
            
            // Handle service stashing/restoration
            if (mode === 'custom') {
                // Stash current itemized services
                const manager = window.InvoiceManager || window.invoiceManager;
                if (manager) {
                    if (kind === 'invoice') {
                        const currentInvoice = manager.getCurrentInvoice();
                        if (currentInvoice && currentInvoice.services) {
                            state[kind].stashedServices = currentInvoice.services.filter(s => s.type === 'masonry');
                        }
                    } else {
                        const currentEstimate = manager.currentEstimate;
                        if (currentEstimate && currentEstimate.services) {
                            state[kind].stashedServices = currentEstimate.services.filter(s => s.type === 'masonry');
                        }
                    }
                }
            } else {
                // Restore stashed services when switching back to itemized
                const manager = window.InvoiceManager || window.invoiceManager;
                if (manager && state[kind].stashedServices.length > 0) {
                    if (kind === 'invoice') {
                        const currentInvoice = manager.getCurrentInvoice();
                        if (currentInvoice) {
                            // Remove custom quote service if present
                            currentInvoice.services = currentInvoice.services.filter(s => s.id !== 'custom-quote');
                            // Restore stashed services
                            currentInvoice.services.push(...state[kind].stashedServices);
                            // Update display using actual InvoiceManager methods
                            const servicesList = document.getElementById('services-list');
                            if (servicesList) {
                                // Clear and re-add all services to display
                                servicesList.innerHTML = '';
                                currentInvoice.services.forEach(service => {
                                    manager.addServiceToList(service);
                                });
                            }
                            manager.checkEmptyServices();
                            manager.updateInvoiceTotals();
                        }
                    } else {
                        if (manager.currentEstimate) {
                            // Remove custom quote service if present
                            manager.currentEstimate.services = manager.currentEstimate.services.filter(s => s.id !== 'custom-quote');
                            // Restore stashed services
                            manager.currentEstimate.services.push(...state[kind].stashedServices);
                            // Update estimate display
                            const estimateServicesList = document.getElementById('estimate-services-list');
                            if (estimateServicesList) {
                                estimateServicesList.innerHTML = '';
                                manager.currentEstimate.services.forEach(service => {
                                    const serviceItem = document.createElement('div');
                                    serviceItem.className = 'service-item';
                                    serviceItem.innerHTML = `
                                        <div class="service-details">
                                            <div class="description">${service.description}</div>
                                            <div class="service-meta">Qty: ${service.quantity} ${service.unit} @ $${service.rate}/unit = $${service.amount.toFixed(2)}</div>
                                        </div>
                                    `;
                                    estimateServicesList.appendChild(serviceItem);
                                });
                            }
                            manager.updateEstimateTotals();
                        }
                    }
                    state[kind].stashedServices = [];
                }
            }
        }
    }
    
    // Setup invoice toggle
    function setupInvoiceToggle() {
        const section = document.getElementById('masonry-services');
        if (!section || section.querySelector('.quote-mode-toggle')) return;
        
        const header = section.querySelector('h3');
        if (header) {
            const toggle = buildToggle('invoice');
            header.parentNode.insertBefore(toggle, header.nextSibling);
        }
        
        // Mark itemized-only elements
        const quickAdds = section.querySelector('.masonry-quick-adds');
        if (quickAdds) quickAdds.classList.add('itemized-only');
        
        // Set initial mode
        section.setAttribute('data-quote-mode', 'itemized');
    }
    
    // Setup estimate toggle
    function setupEstimateToggle() {
        // Watch for estimate content to be loaded
        const observer = new MutationObserver((mutations) => {
            const masonrySection = document.querySelector('#estimate-services-content .estimate-masonry-section') ||
                                  document.querySelector('#estimate-services-content [data-business-type="masonry"]');
            
            if (masonrySection && !masonrySection.querySelector('.quote-mode-toggle')) {
                const header = masonrySection.querySelector('h4') || masonrySection.querySelector('h3');
                if (header) {
                    const toggle = buildToggle('estimate');
                    header.parentNode.insertBefore(toggle, header.nextSibling);
                }
                
                // Mark itemized-only elements
                const quantityGroup = document.getElementById('estimate-masonry-quantity')?.closest('.form-group');
                const unitGroup = document.getElementById('estimate-masonry-unit')?.closest('.form-group');
                const rateGroup = document.getElementById('estimate-masonry-rate')?.closest('.form-group');
                
                if (quantityGroup) quantityGroup.classList.add('itemized-only');
                if (unitGroup) unitGroup.classList.add('itemized-only');
                if (rateGroup) rateGroup.classList.add('itemized-only');
                
                // Add custom total input for custom mode
                if (!document.getElementById('estimate-masonry-custom-total')) {
                    const rateRow = rateGroup?.closest('.form-row');
                    if (rateRow) {
                        const customTotalDiv = document.createElement('div');
                        customTotalDiv.className = 'custom-total-input custom-only';
                        customTotalDiv.innerHTML = `
                            <label for="estimate-masonry-custom-total">Custom Total:</label>
                            <div class="input-with-currency">
                                <span class="currency-symbol">$</span>
                                <input type="number" id="estimate-masonry-custom-total" min="0" step="0.01" placeholder="0.00">
                            </div>
                        `;
                        rateRow.parentNode.insertBefore(customTotalDiv, rateRow.nextSibling);
                    }
                }
                
                // Set initial mode
                masonrySection.setAttribute('data-quote-mode', 'itemized');
            }
        });
        
        observer.observe(document.getElementById('estimate-services-content') || document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Patch addService for invoice custom mode
    function patchAddService() {
        const manager = window.InvoiceManager || window.invoiceManager;
        if (!manager || manager._customQuotePatchedAdd) return;
        
        const originalAdd = manager.addMasonryServiceFromForm;
        if (!originalAdd) return;
        
        manager.addMasonryServiceFromForm = function() {
            // Check if we're in custom mode
            const section = document.getElementById('masonry-services');
            const isCustomMode = section && section.getAttribute('data-quote-mode') === 'custom';
            
            if (isCustomMode) {
                const description = document.getElementById('masonry-description')?.value?.trim();
                const priceValue = document.getElementById('masonry-job-price')?.value || '0';
                const price = parseFloat(String(priceValue).replace(/[^\d.-]/g, '')) || 0;
                
                console.log('[CUSTOM-QUOTE] Invoice Custom Mode - Price parsing:', {
                    raw: priceValue,
                    parsed: price
                });
                
                if (!description || !price) {
                    alert('Please enter both a description and price for the custom quote.');
                    return;
                }
                
                // Create custom quote service with proper structure
                const customService = {
                    id: 'custom-quote',
                    type: 'masonry',
                    description: description,
                    quantity: 1,
                    unit: 'project',
                    rate: price,
                    amount: price,
                    // Include masonry-specific details structure
                    details: {
                        jobPricing: true,
                        price: price
                    }
                };
                
                console.log('[CUSTOM-QUOTE] Invoice service object:', customService);
                
                // Clear existing masonry services and add custom quote
                const currentInvoice = manager.getCurrentInvoice();
                if (currentInvoice) {
                    // Store current itemized services first
                    const itemizedServices = currentInvoice.services.filter(s => s.type === 'masonry' && s.id !== 'custom-quote');
                    if (itemizedServices.length > 0) {
                        state.invoice.stashedServices = itemizedServices;
                    }
                    
                    // Remove all masonry services
                    currentInvoice.services = currentInvoice.services.filter(s => s.type !== 'masonry');
                    
                    // Add the custom quote using actual InvoiceManager methods
                    currentInvoice.services.push(customService);
                    
                    // Add to Review Services display
                    manager.addServiceToList(customService);
                    manager.checkEmptyServices();
                    manager.updateInvoiceTotals();
                    
                    console.log('[CUSTOM-QUOTE] Invoice service added to Review Services');
                    
                    // Clear form
                    document.getElementById('masonry-description').value = '';
                    document.getElementById('masonry-job-price').value = '';
                    
                    // Show success message
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.textContent = 'Custom quote added successfully!';
                    successMsg.style.cssText = 'background: #4CAF50; color: white; padding: 10px; border-radius: 4px; margin: 10px 0;';
                    section.appendChild(successMsg);
                    setTimeout(() => successMsg.remove(), 3000);
                }
            } else {
                // Use original itemized behavior
                return originalAdd.call(this);
            }
        };
        
        manager._customQuotePatchedAdd = true;
    }
    
    // Patch addMasonryServiceToEstimate for estimate custom mode
    function patchAddMasonryServiceToEstimate() {
        const manager = window.InvoiceManager || window.invoiceManager;
        if (!manager || manager._customQuotePatchedEstimate) return;
        
        const originalAddEstimate = manager.addMasonryServiceToEstimate;
        if (!originalAddEstimate) return;
        
        manager.addMasonryServiceToEstimate = function() {
            // Check if we're in custom mode
            const section = document.querySelector('#estimate-services-content .estimate-masonry-section') ||
                           document.querySelector('#estimate-services-content [data-business-type="masonry"]');
            const isCustomMode = section && section.getAttribute('data-quote-mode') === 'custom';
            
            if (isCustomMode) {
                const description = document.getElementById('estimate-masonry-description')?.value?.trim();
                const totalValue = document.getElementById('estimate-masonry-custom-total')?.value || '0';
                const customTotal = parseFloat(String(totalValue).replace(/[^\d.-]/g, '')) || 0;
                
                console.log('[CUSTOM-QUOTE] Estimate Custom Mode - Total parsing:', {
                    raw: totalValue,
                    parsed: customTotal
                });
                
                if (!description || !customTotal) {
                    alert('Please enter both a description and total amount for the custom quote.');
                    return;
                }
                
                // Create custom quote service with proper structure
                const customService = {
                    id: 'custom-quote',
                    type: 'masonry',
                    description: description,
                    quantity: 1,
                    unit: 'project',
                    rate: customTotal,
                    amount: customTotal,
                    // Include masonry-specific details
                    details: {
                        jobPricing: true,
                        price: customTotal
                    }
                };
                
                console.log('[CUSTOM-QUOTE] Estimate service object:', customService);
                
                // Handle estimate services
                if (!manager.currentEstimate) {
                    manager.currentEstimate = { services: [], totals: {} };
                }
                
                // Store current itemized services
                const itemizedServices = manager.currentEstimate.services.filter(s => s.type === 'masonry' && s.id !== 'custom-quote');
                if (itemizedServices.length > 0) {
                    state.estimate.stashedServices = itemizedServices;
                }
                
                // Remove all masonry services
                manager.currentEstimate.services = manager.currentEstimate.services.filter(s => s.type !== 'masonry');
                
                // Add the custom quote and update display
                manager.currentEstimate.services.push(customService);
                
                // Update estimate services display
                const estimateServicesList = document.getElementById('estimate-services-list');
                if (estimateServicesList) {
                    // Remove empty message if present
                    const emptyMsg = estimateServicesList.querySelector('.empty-services');
                    if (emptyMsg) emptyMsg.remove();
                    
                    // Add service to display
                    const serviceItem = document.createElement('div');
                    serviceItem.className = 'service-item';
                    serviceItem.innerHTML = `
                        <div class="service-details">
                            <div class="description">${customService.description}</div>
                            <div class="service-meta">Qty: ${customService.quantity} ${customService.unit} = $${customService.amount.toFixed(2)}</div>
                        </div>
                        <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">Remove</button>
                    `;
                    estimateServicesList.appendChild(serviceItem);
                }
                
                manager.updateEstimateTotals();
                
                console.log('[CUSTOM-QUOTE] Estimate service added:', manager.currentEstimate.services);
                
                // Clear form
                document.getElementById('estimate-masonry-description').value = '';
                document.getElementById('estimate-masonry-custom-total').value = '';
                
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.textContent = 'Custom quote added to estimate!';
                successMsg.style.cssText = 'background: #4CAF50; color: white; padding: 10px; border-radius: 4px; margin: 10px 0;';
                section.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 3000);
            } else {
                // Use original itemized behavior
                return originalAddEstimate.call(this);
            }
        };
        
        manager._customQuotePatchedEstimate = true;
    }
    
    // Initialize the module
    function init() {
        // Inject styles
        injectStyles();
        
        // Wait for InvoiceManager to be available
        let retryCount = 0;
        const waitForManager = setInterval(() => {
            const manager = window.InvoiceManager || window.invoiceManager;
            
            if (manager) {
                clearInterval(waitForManager);
                
                // Setup invoice toggle
                setupInvoiceToggle();
                
                // Setup estimate toggle (with observer for dynamic content)
                setupEstimateToggle();
                
                // Patch the service addition methods
                patchAddService();
                patchAddMasonryServiceToEstimate();
                
                // Watch for navigation changes to re-setup toggles
                const navObserver = new MutationObserver(() => {
                    setupInvoiceToggle();
                });
                
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    navObserver.observe(mainContent, {
                        childList: true,
                        subtree: true
                    });
                }
            } else if (++retryCount > 50) { // 5 seconds timeout
                clearInterval(waitForManager);
                console.warn('Custom Quote Mode: InvoiceManager not found, module disabled');
            }
        }, 100);
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();