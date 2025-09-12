/**
 * Masonry Fixes - Comprehensive patch for line breaks and validation
 * Fixes:
 * 1. Line breaks not preserved in service descriptions
 * 2. Estimate validation error due to wrong field ID
 */

(function() {
    'use strict';
    
    console.log('[MASONRY-FIX] Initializing comprehensive fixes...');
    
    // Helper to preserve line breaks in HTML
    function preserveLineBreaks(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\r\n/g, '\n')
            .replace(/\n/g, '<br>');
    }
    
    // Fix 1: Override estimate preview generation to preserve line breaks
    function fixEstimatePreview() {
        const originalGeneratePreview = window.InvoiceManager?.generateEstimatePreview;
        if (!originalGeneratePreview || window.InvoiceManager._estimatePreviewFixed) return;
        
        window.InvoiceManager.generateEstimatePreview = function(estimate) {
            console.log('[MASONRY-FIX] Generating estimate preview with line break fix');
            
            if (!estimate) {
                console.error('No estimate provided');
                return;
            }
            
            const previewContent = document.getElementById('estimate-preview-content');
            if (!previewContent) {
                console.error('Preview content element not found');
                return;
            }
            
            // Build services HTML with preserved line breaks
            let servicesHTML = '';
            if (estimate.services && estimate.services.length > 0) {
                estimate.services.forEach(service => {
                    // Preserve line breaks in description
                    const descriptionHtml = preserveLineBreaks(service.description || 'Service');
                    servicesHTML += `
                        <tr>
                            <td style="white-space: pre-line;">${descriptionHtml}</td>
                            <td style="text-align: right;">$${(service.amount || service.total || service.unitPrice || 0).toFixed(2)}</td>
                        </tr>
                    `;
                });
            }
            
            // Generate the full preview HTML
            const previewHTML = `
                <div class="estimate-header" style="margin-bottom: 30px;">
                    <h2>Estimate #${estimate.number || 'EST-001'}</h2>
                    <p>Date: ${estimate.date || new Date().toLocaleDateString()}</p>
                    <p>Status: ${estimate.status || 'DRAFT'}</p>
                </div>
                
                <div class="customer-info" style="margin-bottom: 30px;">
                    <h3>Estimate For:</h3>
                    <p>${estimate.customerName || ''}</p>
                    ${estimate.customerAddress ? `<p>${estimate.customerAddress}</p>` : ''}
                    ${estimate.customerEmail ? `<p>Email: ${estimate.customerEmail}</p>` : ''}
                    ${estimate.customerPhone ? `<p>Phone: ${estimate.customerPhone}</p>` : ''}
                </div>
                
                <table class="services-table" style="width: 100%; margin-bottom: 30px;">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${servicesHTML}
                    </tbody>
                </table>
                
                <div class="totals" style="text-align: right;">
                    <p><strong>Subtotal:</strong> $${(estimate.subtotal || 0).toFixed(2)}</p>
                    <p><strong>Total:</strong> $${(estimate.total || 0).toFixed(2)}</p>
                </div>
            `;
            
            previewContent.innerHTML = previewHTML;
            
            // Call any additional handlers
            if (window.EstimateManager?.onPreviewGenerated) {
                window.EstimateManager.onPreviewGenerated(estimate);
            }
        };
        
        window.InvoiceManager._estimatePreviewFixed = true;
        console.log('[MASONRY-FIX] Estimate preview fixed');
    }
    
    // Fix 2: Patch the masonry estimate handler to use correct field ID
    function fixMasonryEstimateHandler() {
        // Watch for estimate masonry section and fix field references
        const observer = new MutationObserver(() => {
            const estimateAddBtn = document.getElementById('estimate-add-masonry-service');
            if (!estimateAddBtn || estimateAddBtn.dataset.fixedHandler) return;
            
            console.log('[MASONRY-FIX] Fixing masonry estimate handler');
            
            // Remove existing listeners by cloning
            const newBtn = estimateAddBtn.cloneNode(true);
            estimateAddBtn.parentNode.replaceChild(newBtn, estimateAddBtn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('[MASONRY-FIX] Masonry estimate add clicked');
                
                // Check if we're in custom mode
                const section = document.querySelector('.estimate-masonry-section, [data-masonry-section="true"]');
                const isCustomMode = section?.getAttribute('data-quote-mode') === 'custom';
                
                const description = document.getElementById('estimate-masonry-description')?.value;
                
                if (isCustomMode) {
                    console.log('[MASONRY-FIX] Custom mode - using rate as total');
                    
                    // In custom mode, use rate field as the total price
                    const rateField = document.getElementById('estimate-masonry-rate');
                    const price = parseFloat((rateField?.value || '').replace(/[$,\s]/g, ''));
                    
                    console.log('[MASONRY-FIX] Price from rate field:', price);
                    
                    if (!description || description.trim() === '') {
                        alert('Please enter a description');
                        return;
                    }
                    
                    if (!price || price <= 0) {
                        alert('Please enter a price greater than $0.00');
                        return;
                    }
                    
                    // Create service with preserved line breaks
                    const service = {
                        id: 'masonry_' + Date.now(),
                        type: 'masonry',
                        description: description,
                        quantity: 1,
                        unit: 'project',
                        rate: price,
                        amount: price,
                        total: price,
                        details: {
                            jobPricing: true,
                            price: price
                        }
                    };
                    
                    console.log('[MASONRY-FIX] Adding custom service:', service);
                    
                    // Add to estimate
                    const manager = window.InvoiceManager || window.invoiceManager;
                    if (!manager.currentEstimate) {
                        manager.currentEstimate = { services: [], totals: {} };
                    }
                    
                    // Remove existing masonry services in custom mode
                    manager.currentEstimate.services = manager.currentEstimate.services.filter(s => s.type !== 'masonry');
                    manager.currentEstimate.services.push(service);
                    
                    // Update display with line breaks preserved
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
                        serviceItem.innerHTML = `
                            <div class="service-details">
                                <div class="description" style="white-space: pre-line;">${preserveLineBreaks(service.description)}</div>
                                <div class="service-meta">Custom Quote: $${service.amount.toFixed(2)}</div>
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
                    
                } else {
                    console.log('[MASONRY-FIX] Itemized mode');
                    
                    // Itemized mode - validate all fields
                    const quantity = parseFloat(document.getElementById('estimate-masonry-quantity')?.value || 0);
                    const unit = document.getElementById('estimate-masonry-unit')?.value;
                    const rate = parseFloat((document.getElementById('estimate-masonry-rate')?.value || '').replace(/[$,\s]/g, ''));
                    
                    if (!description || description.trim() === '') {
                        alert('Please enter a description');
                        return;
                    }
                    
                    if (quantity <= 0) {
                        alert('Please enter a quantity greater than zero');
                        return;
                    }
                    
                    if (rate <= 0) {
                        alert('Please enter a rate greater than zero');
                        return;
                    }
                    
                    const service = {
                        id: 'masonry_' + Date.now(),
                        type: 'masonry',
                        description: description,
                        quantity: quantity,
                        unit: unit || 'unit',
                        rate: rate,
                        amount: quantity * rate,
                        total: quantity * rate
                    };
                    
                    // Add using InvoiceManager
                    const manager = window.InvoiceManager || window.invoiceManager;
                    if (manager.addMasonryServiceToEstimate) {
                        manager.addMasonryServiceToEstimate();
                    } else {
                        // Fallback - add directly
                        if (!manager.currentEstimate) {
                            manager.currentEstimate = { services: [], totals: {} };
                        }
                        manager.currentEstimate.services.push(service);
                        
                        // Update display
                        const list = document.getElementById('estimate-services-list');
                        if (list) {
                            const emptyMsg = list.querySelector('.empty-services');
                            if (emptyMsg) emptyMsg.remove();
                            
                            const serviceItem = document.createElement('div');
                            serviceItem.className = 'service-item';
                            serviceItem.innerHTML = `
                                <div class="service-details">
                                    <div class="description" style="white-space: pre-line;">${preserveLineBreaks(service.description)}</div>
                                    <div class="service-meta">Qty: ${service.quantity} ${service.unit} @ $${service.rate}/unit = $${service.amount.toFixed(2)}</div>
                                </div>
                                <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">Remove</button>
                            `;
                            list.appendChild(serviceItem);
                        }
                        
                        manager.updateEstimateTotals();
                    }
                }
            });
            
            newBtn.dataset.fixedHandler = 'true';
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Fix 3: Patch invoice service display to preserve line breaks
    function fixInvoiceServiceDisplay() {
        const manager = window.InvoiceManager || window.invoiceManager;
        if (!manager || manager._invoiceDisplayFixed) return;
        
        const originalAddToList = manager.addServiceToList;
        if (!originalAddToList) return;
        
        manager.addServiceToList = function(service) {
            console.log('[MASONRY-FIX] Adding service to invoice list:', service);
            
            // For masonry services, preserve line breaks
            if (service.type === 'masonry') {
                const servicesList = document.getElementById('services-list') || 
                                  document.getElementById('invoice-services-list');
                
                if (servicesList) {
                    const serviceItem = document.createElement('div');
                    serviceItem.className = 'service-item service-item--masonry';
                    serviceItem.dataset.serviceId = service.id;
                    
                    if (service.details && service.details.jobPricing) {
                        serviceItem.innerHTML = `
                            <div class="service-row-masonry" style="padding: 15px; border-bottom: 1px solid #ddd;">
                                <div class="service-description-masonry" style="margin-bottom: 10px;">
                                    <strong>Description:</strong><br>
                                    <div style="white-space: pre-line; margin-top: 5px;">${preserveLineBreaks(service.description)}</div>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div class="service-quantity">
                                        <strong>Quantity:</strong> ${service.quantity || 1} ${service.unit || ''}
                                    </div>
                                    <div class="service-amount-container" style="text-align: right;">
                                        <strong>Amount:</strong> 
                                        <span class="service-amount">${this.formatCurrency(service.amount)}</span>
                                        <button class="remove-service" style="margin-left: 10px;" onclick="JStarkInvoicing.InvoiceManager.removeService('${service.id}')">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        serviceItem.innerHTML = `
                            <div class="service-details">
                                <h4 style="white-space: pre-line;">${preserveLineBreaks(service.description)}</h4>
                                <p>${service.quantity} ${service.unit} × ${this.formatCurrency(service.rate)}</p>
                            </div>
                            <div class="service-actions">
                                <span class="service-amount">${this.formatCurrency(service.amount)}</span>
                                <button class="remove-service" onclick="JStarkInvoicing.InvoiceManager.removeService('${service.id}')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                    }
                    
                    servicesList.appendChild(serviceItem);
                    this.checkEmptyServices();
                    return;
                }
            }
            
            // For non-masonry, use original
            return originalAddToList.call(this, service);
        };
        
        manager._invoiceDisplayFixed = true;
        console.log('[MASONRY-FIX] Invoice display fixed');
    }
    
    // Fix 4: Override invoice preview to preserve line breaks
    function fixInvoicePreview() {
        const originalGeneratePreview = window.InvoiceManager?.generateInvoicePreview;
        if (!originalGeneratePreview || window.InvoiceManager._invoicePreviewFixed) return;
        
        window.InvoiceManager.generateInvoicePreview = function(invoice) {
            console.log('[MASONRY-FIX] Generating invoice preview with line break fix');
            
            // Call original first to get basic structure
            const result = originalGeneratePreview.call(this, invoice);
            
            // Then fix line breaks in the displayed content
            setTimeout(() => {
                const previewContent = document.getElementById('invoice-preview-modal') || 
                                     document.getElementById('invoice-preview-content');
                if (previewContent) {
                    // Find all description cells and preserve line breaks
                    previewContent.querySelectorAll('td').forEach(td => {
                        if (td.textContent && td.textContent.includes('\n')) {
                            td.innerHTML = preserveLineBreaks(td.textContent);
                            td.style.whiteSpace = 'pre-line';
                        }
                    });
                }
            }, 100);
            
            return result;
        };
        
        window.InvoiceManager._invoicePreviewFixed = true;
    }
    
    // Initialize all fixes
    function init() {
        console.log('[MASONRY-FIX] Starting initialization');
        
        // Wait for InvoiceManager
        const waitForManager = setInterval(() => {
            const manager = window.InvoiceManager || window.invoiceManager;
            if (manager) {
                clearInterval(waitForManager);
                console.log('[MASONRY-FIX] InvoiceManager found, applying fixes');
                
                fixEstimatePreview();
                fixMasonryEstimateHandler();
                fixInvoiceServiceDisplay();
                fixInvoicePreview();
                
                console.log('[MASONRY-FIX] All fixes applied');
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(waitForManager);
            console.log('[MASONRY-FIX] Timeout waiting for InvoiceManager');
        }, 10000);
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for debugging
    window.MasonryFixes = {
        preserveLineBreaks: preserveLineBreaks,
        version: '1.0'
    };
    
})();