/**
 * Masonry Custom Quote - Minimal Non-Invasive Implementation
 * Adds toggle for Custom mode without breaking existing functionality
 */

(function() {
    'use strict';
    
    console.log('[CUSTOM-QUOTE-MINIMAL] Loading...');
    
    // Helper functions
    function parseCurrency(raw) {
        return parseFloat(String(raw || '').replace(/[^\d.-]/g, '')) || 0;
    }
    
    function escapeHTML(s) {
        return String(s || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }
    
    function htmlWithBR(s) {
        return escapeHTML(String(s || '').replace(/\r\n/g, '\n')).replace(/\n/g, '<br>');
    }
    
    // Add toggle to masonry sections when they appear
    const observer = new MutationObserver(() => {
        // Invoice masonry section
        const invoiceSection = document.querySelector('.masonry-section:not([data-custom-init])');
        if (invoiceSection && document.getElementById('masonry-description')) {
            invoiceSection.setAttribute('data-custom-init', 'true');
            addToggleToSection(invoiceSection, 'invoice');
        }
        
        // Estimate masonry section  
        const estimateSection = document.querySelector('.estimate-masonry-section:not([data-custom-init])');
        if (estimateSection && document.getElementById('estimate-masonry-description')) {
            estimateSection.setAttribute('data-custom-init', 'true');
            addToggleToSection(estimateSection, 'estimate');
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    function addToggleToSection(section, context) {
        const toggleName = context === 'invoice' ? 'masonry-mode' : 'estimate-masonry-mode';
        
        // Create toggle HTML
        const toggleDiv = document.createElement('div');
        toggleDiv.className = 'masonry-mode-toggle';
        toggleDiv.innerHTML = `
            <div style="margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
                <label style="font-weight: bold; margin-right: 15px;">Mode:</label>
                <label style="margin-right: 10px;">
                    <input type="radio" name="${toggleName}" value="itemized" checked>
                    Itemized
                </label>
                <label>
                    <input type="radio" name="${toggleName}" value="custom">
                    Custom Quote
                </label>
            </div>
        `;
        
        // Insert after header
        const header = section.querySelector('h3, h4, .section-header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(toggleDiv, header.nextSibling);
        } else {
            section.insertBefore(toggleDiv, section.firstChild);
        }
        
        // Add change handler
        toggleDiv.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    updateFieldsForMode(section, this.value, context);
                }
            });
        });
        
        // Set initial mode
        section.setAttribute('data-quote-mode', 'itemized');
    }
    
    function updateFieldsForMode(section, mode, context) {
        section.setAttribute('data-quote-mode', mode);
        
        if (context === 'invoice') {
            // Invoice fields
            const quantityRow = document.getElementById('masonry-quantity')?.closest('.form-group, div');
            const unitRow = document.getElementById('masonry-unit')?.closest('.form-group, div');
            const rateRow = document.getElementById('masonry-rate')?.closest('.form-group, div');
            const priceField = document.getElementById('masonry-job-price');
            const priceLabel = priceField?.parentElement?.querySelector('label');
            
            if (mode === 'custom') {
                // Hide itemized fields
                if (quantityRow) quantityRow.style.display = 'none';
                if (unitRow) unitRow.style.display = 'none';
                if (rateRow) rateRow.style.display = 'none';
                // Update price label
                if (priceLabel) priceLabel.textContent = 'Total Price:';
            } else {
                // Show itemized fields
                if (quantityRow) quantityRow.style.display = '';
                if (unitRow) unitRow.style.display = '';
                if (rateRow) rateRow.style.display = '';
                // Update price label
                if (priceLabel) priceLabel.textContent = 'Job Price:';
            }
        } else {
            // Estimate fields
            const quantityRow = document.getElementById('estimate-masonry-quantity')?.closest('.form-group, div');
            const unitRow = document.getElementById('estimate-masonry-unit')?.closest('.form-group, div');
            const priceField = document.getElementById('estimate-masonry-rate');
            const priceLabel = priceField?.parentElement?.querySelector('label');
            
            if (mode === 'custom') {
                // Hide itemized fields
                if (quantityRow) quantityRow.style.display = 'none';
                if (unitRow) unitRow.style.display = 'none';
                // Update price label
                if (priceLabel) priceLabel.textContent = 'Total Price:';
            } else {
                // Show itemized fields
                if (quantityRow) quantityRow.style.display = '';
                if (unitRow) unitRow.style.display = '';
                // Update price label
                if (priceLabel) priceLabel.textContent = 'Rate:';
            }
        }
    }
    
    // Patch the add button handlers to check mode
    function patchAddButtons() {
        const manager = window.InvoiceManager || window.invoiceManager;
        if (!manager) return;
        
        // Patch invoice masonry handler
        const originalAddMasonry = manager.addMasonryService;
        if (originalAddMasonry && !manager._customQuotePatched) {
            manager.addMasonryService = function() {
                const section = document.querySelector('.masonry-section');
                const mode = section?.getAttribute('data-quote-mode');
                
                if (mode === 'custom') {
                    // Custom mode - create single service
                    const description = document.getElementById('masonry-description')?.value;
                    const price = parseCurrency(document.getElementById('masonry-job-price')?.value);
                    
                    if (!description || description.trim() === '') {
                        alert('Please enter a description');
                        return;
                    }
                    
                    if (price <= 0) {
                        alert('Please enter a price greater than $0.00');
                        return;
                    }
                    
                    const service = {
                        id: 'custom_' + Date.now(),
                        type: 'masonry',
                        description: description,
                        quantity: 1,
                        unit: 'project',
                        rate: price,
                        amount: price,
                        price: price,
                        details: {
                            jobPricing: true,
                            isCustomQuote: true
                        }
                    };
                    
                    // Add to invoice
                    if (!manager.currentInvoice) {
                        manager.currentInvoice = { services: [], totals: {} };
                    }
                    manager.currentInvoice.services.push(service);
                    
                    // Add to display with line breaks
                    const list = document.getElementById('services-list') || document.getElementById('invoice-services-list');
                    if (list) {
                        const serviceItem = document.createElement('div');
                        serviceItem.className = 'service-item service-item--masonry';
                        serviceItem.setAttribute('data-service-id', service.id);
                        serviceItem.innerHTML = `
                            <div class="service-row-masonry" style="padding: 15px; border-bottom: 1px solid #ddd;">
                                <div style="white-space: pre-line; margin-bottom: 10px;">${htmlWithBR(service.description)}</div>
                                <div style="display: flex; justify-content: space-between;">
                                    <span>Custom Quote</span>
                                    <span>${manager.formatCurrency(price)}</span>
                                </div>
                            </div>
                        `;
                        list.appendChild(serviceItem);
                    }
                    
                    manager.updateInvoiceTotals();
                    
                    // Clear form
                    document.getElementById('masonry-description').value = '';
                    document.getElementById('masonry-job-price').value = '';
                    
                } else {
                    // Itemized mode - use original
                    originalAddMasonry.call(this);
                }
            };
            manager._customQuotePatched = true;
        }
        
        // Patch estimate masonry handler
        const originalAddEstimateMasonry = manager.addMasonryEstimateService || manager.addEstimateService;
        if (originalAddEstimateMasonry && !manager._customQuoteEstimatePatched) {
            const newHandler = function() {
                const section = document.querySelector('.estimate-masonry-section');
                const mode = section?.getAttribute('data-quote-mode');
                
                if (mode === 'custom') {
                    // Custom mode for estimate
                    const description = document.getElementById('estimate-masonry-description')?.value;
                    const price = parseCurrency(document.getElementById('estimate-masonry-rate')?.value);
                    
                    if (!description || description.trim() === '') {
                        alert('Please enter a description');
                        return;
                    }
                    
                    if (price <= 0) {
                        alert('Please enter a price greater than $0.00');
                        return;
                    }
                    
                    const service = {
                        id: 'custom_' + Date.now(),
                        type: 'masonry',
                        description: description,
                        quantity: 1,
                        unit: 'project',
                        rate: price,
                        amount: price,
                        price: price,
                        details: {
                            jobPricing: true,
                            isCustomQuote: true
                        }
                    };
                    
                    // Add to estimate
                    if (!manager.currentEstimate) {
                        manager.currentEstimate = { services: [], totals: {} };
                    }
                    manager.currentEstimate.services.push(service);
                    
                    // Add to display
                    const list = document.getElementById('estimate-services-list');
                    if (list) {
                        const serviceItem = document.createElement('div');
                        serviceItem.className = 'service-item';
                        serviceItem.setAttribute('data-service-id', service.id);
                        serviceItem.innerHTML = `
                            <div class="service-details">
                                <div style="white-space: pre-line;">${htmlWithBR(service.description)}</div>
                                <p>Custom Quote: ${manager.formatCurrency(price)}</p>
                            </div>
                        `;
                        list.appendChild(serviceItem);
                    }
                    
                    manager.updateEstimateTotals();
                    
                    // Clear form
                    document.getElementById('estimate-masonry-description').value = '';
                    document.getElementById('estimate-masonry-rate').value = '';
                    
                } else {
                    // Itemized mode - use original
                    originalAddEstimateMasonry.call(this);
                }
            };
            
            if (manager.addMasonryEstimateService) {
                manager.addMasonryEstimateService = newHandler;
            }
            if (manager.addEstimateService) {
                manager.addEstimateService = newHandler;
            }
            manager._customQuoteEstimatePatched = true;
        }
    }
    
    // Apply patches when manager is ready
    const patchInterval = setInterval(() => {
        const manager = window.InvoiceManager || window.invoiceManager;
        if (manager) {
            patchAddButtons();
            clearInterval(patchInterval);
            console.log('[CUSTOM-QUOTE-MINIMAL] Patches applied');
        }
    }, 500);
    
    // Add CSS for line breaks
    const style = document.createElement('style');
    style.textContent = `
        .service-item div[style*="white-space: pre-line"],
        .service-row-masonry div[style*="white-space: pre-line"] {
            white-space: pre-line !important;
        }
    `;
    document.head.appendChild(style);
    
    // Export for debugging
    window.CustomQuoteMinimal = {
        version: '1.0',
        parseCurrency: parseCurrency,
        htmlWithBR: htmlWithBR
    };
    
})();