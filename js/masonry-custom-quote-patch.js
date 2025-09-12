/**
 * Masonry Custom Quote Patch - Non-invasive implementation
 * Adds toggle for Custom/Itemized modes without breaking existing functionality
 */

(function() {
    'use strict';
    
    console.log('[CUSTOM-QUOTE-PATCH] Loading...');
    
    // Flag to prevent duplicate execution
    let isProcessingEstimate = false;
    let isProcessingInvoice = false;
    
    // Helper to convert newlines to HTML breaks
    function htmlWithBR(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>');
    }
    
    // Add toggle when masonry section becomes visible
    function addToggleWhenReady() {
        // For invoice masonry section
        const invoiceSection = document.getElementById('masonry-services');
        if (invoiceSection && invoiceSection.style.display !== 'none' && !invoiceSection.dataset.toggleAdded) {
            addToggleToInvoice(invoiceSection);
            invoiceSection.dataset.toggleAdded = 'true';
        }
        
        // For estimate masonry section
        const estimateSection = document.querySelector('.estimate-masonry-services, .estimate-masonry-section');
        if (estimateSection && !estimateSection.dataset.toggleAdded) {
            addToggleToEstimate(estimateSection);
            estimateSection.dataset.toggleAdded = 'true';
            // Store the current mode state in case section gets recreated
            window._customQuoteModeState = window._customQuoteModeState || {};
            window._customQuoteModeState.estimate = estimateSection.getAttribute('data-quote-mode') || 'itemized';
        }
    }
    
    function addToggleToInvoice(section) {
        // Create toggle
        const toggleDiv = document.createElement('div');
        toggleDiv.className = 'quote-mode-toggle';
        toggleDiv.innerHTML = `
            <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                <label style="font-weight: bold; margin-right: 15px;">Quote Mode:</label>
                <label style="margin-right: 10px;">
                    <input type="radio" name="invoice-quote-mode" value="itemized" checked>
                    Itemized
                </label>
                <label>
                    <input type="radio" name="invoice-quote-mode" value="custom">
                    Custom Quote
                </label>
            </div>
        `;
        
        // Insert after header
        const header = section.querySelector('h3');
        if (header) {
            header.parentNode.insertBefore(toggleDiv, header.nextSibling);
        }
        
        // Add change handler
        toggleDiv.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    updateInvoiceMode(section, this.value);
                }
            });
        });
        
        // Set initial mode
        section.setAttribute('data-quote-mode', 'itemized');
    }
    
    function addToggleToEstimate(section) {
        // Create toggle
        const toggleDiv = document.createElement('div');
        toggleDiv.className = 'quote-mode-toggle';
        toggleDiv.innerHTML = `
            <div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                <label style="font-weight: bold; margin-right: 15px;">Quote Mode:</label>
                <label style="margin-right: 10px;">
                    <input type="radio" name="estimate-quote-mode" value="itemized" checked>
                    Itemized
                </label>
                <label>
                    <input type="radio" name="estimate-quote-mode" value="custom">
                    Custom Quote
                </label>
            </div>
        `;
        
        // Insert after header
        const header = section.querySelector('h4');
        if (header) {
            header.parentNode.insertBefore(toggleDiv, header.nextSibling);
        }
        
        // Add change handler
        toggleDiv.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    updateEstimateMode(section, this.value);
                }
            });
        });
        
        // Set initial mode
        section.setAttribute('data-quote-mode', 'itemized');
        section.classList.add('estimate-masonry-section'); // Ensure class is present
    }
    
    function updateInvoiceMode(section, mode) {
        section.setAttribute('data-quote-mode', mode);
        
        // Get field references
        const serviceSelect = document.getElementById('masonry-service');
        const descTextarea = document.getElementById('masonry-description');
        const priceInput = document.getElementById('masonry-job-price');
        
        if (mode === 'custom') {
            // Hide service type, keep description and price
            if (serviceSelect) {
                const serviceRow = serviceSelect.closest('.form-group');
                if (serviceRow) serviceRow.style.display = 'none';
            }
            
            // Update price label
            const priceLabel = priceInput?.parentElement?.parentElement?.querySelector('label');
            if (priceLabel) priceLabel.innerHTML = 'Total Price:';
            
            // Make description larger
            if (descTextarea) descTextarea.rows = 5;
            
        } else {
            // Show service type
            if (serviceSelect) {
                const serviceRow = serviceSelect.closest('.form-group');
                if (serviceRow) serviceRow.style.display = '';
            }
            
            // Update price label
            const priceLabel = priceInput?.parentElement?.parentElement?.querySelector('label');
            if (priceLabel) priceLabel.innerHTML = 'Job Price: <span class="help-icon" data-tooltip="Enter the total price for this masonry job. This will be the final amount charged to the customer."><i class="fas fa-question-circle"></i></span>';
            
            // Normal description size
            if (descTextarea) descTextarea.rows = 2;
        }
    }
    
    function updateEstimateMode(section, mode) {
        section.setAttribute('data-quote-mode', mode);
        
        // Store the mode state globally in case section gets recreated
        window._customQuoteModeState = window._customQuoteModeState || {};
        window._customQuoteModeState.estimate = mode;
        
        // Get field references
        const serviceSelect = document.getElementById('estimate-masonry-service');
        const descTextarea = document.getElementById('estimate-masonry-description');
        const priceInput = document.getElementById('estimate-masonry-rate');
        
        if (mode === 'custom') {
            // Hide service type
            if (serviceSelect) {
                const serviceRow = serviceSelect.closest('.form-group');
                if (serviceRow) serviceRow.style.display = 'none';
            }
            
            // Update price label
            const priceLabel = priceInput?.parentElement?.parentElement?.querySelector('label');
            if (priceLabel) priceLabel.textContent = 'Total Price:';
            
            // Make description larger
            if (descTextarea) descTextarea.rows = 5;
            
        } else {
            // Show service type
            if (serviceSelect) {
                const serviceRow = serviceSelect.closest('.form-group');
                if (serviceRow) serviceRow.style.display = '';
            }
            
            // Update price label
            const priceLabel = priceInput?.parentElement?.parentElement?.querySelector('label');
            if (priceLabel) priceLabel.textContent = 'Estimated Price:';
            
            // Normal description size
            if (descTextarea) descTextarea.rows = 3;
        }
    }
    
    // Override functions immediately if available, with fallback
    function patchFunctions() {
        // Patch EstimateManager immediately if available
        if (window.EstimateManager && window.EstimateManager.addMasonryEstimateService && !window.EstimateManager._customPatched) {
            const originalAddMasonryEstimateService = window.EstimateManager.addMasonryEstimateService;
            window.EstimateManager.addMasonryEstimateService = function() {
                console.log('[CUSTOM-QUOTE-PATCH] Intercepted addMasonryEstimateService call');
                const section = document.querySelector('.estimate-masonry-services, .estimate-masonry-section');
                console.log('[CUSTOM-QUOTE-PATCH] Section found:', section, 'Mode:', section?.getAttribute('data-quote-mode'));
                if (section?.getAttribute('data-quote-mode') === 'custom') {
                    // Handle custom mode without service type validation
                    // Add small delay to ensure fields are ready
                    console.log('[CUSTOM-QUOTE-PATCH] Waiting for fields to be ready...');
                    setTimeout(() => {
                        console.log('[CUSTOM-QUOTE-PATCH] Attempting to add custom estimate after delay');
                        handleCustomEstimateAdd();
                    }, 50);
                } else {
                    // Call original for itemized mode
                    originalAddMasonryEstimateService.call(this);
                }
            };
            window.EstimateManager._customPatched = true;
            console.log('[CUSTOM-QUOTE-PATCH] EstimateManager.addMasonryEstimateService patched immediately');
        }
        
        // Patch InvoiceManager immediately if available
        if (window.InvoiceManager && window.InvoiceManager.addMasonryServiceFromForm && !window.InvoiceManager._customPatched) {
            const originalAddMasonryService = window.InvoiceManager.addMasonryServiceFromForm;
            window.InvoiceManager.addMasonryServiceFromForm = function() {
                const section = document.getElementById('masonry-services');
                if (section?.getAttribute('data-quote-mode') === 'custom') {
                    // Handle custom mode without service type validation
                    handleCustomInvoiceAdd();
                } else {
                    // Call original for itemized mode
                    originalAddMasonryService.call(this);
                }
            };
            window.InvoiceManager._customPatched = true;
            console.log('[CUSTOM-QUOTE-PATCH] InvoiceManager.addMasonryServiceFromForm patched immediately');
        }
        
        // Fallback: If managers aren't available yet, try again later
        if (!window.EstimateManager?._customPatched || !window.InvoiceManager?._customPatched) {
            const patchInterval = setInterval(() => {
                // Try patching EstimateManager if not done yet
                if (window.EstimateManager && window.EstimateManager.addMasonryEstimateService && !window.EstimateManager._customPatched) {
                    const originalAddMasonryEstimateService = window.EstimateManager.addMasonryEstimateService;
                    window.EstimateManager.addMasonryEstimateService = function() {
                        console.log('[CUSTOM-QUOTE-PATCH] Intercepted addMasonryEstimateService call (delayed)');
                        const section = document.querySelector('.estimate-masonry-services, .estimate-masonry-section');
                        console.log('[CUSTOM-QUOTE-PATCH] Section found:', section, 'Mode:', section?.getAttribute('data-quote-mode'));
                        if (section?.getAttribute('data-quote-mode') === 'custom') {
                            // Add small delay to ensure fields are ready
                            console.log('[CUSTOM-QUOTE-PATCH] Waiting for fields to be ready (delayed patch)...');
                            setTimeout(() => {
                                console.log('[CUSTOM-QUOTE-PATCH] Attempting to add custom estimate after delay (delayed patch)');
                                handleCustomEstimateAdd();
                            }, 50);
                        } else {
                            originalAddMasonryEstimateService.call(this);
                        }
                    };
                    window.EstimateManager._customPatched = true;
                    console.log('[CUSTOM-QUOTE-PATCH] EstimateManager.addMasonryEstimateService patched (delayed)');
                }
                
                // Try patching InvoiceManager if not done yet
                if (window.InvoiceManager && window.InvoiceManager.addMasonryServiceFromForm && !window.InvoiceManager._customPatched) {
                    const originalAddMasonryService = window.InvoiceManager.addMasonryServiceFromForm;
                    window.InvoiceManager.addMasonryServiceFromForm = function() {
                        const section = document.getElementById('masonry-services');
                        if (section?.getAttribute('data-quote-mode') === 'custom') {
                            handleCustomInvoiceAdd();
                        } else {
                            originalAddMasonryService.call(this);
                        }
                    };
                    window.InvoiceManager._customPatched = true;
                    console.log('[CUSTOM-QUOTE-PATCH] InvoiceManager.addMasonryServiceFromForm patched (delayed)');
                }
                
                // Stop trying if both are patched
                if (window.EstimateManager?._customPatched && window.InvoiceManager?._customPatched) {
                    clearInterval(patchInterval);
                }
            }, 100);
        }
        
        // Also patch button clicks to intercept before other handlers
        document.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'add-masonry-service') {
                const section = document.getElementById('masonry-services');
                if (section?.getAttribute('data-quote-mode') === 'custom') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCustomInvoiceAdd();
                }
            }
        }, true); // Use capture phase
    }
    
    function handleCustomInvoiceAdd() {
        // Check if already processing to prevent duplicate execution
        if (isProcessingInvoice) {
            console.log('[CUSTOM-QUOTE] Ignoring duplicate invoice call - already processing');
            return;
        }
        
        // Set flag to prevent duplicate execution
        isProcessingInvoice = true;
        setTimeout(() => {
            isProcessingInvoice = false;
        }, 500);
        
        const description = document.getElementById('masonry-description')?.value?.trim();
        const price = parseFloat(document.getElementById('masonry-job-price')?.value || 0);
        
        if (!description) {
            alert('Please enter a description');
            return;
        }
        
        if (price <= 0) {
            alert('Please enter a price greater than $0.00');
            return;
        }
        
        // Create custom service
        const service = {
            type: 'masonry_custom',
            serviceType: 'custom',
            description: description,
            price: price,
            quantity: 1,
            amount: price,
            details: {
                jobPricing: true,
                isCustomQuote: true
            }
        };
        
        // Add using existing manager
        if (window.JStarkInvoicing?.InvoiceManager) {
            window.JStarkInvoicing.InvoiceManager.addService(service);
            
            // Clear form
            document.getElementById('masonry-description').value = '';
            document.getElementById('masonry-job-price').value = '';
        }
    }
    
    function handleCustomEstimateAdd() {
        // Check if already processing to prevent duplicate execution
        if (isProcessingEstimate) {
            console.log('[CUSTOM-QUOTE] Ignoring duplicate call - already processing');
            return;
        }
        
        // Set flag to prevent duplicate execution
        isProcessingEstimate = true;
        console.log('[CUSTOM-QUOTE] Processing started, blocking duplicates...');
        
        // Reset flag after a short delay
        setTimeout(() => {
            isProcessingEstimate = false;
            console.log('[CUSTOM-QUOTE] Processing flag reset, ready for next add');
        }, 500);
        
        console.log('[CUSTOM-QUOTE] Looking for estimate-masonry-description field...');
        
        // Try to find the field globally first
        let descField = document.getElementById('estimate-masonry-description');
        
        // If not found, try querySelector as fallback
        if (!descField) {
            console.log('[CUSTOM-QUOTE] getElementById failed, trying querySelector...');
            descField = document.querySelector('#estimate-masonry-description');
        }
        
        // If still not found, check if we're looking in the right place
        if (!descField) {
            console.log('[CUSTOM-QUOTE] Field not found! Checking document state...');
            
            // Check if the section exists and has content
            const section = document.querySelector('.estimate-masonry-services');
            console.log('[CUSTOM-QUOTE] Section found:', section);
            console.log('[CUSTOM-QUOTE] Section has content:', section?.innerHTML?.length > 0);
            
            // Try to find any textarea in the section
            const anyTextarea = section?.querySelector('textarea');
            console.log('[CUSTOM-QUOTE] Any textarea in section:', anyTextarea);
            
            // Check all textareas in document
            const allTextareas = document.querySelectorAll('textarea');
            console.log('[CUSTOM-QUOTE] All textareas in document:', allTextareas.length);
            allTextareas.forEach((ta, i) => {
                console.log(`[CUSTOM-QUOTE] Textarea ${i}: id="${ta.id}", name="${ta.name}"`);
            });
        }
        
        // Log what we found
        console.log('[CUSTOM-QUOTE] Description field found:', descField);
        console.log('[CUSTOM-QUOTE] Field value:', descField?.value);
        console.log('[CUSTOM-QUOTE] Field visible:', descField?.offsetParent !== null);
        
        const description = descField?.value?.trim();
        
        // Similar debugging for price field
        let priceField = document.getElementById('estimate-masonry-rate');
        if (!priceField) {
            priceField = document.querySelector('#estimate-masonry-rate');
        }
        console.log('[CUSTOM-QUOTE] Price field found:', priceField);
        console.log('[CUSTOM-QUOTE] Price value:', priceField?.value);
        const price = parseFloat(priceField?.value || 0);
        
        if (!description) {
            alert('Please enter a description');
            return;
        }
        
        if (price <= 0) {
            alert('Please enter a price greater than $0.00');
            return;
        }
        
        // Create custom service
        const service = {
            id: 'custom_' + Date.now(),
            type: 'masonry',
            description: description,
            quantity: 1,
            price: price,
            amount: price
        };
        
        // Add to estimate
        if (window.EstimateManager) {
            if (!window.EstimateManager.currentEstimate) {
                window.EstimateManager.currentEstimate = { services: [], totals: {} };
            }
            window.EstimateManager.currentEstimate.services.push(service);
            
            // Update display
            const list = document.getElementById('estimate-services-list');
            if (list) {
                const emptyMsg = list.querySelector('.empty-services');
                if (emptyMsg) emptyMsg.remove();
                
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.innerHTML = `
                    <div class="service-details">
                        <div style="white-space: pre-line;">${htmlWithBR(description)}</div>
                        <p>Custom Quote: $${price.toFixed(2)}</p>
                    </div>
                `;
                list.appendChild(serviceItem);
            }
            
            window.EstimateManager.updateEstimateTotals();
            
            // Clear form
            document.getElementById('estimate-masonry-description').value = '';
            document.getElementById('estimate-masonry-rate').value = '';
        }
    }
    
    // Monitor for masonry section visibility
    const observer = new MutationObserver(() => {
        addToggleWhenReady();
        
        // Check if estimate section was recreated and restore mode
        const estimateSection = document.querySelector('.estimate-masonry-services, .estimate-masonry-section');
        if (estimateSection && window._customQuoteModeState?.estimate && !estimateSection.dataset.toggleAdded) {
            console.log('[CUSTOM-QUOTE-PATCH] Section recreated, restoring mode:', window._customQuoteModeState.estimate);
            setTimeout(() => {
                addToggleWhenReady();
                const toggle = document.querySelector('input[name="estimate-quote-mode"][value="' + window._customQuoteModeState.estimate + '"]');
                if (toggle) {
                    toggle.checked = true;
                    toggle.dispatchEvent(new Event('change'));
                }
            }, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style']
    });
    
    // Initial check
    setTimeout(addToggleWhenReady, 500);
    
    // Patch functions immediately on script load
    patchFunctions();
    
    // Also try patching on DOMContentLoaded in case scripts aren't ready yet
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', patchFunctions);
    } else {
        // DOM already loaded, patch again to be sure
        setTimeout(patchFunctions, 0);
    }
    
    // Add CSS for line breaks and custom mode
    const style = document.createElement('style');
    style.textContent = `
        /* Preserve line breaks in service descriptions */
        .service-item div[style*="white-space: pre-line"],
        .service-details div[style*="white-space: pre-line"],
        td[style*="white-space: pre-line"],
        .preview-service-description {
            white-space: pre-line !important;
        }
        
        /* Hide service type dropdown in custom mode */
        #masonry-services[data-quote-mode="custom"] #masonry-service,
        .estimate-masonry-section[data-quote-mode="custom"] #estimate-masonry-service {
            display: none;
        }
        
        /* Ensure service descriptions preserve formatting */
        .service-item .service-description,
        #services-list .service-details,
        #estimate-services-list .service-details {
            white-space: pre-line;
        }
    `;
    document.head.appendChild(style);
    
    console.log('[CUSTOM-QUOTE-PATCH] Initialized');
    
})();