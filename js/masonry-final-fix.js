/**
 * Masonry Final Fix - Direct patches for validation error and PDF line breaks
 * Targets the specific issues found in the code
 */

(function() {
    'use strict';
    
    console.log('[MASONRY-FINAL] Applying targeted fixes...');
    
    // Fix 1: Patch the incorrect field ID for estimate masonry price
    function fixEstimatePriceField() {
        // Monitor for the estimate masonry section
        const observer = new MutationObserver(() => {
            // Check if estimate masonry price field exists with wrong ID
            const wrongField = document.getElementById('estimate-masonry-price');
            if (wrongField) {
                // Rename it to the correct ID that the code is looking for
                wrongField.id = 'estimate-masonry-rate';
                console.log('[MASONRY-FINAL] Fixed field ID: estimate-masonry-price -> estimate-masonry-rate');
            }
            
            // Also check if rate field exists and custom mode is active
            const rateField = document.getElementById('estimate-masonry-rate');
            const section = document.querySelector('.estimate-masonry-section, [data-masonry-section="true"]');
            const isCustomMode = section?.getAttribute('data-quote-mode') === 'custom';
            
            if (rateField && isCustomMode) {
                // In custom mode, ensure the rate field is used as the price
                const label = rateField.parentElement?.querySelector('label');
                if (label && !label.textContent.includes('Price')) {
                    label.textContent = 'Price:';
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Fix 2: Override the validation function that's causing the error
    function fixEstimateValidation() {
        // Wait for InvoiceManager
        const waitForManager = setInterval(() => {
            const manager = window.InvoiceManager || window.invoiceManager;
            if (!manager) return;
            
            clearInterval(waitForManager);
            
            // Check if there's a masonry estimate handler
            const originalCollectMasonry = manager.collectMasonryEstimateService || manager.collectMasonryService;
            
            // Create a new function that uses the correct field
            manager.collectMasonryEstimateService = function() {
                console.log('[MASONRY-FINAL] Custom collectMasonryEstimateService called');
                
                const section = document.querySelector('.estimate-masonry-section, [data-masonry-section="true"]');
                const isCustomMode = section?.getAttribute('data-quote-mode') === 'custom';
                
                const description = document.getElementById('estimate-masonry-description')?.value?.trim();
                
                if (isCustomMode) {
                    // In custom mode, use rate field as the price
                    const rateField = document.getElementById('estimate-masonry-rate');
                    const priceValue = rateField?.value || '';
                    const price = parseFloat(priceValue.replace(/[$,\s]/g, ''));
                    
                    console.log('[MASONRY-FINAL] Custom mode price:', { raw: priceValue, parsed: price });
                    
                    if (!description) {
                        alert('Please enter a description');
                        return null;
                    }
                    
                    if (!price || price <= 0) {
                        alert('Please enter a price greater than $0.00');
                        return null;
                    }
                    
                    return {
                        id: 'masonry_' + Date.now(),
                        type: 'masonry',
                        description: description,
                        quantity: 1,
                        unit: 'project',
                        rate: price,
                        amount: price,
                        price: price,
                        total: price,
                        details: {
                            jobPricing: true,
                            price: price
                        }
                    };
                } else {
                    // Itemized mode
                    const quantity = parseFloat(document.getElementById('estimate-masonry-quantity')?.value || 0);
                    const unit = document.getElementById('estimate-masonry-unit')?.value;
                    const rate = parseFloat((document.getElementById('estimate-masonry-rate')?.value || '').replace(/[$,\s]/g, ''));
                    
                    if (!description) {
                        alert('Please enter a description');
                        return null;
                    }
                    
                    if (quantity <= 0) {
                        alert('Please enter a quantity greater than zero');
                        return null;
                    }
                    
                    if (rate <= 0) {
                        alert('Please enter a rate greater than zero');
                        return null;
                    }
                    
                    return {
                        id: 'masonry_' + Date.now(),
                        type: 'masonry',
                        description: description,
                        quantity: quantity,
                        unit: unit || 'unit',
                        rate: rate,
                        amount: quantity * rate,
                        price: quantity * rate,
                        total: quantity * rate
                    };
                }
            };
            
            // Also patch the main addEstimateService handler if it exists
            if (manager.addEstimateService) {
                const originalAddEstimate = manager.addEstimateService;
                manager.addEstimateService = function() {
                    console.log('[MASONRY-FINAL] addEstimateService intercepted');
                    
                    // Check if this is for masonry
                    const businessType = document.querySelector('input[name="estimateBusinessType"]:checked')?.value;
                    if (businessType === 'masonry') {
                        const service = manager.collectMasonryEstimateService();
                        if (service) {
                            // Add the service
                            if (!manager.currentEstimate) {
                                manager.currentEstimate = { services: [], totals: {} };
                            }
                            
                            // Remove existing masonry services in custom mode
                            const section = document.querySelector('.estimate-masonry-section, [data-masonry-section="true"]');
                            const isCustomMode = section?.getAttribute('data-quote-mode') === 'custom';
                            if (isCustomMode) {
                                manager.currentEstimate.services = manager.currentEstimate.services.filter(s => s.type !== 'masonry');
                            }
                            
                            manager.currentEstimate.services.push(service);
                            
                            // Update display with line breaks preserved
                            const list = document.getElementById('estimate-services-list');
                            if (list) {
                                const emptyMsg = list.querySelector('.empty-services');
                                if (emptyMsg) emptyMsg.remove();
                                
                                if (isCustomMode) {
                                    // Remove existing masonry items in custom mode
                                    Array.from(list.children).forEach(child => {
                                        if (child.textContent.includes('masonry') || child.textContent.includes('Custom')) {
                                            child.remove();
                                        }
                                    });
                                }
                                
                                const serviceItem = document.createElement('div');
                                serviceItem.className = 'service-item';
                                const descHtml = service.description
                                    .replace(/&/g, '&amp;')
                                    .replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/\n/g, '<br>');
                                    
                                serviceItem.innerHTML = `
                                    <div class="service-details">
                                        <div class="description" style="white-space: pre-line;">${descHtml}</div>
                                        <div class="service-meta">${isCustomMode ? 'Custom Quote' : `Qty: ${service.quantity} ${service.unit}`}: $${service.amount.toFixed(2)}</div>
                                    </div>
                                    <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">
                                        <i class="fas fa-trash"></i> Remove
                                    </button>
                                `;
                                list.appendChild(serviceItem);
                            }
                            
                            manager.updateEstimateTotals();
                            
                            // Clear form
                            document.getElementById('estimate-masonry-description').value = '';
                            document.getElementById('estimate-masonry-rate').value = '';
                            if (!isCustomMode) {
                                document.getElementById('estimate-masonry-quantity').value = '';
                            }
                            
                            return; // Don't call original
                        }
                    }
                    
                    // For non-masonry, call original
                    return originalAddEstimate.call(this);
                };
            }
        }, 100);
    }
    
    // Fix 3: Patch PDF generation to preserve line breaks
    function fixPDFLineBreaks() {
        // Override the table generation in PDFs
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            
            // If creating a TD element, override its innerHTML setter
            if (tagName.toLowerCase() === 'td') {
                const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
                Object.defineProperty(element, 'innerHTML', {
                    set: function(value) {
                        // Check if this looks like a description with line breaks
                        if (typeof value === 'string' && value.includes('\n')) {
                            // Convert line breaks to <br> tags
                            value = value.replace(/\n/g, '<br>');
                        }
                        originalInnerHTML.set.call(this, value);
                    },
                    get: function() {
                        return originalInnerHTML.get.call(this);
                    }
                });
            }
            
            return element;
        };
        
        // Also patch the preview generation
        const waitForPreview = setInterval(() => {
            const manager = window.InvoiceManager || window.invoiceManager;
            if (!manager) return;
            
            clearInterval(waitForPreview);
            
            // Patch estimate preview
            const originalEstimatePreview = manager.generateEstimatePreview;
            if (originalEstimatePreview) {
                manager.generateEstimatePreview = function(estimate) {
                    console.log('[MASONRY-FINAL] Patching estimate preview for line breaks');
                    
                    // Call original
                    const result = originalEstimatePreview.call(this, estimate);
                    
                    // Fix line breaks after generation
                    setTimeout(() => {
                        const previewContent = document.getElementById('estimate-preview-content');
                        if (previewContent) {
                            // Find all td elements and fix line breaks
                            previewContent.querySelectorAll('td').forEach(td => {
                                if (td.textContent && td.textContent.includes('\n')) {
                                    const text = td.textContent;
                                    td.innerHTML = text
                                        .replace(/&/g, '&amp;')
                                        .replace(/</g, '&lt;')
                                        .replace(/>/g, '&gt;')
                                        .replace(/\n/g, '<br>');
                                    td.style.whiteSpace = 'pre-line';
                                }
                            });
                        }
                    }, 100);
                    
                    return result;
                };
            }
            
            // Patch invoice preview
            const originalInvoicePreview = manager.generateInvoicePreview;
            if (originalInvoicePreview) {
                manager.generateInvoicePreview = function(invoice) {
                    console.log('[MASONRY-FINAL] Patching invoice preview for line breaks');
                    
                    // Call original
                    const result = originalInvoicePreview.call(this, invoice);
                    
                    // Fix line breaks after generation
                    setTimeout(() => {
                        const previewContent = document.querySelector('#invoice-preview-modal, #invoice-preview-content, .invoice-preview');
                        if (previewContent) {
                            // Find all td elements and fix line breaks
                            previewContent.querySelectorAll('td').forEach(td => {
                                if (td.textContent && td.textContent.includes('\n')) {
                                    const text = td.textContent;
                                    td.innerHTML = text
                                        .replace(/&/g, '&amp;')
                                        .replace(/</g, '&lt;')
                                        .replace(/>/g, '&gt;')
                                        .replace(/\n/g, '<br>');
                                    td.style.whiteSpace = 'pre-line';
                                }
                            });
                        }
                    }, 100);
                    
                    return result;
                };
            }
        }, 100);
    }
    
    // Fix 4: Direct button handler override for estimate
    function fixEstimateButton() {
        const observer = new MutationObserver(() => {
            const btn = document.getElementById('estimate-add-masonry-service');
            if (!btn || btn.dataset.finalFixed) return;
            
            console.log('[MASONRY-FINAL] Fixing estimate button');
            
            // Clone to remove existing handlers
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('[MASONRY-FINAL] Estimate button clicked');
                
                const manager = window.InvoiceManager || window.invoiceManager;
                const section = document.querySelector('.estimate-masonry-section, [data-masonry-section="true"]');
                const isCustomMode = section?.getAttribute('data-quote-mode') === 'custom';
                
                const description = document.getElementById('estimate-masonry-description')?.value?.trim();
                
                if (isCustomMode) {
                    // Custom mode - use rate field as price
                    const rateField = document.getElementById('estimate-masonry-rate');
                    const priceValue = rateField?.value || '';
                    const price = parseFloat(priceValue.replace(/[$,\s]/g, ''));
                    
                    console.log('[MASONRY-FINAL] Custom mode - price from rate field:', { raw: priceValue, parsed: price });
                    
                    if (!description) {
                        alert('Please enter a description');
                        return;
                    }
                    
                    if (!price || price <= 0) {
                        alert('Please enter a price greater than $0.00');
                        return;
                    }
                    
                    // Create service
                    const service = {
                        id: 'masonry_' + Date.now(),
                        type: 'masonry',
                        description: description,
                        quantity: 1,
                        unit: 'project',
                        rate: price,
                        amount: price,
                        price: price,
                        total: price,
                        details: {
                            jobPricing: true,
                            price: price
                        }
                    };
                    
                    // Add to estimate
                    if (!manager.currentEstimate) {
                        manager.currentEstimate = { services: [], totals: {} };
                    }
                    
                    // Remove existing masonry services in custom mode
                    manager.currentEstimate.services = manager.currentEstimate.services.filter(s => s.type !== 'masonry');
                    manager.currentEstimate.services.push(service);
                    
                    // Update display
                    const list = document.getElementById('estimate-services-list');
                    if (list) {
                        const emptyMsg = list.querySelector('.empty-services');
                        if (emptyMsg) emptyMsg.remove();
                        
                        // Remove existing masonry items
                        Array.from(list.children).forEach(child => {
                            if (child.textContent.includes('masonry') || child.textContent.includes('Custom')) {
                                child.remove();
                            }
                        });
                        
                        const serviceItem = document.createElement('div');
                        serviceItem.className = 'service-item';
                        const descHtml = description
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\n/g, '<br>');
                            
                        serviceItem.innerHTML = `
                            <div class="service-details">
                                <div class="description" style="white-space: pre-line;">${descHtml}</div>
                                <div class="service-meta">Custom Quote: $${price.toFixed(2)}</div>
                            </div>
                            <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        `;
                        list.appendChild(serviceItem);
                    }
                    
                    manager.updateEstimateTotals();
                    
                    // Clear form
                    document.getElementById('estimate-masonry-description').value = '';
                    document.getElementById('estimate-masonry-rate').value = '';
                    
                    console.log('[MASONRY-FINAL] Custom service added successfully');
                    
                } else {
                    // Itemized mode - call original handler
                    if (manager.addMasonryServiceToEstimate) {
                        manager.addMasonryServiceToEstimate();
                    }
                }
            });
            
            newBtn.dataset.finalFixed = 'true';
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Initialize all fixes
    function init() {
        console.log('[MASONRY-FINAL] Initializing all fixes');
        
        fixEstimatePriceField();
        fixEstimateValidation();
        fixPDFLineBreaks();
        fixEstimateButton();
        
        console.log('[MASONRY-FINAL] All fixes initialized');
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for debugging
    window.MasonryFinalFix = {
        version: '1.0',
        init: init
    };
    
})();