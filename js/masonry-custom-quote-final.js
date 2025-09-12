/**
 * Masonry Custom Quote - Production Ready Implementation
 * Implements toggle between Itemized and Custom modes for Masonry business type
 * Handles both Invoice and Estimate creation with proper line break preservation
 */

(function() {
    'use strict';
    
    console.log('[CUSTOM-QUOTE] Initializing production version...');
    
    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    
    /**
     * Parse currency string to number
     */
    function parseCurrency(raw) {
        return parseFloat(String(raw || '').replace(/[^\d.-]/g, '')) || 0;
    }
    
    /**
     * Escape HTML special characters
     */
    function escapeHTML(s) {
        return String(s || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }
    
    /**
     * Convert text to HTML with line breaks
     */
    function htmlWithBR(s) {
        return escapeHTML(String(s || '').replace(/\r\n/g, '\n')).replace(/\n/g, '<br>');
    }
    
    /**
     * Normalize line endings
     */
    function normalizeLines(s) {
        return String(s ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    
    // ============================================================
    // MODE TOGGLE CREATION
    // ============================================================
    
    /**
     * Create toggle UI for mode selection
     */
    function createModeToggle(context) {
        const toggleId = context === 'invoice' ? 'quote-mode-toggle' : 'quote-mode-toggle-estimate';
        
        const toggleHTML = `
            <div class="quote-mode-toggle" style="margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                <label style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-weight: bold;">Quote Mode:</span>
                    <div style="display: inline-flex; background: white; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
                        <label style="margin: 0;">
                            <input type="radio" name="${toggleId}" value="itemized" checked style="display: none;">
                            <span class="toggle-btn" style="display: inline-block; padding: 8px 15px; cursor: pointer; background: #007bff; color: white; transition: all 0.3s;">
                                Itemized
                            </span>
                        </label>
                        <label style="margin: 0;">
                            <input type="radio" name="${toggleId}" value="custom" style="display: none;">
                            <span class="toggle-btn" style="display: inline-block; padding: 8px 15px; cursor: pointer; transition: all 0.3s;">
                                Custom
                            </span>
                        </label>
                    </div>
                </label>
            </div>
        `;
        
        return toggleHTML;
    }
    
    /**
     * Setup toggle behavior
     */
    function setupToggleBehavior(section, context) {
        const toggleName = context === 'invoice' ? 'quote-mode-toggle' : 'quote-mode-toggle-estimate';
        const radios = section.querySelectorAll(`input[name="${toggleName}"]`);
        
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    handleModeChange(section, this.value, context);
                    
                    // Update visual state
                    radios.forEach(r => {
                        const btn = r.nextElementSibling;
                        if (r.checked) {
                            btn.style.background = '#007bff';
                            btn.style.color = 'white';
                        } else {
                            btn.style.background = 'transparent';
                            btn.style.color = '#333';
                        }
                    });
                }
            });
        });
    }
    
    // ============================================================
    // MODE CHANGE HANDLER
    // ============================================================
    
    function handleModeChange(section, mode, context) {
        console.log(`[CUSTOM-QUOTE] Mode changed to: ${mode} for ${context}`);
        
        // Set mode attribute
        section.setAttribute('data-quote-mode', mode);
        
        // Get document object
        const manager = window.InvoiceManager || window.invoiceManager;
        const docObj = context === 'invoice' ? manager.currentInvoice : manager.currentEstimate;
        
        if (mode === 'custom') {
            // Switching to Custom - stash current services
            if (docObj && docObj.services) {
                docObj._stashedServices = [...docObj.services];
                // Remove any non-custom masonry services
                docObj.services = docObj.services.filter(s => s.id !== 'custom-quote');
            }
            
            // Update field visibility
            updateFieldVisibility(section, 'custom', context);
            
        } else {
            // Switching to Itemized - restore stashed services
            if (docObj && docObj._stashedServices) {
                // Remove any custom quote
                docObj.services = docObj.services ? docObj.services.filter(s => s.id !== 'custom-quote') : [];
                // Restore stashed services
                docObj.services.push(...docObj._stashedServices);
                delete docObj._stashedServices;
            }
            
            // Update field visibility
            updateFieldVisibility(section, 'itemized', context);
        }
        
        // Update totals
        if (context === 'invoice') {
            manager.updateInvoiceTotals?.();
        } else {
            manager.updateEstimateTotals?.();
        }
    }
    
    // ============================================================
    // FIELD VISIBILITY MANAGEMENT
    // ============================================================
    
    function updateFieldVisibility(section, mode, context) {
        // Find all relevant fields
        const prefix = context === 'estimate' ? 'estimate-' : '';
        
        // Fields to show/hide based on mode
        const itemizedFields = [
            `${prefix}masonry-service`,
            `${prefix}masonry-quantity`, 
            `${prefix}masonry-unit`,
            `${prefix}masonry-rate`
        ];
        
        const customFields = [
            `${prefix}masonry-description`
        ];
        
        // The price field is shared but labeled differently
        const priceFieldId = context === 'estimate' ? 'estimate-masonry-rate' : 'masonry-job-price';
        const priceField = document.getElementById(priceFieldId);
        
        if (mode === 'custom') {
            // Hide itemized fields
            itemizedFields.forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    const container = field.closest('.form-group') || field.parentElement;
                    if (container) container.style.display = 'none';
                }
            });
            
            // Show custom fields
            customFields.forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    const container = field.closest('.form-group') || field.parentElement;
                    if (container) container.style.display = 'block';
                }
            });
            
            // Update price field label
            if (priceField) {
                const label = priceField.parentElement?.querySelector('label');
                if (label) label.textContent = 'Total Price:';
            }
            
        } else {
            // Show itemized fields
            itemizedFields.forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    const container = field.closest('.form-group') || field.parentElement;
                    if (container) container.style.display = 'block';
                }
            });
            
            // Show description field (used in both modes)
            customFields.forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    const container = field.closest('.form-group') || field.parentElement;
                    if (container) container.style.display = 'block';
                }
            });
            
            // Update price field label
            if (priceField) {
                const label = priceField.parentElement?.querySelector('label');
                if (label) label.textContent = context === 'estimate' ? 'Rate:' : 'Job Price:';
            }
        }
    }
    
    // ============================================================
    // CUSTOM QUOTE SERVICE HANDLER
    // ============================================================
    
    function addOrReplaceCustomQuote(context, description, rawPrice) {
        const amount = parseCurrency(rawPrice);
        
        // Validate
        if (amount <= 0) {
            alert('Please enter a price greater than $0.00');
            return false;
        }
        
        if (!description || description.trim() === '') {
            alert('Please enter a description');
            return false;
        }
        
        // Create service object
        const service = {
            id: 'custom-quote',
            type: 'masonry',
            description: description,
            quantity: 1,
            unit: 'project',
            rate: amount,
            amount: amount,
            price: amount,
            total: amount,
            details: {
                jobPricing: true,
                isCustomQuote: true
            }
        };
        
        console.log('[CUSTOM-QUOTE] Adding service:', service);
        
        // Get manager and document
        const manager = window.InvoiceManager || window.invoiceManager;
        const docObj = context === 'invoice' ? manager.currentInvoice : manager.currentEstimate;
        
        if (!docObj) {
            console.error('[CUSTOM-QUOTE] No document object found');
            return false;
        }
        
        // Initialize services array if needed
        if (!docObj.services) {
            docObj.services = [];
        }
        
        // Remove any existing custom quote
        docObj.services = docObj.services.filter(s => s.id !== 'custom-quote');
        
        // Add the new service
        docObj.services.push(service);
        
        // Update UI
        if (context === 'invoice') {
            // Add to services list
            manager.addServiceToList?.(service);
            manager.updateInvoiceTotals?.();
        } else {
            // Add to estimate services list
            const list = document.getElementById('estimate-services-list');
            if (list) {
                // Remove empty message
                const emptyMsg = list.querySelector('.empty-services');
                if (emptyMsg) emptyMsg.remove();
                
                // Remove existing custom quote items
                Array.from(list.children).forEach(child => {
                    if (child.dataset.serviceId === 'custom-quote') {
                        child.remove();
                    }
                });
                
                // Add new item with line breaks
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item service-item--masonry';
                serviceItem.dataset.serviceId = 'custom-quote';
                serviceItem.innerHTML = `
                    <div class="service-details">
                        <div class="description" style="white-space: pre-line; margin-bottom: 10px;">${htmlWithBR(service.description)}</div>
                        <div class="service-meta">Custom Quote: $${amount.toFixed(2)}</div>
                    </div>
                    <button class="btn-remove" onclick="window.InvoiceManager.removeEstimateService(this)">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                `;
                list.appendChild(serviceItem);
            }
            
            manager.updateEstimateTotals?.();
        }
        
        // Clear form
        if (context === 'invoice') {
            const descField = document.getElementById('masonry-description');
            const priceField = document.getElementById('masonry-job-price');
            if (descField) descField.value = '';
            if (priceField) priceField.value = '';
        } else {
            const descField = document.getElementById('estimate-masonry-description');
            const priceField = document.getElementById('estimate-masonry-rate');
            if (descField) descField.value = '';
            if (priceField) priceField.value = '';
        }
        
        return true;
    }
    
    // ============================================================
    // BUTTON HANDLER OVERRIDE
    // ============================================================
    
    function overrideAddButtons() {
        // Invoice button
        const invoiceBtn = document.getElementById('add-masonry-service');
        if (invoiceBtn && !invoiceBtn.dataset.customQuotePatched) {
            const newBtn = invoiceBtn.cloneNode(true);
            invoiceBtn.parentNode.replaceChild(newBtn, invoiceBtn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const section = document.querySelector('.masonry-section, [data-masonry-section="true"]');
                const mode = section?.getAttribute('data-quote-mode');
                
                if (mode === 'custom') {
                    const desc = document.getElementById('masonry-description')?.value;
                    const price = document.getElementById('masonry-job-price')?.value;
                    addOrReplaceCustomQuote('invoice', desc, price);
                } else {
                    // Call original handler
                    const manager = window.InvoiceManager || window.invoiceManager;
                    manager.addMasonryService?.();
                }
            });
            
            newBtn.dataset.customQuotePatched = 'true';
        }
        
        // Estimate button
        const estimateBtn = document.getElementById('estimate-add-masonry-service');
        if (estimateBtn && !estimateBtn.dataset.customQuotePatched) {
            const newBtn = estimateBtn.cloneNode(true);
            estimateBtn.parentNode.replaceChild(newBtn, estimateBtn);
            
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const section = document.querySelector('.estimate-masonry-section, [data-masonry-section="true"]');
                const mode = section?.getAttribute('data-quote-mode');
                
                if (mode === 'custom') {
                    const desc = document.getElementById('estimate-masonry-description')?.value;
                    const price = document.getElementById('estimate-masonry-rate')?.value;
                    addOrReplaceCustomQuote('estimate', desc, price);
                } else {
                    // Call original handler
                    const manager = window.InvoiceManager || window.invoiceManager;
                    if (manager.addMasonryEstimateService) {
                        manager.addMasonryEstimateService();
                    } else if (manager.addEstimateService) {
                        manager.addEstimateService();
                    }
                }
            });
            
            newBtn.dataset.customQuotePatched = 'true';
        }
    }
    
    // ============================================================
    // CSS INJECTION
    // ============================================================
    
    function injectStyles() {
        if (document.getElementById('custom-quote-styles')) return;
        
        const styles = `
            <style id="custom-quote-styles">
                /* Mode-based visibility */
                [data-quote-mode="custom"] .itemized-only {
                    display: none !important;
                }
                
                [data-quote-mode="itemized"] .custom-only {
                    display: none !important;
                }
                
                /* Line break preservation */
                .services-list .service-description,
                .services-list td.description,
                #invoice-preview-content td,
                #estimate-preview-content td,
                .service-details .description,
                .service-item .description {
                    white-space: pre-line !important;
                }
                
                /* PDF specific */
                .pdf-root .service-description,
                .invoice-document td,
                .estimate-document td {
                    white-space: pre-line !important;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // ============================================================
    // INITIALIZATION
    // ============================================================
    
    function init() {
        console.log('[CUSTOM-QUOTE] Starting initialization...');
        
        // Inject styles
        injectStyles();
        
        // Setup mutation observer to catch dynamically added sections
        const observer = new MutationObserver(() => {
            // Invoice masonry section
            const invoiceSection = document.querySelector('.masonry-section:not([data-custom-quote-init])');
            if (invoiceSection) {
                invoiceSection.setAttribute('data-custom-quote-init', 'true');
                invoiceSection.setAttribute('data-quote-mode', 'itemized');
                
                // Add toggle if not present
                if (!invoiceSection.querySelector('.quote-mode-toggle')) {
                    const header = invoiceSection.querySelector('h3, h4, .section-header');
                    if (header) {
                        header.insertAdjacentHTML('afterend', createModeToggle('invoice'));
                        setupToggleBehavior(invoiceSection, 'invoice');
                    }
                }
            }
            
            // Estimate masonry section
            const estimateSection = document.querySelector('.estimate-masonry-section:not([data-custom-quote-init])');
            if (estimateSection) {
                estimateSection.setAttribute('data-custom-quote-init', 'true');
                estimateSection.setAttribute('data-quote-mode', 'itemized');
                estimateSection.setAttribute('data-masonry-section', 'true');
                
                // Add toggle if not present
                if (!estimateSection.querySelector('.quote-mode-toggle')) {
                    const header = estimateSection.querySelector('h3, h4, .section-header');
                    if (header) {
                        header.insertAdjacentHTML('afterend', createModeToggle('estimate'));
                        setupToggleBehavior(estimateSection, 'estimate');
                    }
                }
            }
            
            // Override buttons
            overrideAddButtons();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Initial setup
        setTimeout(() => {
            const invoiceSection = document.querySelector('.masonry-section');
            const estimateSection = document.querySelector('.estimate-masonry-section');
            
            if (invoiceSection && !invoiceSection.dataset.customQuoteInit) {
                invoiceSection.setAttribute('data-custom-quote-init', 'true');
                invoiceSection.setAttribute('data-quote-mode', 'itemized');
                
                const header = invoiceSection.querySelector('h3, h4, .section-header');
                if (header) {
                    header.insertAdjacentHTML('afterend', createModeToggle('invoice'));
                    setupToggleBehavior(invoiceSection, 'invoice');
                }
            }
            
            if (estimateSection && !estimateSection.dataset.customQuoteInit) {
                estimateSection.setAttribute('data-custom-quote-init', 'true');
                estimateSection.setAttribute('data-quote-mode', 'itemized');
                estimateSection.setAttribute('data-masonry-section', 'true');
                
                const header = estimateSection.querySelector('h3, h4, .section-header');
                if (header) {
                    header.insertAdjacentHTML('afterend', createModeToggle('estimate'));
                    setupToggleBehavior(estimateSection, 'estimate');
                }
            }
            
            overrideAddButtons();
        }, 1000);
        
        console.log('[CUSTOM-QUOTE] Initialization complete');
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for debugging
    window.CustomQuoteFinal = {
        version: '2.0',
        addOrReplaceCustomQuote: addOrReplaceCustomQuote,
        parseCurrency: parseCurrency,
        htmlWithBR: htmlWithBR,
        normalizeLines: normalizeLines
    };
    
})();