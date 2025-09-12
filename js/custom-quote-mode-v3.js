/**
 * Custom Quote Mode for Masonry Business Type - Version 3
 * 
 * Unified implementation for Invoice and Estimate with:
 * - Itemized mode: Current behavior with individual line items (default)
 * - Custom mode: Description textarea + single Price input
 * 
 * To remove: Delete this file and remove the script tag from index.html
 */

(function() {
    'use strict';
    
    // State management
    const state = {
        invoice: { mode: 'itemized', stashedServices: [] },
        estimate: { mode: 'itemized', stashedServices: [] }
    };
    
    // Inject CSS for toggle and visibility
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
            
            /* Visibility controls */
            [data-quote-mode="custom"] .itemized-only {
                display: none !important;
            }
            
            [data-quote-mode="itemized"] .custom-only {
                display: none !important;
            }
            
            /* Custom total for estimates */
            .custom-price-group {
                margin: 15px 0;
            }
            
            .custom-price-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
            }
            
            .custom-price-group .input-with-currency {
                display: flex;
                align-items: center;
                position: relative;
            }
            
            .custom-price-group .currency-symbol {
                position: absolute;
                left: 10px;
                pointer-events: none;
            }
            
            .custom-price-group input {
                width: 100%;
                padding: 8px 8px 8px 25px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            /* Preserve line breaks everywhere */
            .services-list .service-description,
            .service-item .description,
            #invoice-preview-content .description,
            #estimate-preview-content .description,
            #services-list .description,
            #estimate-services-list .description,
            .invoice-services .description,
            .estimate-services .description,
            td.description,
            .service-details .description {
                white-space: pre-line !important;
            }
            
            /* Make description textarea bigger in custom mode */
            [data-quote-mode="custom"] #masonry-description,
            [data-quote-mode="custom"] #estimate-masonry-description {
                min-height: 120px;
                resize: vertical;
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
        
        let section;
        if (kind === 'invoice') {
            section = document.getElementById('masonry-services');
        } else {
            section = document.querySelector('#estimate-services-content .estimate-masonry-section') || 
                     document.querySelector('#estimate-services-content [data-masonry-section="true"]');
        }
        
        if (section) {
            section.setAttribute('data-quote-mode', mode);
            
            // Handle stashing/restoring services
            const manager = window.InvoiceManager || window.invoiceManager;
            if (!manager) return;
            
            const docObj = kind === 'invoice' ? manager.currentInvoice : manager.currentEstimate;
            if (!docObj) return;
            
            if (mode === 'custom') {
                // Stash itemized services
                if (docObj.services && docObj.services.length > 0) {
                    const masonryServices = docObj.services.filter(s => s.type === 'masonry');
                    if (masonryServices.length > 0 && !masonryServices.some(s => s.id === 'custom-quote')) {
                        state[kind].stashedServices = [...masonryServices];
                        docObj._stashedServices = [...masonryServices];
                    }
                }
            } else if (mode === 'itemized') {
                // Restore stashed services
                const stashed = docObj._stashedServices || state[kind].stashedServices;
                if (stashed && stashed.length > 0) {
                    // Remove custom quote
                    docObj.services = docObj.services.filter(s => s.id !== 'custom-quote');
                    // Add back stashed services
                    stashed.forEach(service => {
                        if (!docObj.services.find(s => s.id === service.id)) {
                            docObj.services.push(service);
                        }
                    });
                    // Update display
                    refreshServicesList(kind, manager);
                    if (kind === 'invoice') {
                        manager.updateInvoiceTotals();
                    } else {
                        manager.updateEstimateTotals();
                    }
                    // Clear stash
                    state[kind].stashedServices = [];
                    delete docObj._stashedServices;
                }
            }
        }
    }
    
    // Refresh services list display
    function refreshServicesList(kind, manager) {
        const listId = kind === 'invoice' ? 'services-list' : 'estimate-services-list';
        const list = document.getElementById(listId);
        if (!list) return;
        
        const docObj = kind === 'invoice' ? manager.currentInvoice : manager.currentEstimate;
        if (!docObj || !docObj.services) return;
        
        // Clear list
        list.innerHTML = '';
        
        // Re-add all services
        if (docObj.services.length === 0) {
            list.innerHTML = '<p class="empty-services">No services added yet.</p>';
        } else {
            docObj.services.forEach(service => {
                if (kind === 'invoice') {
                    manager.addServiceToList(service);
                } else {
                    // For estimates, manually add to display
                    const serviceItem = document.createElement('div');
                    serviceItem.className = 'service-item';
                    const metaText = service.id === 'custom-quote' 
                        ? `Custom Quote: $${service.amount.toFixed(2)}`
                        : `Qty: ${service.quantity} ${service.unit} @ $${service.rate}/unit = $${service.amount.toFixed(2)}`;
                    
                    serviceItem.innerHTML = `
                        <div class="service-details">
                            <div class="description">${service.description}</div>
                            <div class="service-meta">${metaText}</div>
                        </div>
                        <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    `;
                    list.appendChild(serviceItem);
                }
            });
        }
        
        if (manager.checkEmptyServices) {
            manager.checkEmptyServices();
        }
    }
    
    // Shared helper for adding/replacing custom quote
    function addOrReplaceCustomQuote(kind, desc, rawPrice) {
        const amount = parseFloat(String(rawPrice).replace(/[^\d.-]/g, '')) || 0;
        
        if (amount <= 0) {
            // Show validation error
            const priceInputId = kind === 'invoice' ? 'masonry-job-price' : 'estimate-custom-price';
            const input = document.getElementById(priceInputId);
            if (input) {
                input.focus();
                input.style.borderColor = 'red';
                setTimeout(() => { input.style.borderColor = ''; }, 3000);
            }
            alert('Please enter a price greater than zero');
            return false;
        }
        
        if (!desc || desc.trim() === '') {
            alert('Please enter a description');
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
        
        // Stash existing services if first time entering custom
        if (!doc._stashedServices && doc.services) {
            const existing = doc.services.filter(s => s.type === 'masonry' && s.id !== 'custom-quote');
            if (existing.length > 0) {
                doc._stashedServices = [...existing];
            }
        }
        
        // Remove any existing custom quote and masonry services
        doc.services = (doc.services || []).filter(s => s.type !== 'masonry');
        
        // Add the custom quote
        doc.services.push(service);
        
        // Update display
        if (kind === 'invoice') {
            manager.addServiceToList(service);
            manager.checkEmptyServices();
            manager.updateInvoiceTotals();
        } else {
            // For estimate, update display manually
            const list = document.getElementById('estimate-services-list');
            if (list) {
                // Remove empty message
                const emptyMsg = list.querySelector('.empty-services');
                if (emptyMsg) emptyMsg.remove();
                
                // Remove any existing custom quote display
                Array.from(list.children).forEach(child => {
                    if (child.textContent.includes('Custom Quote')) {
                        child.remove();
                    }
                });
                
                // Add new display
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.innerHTML = `
                    <div class="service-details">
                        <div class="description">${service.description}</div>
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
    
    // Setup invoice toggle and UI
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
        
        // The job price field is used for custom mode, so don't hide it
        
        // Set initial mode
        section.setAttribute('data-quote-mode', 'itemized');
    }
    
    // Setup estimate toggle and UI
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
                const header = masonrySection.querySelector('h4');
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
                
                // Add custom price input (matches invoice's job price)
                if (!document.getElementById('estimate-custom-price')) {
                    const descGroup = document.getElementById('estimate-masonry-description')?.closest('.form-group');
                    if (descGroup) {
                        const priceGroup = document.createElement('div');
                        priceGroup.className = 'form-group custom-price-group custom-only';
                        priceGroup.innerHTML = `
                            <label for="estimate-custom-price">Price:</label>
                            <div class="input-with-currency">
                                <span class="currency-symbol">$</span>
                                <input type="number" id="estimate-custom-price" min="0.01" step="0.01" placeholder="0.00">
                            </div>
                        `;
                        descGroup.parentNode.appendChild(priceGroup);
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
    
    // Override invoice button handler
    function overrideInvoiceButton() {
        const btn = document.getElementById('add-masonry-service');
        if (!btn || btn.dataset.customOverridden) return;
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            const section = document.getElementById('masonry-services');
            const isCustom = section?.getAttribute('data-quote-mode') === 'custom';
            
            if (isCustom) {
                const desc = document.getElementById('masonry-description')?.value;
                const price = document.getElementById('masonry-job-price')?.value;
                
                if (addOrReplaceCustomQuote('invoice', desc, price)) {
                    // Clear form
                    document.getElementById('masonry-description').value = '';
                    document.getElementById('masonry-job-price').value = '';
                }
            } else {
                // Call original handler
                const manager = window.InvoiceManager || window.invoiceManager;
                if (manager?.addMasonryServiceFromForm) {
                    manager.addMasonryServiceFromForm();
                }
            }
        });
        
        newBtn.dataset.customOverridden = 'true';
    }
    
    // Override estimate button handler
    function overrideEstimateButton() {
        const observer = new MutationObserver(() => {
            const btn = document.getElementById('estimate-add-masonry-service');
            if (!btn || btn.dataset.customOverridden) return;
            
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const section = document.querySelector('#estimate-services-content [data-masonry-section="true"]') ||
                              document.querySelector('#estimate-services-content .estimate-masonry-section');
                const isCustom = section?.getAttribute('data-quote-mode') === 'custom';
                
                if (isCustom) {
                    const desc = document.getElementById('estimate-masonry-description')?.value;
                    const price = document.getElementById('estimate-custom-price')?.value;
                    
                    if (addOrReplaceCustomQuote('estimate', desc, price)) {
                        // Clear form
                        document.getElementById('estimate-masonry-description').value = '';
                        document.getElementById('estimate-custom-price').value = '';
                    }
                } else {
                    // Call original handler
                    const manager = window.InvoiceManager || window.invoiceManager;
                    if (manager?.addMasonryServiceToEstimate) {
                        manager.addMasonryServiceToEstimate();
                    }
                }
            });
            
            newBtn.dataset.customOverridden = 'true';
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Patch PDF generation for line breaks
    function patchPDFGeneration() {
        // Wait for PDFManager to be available
        if (window.PDFManager && !window.PDFManager._lineBreakPatched) {
            const originalGenerate = window.PDFManager.generatePDF;
            if (originalGenerate) {
                window.PDFManager.generatePDF = function(type) {
                    // Mark for line break handling
                    window._pdfLineBreakMode = true;
                    const result = originalGenerate.call(this, type);
                    window._pdfLineBreakMode = false;
                    return result;
                };
                window.PDFManager._lineBreakPatched = true;
            }
        }
        
        // Also patch any direct jsPDF usage
        if (window.jsPDF && !window.jsPDF._lineBreakPatched) {
            const OriginalJsPDF = window.jsPDF;
            window.jsPDF = function(...args) {
                const doc = new OriginalJsPDF(...args);
                const originalText = doc.text;
                
                doc.text = function(text, x, y, options) {
                    // Handle multi-line text for descriptions
                    if (typeof text === 'string' && text.includes('\n')) {
                        const lines = text.split('\n');
                        const lineHeight = this.getLineHeight() / this.internal.scaleFactor;
                        lines.forEach((line, index) => {
                            originalText.call(this, line, x, y + (index * lineHeight), options);
                        });
                    } else {
                        return originalText.call(this, text, x, y, options);
                    }
                };
                
                return doc;
            };
            window.jsPDF._lineBreakPatched = true;
        }
    }
    
    // Initialize
    function init() {
        injectStyles();
        setupInvoiceToggle();
        setupEstimateToggle();
        
        // Delay button overrides to ensure DOM is ready
        setTimeout(() => {
            overrideInvoiceButton();
            overrideEstimateButton();
            patchPDFGeneration();
        }, 500);
        
        // Re-setup on navigation changes
        const observer = new MutationObserver(() => {
            setupInvoiceToggle();
            setTimeout(() => {
                overrideInvoiceButton();
                patchPDFGeneration();
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
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for debugging
    window.CustomQuoteMode = {
        state: state,
        addOrReplaceCustomQuote: addOrReplaceCustomQuote,
        version: '3.0'
    };
})();

/**
 * SELECTORS USED:
 * 
 * Invoice:
 * - Section: #masonry-services
 * - Description: #masonry-description (textarea, multi-line)
 * - Price: #masonry-job-price (existing job price input)
 * - Add Button: #add-masonry-service
 * - Services List: #services-list
 * 
 * Estimate:
 * - Section: .estimate-masonry-section or [data-masonry-section="true"]
 * - Description: #estimate-masonry-description (textarea, multi-line)
 * - Price: #estimate-custom-price (new input, matches invoice style)
 * - Add Button: #estimate-add-masonry-service  
 * - Services List: #estimate-services-list
 * 
 * Both rate and amount are set to the same parsed numeric value.
 * Line breaks are preserved with white-space: pre-line CSS.
 * PDF line breaks handled by splitting on \n and rendering each line separately.
 */