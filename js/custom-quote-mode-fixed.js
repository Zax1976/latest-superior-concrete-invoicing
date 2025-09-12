/**
 * Custom Quote Mode for Masonry - Fixed Implementation
 * 
 * Unified behavior for Invoice and Estimate:
 * - Custom mode: Description (multi-line) + Price only
 * - Itemized mode: Existing behavior (default)
 * - Line breaks preserved in UI and PDF
 * - Single price field, proper validation
 */

(function() {
    'use strict';
    
    // ========== UTILITY FUNCTIONS ==========
    
    function parseCurrency(raw) {
        return parseFloat(String(raw || '').replace(/[^\d.-]/g, '')) || 0;
    }
    
    function escapeHTML(s) {
        return s.replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }
    
    function renderDescHTML(s) {
        const escaped = escapeHTML(String(s || '').replace(/\r\n/g, '\n'));
        return escaped.replace(/\n/g, '<br>');
    }
    
    // ========== CSS INJECTION ==========
    
    function injectStyles() {
        if (document.getElementById('custom-quote-fixed-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'custom-quote-fixed-styles';
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
            
            /* Preserve line breaks in all description displays */
            .services-list .service-description,
            .services-list td.description,
            .service-item .description,
            #services-list .description,
            #estimate-services-list .description,
            #invoice-preview-content .description,
            #estimate-preview-content .description,
            .invoice-services .description,
            .estimate-services .description,
            .service-details .description {
                white-space: pre-line !important;
            }
            
            /* Make description textarea bigger in custom mode */
            [data-quote-mode="custom"] #masonry-description,
            [data-quote-mode="custom"] #estimate-masonry-description {
                min-height: 120px;
                resize: vertical;
            }
            
            /* Custom mode label for rate field */
            [data-quote-mode="custom"] label[for="estimate-masonry-rate"]:after {
                content: " (Total Price)";
                font-weight: normal;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }
    
    // ========== SHARED ADD HELPER ==========
    
    function showValidationError(kind, message) {
        alert(message);
    }
    
    function addOrReplaceCustomQuote(kind, desc, rawPrice) {
        const amount = parseCurrency(rawPrice);
        
        if (amount <= 0) {
            showValidationError(kind, 'Please enter a price greater than zero.');
            return false;
        }
        
        if (!desc || desc.trim() === '') {
            showValidationError(kind, 'Please enter a description.');
            return false;
        }
        
        const svc = {
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
        
        // Initialize if needed
        if (!docObj) {
            if (kind === 'invoice') {
                manager.currentInvoice = { services: [] };
            } else {
                manager.currentEstimate = { services: [], totals: {} };
            }
        }
        
        const doc = kind === 'invoice' ? manager.currentInvoice : manager.currentEstimate;
        
        // Stash services first time entering custom
        if (!doc._stashedServices && doc.services) {
            const existing = doc.services.filter(s => s.type === 'masonry' && s.id !== 'custom-quote');
            if (existing.length > 0) {
                doc._stashedServices = [...existing];
            }
        }
        
        // Remove existing masonry services and add custom quote
        doc.services = (doc.services || []).filter(s => s.type !== 'masonry');
        doc.services.push(svc);
        
        // Use existing update methods
        if (kind === 'invoice') {
            if (manager.addServiceToList) {
                // Clear existing masonry services from display
                const list = document.getElementById('services-list');
                if (list) {
                    Array.from(list.children).forEach(child => {
                        if (child.textContent.includes('masonry') || child.textContent.includes('Custom Quote')) {
                            child.remove();
                        }
                    });
                }
                manager.addServiceToList(svc);
            }
            if (manager.checkEmptyServices) manager.checkEmptyServices();
            if (manager.updateInvoiceTotals) manager.updateInvoiceTotals();
        } else {
            // Update estimate display
            const list = document.getElementById('estimate-services-list');
            if (list) {
                // Remove empty message
                const emptyMsg = list.querySelector('.empty-services');
                if (emptyMsg) emptyMsg.remove();
                
                // Remove existing masonry services
                Array.from(list.children).forEach(child => {
                    if (child.textContent.includes('masonry') || child.textContent.includes('Custom Quote')) {
                        child.remove();
                    }
                });
                
                // Add custom quote with preserved line breaks
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.innerHTML = `
                    <div class="service-details">
                        <div class="description">${renderDescHTML(svc.description)}</div>
                        <div class="service-meta">Custom Quote: $${svc.amount.toFixed(2)}</div>
                    </div>
                    <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                `;
                list.appendChild(serviceItem);
            }
            if (manager.updateEstimateTotals) manager.updateEstimateTotals();
            if (manager.generateEstimatePreview) manager.generateEstimatePreview(doc);
        }
        
        return true;
    }
    
    // ========== MODE TOGGLE UI ==========
    
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
    
    // ========== MODE SWITCHING ==========
    
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
            
            // Handle service stashing/restoration
            const manager = window.InvoiceManager || window.invoiceManager;
            if (!manager) return;
            
            const docObj = kind === 'invoice' ? manager.currentInvoice : manager.currentEstimate;
            if (!docObj) return;
            
            if (mode === 'itemized' && docObj._stashedServices && docObj._stashedServices.length > 0) {
                // Restore stashed services
                docObj.services = docObj.services.filter(s => s.id !== 'custom-quote');
                docObj.services.push(...docObj._stashedServices);
                delete docObj._stashedServices;
                
                // Refresh display
                if (kind === 'invoice') {
                    const list = document.getElementById('services-list');
                    if (list) {
                        list.innerHTML = '';
                        docObj.services.forEach(s => {
                            if (manager.addServiceToList) manager.addServiceToList(s);
                        });
                    }
                    if (manager.checkEmptyServices) manager.checkEmptyServices();
                    if (manager.updateInvoiceTotals) manager.updateInvoiceTotals();
                } else {
                    const list = document.getElementById('estimate-services-list');
                    if (list) {
                        list.innerHTML = '';
                        docObj.services.forEach(s => {
                            const item = document.createElement('div');
                            item.className = 'service-item';
                            item.innerHTML = `
                                <div class="service-details">
                                    <div class="description">${renderDescHTML(s.description)}</div>
                                    <div class="service-meta">Qty: ${s.quantity} ${s.unit} @ $${s.rate}/unit = $${s.amount.toFixed(2)}</div>
                                </div>
                                <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">Remove</button>
                            `;
                            list.appendChild(item);
                        });
                    }
                    if (manager.updateEstimateTotals) manager.updateEstimateTotals();
                }
            }
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
        
        // Mark itemized-only elements
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
                // Remove any duplicate price fields from previous implementations
                const customTotal = document.getElementById('estimate-custom-total');
                if (customTotal) customTotal.closest('.form-row, .form-group')?.remove();
                
                const customPrice = document.getElementById('estimate-custom-price');
                if (customPrice) customPrice.closest('.form-row, .form-group')?.remove();
                
                const header = masonrySection.querySelector('h4');
                if (header) {
                    const toggle = buildToggle('estimate');
                    header.parentNode.insertBefore(toggle, header.nextSibling);
                }
                
                // Mark itemized-only elements (quantity and unit only)
                const quantityGroup = document.getElementById('estimate-masonry-quantity')?.closest('.form-group');
                const unitGroup = document.getElementById('estimate-masonry-unit')?.closest('.form-group');
                
                if (quantityGroup) quantityGroup.classList.add('itemized-only');
                if (unitGroup) unitGroup.classList.add('itemized-only');
                
                // Rate field is used in both modes, just relabeled in custom
                
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
        if (!btn || btn.dataset.customFixed) return;
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
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
        
        newBtn.dataset.customFixed = 'true';
    }
    
    function overrideEstimateButton() {
        const observer = new MutationObserver(() => {
            const btn = document.getElementById('estimate-add-masonry-service');
            if (!btn || btn.dataset.customFixed) return;
            
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', function() {
                const section = document.querySelector('#estimate-services-content [data-masonry-section="true"]') ||
                              document.querySelector('#estimate-services-content .estimate-masonry-section');
                const isCustom = section?.getAttribute('data-quote-mode') === 'custom';
                
                if (isCustom) {
                    const desc = document.getElementById('estimate-masonry-description')?.value;
                    // Use the existing rate field as the price in custom mode
                    const price = document.getElementById('estimate-masonry-rate')?.value;
                    
                    if (addOrReplaceCustomQuote('estimate', desc, price)) {
                        document.getElementById('estimate-masonry-description').value = '';
                        document.getElementById('estimate-masonry-rate').value = '';
                    }
                } else {
                    const manager = window.InvoiceManager || window.invoiceManager;
                    if (manager?.addMasonryServiceToEstimate) {
                        // Fix validation for itemized mode
                        const rateInput = document.getElementById('estimate-masonry-rate');
                        const quantityInput = document.getElementById('estimate-masonry-quantity');
                        
                        if (rateInput && quantityInput) {
                            const rate = parseCurrency(rateInput.value);
                            const quantity = parseFloat(quantityInput.value) || 0;
                            
                            if (rate <= 0 || quantity <= 0) {
                                alert('Please enter valid quantity and rate values greater than zero.');
                                return;
                            }
                        }
                        
                        manager.addMasonryServiceToEstimate();
                    }
                }
            });
            
            newBtn.dataset.customFixed = 'true';
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // ========== PDF LINE BREAK FIX ==========
    
    function patchPDFGeneration() {
        // Patch service description rendering to preserve line breaks
        if (window.PDFManager && !window.PDFManager._lineBreakFixed) {
            const originalGenerate = window.PDFManager.generatePDF;
            if (originalGenerate) {
                window.PDFManager.generatePDF = function(type) {
                    // This will signal PDF generation to handle line breaks
                    window._preserveLineBreaks = true;
                    const result = originalGenerate.call(this, type);
                    window._preserveLineBreaks = false;
                    return result;
                };
                window.PDFManager._lineBreakFixed = true;
            }
        }
        
        // Patch jsPDF text method to handle multi-line text
        if (window.jsPDF && !window.jsPDF._lineBreakFixed) {
            const OriginalJsPDF = window.jsPDF;
            window.jsPDF = function(...args) {
                const doc = new OriginalJsPDF(...args);
                const originalText = doc.text;
                
                doc.text = function(text, x, y, options) {
                    if (window._preserveLineBreaks && typeof text === 'string' && text.includes('\n')) {
                        const lines = text.split('\n');
                        const lineHeight = (options?.lineHeightFactor || 1.15) * this.getFontSize();
                        lines.forEach((line, index) => {
                            originalText.call(this, line, x, y + (index * lineHeight), options);
                        });
                    } else {
                        return originalText.call(this, text, x, y, options);
                    }
                };
                
                // Also patch splitTextToSize to preserve line breaks
                const originalSplit = doc.splitTextToSize;
                doc.splitTextToSize = function(text, maxWidth, options) {
                    if (typeof text === 'string' && text.includes('\n')) {
                        // Split by line breaks first, then split each line by width
                        const lines = text.split('\n');
                        const result = [];
                        lines.forEach(line => {
                            const splitLines = originalSplit.call(this, line, maxWidth, options);
                            result.push(...(Array.isArray(splitLines) ? splitLines : [splitLines]));
                        });
                        return result;
                    }
                    return originalSplit.call(this, text, maxWidth, options);
                };
                
                return doc;
            };
            window.jsPDF._lineBreakFixed = true;
        }
    }
    
    // ========== INITIALIZATION ==========
    
    function init() {
        injectStyles();
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
    
    // Start when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for debugging
    window.CustomQuoteFixed = {
        addOrReplaceCustomQuote: addOrReplaceCustomQuote,
        parseCurrency: parseCurrency,
        version: 'fixed'
    };
})();

/**
 * SELECTORS USED:
 * 
 * Invoice:
 * - Section: #masonry-services
 * - Description: #masonry-description 
 * - Price: #masonry-job-price
 * - Add Button: #add-masonry-service
 * - Services List: #services-list
 * 
 * Estimate:
 * - Section: .estimate-masonry-section or [data-masonry-section="true"]
 * - Description: #estimate-masonry-description
 * - Price: #estimate-masonry-rate (reused existing field, no duplicate)
 * - Add Button: #estimate-add-masonry-service
 * - Services List: #estimate-services-list
 * 
 * Mode flag: data-quote-mode="itemized|custom"
 * 
 * Both rate and amount set to same parsed numeric value
 * Line breaks preserved with white-space: pre-line CSS
 * PDF line breaks handled by splitting text on \n
 */