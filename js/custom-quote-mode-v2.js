/**
 * Custom Quote Mode for Masonry Business Type - Version 2
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
            .service-item .description,
            #services-list .description,
            #estimate-services-list .description {
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
            <label for="${toggleId}-custom">Custom</label>
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
        console.log(`[CUSTOM-QUOTE] Setting ${kind} mode to: ${mode}`);
        
        // Find the appropriate section
        let section;
        if (kind === 'invoice') {
            section = document.getElementById('masonry-services');
        } else {
            // For estimates, look for the dynamically created masonry section
            section = document.querySelector('#estimate-services-content .estimate-masonry-section') || 
                     document.querySelector('#estimate-services-content [data-masonry-section="true"]');
        }
        
        if (section) {
            section.setAttribute('data-quote-mode', mode);
            console.log(`[CUSTOM-QUOTE] Section found and mode set for ${kind}`);
        } else {
            console.log(`[CUSTOM-QUOTE] Section not found for ${kind}`);
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
        console.log('[CUSTOM-QUOTE] Invoice toggle setup complete');
    }
    
    // Setup estimate toggle
    function setupEstimateToggle() {
        // Watch for estimate content to be loaded
        const observer = new MutationObserver((mutations) => {
            // Look for the masonry section in estimates
            const estimateContent = document.getElementById('estimate-services-content');
            if (!estimateContent) return;
            
            // Find masonry section - it's dynamically created with class 'estimate-masonry-section'
            let masonrySection = estimateContent.querySelector('.estimate-masonry-section');
            
            // If not found by class, try to find it by structure
            if (!masonrySection) {
                const h4s = estimateContent.querySelectorAll('h4');
                h4s.forEach(h4 => {
                    if (h4.textContent.includes('Masonry Services')) {
                        masonrySection = h4.closest('div');
                        if (masonrySection) {
                            masonrySection.setAttribute('data-masonry-section', 'true');
                        }
                    }
                });
            }
            
            if (masonrySection && !masonrySection.querySelector('.quote-mode-toggle')) {
                console.log('[CUSTOM-QUOTE] Found masonry section in estimate, adding toggle');
                
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
                if (rateGroup?.closest('.form-row')) {
                    rateGroup.closest('.form-row').classList.add('itemized-only');
                }
                
                // Add custom total input for custom mode
                if (!document.getElementById('estimate-masonry-custom-total')) {
                    const rateRow = rateGroup?.closest('.form-row');
                    if (rateRow) {
                        const customTotalDiv = document.createElement('div');
                        customTotalDiv.className = 'form-row custom-only';
                        customTotalDiv.innerHTML = `
                            <div class="form-group">
                                <label for="estimate-masonry-custom-total">Custom Total:</label>
                                <div class="input-with-currency">
                                    <span class="currency-symbol">$</span>
                                    <input type="number" id="estimate-masonry-custom-total" min="0" step="0.01" placeholder="0.00">
                                </div>
                            </div>
                        `;
                        rateRow.parentNode.insertBefore(customTotalDiv, rateRow.nextSibling);
                    }
                }
                
                // Set initial mode
                masonrySection.setAttribute('data-quote-mode', 'itemized');
                console.log('[CUSTOM-QUOTE] Estimate toggle setup complete');
            }
        });
        
        observer.observe(document.getElementById('estimate-services-content') || document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Custom handler for invoice masonry service
    function handleInvoiceMasonryAdd() {
        const section = document.getElementById('masonry-services');
        const isCustomMode = section && section.getAttribute('data-quote-mode') === 'custom';
        
        console.log('[CUSTOM-QUOTE] Invoice Add - Mode:', isCustomMode ? 'custom' : 'itemized');
        
        if (isCustomMode) {
            const manager = window.InvoiceManager || window.invoiceManager;
            if (!manager) {
                console.error('[CUSTOM-QUOTE] InvoiceManager not found');
                return;
            }
            
            const description = document.getElementById('masonry-description')?.value?.trim();
            const priceInput = document.getElementById('masonry-job-price');
            const priceValue = priceInput?.value || '0';
            const price = parseFloat(String(priceValue).replace(/[^\d.-]/g, '')) || 0;
            
            console.log('[CUSTOM-QUOTE] Invoice Custom Mode - Values:', {
                description: description,
                priceRaw: priceValue,
                priceParsed: price
            });
            
            if (!description || !price) {
                alert('Please enter both a description and price for the custom quote.');
                return false;
            }
            
            // Create custom quote service with proper structure
            const customService = {
                id: 'custom-quote-' + Date.now(),
                type: 'masonry',
                description: description,
                quantity: 1,
                unit: 'project',
                rate: price,
                amount: price,
                // Include masonry-specific details structure
                details: {
                    jobPricing: true,
                    price: price,
                    description: description
                }
            };
            
            console.log('[CUSTOM-QUOTE] Invoice service object:', customService);
            
            // Get or initialize current invoice
            if (!manager.currentInvoice) {
                manager.currentInvoice = { services: [] };
            }
            
            // Clear any existing custom quote services
            manager.currentInvoice.services = manager.currentInvoice.services.filter(s => 
                !(s.type === 'masonry' && s.id && s.id.startsWith('custom-quote'))
            );
            
            // Add the custom quote
            manager.currentInvoice.services.push(customService);
            
            // Add to the services list display
            manager.addServiceToList(customService);
            manager.checkEmptyServices();
            manager.updateInvoiceTotals();
            
            // Clear form
            document.getElementById('masonry-description').value = '';
            document.getElementById('masonry-job-price').value = '';
            
            console.log('[CUSTOM-QUOTE] Invoice custom service added successfully');
            return true; // Indicate we handled it
        }
        
        return false; // Let original handler take over
    }
    
    // Custom handler for estimate masonry service
    function handleEstimateMasonryAdd() {
        // Find the masonry section in estimate
        const section = document.querySelector('#estimate-services-content .estimate-masonry-section') ||
                       document.querySelector('#estimate-services-content [data-masonry-section="true"]');
        const isCustomMode = section && section.getAttribute('data-quote-mode') === 'custom';
        
        console.log('[CUSTOM-QUOTE] Estimate Add - Mode:', isCustomMode ? 'custom' : 'itemized');
        
        if (isCustomMode) {
            const manager = window.InvoiceManager || window.invoiceManager;
            if (!manager) {
                console.error('[CUSTOM-QUOTE] InvoiceManager not found');
                return;
            }
            
            const description = document.getElementById('estimate-masonry-description')?.value?.trim();
            const totalInput = document.getElementById('estimate-masonry-custom-total');
            const totalValue = totalInput?.value || '0';
            const customTotal = parseFloat(String(totalValue).replace(/[^\d.-]/g, '')) || 0;
            
            console.log('[CUSTOM-QUOTE] Estimate Custom Mode - Values:', {
                description: description,
                totalRaw: totalValue,
                totalParsed: customTotal
            });
            
            if (!description || !customTotal) {
                alert('Please enter both a description and total amount for the custom quote.');
                return false;
            }
            
            // Create custom quote service
            const customService = {
                id: 'custom-quote-' + Date.now(),
                type: 'masonry',
                description: description,
                quantity: 1,
                unit: 'project',
                rate: customTotal,
                amount: customTotal,
                details: {
                    jobPricing: true,
                    price: customTotal,
                    description: description
                }
            };
            
            console.log('[CUSTOM-QUOTE] Estimate service object:', customService);
            
            // Initialize estimate if needed
            if (!manager.currentEstimate) {
                manager.currentEstimate = { services: [], totals: {} };
            }
            
            // Clear any existing custom quote services
            manager.currentEstimate.services = manager.currentEstimate.services.filter(s => 
                !(s.type === 'masonry' && s.id && s.id.startsWith('custom-quote'))
            );
            
            // Add the custom quote
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
                        <div class="service-meta">Custom Quote: $${customService.amount.toFixed(2)}</div>
                    </div>
                    <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                `;
                estimateServicesList.appendChild(serviceItem);
            }
            
            // Update totals
            manager.updateEstimateTotals();
            
            // Clear form
            document.getElementById('estimate-masonry-description').value = '';
            document.getElementById('estimate-masonry-custom-total').value = '';
            
            console.log('[CUSTOM-QUOTE] Estimate custom service added successfully');
            return true; // Indicate we handled it
        }
        
        return false; // Let original handler take over
    }
    
    // Override button click handlers
    function overrideButtonHandlers() {
        // Override Invoice "Add Service to Invoice" button
        const invoiceBtn = document.getElementById('add-masonry-service');
        if (invoiceBtn) {
            // Clone the button to remove existing event listeners
            const newBtn = invoiceBtn.cloneNode(true);
            invoiceBtn.parentNode.replaceChild(newBtn, invoiceBtn);
            
            // Add our handler that checks mode first
            newBtn.addEventListener('click', function(e) {
                console.log('[CUSTOM-QUOTE] Invoice button clicked');
                if (!handleInvoiceMasonryAdd()) {
                    // If we didn't handle it (itemized mode), call original
                    const manager = window.InvoiceManager || window.invoiceManager;
                    if (manager && manager.addMasonryServiceFromForm) {
                        manager.addMasonryServiceFromForm();
                    }
                }
            });
            console.log('[CUSTOM-QUOTE] Invoice button handler overridden');
        }
    }
    
    // Override estimate button when it appears
    function overrideEstimateButton() {
        const observer = new MutationObserver(() => {
            const estimateBtn = document.getElementById('estimate-add-masonry-service');
            if (estimateBtn && !estimateBtn.dataset.customOverridden) {
                // Clone to remove existing listeners
                const newBtn = estimateBtn.cloneNode(true);
                estimateBtn.parentNode.replaceChild(newBtn, estimateBtn);
                
                // Add our handler
                newBtn.addEventListener('click', function(e) {
                    console.log('[CUSTOM-QUOTE] Estimate button clicked');
                    if (!handleEstimateMasonryAdd()) {
                        // If we didn't handle it (itemized mode), call original
                        const manager = window.InvoiceManager || window.invoiceManager;
                        if (manager && manager.addMasonryServiceToEstimate) {
                            manager.addMasonryServiceToEstimate();
                        }
                    }
                });
                
                newBtn.dataset.customOverridden = 'true';
                console.log('[CUSTOM-QUOTE] Estimate button handler overridden');
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Initialize the module
    function init() {
        console.log('[CUSTOM-QUOTE] Initializing Custom Quote Mode v2');
        
        // Inject styles
        injectStyles();
        
        // Setup invoice toggle immediately if section exists
        setupInvoiceToggle();
        
        // Setup estimate toggle (with observer for dynamic content)
        setupEstimateToggle();
        
        // Override button handlers
        setTimeout(() => {
            overrideButtonHandlers();
            overrideEstimateButton();
        }, 500);
        
        // Watch for navigation changes to re-setup
        const navObserver = new MutationObserver(() => {
            setupInvoiceToggle();
            setTimeout(overrideButtonHandlers, 100);
        });
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            navObserver.observe(mainContent, {
                childList: true,
                subtree: false
            });
        }
        
        console.log('[CUSTOM-QUOTE] Initialization complete');
    }
    
    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();