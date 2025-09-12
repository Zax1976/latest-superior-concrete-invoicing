/**
 * Custom Quote Mode for Masonry - Final Fixed Implementation
 * 
 * Fixes:
 * - Line breaks properly preserved in displays
 * - Description shown for masonry services
 * - Validation error fixed for estimates
 */

(function() {
    'use strict';
    
    // ========== UTILITY FUNCTIONS ==========
    
    function parseCurrency(raw) {
        return parseFloat(String(raw || '').replace(/[^\d.-]/g, '')) || 0;
    }
    
    function escapeHTML(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }
    
    function preserveLineBreaks(text) {
        // Preserve line breaks by converting to <br> after escaping
        return escapeHTML(text).replace(/\n/g, '<br>');
    }
    
    // ========== CSS INJECTION ==========
    
    function injectStyles() {
        if (document.getElementById('custom-quote-final-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'custom-quote-final-styles';
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
            
            /* Visibility controls */
            [data-quote-mode="custom"] .itemized-only {
                display: none !important;
            }
            
            [data-quote-mode="itemized"] .custom-only {
                display: none !important;
            }
            
            /* Preserve line breaks */
            .service-description-masonry,
            .masonry-description {
                white-space: pre-line !important;
                margin: 5px 0;
            }
            
            /* Custom mode textarea */
            [data-quote-mode="custom"] #masonry-description,
            [data-quote-mode="custom"] #estimate-masonry-description {
                min-height: 120px;
                resize: vertical;
            }
        `;
        document.head.appendChild(style);
    }
    
    // ========== PATCH MASONRY SERVICE DISPLAY ==========
    
    function patchMasonryServiceDisplay() {
        const manager = window.InvoiceManager || window.invoiceManager;
        if (!manager || manager._masonryDisplayPatched) return;
        
        const originalAddToList = manager.addServiceToList;
        if (!originalAddToList) return;
        
        manager.addServiceToList = function(service) {
            // For masonry services with custom quote, show description
            if (service.type === 'masonry' && service.id === 'custom-quote') {
                const servicesList = document.getElementById('services-list') || 
                                  document.getElementById('invoice-services-list');
                if (!servicesList) return;
                
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item service-item--masonry';
                serviceItem.dataset.serviceId = service.id;
                
                // Show description with preserved line breaks
                serviceItem.innerHTML = `
                    <div class="service-row-masonry" style="padding: 15px; border-bottom: 1px solid #ddd;">
                        <div class="service-description-masonry" style="margin-bottom: 10px;">
                            <strong>Description:</strong><br>
                            <div class="masonry-description">${preserveLineBreaks(service.description)}</div>
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
                
                servicesList.appendChild(serviceItem);
                this.checkEmptyServices();
            } else {
                // Use original for non-custom masonry services
                return originalAddToList.call(this, service);
            }
        };
        
        manager._masonryDisplayPatched = true;
    }
    
    // ========== SHARED ADD HELPER ==========
    
    function addOrReplaceCustomQuote(kind, desc, rawPrice) {
        const amount = parseCurrency(rawPrice);
        
        if (amount <= 0) {
            alert('Please enter a price greater than zero.');
            return false;
        }
        
        if (!desc || desc.trim() === '') {
            alert('Please enter a description.');
            return false;
        }
        
        const service = {
            id: 'custom-quote',
            type: 'masonry',
            description: desc,
            quantity: 1,
            unit: 'project',
            rate: amount,
            amount: amount,
            details: {
                jobPricing: true,
                price: amount
            }
        };
        
        const manager = window.InvoiceManager || window.invoiceManager;
        if (!manager) return false;
        
        const docObj = kind === 'invoice' ? manager.currentInvoice : manager.currentEstimate;
        
        if (!docObj) {
            if (kind === 'invoice') {
                manager.currentInvoice = { services: [] };
            } else {
                manager.currentEstimate = { services: [], totals: {} };
            }
        }
        
        const doc = kind === 'invoice' ? manager.currentInvoice : manager.currentEstimate;
        
        // Remove existing masonry services
        doc.services = (doc.services || []).filter(s => s.type !== 'masonry');
        doc.services.push(service);
        
        // Update display
        if (kind === 'invoice') {
            // Clear masonry services from display
            const list = document.getElementById('services-list');
            if (list) {
                Array.from(list.children).forEach(child => {
                    const serviceId = child.dataset.serviceId;
                    if (serviceId === 'custom-quote' || child.className.includes('masonry')) {
                        child.remove();
                    }
                });
            }
            manager.addServiceToList(service);
            manager.checkEmptyServices();
            manager.updateInvoiceTotals();
        } else {
            // Update estimate display
            const list = document.getElementById('estimate-services-list');
            if (list) {
                const emptyMsg = list.querySelector('.empty-services');
                if (emptyMsg) emptyMsg.remove();
                
                // Remove existing masonry services
                Array.from(list.children).forEach(child => {
                    if (child.textContent.includes('masonry') || child.textContent.includes('Custom Quote')) {
                        child.remove();
                    }
                });
                
                // Add with preserved line breaks
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.innerHTML = `
                    <div class="service-details">
                        <div class="masonry-description">${preserveLineBreaks(service.description)}</div>
                        <div class="service-meta">Custom Quote: $${service.amount.toFixed(2)}</div>
                    </div>
                    <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                `;
                list.appendChild(serviceItem);
            }
            manager.updateEstimateTotals();
        }
        
        return true;
    }
    
    // ========== MODE TOGGLE ==========
    
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
        
        div.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    setMode(kind, e.target.value);
                }
            });
        });
        
        return div;
    }
    
    function setMode(kind, mode) {
        let section;
        if (kind === 'invoice') {
            section = document.getElementById('masonry-services');
        } else {
            section = document.querySelector('#estimate-services-content .estimate-masonry-section') || 
                     document.querySelector('#estimate-services-content [data-masonry-section="true"]');
        }
        
        if (section) {
            section.setAttribute('data-quote-mode', mode);
        }
    }
    
    // ========== SETUP FUNCTIONS ==========
    
    function setupInvoiceToggle() {
        const section = document.getElementById('masonry-services');
        if (!section || section.querySelector('.quote-mode-toggle')) return;
        
        const header = section.querySelector('h3');
        if (header) {
            const toggle = buildToggle('invoice');
            header.parentNode.insertBefore(toggle, header.nextSibling);
        }
        
        const quickAdds = section.querySelector('.masonry-quick-adds');
        if (quickAdds) quickAdds.classList.add('itemized-only');
        
        section.setAttribute('data-quote-mode', 'itemized');
    }
    
    function setupEstimateToggle() {
        const observer = new MutationObserver(() => {
            const estimateContent = document.getElementById('estimate-services-content');
            if (!estimateContent) return;
            
            let masonrySection = estimateContent.querySelector('.estimate-masonry-section');
            
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
                // Remove duplicate fields
                ['estimate-custom-total', 'estimate-custom-price', 'estimate-masonry-custom-total'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.closest('.form-row, .form-group')?.remove();
                });
                
                const header = masonrySection.querySelector('h4');
                if (header) {
                    const toggle = buildToggle('estimate');
                    header.parentNode.insertBefore(toggle, header.nextSibling);
                }
                
                const quantityGroup = document.getElementById('estimate-masonry-quantity')?.closest('.form-group');
                const unitGroup = document.getElementById('estimate-masonry-unit')?.closest('.form-group');
                
                if (quantityGroup) quantityGroup.classList.add('itemized-only');
                if (unitGroup) unitGroup.classList.add('itemized-only');
                
                masonrySection.setAttribute('data-quote-mode', 'itemized');
            }
        });
        
        observer.observe(document.getElementById('estimate-services-content') || document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // ========== BUTTON HANDLERS ==========
    
    function overrideInvoiceButton() {
        const btn = document.getElementById('add-masonry-service');
        if (!btn || btn.dataset.customFinal) return;
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const section = document.getElementById('masonry-services');
            const isCustom = section?.getAttribute('data-quote-mode') === 'custom';
            
            if (isCustom) {
                const desc = document.getElementById('masonry-description')?.value;
                const price = document.getElementById('masonry-job-price')?.value;
                
                if (addOrReplaceCustomQuote('invoice', desc, price)) {
                    document.getElementById('masonry-description').value = '';
                    document.getElementById('masonry-job-price').value = '';
                }
            } else {
                const manager = window.InvoiceManager || window.invoiceManager;
                if (manager?.addMasonryServiceFromForm) {
                    manager.addMasonryServiceFromForm();
                }
            }
        });
        
        newBtn.dataset.customFinal = 'true';
    }
    
    function overrideEstimateButton() {
        const observer = new MutationObserver(() => {
            const btn = document.getElementById('estimate-add-masonry-service');
            if (!btn || btn.dataset.customFinal) return;
            
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const section = document.querySelector('[data-masonry-section="true"]') ||
                              document.querySelector('.estimate-masonry-section');
                const isCustom = section?.getAttribute('data-quote-mode') === 'custom';
                
                if (isCustom) {
                    const desc = document.getElementById('estimate-masonry-description')?.value;
                    const rate = document.getElementById('estimate-masonry-rate')?.value;
                    
                    // In custom mode, use rate field as price and skip validation
                    if (addOrReplaceCustomQuote('estimate', desc, rate)) {
                        document.getElementById('estimate-masonry-description').value = '';
                        document.getElementById('estimate-masonry-rate').value = '';
                    }
                } else {
                    // In itemized mode, validate properly
                    const manager = window.InvoiceManager || window.invoiceManager;
                    
                    // Override validation temporarily
                    const desc = document.getElementById('estimate-masonry-description')?.value?.trim();
                    const qty = document.getElementById('estimate-masonry-quantity')?.value;
                    const rate = document.getElementById('estimate-masonry-rate')?.value;
                    
                    if (!desc) {
                        alert('Please enter a description');
                        return;
                    }
                    
                    const qtyNum = parseFloat(qty) || 0;
                    const rateNum = parseCurrency(rate);
                    
                    if (qtyNum <= 0) {
                        alert('Please enter a quantity greater than zero');
                        return;
                    }
                    
                    if (rateNum <= 0) {
                        alert('Please enter a rate greater than zero');
                        return;
                    }
                    
                    // All valid, proceed
                    if (manager?.addMasonryServiceToEstimate) {
                        manager.addMasonryServiceToEstimate();
                    }
                }
            });
            
            newBtn.dataset.customFinal = 'true';
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // ========== PDF LINE BREAK FIX ==========
    
    function patchPDFGeneration() {
        // Override the invoice/estimate preview generation to preserve line breaks
        const originalGeneratePreview = window.InvoiceManager?.generateInvoicePreview;
        if (originalGeneratePreview && !window.InvoiceManager._previewPatched) {
            window.InvoiceManager.generateInvoicePreview = function(invoice) {
                const result = originalGeneratePreview.call(this, invoice);
                // After preview is generated, fix line breaks
                setTimeout(() => {
                    document.querySelectorAll('.masonry-description, .service-description-masonry').forEach(el => {
                        if (el.innerHTML && !el.innerHTML.includes('<br>')) {
                            el.innerHTML = preserveLineBreaks(el.textContent);
                        }
                    });
                }, 100);
                return result;
            };
            window.InvoiceManager._previewPatched = true;
        }
    }
    
    // ========== INITIALIZATION ==========
    
    function init() {
        injectStyles();
        patchMasonryServiceDisplay();
        setupInvoiceToggle();
        setupEstimateToggle();
        
        setTimeout(() => {
            overrideInvoiceButton();
            overrideEstimateButton();
            patchPDFGeneration();
        }, 500);
        
        // Re-setup on navigation
        const observer = new MutationObserver(() => {
            setupInvoiceToggle();
            setTimeout(() => {
                overrideInvoiceButton();
                patchMasonryServiceDisplay();
            }, 100);
        });
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            observer.observe(mainContent, {
                childList: true,
                subtree: false
            });
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for debugging
    window.CustomQuoteFinal = {
        addOrReplaceCustomQuote: addOrReplaceCustomQuote,
        parseCurrency: parseCurrency,
        version: 'final'
    };
})();