/**
 * J. Stark Business Invoicing System - Invoice and Estimate Management
 * Handles invoice and estimate creation, preview, and management
 * VERSION: 2025-08-04-A - Cache busting and debugging version
 */

// CRITICAL: Define InvoiceManager globally EARLY to prevent "not available" errors
window.InvoiceManager = window.InvoiceManager || {
    invoices: [],
    currentInvoice: { services: [] }, // Initialize with empty services array
    updateInvoiceTotals: function() {
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (BEGIN) - Enhanced emergency fallback
        // Emergency fallback - implement basic totals calculation
        console.log('[EMERGENCY] InvoiceManager.updateInvoiceTotals called (early fallback)');
        try {
            if (this.currentInvoice && this.currentInvoice.services) {
                let subtotal = this.currentInvoice.services.reduce((sum, service) => {
                    const serviceAmount = service.amount || service.price || service.total || service.unitPrice || 0;
                    console.log('[EMERGENCY:SERVICE]', {
                        id: service.id,
                        amount: serviceAmount
                    });
                    return sum + serviceAmount;
                }, 0);
                this.currentInvoice.subtotal = subtotal;
                this.currentInvoice.total = subtotal; // No tax per requirements
                console.log('[EMERGENCY:TOTALS]', { subtotal, total: subtotal });
            }
        } catch (error) {
            console.error('[EMERGENCY:ERROR] updateInvoiceTotals failed:', error);
        }
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
    },
    // Add other critical methods as needed
    addService: function(service) {
        console.log('InvoiceManager.addService called with:', service);
        if (this.currentInvoice && this.currentInvoice.services) {
            this.currentInvoice.services.push(service);
            this.updateInvoiceTotals();
        }
    },
    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - Add handleEstimateSubmission
    // Handle estimate submission - delegates to EstimateManager when available
    handleEstimateSubmission: function(formData) {
        console.log('[EST-SUBMIT:INVMGR] InvoiceManager.handleEstimateSubmission called');
        
        // If EstimateManager is available, use it
        if (window.EstimateManager && window.EstimateManager.handleEstimateSubmission) {
            console.log('[EST-SUBMIT:DELEGATE] Delegating to EstimateManager');
            return window.EstimateManager.handleEstimateSubmission(formData);
        }
        
        // Fallback: Basic estimate creation
        console.log('[EST-SUBMIT:FALLBACK] Using fallback implementation');
        try {
            // Get current estimate from EstimateManager if available
            const estimate = window.EstimateManager?.currentEstimate || {};
            
            if (!estimate.services || estimate.services.length === 0) {
                console.error('[EST-SUBMIT:ERROR] No services in estimate');
                return false;
            }
            
            // Save estimate
            estimate.id = estimate.id || Date.now().toString();
            estimate.date = estimate.date || new Date().toISOString();
            estimate.status = 'draft';
            
            // Store in localStorage
            const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
            estimates.push(estimate);
            localStorage.setItem('jstark_estimates', JSON.stringify(estimates));
            
            console.log('[EST-SUBMIT:SUCCESS] Estimate saved:', estimate.id);
            return true;
        } catch (error) {
            console.error('[EST-SUBMIT:ERROR]', error);
            return false;
        }
    },
    
    // Generate estimate preview - delegates to EstimateManager when available
    generateEstimatePreview: function(estimate) {
        console.log('[EST-PREVIEW:INVMGR] InvoiceManager.generateEstimatePreview called');
        
        // If EstimateManager is available, use it
        if (window.EstimateManager && window.EstimateManager.generateEstimatePreview) {
            console.log('[EST-PREVIEW:DELEGATE] Delegating to EstimateManager');
            return window.EstimateManager.generateEstimatePreview(estimate);
        }
        
        // Fallback: Basic preview generation
        console.log('[EST-PREVIEW:FALLBACK] Using fallback implementation');
        try {
            const previewContent = document.getElementById('estimate-preview-content');
            if (!previewContent) {
                console.error('[EST-PREVIEW:ERROR] Preview content element not found');
                return;
            }
            
            // Basic preview HTML
            const businessName = estimate.businessType === 'concrete' ? 
                'Superior Concrete Leveling' : 'J. Stark Masonry';
            
            let servicesHTML = '';
            if (estimate.services && estimate.services.length > 0) {
                estimate.services.forEach(service => {
                    servicesHTML += `
                        <tr>
                            <td style="white-space: pre-line;">${(service.description || 'Service').replace(/\n/g, '<br>')}</td>
                            <td style="text-align: right;">$${(service.total || service.unitPrice || 0).toFixed(2)}</td>
                        </tr>
                    `;
                });
            }
            
            previewContent.innerHTML = `
                <div class="invoice-preview">
                    <h2>${businessName}</h2>
                    <h3>Estimate #${estimate.number || 'DRAFT'}</h3>
                    <p>Customer: ${estimate.customerName || 'N/A'}</p>
                    <p>Date: ${estimate.date || new Date().toLocaleDateString()}</p>
                    <table style="width: 100%; margin-top: 20px;">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${servicesHTML}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Total:</strong></td>
                                <td style="text-align: right;"><strong>$${(estimate.total || 0).toFixed(2)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
            
            console.log('[EST-PREVIEW:SUCCESS] Preview generated');
        } catch (error) {
            console.error('[EST-PREVIEW:ERROR]', error);
        }
    },
    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END)
    
    // === SAFE-HOTFIX: ESTIMATE CALC ALIGNMENT (BEGIN)
    // Critical method for estimate calculator - will be replaced by real one later
    handleEstimateBusinessTypeChange: function(businessType) {
        console.log('[EMERGENCY] InvoiceManager.handleEstimateBusinessTypeChange called with:', businessType);
        // Try to defer to the real InvoiceManager if available
        if (window.JStarkInvoicing && window.JStarkInvoicing.InvoiceManager && 
            window.JStarkInvoicing.InvoiceManager.handleEstimateBusinessTypeChange &&
            window.JStarkInvoicing.InvoiceManager !== this) {
            console.log('[EMERGENCY] Deferring to real InvoiceManager');
            return window.JStarkInvoicing.InvoiceManager.handleEstimateBusinessTypeChange(businessType);
        }
        // Otherwise wait and retry
        console.log('[EMERGENCY] Real InvoiceManager not ready, retrying in 100ms...');
        setTimeout(() => {
            if (window.JStarkInvoicing && window.JStarkInvoicing.InvoiceManager && 
                window.JStarkInvoicing.InvoiceManager.handleEstimateBusinessTypeChange) {
                console.log('[EMERGENCY] Calling real InvoiceManager after delay');
                window.JStarkInvoicing.InvoiceManager.handleEstimateBusinessTypeChange(businessType);
            } else {
                console.error('[EMERGENCY] Real InvoiceManager still not available');
            }
        }, 100);
    }
    // === SAFE-HOTFIX: ESTIMATE CALC ALIGNMENT (END)
};

console.log('%c📋 INVOICE.JS VERSION 2025-08-04-A LOADED', 'color: blue; font-weight: bold; font-size: 14px;');

window.JStarkInvoicing = (function() {
    'use strict';

    // Helper function to format customer address
    function formatAddressLines(customer = {}) {
        const lines = [];
        const name = (customer.name || '').trim();
        const street = (customer.street || '').trim();
        const city = (customer.city || '').trim();
        const state = (customer.state || '').trim();
        const zip = (customer.zip || '').trim();
        
        if (name) lines.push(name);
        if (street) lines.push(street);
        
        const cityStateZip = [city, state, zip].filter(Boolean).join(', ');
        if (cityStateZip) lines.push(cityStateZip);
        
        return lines;
    }

    // Invoice Manager object
    const InvoiceManager = {
        currentInvoice: {
            id: null,
            number: null,
            businessType: '',
            customer: {
                name: '',
                email: '',
                phone: '',
                street: '',
                city: '',
                state: '',
                zip: ''
            },
            date: '',
            services: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            notes: '',
            status: 'draft',
            signature: null
        },
        
        taxRate: 0, // No tax applied per user request
        
        normalizeCustomer: function(obj) {
            // Normalize customer fields from various legacy shapes
            if (!obj) return {};
            const customer = obj.customer || {};
            
            // Map legacy fields
            customer.name = customer.name || obj.customerName || '';
            customer.street = customer.street || obj.customerStreet || '';
            customer.city = customer.city || obj.customerCity || '';
            customer.state = customer.state || obj.customerState || '';
            customer.zip = customer.zip || obj.customerZip || '';
            
            // Parse address if stored as single string
            if (!customer.street && obj.customerAddress) {
                const parts = (obj.customerAddress || '').split(',').map(s => s.trim());
                if (parts.length >= 1) customer.street = parts[0];
                if (parts.length >= 2) {
                    const cityStateZip = parts.slice(1).join(', ');
                    const match = cityStateZip.match(/^(.+?),?\s+([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
                    if (match) {
                        customer.city = match[1];
                        customer.state = match[2];
                        customer.zip = match[3];
                    }
                }
            }
            
            return customer;
        },
        
        init: function() {
            try {
                this.bindEvents();
                console.log('Invoice Manager initialized');
            } catch (error) {
                console.error('Invoice Manager initialization error:', error);
            }
        },
        
        configureMasonryDescriptionField: function() {
            // === SAFE-HOTFIX: MASONRY DESC LENGTH (BEGIN)
            // Configure masonry description field for invoice
            const invoiceView = document.getElementById('invoice-creation');
            if (invoiceView) {
                const masonryDescField = invoiceView.querySelector('#masonry-description');
                if (masonryDescField) {
                    const MASONRY_DESC_MAX = 4000; // Support ≥2000 chars with buffer
                    masonryDescField.setAttribute('maxlength', MASONRY_DESC_MAX);
                    masonryDescField.removeAttribute('maxLength'); // Remove any case variations
                    console.log('[MASONRY-DESC:CONFIG]', { max: MASONRY_DESC_MAX, root: '#invoice-creation' });
                    console.log('[MASONRY-DESC:HTML_MAXLENGTH_SET]', true);
                    
                    // Add character counter
                    if (!masonryDescField.dataset.counterAdded) {
                        const counter = document.createElement('div');
                        counter.className = 'char-counter';
                        counter.style.fontSize = '12px';
                        counter.style.color = '#666';
                        counter.style.marginTop = '5px';
                        counter.textContent = `0 / ${MASONRY_DESC_MAX}`;
                        masonryDescField.parentNode.appendChild(counter);
                        
                        masonryDescField.addEventListener('input', () => {
                            const len = masonryDescField.value.length;
                            counter.textContent = `${len} / ${MASONRY_DESC_MAX}`;
                            if (len > MASONRY_DESC_MAX * 0.9) {
                                counter.style.color = '#ff6b00';
                            } else {
                                counter.style.color = '#666';
                            }
                        });
                        
                        masonryDescField.dataset.counterAdded = 'true';
                        console.log('[MASONRY-DESC:UI_COUNTER]', { enabled: true });
                    }
                }
            }
            // === SAFE-HOTFIX: MASONRY DESC LENGTH (END)
            
            // === SAFE-HOTFIX: MASONRY BUTTON FIX (BEGIN) - Removed binding, delegated to SSM
            // SimpleServiceManager handles button binding and delegates back to addMasonryServiceFromForm
            console.log('[MAS-CONFIG] Description field configured, button handled by SSM');
            // === SAFE-HOTFIX: MASONRY BUTTON FIX (END)
        },
        
        bindMasonryServiceButton: function() {
            // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (BEGIN)
            // Bind masonry service button - called when business type switches to masonry
            const addMasonryBtn = document.getElementById('add-masonry-service');
            if (addMasonryBtn) {
                if (!addMasonryBtn.dataset.masBound) {
                    addMasonryBtn.addEventListener('click', () => {
                        this.addMasonryServiceFromForm();
                    });
                    addMasonryBtn.dataset.masBound = '1';
                    console.log('[MAS-ADD:BIND]', { root: '#invoice-creation', rebind: true });
                }
            } else {
                console.log('[MAS-ADD:BIND_MISSING] Button not found');
            }
            // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (END)
        },
        
        bindEvents: function() {
            try {
                // Configure masonry description field
                this.configureMasonryDescriptionField();
                
                // Form submission
                const form = document.getElementById('invoice-form');
                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.handleInvoiceSubmission();
                    });
                }
                
                // Preview button
                const previewBtn = document.getElementById('preview-invoice');
                if (previewBtn) {
                    previewBtn.addEventListener('click', () => {
                        this.previewInvoice();
                    });
                }
                
                // Add Concrete Service button
                const addConcreteBtn = document.getElementById('add-concrete-service');
                if (addConcreteBtn) {
                    addConcreteBtn.addEventListener('click', () => {
                        this.addConcreteServiceFromForm();
                    });
                }
                
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (BEGIN)
                // Add Masonry Service button - use the new method
                this.bindMasonryServiceButton();
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (END)
                
            } catch (error) {
                console.error('Invoice Manager event binding error:', error);
            }
        },
        
        addConcreteServiceFromForm: function() {
            try {
                const description = document.getElementById('concrete-service-description')?.value?.trim();
                
                if (!description) {
                    alert('Please enter a service description');
                    document.getElementById('concrete-service-description')?.focus();
                    return;
                }
                
                // Get slab data from SlabManager if available
                let slabsData = [];
                let totalPrice = 0;
                
                if (window.SlabManager && typeof window.SlabManager.getSlabsData === 'function') {
                    slabsData = window.SlabManager.getSlabsData();
                    totalPrice = slabsData.reduce((sum, slab) => sum + (slab.price || 0), 0);
                }
                
                if (totalPrice <= 0) {
                    alert('Please add at least one slab with a valid price');
                    return;
                }
                
                // EMERGENCY FIX: Create enhanced service with verified slab details structure
                // This MUST match PDF.js expectations exactly (lines 570-578 in PDF.js)
                const service = {
                    id: 'concrete_' + Date.now(),
                    type: 'concrete',
                    description: description,
                    price: totalPrice,
                    amount: totalPrice, // EMERGENCY FIX: Ensure both price and amount are set
                    quantity: 1,
                    // EMERGENCY FIX: Include slab breakdown with EXACT structure for PDF.js
                    slabDetails: slabsData.map(slab => ({
                        dimensions: `${slab.length}'×${slab.width}'`, // EMERGENCY FIX: Use × symbol to match PDF format
                        liftHeight: slab.liftHeight,
                        sidesSettled: slab.sides,
                        squareFootage: slab.squareFootage,
                        price: slab.price
                    })),
                    totalSlabs: slabsData.length,
                    totalSquareFootage: slabsData.reduce((sum, slab) => sum + (slab.squareFootage || 0), 0)
                };
                
                // EMERGENCY FIX: Validate slab details structure before adding to invoice
                console.log('🚨 EMERGENCY VALIDATION: Service structure for PDF:', {
                    type: service.type,
                    description: service.description,
                    hasSlabDetails: !!service.slabDetails,
                    slabCount: service.slabDetails ? service.slabDetails.length : 0,
                    slabDetailsStructure: service.slabDetails ? service.slabDetails[0] : null
                });
                
                // EMERGENCY FIX: Verify each slab has required fields for PDF generation
                if (service.slabDetails && service.slabDetails.length > 0) {
                    service.slabDetails.forEach((slab, index) => {
                        const required = ['dimensions', 'liftHeight', 'sidesSettled', 'price'];
                        const missing = required.filter(field => !slab.hasOwnProperty(field));
                        if (missing.length > 0) {
                            console.error(`🚨 EMERGENCY ERROR: Slab ${index + 1} missing required fields:`, missing);
                        } else {
                            console.log(`✅ EMERGENCY VALIDATION: Slab ${index + 1} structure valid for PDF`);
                        }
                    });
                } else {
                    console.error('🚨 EMERGENCY ERROR: No slab details found - PDF itemization will fail');
                }
                
                this.addService(service);
                
                // Clear form and reset slabs
                document.getElementById('concrete-service-description').value = '';
                
                // Clear slab manager if available
                if (window.SlabManager && typeof window.SlabManager.clearAll === 'function') {
                    window.SlabManager.clearAll();
                }
                
                // Show success
                if (window.LoadingIndicator) {
                    window.LoadingIndicator.showSuccess('Concrete service added');
                }
                
            } catch (error) {
                console.error('Error adding concrete service:', error);
                alert('Error adding service: ' + error.message);
            }
        },
        
        addMasonryServiceFromForm: function() {
            try {
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (BEGIN)
                console.log('[MAS-ADD:CLICK]');
                
                // Check if we're in the right view
                const invoiceView = document.getElementById('invoice-creation');
                if (!invoiceView || invoiceView.style.display === 'none') {
                    console.log('[MAS-ADD:WRONG_VIEW] Not in invoice creation view');
                    return;
                }
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (END)
                
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('MASONRY_SERVICE_ADD_START');
                }
                
                // === SAFE-HOTFIX: MASONRY DESC LENGTH (BEGIN) - Validation
                // Null-safe element retrieval with guards
                const serviceTypeElement = document.getElementById('masonry-service');
                const descriptionElement = document.getElementById('masonry-description');
                const priceElement = document.getElementById('masonry-job-price');
                
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (BEGIN)
                // === SAFE-HOTFIX: MASONRY INVOICE REVIEW COLUMNS (BEGIN)
                const rawPrice = priceElement?.value?.trim() || '';
                const quantity = 1; // Default quantity for masonry jobs
                console.log('[MAS-ADD:INPUTS]', { 
                    descLen: descriptionElement?.value?.length || 0, 
                    rawPrice: rawPrice,
                    qty: quantity
                });
                // === SAFE-HOTFIX: MASONRY INVOICE REVIEW COLUMNS (END)
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (END)
                
                // Validate description length
                const MASONRY_DESC_MAX = 4000;
                if (descriptionElement && descriptionElement.value.length > MASONRY_DESC_MAX) {
                    alert(`Description must be ${MASONRY_DESC_MAX} characters or less`);
                    return;
                }
                console.log('[MASONRY-DESC:VALIDATION_OK]', { max: MASONRY_DESC_MAX });
                // === SAFE-HOTFIX: MASONRY DESC LENGTH (END)
                
                if (!serviceTypeElement || !descriptionElement || !priceElement) {
                    const missingElements = [];
                    if (!serviceTypeElement) missingElements.push('masonry-service');
                    if (!descriptionElement) missingElements.push('masonry-description');
                    if (!priceElement) missingElements.push('masonry-job-price');
                    
                    if (typeof diagnosticLog === 'function') {
                        diagnosticLog('MASONRY_ELEMENTS_MISSING', missingElements);
                    }
                    alert('Required form elements not found: ' + missingElements.join(', '));
                    return;
                }
                
                const serviceType = serviceTypeElement.value;
                const description = descriptionElement.value?.trim();
                const priceInput = priceElement.value?.trim();
                
                if (!serviceType) {
                    alert('Please select a service type');
                    serviceTypeElement.focus();
                    return;
                }
                
                if (!description) {
                    alert('Please enter a service description');
                    descriptionElement.focus();
                    return;
                }
                
                // Enhanced price validation with null guards
                if (!priceInput || priceInput === '') {
                    alert('Please enter a price');
                    document.getElementById('masonry-job-price')?.focus();
                    return;
                }
                
                const price = parseFloat(priceInput.replace(/[^\d.-]/g, ''));
                
                if (isNaN(price) || price <= 0) {
                    alert('Please enter a valid price greater than $0.00');
                    document.getElementById('masonry-job-price')?.focus();
                    return;
                }
                
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (BEGIN)
                const service = {
                    id: 'masonry_' + Date.now(),
                    type: 'masonry_' + serviceType,
                    description: description,
                    price: price,
                    quantity: 1,
                    amount: price, // Add amount for compatibility with addServiceToList
                    details: { jobPricing: true } // Mark as job-based pricing
                };
                
                // === SAFE-HOTFIX: MASONRY INVOICE REVIEW COLUMNS (BEGIN)
                console.log('[MAS-ADD:PARSED]', { price: price, qty: service.quantity, amount: service.amount });
                // === SAFE-HOTFIX: MASONRY INVOICE REVIEW COLUMNS (END)
                console.log('[MAS-ADD:STATE_OK]', { 
                    services: (this.currentInvoice?.services?.length || 0) + 1, 
                    subtotal: price 
                });
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (END)
                
                // === SAFE-HOTFIX: MASONRY DESC LENGTH (BEGIN) - Log pipeline
                console.log('[INV-MASONRY-DESC:PIPE_OK]', { len: description.length });
                // === SAFE-HOTFIX: MASONRY DESC LENGTH (END)
                
                this.addService(service);
                
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (BEGIN)
                // Log totals after update
                console.log('[INV-TOTALS:AFTER]', { 
                    subtotal: this.currentInvoice?.subtotal || 0, 
                    total: this.currentInvoice?.total || 0 
                });
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (END)
                
                // Clear form
                document.getElementById('masonry-service').value = '';
                document.getElementById('masonry-description').value = '';
                document.getElementById('masonry-job-price').value = '';
                
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (BEGIN)
                console.log('[MAS-ADD:CLEAR]', { 
                    descCleared: true, 
                    priceCleared: true 
                });
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (END)
                
                // Show success
                if (window.LoadingIndicator) {
                    window.LoadingIndicator.showSuccess('Masonry service added');
                }
                
            } catch (error) {
                console.error('Error adding masonry service:', error);
                alert('Error adding service: ' + error.message);
            }
        },
        
        addService: function(service) {
            try {
                // Initialize currentInvoice if not exists
                if (!this.currentInvoice || !this.currentInvoice.services) {
                    console.warn('Current invoice not initialized, initializing now...');
                    this.resetInvoice();
                }
                
                // Add service to current invoice
                this.currentInvoice.services.push(service);
                
                // Add to services list in UI
                this.addServiceToList(service);
                
                // Update totals
                this.updateInvoiceTotals();
                
                console.log('Service added to invoice:', service);
                console.log('Current invoice services count:', this.currentInvoice.services.length);
                
            } catch (error) {
                console.error('Add service error:', error);
                throw error;
            }
        },
        
        removeService: function(serviceId) {
            try {
                // Remove from current invoice
                this.currentInvoice.services = this.currentInvoice.services.filter(
                    service => service.id !== serviceId
                );
                
                // Remove from UI
                const serviceElement = document.querySelector(`[data-service-id="${serviceId}"]`);
                if (serviceElement) {
                    serviceElement.remove();
                }
                
                // Update totals
                this.updateInvoiceTotals();
                
                // Show empty message if no services
                this.checkEmptyServices();
                
            } catch (error) {
                console.error('Remove service error:', error);
            }
        },
        
        addServiceToList: function(service) {
            try {
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (BEGIN)
                let servicesList = document.getElementById('services-list');
                const hasServicesList = !!servicesList;
                if (!servicesList) {
                    servicesList = document.getElementById('invoice-services-list');
                }
                console.log('[MAS-ADD:LIST_TARGET]', { 
                    '#services-list': hasServicesList, 
                    '#invoice-services-list': !hasServicesList && !!servicesList 
                });
                if (!servicesList) {
                    console.log('[MAS-ADD:LIST_NOT_FOUND]');
                    return;
                }
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (END)
                
                // Remove empty message if present
                const emptyMessage = servicesList.querySelector('.empty-services');
                if (emptyMessage) {
                    emptyMessage.remove();
                }
                
                // === SAFE-HOTFIX: MASONRY INVOICE REVIEW COLUMNS (BEGIN)
                // Create service item - different rendering for masonry vs concrete
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.setAttribute('data-service-id', service.id);
                serviceItem.setAttribute('data-service-type', service.type?.includes('masonry') ? 'masonry' : 'concrete');
                
                if (service.details && service.details.jobPricing) {
                    // Masonry services - show description with line breaks, quantity and amount
                    console.log('[MAS-REVIEW:RENDER_START]', { target: hasServicesList ? '#services-list' : '#invoice-services-list' });
                    
                    // Convert newlines to <br> tags for proper line break display
                    const descriptionWithBreaks = (service.description || '').replace(/\n/g, '<br>');
                    
                    serviceItem.className += ' service-item--masonry';
                    // === VERSION 9.18: Removed quantity display from masonry invoice per user request
                    serviceItem.innerHTML = `
                        <div class="service-row-masonry" style="padding: 15px; border-bottom: 1px solid #ddd;">
                            <div class="service-description-masonry" style="margin-bottom: 10px;">
                                <strong>Description:</strong><br>
                                <div style="white-space: pre-line; margin-top: 5px;">${descriptionWithBreaks}</div>
                            </div>
                            <div style="display: flex; justify-content: flex-end; align-items: center;">
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
                    
                    console.log('[MAS-REVIEW:RENDER_OK]', { 
                        rowId: service.id, 
                        qty: service.quantity || 1, 
                        amount: service.amount 
                    });
                } else {
                    // Concrete services - keep existing full display
                    // === VERSION 9.15 FIX: Display dimensions without rate info
                    const displayDescription = service.dimensions ? 
                        `${service.description} - ${service.dimensions}` : 
                        service.description;
                    // V9.15: Removed quantity × rate display per user request
                    
                    serviceItem.innerHTML = `
                        <div class="service-details">
                            <h4>${displayDescription}</h4>
                            ${service.details ? this.getServiceDetailsHtml(service.details) : ''}
                        </div>
                        <div class="service-actions">
                            <span class="service-amount">${this.formatCurrency(service.amount)}</span>
                            <button class="remove-service" onclick="JStarkInvoicing.InvoiceManager.removeService('${service.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                }
                // === SAFE-HOTFIX: MASONRY INVOICE REVIEW COLUMNS (END)
                
                servicesList.appendChild(serviceItem);
                
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (BEGIN)
                const rowCount = servicesList.querySelectorAll('.service-item').length;
                console.log('[MAS-ADD:DOM_OK]', { rows: rowCount });
                // === SAFE-HOTFIX: MASONRY INVOICE ADD-SERVICE (END)
                
            } catch (error) {
                console.error('Add service to list error:', error);
            }
        },
        
        getServiceDetailsHtml: function(details) {
            try {
                let html = '';
                
                // Enhanced service details with pricing intelligence
                if (details.customPricing && details.customPricing.validation) {
                    const validation = details.customPricing.validation;
                    const pricing = details.customPricing;
                    
                    // Show pricing decision info
                    const pricingInfo = [];
                    
                    if (validation.withinSuggestedRange) {
                        pricingInfo.push('<span class="price-status optimal">✓ Optimal pricing</span>');
                    } else if (validation.premiumPricing) {
                        pricingInfo.push('<span class="price-status premium">↑ Premium pricing</span>');
                    } else if (validation.significantlyBelowCost) {
                        pricingInfo.push('<span class="price-status warning">⚠ Below cost threshold</span>');
                    }
                    
                    if (pricing.profitMargin && pricing.profitMargin.custom) {
                        pricingInfo.push(`<span class="profit-margin">${pricing.profitMargin.custom}% margin</span>`);
                    }
                    
                    if (pricingInfo.length > 0) {
                        html += `<small class="pricing-intelligence">${pricingInfo.join(' • ')}</small>`;
                    }
                }
                
                // Traditional service details
                if (details.projectType) {
                    const multiplierInfo = [];
                    if (details.multipliers && details.multipliers.total > 1) {
                        if (details.severity !== 'mild') {
                            multiplierInfo.push(`${details.severity} damage`);
                        }
                        if (details.accessibility !== 'easy') {
                            multiplierInfo.push(`${details.accessibility} access`);
                        }
                    }
                    
                    if (multiplierInfo.length > 0) {
                        html += `<small class="service-modifiers">${multiplierInfo.join(', ')}</small>`;
                    }
                }
                
                // Settlement and complexity info for enhanced services
                if (details.settlement && details.dimensions) {
                    const techInfo = [];
                    if (details.settlement.inchesSettled > 1) {
                        techInfo.push(`${details.settlement.inchesSettled}" settlement`);
                    }
                    if (details.settlement.sidesSettled > 1) {
                        techInfo.push(`${details.settlement.sidesSettled} sides`);
                    }
                    if (details.materials && details.materials.materialWeight) {
                        techInfo.push(`${Math.round(details.materials.materialWeight)} lbs material`);
                    }
                    
                    if (techInfo.length > 0) {
                        html += `<small class="technical-details">${techInfo.join(' • ')}</small>`;
                    }
                }
                
                return html;
                
            } catch (error) {
                console.error('Service details HTML error:', error);
                return '';
            }
        },
        
        updateInvoiceTotals: function() {
            try {
                // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (BEGIN) - Add logging
                // Calculate subtotal from services
                const subtotal = this.currentInvoice.services.reduce((sum, service) => {
                    const serviceAmount = service.amount || service.price || service.total || service.unitPrice || 0;
                    console.log('[INV-TOTALS:SERVICE]', { 
                        id: service.id, 
                        amount: service.amount,
                        price: service.price,
                        total: service.total,
                        unitPrice: service.unitPrice,
                        using: serviceAmount
                    });
                    return sum + serviceAmount;
                }, 0);
                // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
                
                // No tax calculation
                const tax = 0;
                
                // Total equals subtotal (no tax)
                const total = subtotal;
                
                // Update current invoice
                this.currentInvoice.subtotal = subtotal;
                this.currentInvoice.tax = tax;
                this.currentInvoice.total = total;
                
                // Update UI (with null checks for removed elements)
                const subtotalEl = document.getElementById('invoice-subtotal');
                if (subtotalEl) subtotalEl.textContent = this.formatCurrency(subtotal);
                
                const taxEl = document.getElementById('invoice-tax');
                if (taxEl) taxEl.textContent = this.formatCurrency(tax);
                
                const totalEl = document.getElementById('invoice-grand-total');
                if (totalEl) totalEl.textContent = this.formatCurrency(total);
                
            } catch (error) {
                console.error('Update totals error:', error);
            }
        },
        
        // Normalize service to ensure consistent amount calculation
        normalizeService: function(line) {
            const normalized = { ...line };
            
            // Calculate amount based on available fields
            if (typeof normalized.amount === 'number' && normalized.amount > 0) {
                // Already has amount
            } else if (typeof normalized.price === 'number') {
                normalized.amount = normalized.price * (normalized.quantity || 1);
            } else if (typeof normalized.unitPrice === 'number') {
                normalized.amount = normalized.unitPrice * (normalized.quantity || 1);
            } else if (typeof normalized.total === 'number') {
                normalized.amount = normalized.total;
            } else {
                normalized.amount = 0;
            }
            
            return normalized;
        },
        
        // Calculate totals for an invoice object (not using this)
        calculateTotals: function(inv) {
            if (!inv) inv = InvoiceManager.currentInvoice;
            if (!inv.services) inv.services = [];
            
            // Normalize all services and calculate subtotal
            const subtotal = inv.services.reduce((sum, service) => {
                const normalized = InvoiceManager.normalizeService(service);
                return sum + (normalized.amount || 0);
            }, 0);
            
            // No tax
            const tax = 0;
            const total = subtotal;
            
            // Update invoice object
            inv.subtotal = subtotal;
            inv.tax = tax;
            inv.total = total;
            
            return { subtotal, tax, total };
        },
        
        checkEmptyServices: function() {
            try {
                const servicesList = document.getElementById('services-list');
                const serviceItems = servicesList.querySelectorAll('.service-item');
                
                if (serviceItems.length === 0) {
                    servicesList.innerHTML = '<p class="empty-services">No services added yet. Add services using the sections above.</p>';
                }
                
            } catch (error) {
                console.error('Check empty services error:', error);
            }
        },
        
        handleInvoiceSubmission: function(formData) {
            try {
                console.log('[IM_SUBMIT] Starting InvoiceManager submission');
                
                // Ensure currentInvoice exists
                if (!this.currentInvoice) {
                    this.currentInvoice = {};
                }
                
                const inv = this.currentInvoice;
                
                // Ensure services array exists
                if (!inv.services) inv.services = [];
                
                // Calculate totals before validation
                try {
                    this.calculateTotals(inv);
                } catch (e) {
                    console.warn('[IM_SUBMIT] Totals calc failed:', e.message);
                    inv.subtotal = inv.subtotal || 0;
                    inv.total = inv.total || inv.subtotal;
                }
                
                // Validate form (non-blocking)
                try {
                    if (!this.validateInvoiceForm()) {
                        console.warn('[IM_SUBMIT] Validation failed but continuing');
                    }
                } catch (e) {
                    console.warn('[IM_SUBMIT] Validation error:', e.message);
                }
                
                // Collect form data
                try {
                    this.collectFormData();
                } catch (e) {
                    console.warn('[IM_SUBMIT] Form collection failed:', e.message);
                    // Use FormData as fallback
                    if (formData) {
                        inv.customerName = formData.get('customerName') || inv.customerName;
                        inv.businessType = formData.get('businessType') || inv.businessType;
                    }
                }
                
                // Generate invoice number if new
                if (!inv.id) {
                    inv.id = this.generateInvoiceId();
                    inv.number = window.App?.AppState?.nextInvoiceNumber || 1;
                }
                
                // Ensure required fields
                inv.date = inv.date || new Date().toISOString();
                inv.status = inv.status || 'paid';
                
                // Save invoice
                try {
                    this.saveInvoice();
                    console.log('[IM_SUBMIT] Invoice saved to storage');
                } catch (e) {
                    console.error('[IM_SUBMIT] Save failed:', e.message);
                    // Try direct localStorage save
                    try {
                        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
                        const idx = invoices.findIndex(i => i.id === inv.id);
                        if (idx >= 0) invoices[idx] = inv;
                        else invoices.push(inv);
                        localStorage.setItem('invoices', JSON.stringify(invoices));
                        console.log('[IM_SUBMIT] Direct save successful');
                    } catch (e2) {
                        console.error('[IM_SUBMIT] Direct save also failed:', e2.message);
                    }
                }
                
                // Update AppState if available
                try {
                    if (window.App?.AppState) {
                        window.App.AppState.nextInvoiceNumber = (window.App.AppState.nextInvoiceNumber || 1) + 1;
                        window.App.saveData();
                        window.App.updateDashboard();
                        console.log(`[IM_SUBMIT] AppState updated: Invoice #${inv.number}`);
                    }
                } catch (e) {
                    console.warn('[IM_SUBMIT] AppState update failed:', e.message);
                }
                
                // Return true to indicate success
                console.log('[IM_SUBMIT] Complete - returning true');
                return true;
                
            } catch (error) {
                console.error('Invoice submission error:', error);
                if (window.App) {
                    window.App.showError('Failed to create invoice. Please try again.');
                }
                // Return false to indicate failure
                return false;
            }
        },
        
        validateInvoiceForm: function() {
            try {
                let isValid = true;
                const errors = [];
                
                // Check business type (radio buttons)
                const businessTypeRadio = document.querySelector('input[name="businessType"]:checked');
                if (!businessTypeRadio) {
                    errors.push('Business Type is required');
                    isValid = false;
                }
                
                // Check other required fields
                const requiredFields = [
                    { id: 'customer-name', name: 'Customer Name' },
                    { id: 'invoice-date', name: 'Invoice Date' }
                ];
                
                requiredFields.forEach(field => {
                    const element = document.getElementById(field.id);
                    if (!element || !element.value.trim()) {
                        errors.push(`${field.name} is required`);
                        isValid = false;
                        
                        // Add error styling
                        if (element) {
                            element.style.borderColor = '#dc3545';
                        }
                    } else {
                        // Remove error styling
                        if (element) {
                            element.style.borderColor = '';
                        }
                    }
                });
                
                // Validate customer address structure
                const addressValidation = this.validateCustomerAddress();
                if (!addressValidation.valid) {
                    errors.push(...addressValidation.errors);
                    isValid = false;
                }
                
                // Check if services are added
                if (this.currentInvoice.services.length === 0) {
                    errors.push('At least one service must be added');
                    isValid = false;
                } else {
                    // Validate services - especially masonry pricing
                    const serviceValidation = this.validateServices();
                    if (!serviceValidation.valid) {
                        errors.push(...serviceValidation.errors);
                        isValid = false;
                    }
                }
                
                // Validate totals for safety
                const totalValidation = InvoiceManager.validateInvoiceTotals();
                if (!totalValidation.valid) {
                    errors.push(...totalValidation.errors);
                    isValid = false;
                }
                
                // Show errors if any
                if (!isValid) {
                    const errorMessage = 'Please fix the following errors:\n\n• ' + errors.join('\n• ');
                    this.showValidationError(errorMessage);
                }
                
                return isValid;
                
            } catch (error) {
                console.error('Form validation error:', error);
                this.showValidationError('Validation failed. Please check your input and try again.');
                return false;
            }
        },
        
        validateCustomerAddress: function() {
            const result = { valid: true, errors: [] };
            
            // Address is optional, but if any part is provided, street should be included
            const street = document.getElementById('customer-street')?.value?.trim();
            const city = document.getElementById('customer-city')?.value?.trim();
            const state = document.getElementById('customer-state')?.value?.trim();
            const zip = document.getElementById('customer-zip')?.value?.trim();
            
            const hasAnyAddress = street || city || state || zip;
            
            if (hasAnyAddress) {
                if (!street) {
                    result.valid = false;
                    result.errors.push('Street address is required when providing address information');
                }
                
                // Basic state validation (2 characters)
                if (state && state.length !== 2) {
                    result.valid = false;
                    result.errors.push('State should be 2 characters (e.g., OH, CA, TX)');
                }
                
                // Basic zip validation
                if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) {
                    result.valid = false;
                    result.errors.push('ZIP code should be 5 digits or 5+4 format (e.g., 12345 or 12345-6789)');
                }
            }
            
            return result;
        },
        
        validateServices: function() {
            const result = { valid: true, errors: [] };
            
            for (let i = 0; i < this.currentInvoice.services.length; i++) {
                const service = this.currentInvoice.services[i];
                
                // Validate service has required fields
                if (!service.description || service.description.trim() === '') {
                    result.valid = false;
                    result.errors.push(`Service ${i + 1}: Description is required`);
                }
                
                // Validate pricing
                const price = parseFloat(service.price || service.amount || 0);
                if (isNaN(price) || price <= 0) {
                    result.valid = false;
                    result.errors.push(`Service ${i + 1}: Price must be greater than $0.00`);
                } else if (price > 100000) {
                    result.valid = false;
                    result.errors.push(`Service ${i + 1}: Price seems unusually high ($${price.toFixed(2)}). Please verify.`);
                }
                
                // Special validation for masonry services
                if (service.type === 'masonry') {
                    if (!service.serviceType) {
                        result.valid = false;
                        result.errors.push(`Masonry service ${i + 1}: Service type is required`);
                    }
                    if (service.description.length < 5) {
                        result.valid = false;
                        result.errors.push(`Masonry service ${i + 1}: Description should be at least 5 characters`);
                    }
                }
                
                // Special validation for concrete services
                if (service.type === 'concrete') {
                    if (!service.slabDetails || service.slabDetails.length === 0) {
                        result.valid = false;
                        result.errors.push(`Concrete service ${i + 1}: Must include slab details`);
                    }
                }
            }
            
            return result;
        },
        
        validateInvoiceTotals: function(inv) {
            if (!inv) inv = InvoiceManager.currentInvoice;
            const result = { valid: true, errors: [] };
            
            // Recalculate totals to ensure consistency
            InvoiceManager.calculateTotals(inv);
            
            // Validate subtotal matches services
            const serviceTotal = inv.services.reduce((sum, service) => {
                const normalized = InvoiceManager.normalizeService(service);
                return sum + (normalized.amount || 0);
            }, 0);
            
            const displayedSubtotal = parseFloat(inv.subtotal || 0);
            const diff = Math.abs(serviceTotal - displayedSubtotal);
            
            if (diff > 0.01) { // Allow for small rounding differences
                result.valid = false;
                result.errors.push('Invoice totals do not match services. Please refresh and try again.');
                console.error('Total mismatch:', { serviceTotal, displayedSubtotal, difference: diff });
            }
            
            // Ensure total is reasonable
            if (inv.total <= 0) {
                result.valid = false;
                result.errors.push('Invoice total must be greater than $0.00');
            } else if (inv.total > 250000) {
                result.valid = false;
                result.errors.push('Invoice total seems unusually high. Please verify all services and prices.');
            }
            
            return result;
        },
        
        showValidationError: function(message) {
            // Use notification system if available, otherwise fallback to alert
            if (window.NotificationSystem) {
                window.NotificationSystem.showError(message);
            } else {
                alert(message);
            }
        },
        
        collectFormData: function() {
            try {
                // Get form values
                // Get business type from radio buttons
                const businessTypeRadio = document.querySelector('input[name="businessType"]:checked');
                this.currentInvoice.businessType = businessTypeRadio ? businessTypeRadio.value : '';
                
                // Collect customer information with structured address
                this.currentInvoice.customer.name = document.getElementById('customer-name').value.trim();
                this.currentInvoice.customer.email = document.getElementById('customer-email').value.trim();
                this.currentInvoice.customer.phone = document.getElementById('customer-phone').value.trim();
                this.currentInvoice.customer.street = document.getElementById('customer-street')?.value?.trim() || '';
                this.currentInvoice.customer.city = document.getElementById('customer-city')?.value?.trim() || '';
                this.currentInvoice.customer.state = document.getElementById('customer-state')?.value?.trim() || '';
                this.currentInvoice.customer.zip = document.getElementById('customer-zip')?.value?.trim() || '';
                
                this.currentInvoice.date = document.getElementById('invoice-date').value;
                // === VERSION 9.17: Notes field removed from UI, set to empty
                this.currentInvoice.notes = '';
                this.currentInvoice.status = document.getElementById('invoice-status').value;
                
                // J-Stark Surgical Fix: Enhanced signature collection
                if (window.Signature && !window.Signature.isEmpty()) {
                    this.currentInvoice.signature = window.Signature.toDataURL();
                } else {
                    // Fallback: use same method as estimates
                    this.currentInvoice.signature = this.getSignatureData();
                }
                
                // Set creation timestamp
                this.currentInvoice.createdAt = new Date().toISOString();
                this.currentInvoice.updatedAt = new Date().toISOString();
                
            } catch (error) {
                console.error('Collect form data error:', error);
            }
        },
        
        saveInvoice: function() {
            try {
                // Use centralized storage manager to prevent duplicates
                if (window.StorageManager) {
                    const success = window.StorageManager.addInvoice({ ...this.currentInvoice });
                    if (!success) {
                        console.error('❌ Failed to save invoice via StorageManager');
                        throw new Error('StorageManager save failed');
                    }
                    console.log('✅ Invoice saved via centralized StorageManager');
                    return;
                }
                
                // Fallback to original method if StorageManager not available
                console.warn('⚠️ StorageManager not available, using fallback save method');
                if (window.App && window.App.AppState) {
                    // Check if invoice already exists (editing)
                    const existingIndex = window.App.AppState.invoices.findIndex(inv => inv.id === this.currentInvoice.id);
                    
                    if (existingIndex >= 0) {
                        // Update existing invoice
                        window.App.AppState.invoices[existingIndex] = { ...this.currentInvoice };
                    } else {
                        // Add new invoice
                        window.App.AppState.invoices.push({ ...this.currentInvoice });
                    }
                } else {
                    // Fallback to direct localStorage access
                    let invoices = [];
                    try {
                        const stored = localStorage.getItem('jstark_invoices');
                        if (stored) {
                            invoices = JSON.parse(stored);
                        }
                    } catch (e) {
                        console.error('Error loading invoices from localStorage:', e);
                    }
                    
                    const existingIndex = invoices.findIndex(inv => inv.id === this.currentInvoice.id);
                    
                    if (existingIndex >= 0) {
                        invoices[existingIndex] = { ...this.currentInvoice };
                    } else {
                        invoices.push({ ...this.currentInvoice });
                    }
                    
                    localStorage.setItem('jstark_invoices', JSON.stringify(invoices));
                }
                
            } catch (error) {
                console.error('Save invoice error:', error);
            }
        },
        
        previewInvoice: function() {
            try {
                // Ensure services array exists and calculate totals
                const inv = InvoiceManager.currentInvoice;
                if (!inv.services) inv.services = [];
                
                // Normalize customer data
                inv.customer = InvoiceManager.normalizeCustomer(inv);
                
                InvoiceManager.calculateTotals(inv);
                
                // Validate form first
                if (!InvoiceManager.validateInvoiceForm()) {
                    return;
                }
                
                // Collect current form data
                this.collectFormData();
                
                // Generate preview
                if (window.App) {
                    App.showInvoicePreview(this.currentInvoice);
                } else {
                    this.generateInvoicePreview(this.currentInvoice);
                }
                
            } catch (error) {
                console.error('Preview invoice error:', error);
            }
        },
        
        // Clean preview entry point - handles string or object
        showInvoicePreview: function(invoiceLike) {
            try {
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('PREVIEW_START', { type: typeof invoiceLike, id: invoiceLike?.id });
                }
                
                let invoice;
                if (typeof invoiceLike === 'string') {
                    invoice = this.resolveInvoiceById(invoiceLike);
                } else if (typeof invoiceLike === 'object') {
                    // Normalize invoice object
                    invoice = this.normalizeInvoiceData(invoiceLike);
                } else {
                    throw new Error('Invalid invoice data type');
                }
                
                if (!invoice) {
                    this.showError('Invoice not found or invalid');
                    return false;
                }
                
                this.generateInvoicePreview(invoice);
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('PREVIEW_COMPLETE', { invoiceId: invoice.id, services: invoice.services?.length });
                }
                return true;
            } catch (error) {
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('PREVIEW_ERROR', { error: error.message, stack: error.stack });
                }
                console.error('Preview error:', error);
                this.showError('Unable to show preview: ' + error.message);
                return false;
            }
        },
        
        // Normalize invoice data to prevent preview issues
        normalizeInvoiceData: function(invoiceData) {
            if (!invoiceData || typeof invoiceData !== 'object') {
                return null;
            }
            
            return {
                id: invoiceData.id || 'temp_' + Date.now(),
                number: invoiceData.number || 'DRAFT',
                businessType: invoiceData.businessType || 'concrete',
                customer: {
                    name: (invoiceData.customer?.name || '').toString().trim(),
                    email: (invoiceData.customer?.email || '').toString().trim(),
                    phone: (invoiceData.customer?.phone || '').toString().trim(),
                    street: (invoiceData.customer?.street || '').toString().trim(),
                    city: (invoiceData.customer?.city || '').toString().trim(),
                    state: (invoiceData.customer?.state || '').toString().trim(),
                    zip: (invoiceData.customer?.zip || '').toString().trim()
                },
                date: invoiceData.date || new Date().toISOString().split('T')[0],
                services: Array.isArray(invoiceData.services) ? invoiceData.services : [],
                subtotal: Number(invoiceData.subtotal) || 0,
                tax: Number(invoiceData.tax) || 0,
                total: Number(invoiceData.total) || 0,
                notes: (invoiceData.notes || '').toString(),
                status: invoiceData.status || 'draft',
                signature: invoiceData.signature || null
            };
        },
        
        generateInvoicePreview: function(invoice) {
            try {
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('GENERATE_PREVIEW', { invoiceId: invoice.id, businessType: invoice.businessType });
                }
                
                // === SAFE-HOTFIX: CONVERT→PREVIEW→PDF ID FIX (BEGIN)
                // === SAFE-HOTFIX: PREVIEW_PIPELINE (BEGIN)
                // Always set the previewed invoice and clear estimate preview
                this.previewedInvoice = invoice;
                this.selectedInvoiceId = invoice.id;
                this.previewedEstimate = null;
                if (window.EstimateManager) {
                    window.EstimateManager.previewedEstimate = null;
                }
                console.log('[PREVIEW:SET] {type:\'invoice\', id:\'' + invoice.id + '\', number:' + invoice.number + '}');
                console.log('[PREVIEW:READY] {services:' + (invoice.services ? invoice.services.length : 0) + ',total:' + invoice.total + '}');
                // === SAFE-HOTFIX: PREVIEW_PIPELINE (END)
                // === SAFE-HOTFIX: CONVERT→PREVIEW→PDF ID FIX (END)
                
                // === SAFE-HOTFIX: MASONRY INVOICE (BEGIN)
                // Additional logging for masonry invoice preview
                if (invoice.businessType === 'masonry') {
                    console.log('[MAS-PREVIEW:SET] {id:\'' + invoice.id + '\', businessType:\'masonry\', servicesCount:' + (invoice.services ? invoice.services.length : 0) + ', subtotal:' + invoice.subtotal + '}');
                    console.log('[MAS-PREVIEW:READY]');
                }
                // === SAFE-HOTFIX: MASONRY INVOICE (END)
                
                const previewContent = document.getElementById('invoice-preview-content');
                if (!previewContent) {
                    if (typeof diagnosticLog === 'function') {
                        diagnosticLog('PREVIEW_ELEMENT_MISSING', 'invoice-preview-content not found');
                    }
                    return;
                }
                
                const businessInfo = this.getBusinessInfo(invoice.businessType);
                
                // Get warranty block if concrete
                let warrantyBlock = '';
                if (window.PDFGenerator && window.PDFGenerator.renderWarrantyPreviewBlock) {
                    warrantyBlock = window.PDFGenerator.renderWarrantyPreviewBlock(invoice);
                }
                
                const invoiceHtml = `
                    <div class="invoice-document business-${invoice.businessType}">
                        ${this.generateInvoiceHeader(invoice, businessInfo)}
                        ${this.generateCustomerSection(invoice)}
                        ${this.generateServicesTable(invoice)}
                        ${this.generateTotalsSection(invoice)}
                        ${this.generateNotesSection(invoice)}
                        ${this.generateFooterSection(invoice, businessInfo)}
                    </div>
                    ${warrantyBlock}
                `;
                
                previewContent.innerHTML = invoiceHtml;
                
            } catch (error) {
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('GENERATE_PREVIEW_ERROR', { error: error.message });
                }
                console.error('Generate invoice preview error:', error);
            }
        },
        
        getBusinessInfo: function(businessType) {
            const businesses = {
                concrete: {
                    name: 'Superior Concrete Leveling LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com',
                    website: 'superiorconcrete.com'
                },
                masonry: {
                    name: 'J. Stark Masonry & Construction LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com',
                    website: 'jstarkmasonry.com'
                }
            };
            
            return businesses[businessType] || businesses.concrete;
        },
        
        renderCustomerBlock: function(inv) {
            // Ensure customer is normalized
            const customer = this.normalizeCustomer(inv);
            const lines = formatAddressLines(customer);
            
            // Build HTML for customer block
            const html = lines.map(line => `<div>${line}</div>`).join('');
            return `<div class="customer-info-block">${html}</div>`;
        },
        
        generateInvoiceHeader: function(invoice, businessInfo) {
            return `
                <div class="invoice-header">
                    <div class="company-details">
                        <img src="https://i.imgur.com/u294xgL.png" alt="Company Logo" class="company-logo">
                        <h2>${businessInfo.name}</h2>
                        <p>${businessInfo.address}</p>
                        <p>Phone: ${businessInfo.phone}</p>
                        <p>Email: ${businessInfo.email}</p>
                    </div>
                    <div class="invoice-meta">
                        <div class="invoice-number">Invoice #${invoice.number || 'PREVIEW'}</div>
                        <div class="invoice-date">Date: ${this.formatDate(invoice.date)}</div>
                        <div class="invoice-status">Status: ${(invoice.status || 'draft').toUpperCase()}</div>
                    </div>
                </div>
            `;
        },
        
        generateCustomerSection: function(invoice) {
            // Build customer object with proper fallbacks
            const customer = invoice.customer || {
                name: invoice.customerName || '',
                email: invoice.customerEmail || '',
                phone: invoice.customerPhone || '',
                street: '',
                city: '',
                state: '',
                zip: ''
            };
            
            // Format address lines
            const addressLines = formatAddressLines(customer);
            const addressHTML = addressLines.map(line => `<p>${line}</p>`).join('');
            
            return `
                <div class="customer-section">
                    <h3>Bill To:</h3>
                    ${addressHTML}
                    ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
                    ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
                </div>
            `;
        },
        
        generateServicesTable: function(invoice) {
            if (!invoice.services || invoice.services.length === 0) {
                return '<div class="no-services">No services added</div>';
            }
            
            // === SAFE-HOTFIX: MASONRY INVOICE (BEGIN)
            // === VERSION 9.19: Check if this is a masonry invoice OR has jobPricing services - show only 2 columns
            const isMasonryInvoice = invoice.businessType === 'masonry' || 
                                    invoice.services.some(s => s.details?.jobPricing === true);
            if (isMasonryInvoice) {
                console.log('[MAS-PREVIEW:SET] {id:\'' + invoice.id + '\', businessType:\'masonry\', servicesCount:' + invoice.services.length + ', subtotal:' + invoice.subtotal + '}');
                
                const servicesRows = invoice.services.map(service => {
                    const amount = service.amount || service.price || 0;
                    console.log('[MAS-MAP:SERVICE] {description:\'' + (service.description || '').substring(0, 50) + '...\', amount:' + amount + '}');
                    
                    return `
                        <tr>
                            <td style="white-space: pre-line;">${(service.description || '').replace(/\n/g, '<br>')}</td>
                            <td class="amount">${this.formatCurrency(amount)}</td>
                        </tr>
                    `;
                }).join('');
                
                console.log('[MAS-PREVIEW:TABLE] {columns: [\'Description\',\'Amount\'], rows:' + invoice.services.length + '}');
                console.log('[MAS-PREVIEW:READY]');
                
                return `
                    <table class="invoice-services-table" data-hotfix="masonry-invoice">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${servicesRows}
                        </tbody>
                    </table>
                `;
            }
            // === SAFE-HOTFIX: MASONRY INVOICE (END)
            
            const servicesRows = invoice.services.map(service => {
                // Handle display differently for job-based pricing vs quantity-based pricing
                if (service.details && service.details.jobPricing) {
                    // === SAFE-HOTFIX: MASONRY DESC LENGTH (BEGIN) - PDF check
                    if (service.description && service.description.length > 100) {
                        console.log('[INV-MASONRY-DESC:PDF_OK]', { len: service.description.length });
                    }
                    // === SAFE-HOTFIX: MASONRY DESC LENGTH (END)
                    
                    // Job-based pricing (masonry) - show as single job
                    return `
                        <tr>
                            <td style="white-space: pre-line;">${(service.description || '').replace(/\n/g, '<br>')}</td>
                            <td class="amount">1</td>
                            <td class="amount">job</td>
                            <td class="amount">${this.formatCurrency(service.amount)}</td>
                            <td class="amount">${this.formatCurrency(service.amount)}</td>
                        </tr>
                    `;
                } else {
                    // Quantity-based pricing (concrete)
                    // === VERSION 9.24: Append dimensions to description for display
                    const displayDesc = service.dimensions ? 
                        `${service.description} - ${service.dimensions}` : 
                        service.description;
                    return `
                        <tr>
                            <td style="white-space: pre-line;">${(displayDesc || '').replace(/\n/g, '<br>')}</td>
                            <td class="amount">${service.quantity}</td>
                            <td class="amount">${service.unit}</td>
                            <td class="amount">${this.formatCurrency(service.rate)}</td>
                            <td class="amount">${this.formatCurrency(service.amount)}</td>
                        </tr>
                    `;
                }
            }).join('');
            
            return `
                <table class="invoice-services-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${servicesRows}
                    </tbody>
                </table>
            `;
        },
        
        generateTotalsSection: function(invoice) {
            // === SAFE-HOTFIX: MASONRY INVOICE (BEGIN)
            // For masonry, ensure no tax is included in totals
            if (invoice.businessType === 'masonry') {
                const subtotal = invoice.subtotal || 0;
                const total = subtotal; // No tax for masonry
                console.log('[MAS-PREVIEW:TOTALS] {subtotal:' + subtotal + ', total:' + total + '}');
                
                return `
                    <div class="invoice-totals-section" data-hotfix="masonry-invoice">
                        <table class="invoice-totals-table">
                            <tr>
                                <td class="total-label">Subtotal:</td>
                                <td class="total-amount">${this.formatCurrency(subtotal)}</td>
                            </tr>
                            <tr class="grand-total">
                                <td class="total-label">Total:</td>
                                <td class="total-amount">${this.formatCurrency(total)}</td>
                            </tr>
                        </table>
                    </div>
                `;
            }
            // === SAFE-HOTFIX: MASONRY INVOICE (END)
            
            // No tax row at all for other business types
            return `
                <div class="invoice-totals-section">
                    <table class="invoice-totals-table">
                        <tr>
                            <td class="total-label">Subtotal:</td>
                            <td class="total-amount">${this.formatCurrency(invoice.subtotal)}</td>
                        </tr>
                        <tr class="grand-total">
                            <td class="total-label"><strong>Total:</strong></td>
                            <td class="total-amount"><strong>${this.formatCurrency(invoice.total)}</strong></td>
                        </tr>
                    </table>
                </div>
            `;
        },
        
        generateNotesSection: function(invoice) {
            if (!invoice.notes || !invoice.notes.trim()) {
                return '';
            }
            
            return `
                <div class="invoice-notes">
                    <h4>Notes:</h4>
                    <p>${invoice.notes.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        },
        
        generateFooterSection: function(invoice, businessInfo) {
            const warrantySection = this.generateWarrantySection(invoice);
            
            return `
                <div class="invoice-footer">
                    <div class="payment-terms">
                        <h4>Payment Terms</h4>
                        <p>Full payment required at completion unless alternate terms are agreed in advance.</p>
                        <p>Make checks payable to: ${businessInfo.name}</p>
                        <p>Mail payments to: ${businessInfo.address}</p>
                        <p>For questions about this invoice, please contact us at ${businessInfo.phone}</p>
                    </div>
                    ${warrantySection}
                    <p>Thank you for your business!</p>
                </div>
            `;
        },
        
        generateInvoiceId: function() {
            return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        generateWarrantySection: function(invoiceOrEstimate) {
            // Only show warranty reference for concrete leveling services
            if (invoiceOrEstimate.businessType !== 'concrete') {
                return '';
            }
            
            // Check if there are any concrete leveling services
            const hasConcreteServices = invoiceOrEstimate.services && 
                invoiceOrEstimate.services.some(service => 
                    service.description.toLowerCase().includes('concrete') ||
                    service.description.toLowerCase().includes('leveling') ||
                    service.description.toLowerCase().includes('lifting')
                );
            
            if (!hasConcreteServices) {
                return '';
            }
            
            return `
                <div class="warranty-section">
                    <h4>10-Year Limited Warranty for Concrete Leveling</h4>
                    <p class="warranty-reference-text">
                        <strong>See Page 2: 10-Year Warranty Terms & Conditions</strong><br>
                        Complete warranty details, coverage terms, exclusions, and claim procedures 
                        are provided on the attached warranty page.
                    </p>
                </div>
            `;
        },
        
        formatCurrency: function(amount) {
            try {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(amount || 0);
            } catch (error) {
                return '$' + (amount || 0).toFixed(2);
            }
        },
        
        formatDate: function(date) {
            try {
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                return date;
            }
        },
        
        // Reset current invoice
        resetInvoice: function() {
            this.currentInvoice = {
                id: null,
                number: null,
                businessType: '',
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                customer: {
                    name: '',
                    email: '',
                    phone: '',
                    street: '',
                    city: '',
                    state: '',
                    zip: ''
                },
                date: '',
                services: [],
                subtotal: 0,
                tax: 0,
                total: 0,
                notes: '',
                status: 'draft'
            };
            
            // Reset form
            const form = document.getElementById('invoice-form');
            if (form) {
                form.reset();
            }
            
            // Clear services list
            const servicesList = document.getElementById('services-list');
            if (servicesList) {
                servicesList.innerHTML = '<p class="empty-services">No services added yet. Add services using the sections above.</p>';
            }
            
            // Reset totals
            this.updateInvoiceTotals();
        },
        
        // Load invoice for editing
        loadInvoice: function(invoice) {
            try {
                this.currentInvoice = { ...invoice };
                
                // Populate form fields
                this.populateFormWithInvoice(invoice);
                
            } catch (error) {
                console.error('Load invoice error:', error);
            }
        },
        
        // Populate form with invoice data
        populateFormWithInvoice: function(invoice) {
            try {
                // Basic fields
                this.setFieldValue('business-type', invoice.businessType);
                // === VERSION 9.20: Fix customer data loading - check both nested and flat structures
                this.setFieldValue('customer-name', invoice.customer?.name || invoice.customerName || '');
                this.setFieldValue('customer-email', invoice.customer?.email || invoice.customerEmail || '');
                this.setFieldValue('customer-phone', invoice.customer?.phone || invoice.customerPhone || '');
                this.setFieldValue('customer-street', invoice.customer?.street || '');
                this.setFieldValue('customer-city', invoice.customer?.city || '');
                this.setFieldValue('customer-state', invoice.customer?.state || '');
                this.setFieldValue('customer-zip', invoice.customer?.zip || '');
                this.setFieldValue('invoice-date', invoice.date);
                // === VERSION 9.17: Notes field removed from UI, skip setting
                // this.setFieldValue('invoice-notes', invoice.notes);
                this.setFieldValue('invoice-status', invoice.status);
                
                // Clear existing services
                const servicesList = document.getElementById('services-list');
                if (servicesList) {
                    servicesList.innerHTML = '<p class="empty-services">No services added yet. Add services using the sections above.</p>';
                }
                
                // Re-add services
                if (invoice.services && invoice.services.length > 0) {
                    invoice.services.forEach(service => {
                        this.addServiceToList(service);
                    });
                }
                
                // Update totals
                this.updateInvoiceTotals();
                
            } catch (error) {
                console.error('Populate form error:', error);
            }
        },
        
        // Add concrete service with custom price (for suggestion engine)
        addConcreteServiceWithCustomPrice: function(serviceData) {
            try {
                console.log('InvoiceManager.addConcreteServiceWithCustomPrice called with:', serviceData);
                
                const customPrice = serviceData.customPrice || serviceData.finalPrice;
                if (!customPrice || customPrice <= 0) {
                    throw new Error('Invalid custom price provided');
                }
                
                // Create enhanced service object with complete pricing intelligence
                const service = this.createEnhancedServiceObject(serviceData, customPrice, 'invoice');
                
                console.log('Created enhanced invoice service object:', service);
                
                // Add to invoice using existing method
                this.addService(service);
                
                console.log('Custom price invoice service addition completed');
                
                // Show success feedback
                if (window.LoadingIndicator) {
                    window.LoadingIndicator.showSuccess(`Service added: ${service.description} - ${this.formatCurrency(customPrice)}`);
                }
                
                // Reset calculator if available
                if (window.ConcreteCalculator) {
                    window.ConcreteCalculator.resetCalculator();
                }
                
            } catch (error) {
                console.error('Add concrete service with custom price error:', error);
                
                // Show error feedback
                if (window.LoadingIndicator) {
                    window.LoadingIndicator.showError('Failed to add service: ' + error.message);
                } else if (window.App && window.App.showError) {
                    window.App.showError('Failed to add service: ' + error.message);
                } else {
                    alert('Error adding service: ' + error.message);
                }
                throw error;
            }
        },
        
        // Create enhanced service object with complete pricing data structure
        createEnhancedServiceObject: function(serviceData, customPrice, context = 'invoice') {
            // === VERSION 9.16 FIX: Add dimensions property for display
            const dimensionsText = `${serviceData.length || 0} x ${serviceData.width || 0} x ${serviceData.inchesSettled || 0}"`;
            
            const service = {
                type: 'concrete',
                id: 'concrete_' + Date.now(),
                description: this.getConcreteServiceDescription(serviceData),
                dimensions: dimensionsText, // V9.16: Store dimensions separately for display
                quantity: serviceData.squareFootage,
                unit: 'sq ft',
                rate: customPrice / serviceData.squareFootage,
                amount: customPrice,
                customPrice: true, // Flag to indicate custom pricing
                
                // Enhanced pricing structure as specified in requirements
                pricing: serviceData.pricing || {
                    custom: {
                        amount: customPrice,
                        rate: customPrice / serviceData.squareFootage,
                        userSet: true,
                        timestamp: new Date().toISOString()
                    },
                    suggested: {
                        lowEstimate: serviceData.estimatedPriceLow,
                        highEstimate: serviceData.estimatedPriceHigh,
                        recommended: serviceData.recommendedPrice || (serviceData.estimatedPriceLow + serviceData.estimatedPriceHigh) / 2,
                        profitMargin: serviceData.profitMargin || {
                            low: 68.2,
                            high: 71.5,
                            average: 69.85
                        }
                    },
                    calculator: {
                        squareFootage: serviceData.squareFootage,
                        materialCosts: serviceData.materialCosts || { 
                            low: serviceData.materialCostLow, 
                            high: serviceData.materialCostHigh 
                        },
                        equipmentCosts: serviceData.equipmentCosts || 50.00,
                        laborOverhead: serviceData.laborOverhead || { 
                            low: serviceData.estimatedPriceLow - serviceData.materialCostLow - (serviceData.equipmentCosts || 50),
                            high: serviceData.estimatedPriceHigh - serviceData.materialCostHigh - (serviceData.equipmentCosts || 50)
                        }
                    }
                },
                
                // Detailed service information
                details: {
                    pricingMethod: 'material',
                    context: context, // 'invoice' or 'estimate'
                    
                    // Enhanced custom pricing section
                    customPricing: {
                        originalLow: serviceData.estimatedPriceLow,
                        originalHigh: serviceData.estimatedPriceHigh,
                        recommendedPrice: serviceData.recommendedPrice,
                        customPrice: customPrice,
                        priceOverride: serviceData.priceOverride || false,
                        profitMargin: serviceData.profitMargin,
                        costBreakdown: serviceData.costBreakdown,
                        pricingFactors: serviceData.pricingFactors,
                        validation: serviceData.validation
                    },
                    
                    // Project dimensions
                    dimensions: {
                        length: serviceData.length,
                        width: serviceData.width,
                        squareFootage: serviceData.squareFootage
                    },
                    
                    // Settlement characteristics
                    settlement: {
                        inchesSettled: serviceData.inchesSettled,
                        sidesSettled: serviceData.sidesSettled,
                        complexity: serviceData.complexityFactor
                    },
                    
                    // Environmental conditions
                    environmental: {
                        soilType: serviceData.soilType,
                        weatherConditions: serviceData.weatherConditions,
                        moistureLevel: serviceData.moistureLevel,
                        travelDistance: serviceData.travelDistance
                    },
                    
                    // Material and cost analysis
                    materials: {
                        voidVolume: serviceData.voidVolume,
                        cubicYards: serviceData.cubicYards,
                        materialWeight: serviceData.materialWeight || serviceData.weight,
                        estimatedLow: serviceData.estimatedPriceLow,
                        estimatedHigh: serviceData.estimatedPriceHigh,
                        equipmentCosts: serviceData.equipmentCosts,
                        laborAndOverhead: serviceData.laborAndOverhead
                    },
                    
                    // Data persistence metadata
                    metadata: {
                        createdAt: new Date().toISOString(),
                        pricingVersion: '2.0',
                        calculatorVersion: 'enhanced',
                        hasIntelligentPricing: true
                    }
                }
            };
            
            return service;
        },
        
        // Get concrete service description helper
        getConcreteServiceDescription: function(calc) {
            try {
                let description = 'Concrete Leveling';
                
                // Add dimensions if available
                if (calc.squareFootage > 0) {
                    description += ` (${calc.squareFootage} sq ft)`;
                }
                
                // Add settlement details if significant
                if (calc.inchesSettled > 1) {
                    description += ` - ${calc.inchesSettled}" settlement`;
                }
                
                if (calc.sidesSettled > 1) {
                    description += `, ${calc.sidesSettled} sides`;
                }
                
                return description;
                
            } catch (error) {
                console.error('Service description error:', error);
                return 'Concrete Leveling Service';
            }
        },
        
        // Helper to safely set field values
        setFieldValue: function(fieldId, value) {
            try {
                const field = document.getElementById(fieldId);
                if (field && value !== undefined && value !== null) {
                    field.value = value;
                }
            } catch (error) {
                console.error(`Error setting field ${fieldId}:`, error);
            }
        },
        
        // Helper: Resolve invoice by ID
        resolveInvoiceById: function(invoiceId) {
            try {
                const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
                return invoices.find(inv => inv.id === invoiceId);
            } catch (error) {
                console.error('Error resolving invoice by ID:', error);
                return null;
            }
        },
        
        // Helper: Show error message
        showError: function(message) {
            if (window.NotificationSystem) {
                window.NotificationSystem.showError(message);
            } else if (window.LoadingIndicator && window.LoadingIndicator.showError) {
                window.LoadingIndicator.showError(message);
            } else if (window.App && window.App.showError) {
                window.App.showError(message);
            } else {
                alert('Error: ' + message);
            }
        },
        
        // === SAFE-HOTFIX: ESTIMATE SUBMIT BRIDGE (BEGIN) - Add to real InvoiceManager
        // Bridge method to handle estimate submission - delegates to EstimateManager
        handleEstimateSubmission: function(formData) {
            console.log('[EST:SUBMIT_ADAPTER] InvoiceManager.handleEstimateSubmission called', {
                hasIM: true,
                hasEM: !!window.EstimateManager
            });
            
            // Delegate to EstimateManager if available
            if (window.EstimateManager && window.EstimateManager.handleEstimateSubmission) {
                console.log('[EST:SUBMIT_DELEGATE] Delegating to EstimateManager');
                return window.EstimateManager.handleEstimateSubmission(formData);
            }
            
            // Log blocked state if EstimateManager not available
            console.log('BLOCKED:1 {reason:"No EstimateManager available"}');
            return false;
        },
        
        // Bridge method to generate estimate preview - delegates to EstimateManager
        generateEstimatePreview: function(estimate) {
            console.log('[EST:PREVIEW_ADAPTER] InvoiceManager.generateEstimatePreview called');
            
            // Delegate to EstimateManager if available
            if (window.EstimateManager && window.EstimateManager.generateEstimatePreview) {
                console.log('[EST:PREVIEW_DELEGATE] Delegating to EstimateManager');
                return window.EstimateManager.generateEstimatePreview(estimate);
            }
            
            // Fallback: Show basic preview
            console.log('[EST:PREVIEW_FALLBACK] Using basic preview');
            const previewContent = document.getElementById('estimate-preview-content');
            if (previewContent) {
                previewContent.innerHTML = '<h3>Estimate Preview</h3><p>Estimate saved successfully.</p>';
            }
            return true;
        },
        
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (BEGIN) - Add concrete service method
        // Method to add concrete slab service to invoice
        addConcreteSlabService: function(service) {
            console.log('[INV-ADD:SERVICE] Adding concrete service to invoice', service);
            
            // Ensure services array exists
            if (!this.currentInvoice.services) {
                this.currentInvoice.services = [];
            }
            
            // Ensure service has both 'amount' and 'price' for compatibility
            service.amount = service.amount || service.total || service.price || service.unitPrice || 0;
            service.price = service.price || service.total || service.amount || service.unitPrice || 0;
            
            // Add service to invoice
            this.currentInvoice.services.push(service);
            
            // Update totals
            this.updateInvoiceTotals();
            
            // Add to DOM if list exists
            const servicesList = document.getElementById('services-list');
            if (servicesList) {
                // Remove empty message if present
                const emptyMsg = servicesList.querySelector('.empty-services');
                if (emptyMsg) {
                    emptyMsg.remove();
                }
                
                // Add service row to table
                const serviceRow = document.createElement('tr');
                serviceRow.className = 'service-row';
                serviceRow.dataset.serviceId = service.id;
                serviceRow.innerHTML = `
                    <td>Concrete Leveling</td>
                    <td>${service.description}</td>
                    <td>${service.quantity || 1}</td>
                    <td>$${(service.price || 0).toFixed(2)}</td>
                    <td>$${(service.total || service.price || 0).toFixed(2)}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-danger remove-service" data-service-id="${service.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                servicesList.appendChild(serviceRow);
                
                console.log('[INV-ADD:DOM_UPDATED] Service added to DOM');
            }
            
            console.log('[INV-ADD:COMPLETE]', {
                servicesCount: this.currentInvoice.services.length,
                subtotal: this.currentInvoice.subtotal
            });
            
            return true;
        }
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
        // === SAFE-HOTFIX: ESTIMATE SUBMIT BRIDGE (END)
    };
    
    // Initialize when DOM is ready (ONLY ONCE)
    if (!window.InvoiceManager) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                InvoiceManager.init();
            });
        } else {
            InvoiceManager.init();
        }
        
        // Export handled after IIFE returns (see hotfix below)
    }
    
    // Export enhanced service creation for other modules
    window.createEnhancedInvoiceService = function(serviceData, customPrice, context) {
        return InvoiceManager.createEnhancedServiceObject(serviceData, customPrice, context || 'invoice');
    };
    

/**
 * J. Stark Business Invoicing System - Estimate Management
 * Handles estimate creation, preview, and management with digital signatures
 */
    
    // Estimate Manager object
    const EstimateManager = {
        currentEstimate: {
            id: null,
            number: null,
            businessType: '',
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customer: {
                name: '',
                email: '',
                phone: '',
                street: '',
                city: '',
                state: '',
                zip: ''
            },
            date: '',
            services: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            notes: '',
            status: 'draft',
            signature: null,
            signatureCustomerName: '',
            signatureTimestamp: null,
            approval: false
        },
        
        taxRate: 0, // No tax applied per user request
        
        normalizeCustomer: function(obj) {
            // Use InvoiceManager's normalizeCustomer method
            return InvoiceManager.normalizeCustomer(obj);
        },
        
        init: function() {
            try {
                this.bindEvents();
                this.initializeSignatureCanvas();
                console.log('Estimate Manager initialized');
            } catch (error) {
                console.error('Estimate Manager initialization error:', error);
            }
        },
        
        bindEvents: function() {
            try {
                // Form submission
                const form = document.getElementById('estimate-form');
                if (form) {
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.handleEstimateSubmission();
                    });
                }
                
                // Preview button
                const previewBtn = document.getElementById('preview-estimate');
                if (previewBtn) {
                    previewBtn.addEventListener('click', () => {
                        this.previewEstimate();
                    });
                }
                
                // Business type radio buttons for estimates
                const businessRadios = document.querySelectorAll('input[name="estimateBusinessType"]');
                businessRadios.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        this.handleEstimateBusinessTypeChange(e.target.value);
                        if (window.App) {
                            window.App.updateStepIndicator(2);
                        }
                    });
                });
                
                // Clear signature button
                const clearSignatureBtn = document.getElementById('clear-signature');
                if (clearSignatureBtn) {
                    clearSignatureBtn.addEventListener('click', () => {
                        this.clearSignature();
                    });
                }
                
                // Customer name sync
                const customerNameInput = document.getElementById('estimate-customer-name');
                const signatureNameInput = document.getElementById('signature-customer-name');
                
                if (customerNameInput && signatureNameInput) {
                    customerNameInput.addEventListener('blur', () => {
                        if (customerNameInput.value && !signatureNameInput.value) {
                            signatureNameInput.value = customerNameInput.value;
                        }
                    });
                }
                
            } catch (error) {
                console.error('Estimate Manager event binding error:', error);
            }
        },
        
        initializeSignatureCanvas: function() {
            try {
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('SIGNATURE_INIT_START');
                }
                
                const canvas = document.getElementById('signature-canvas');
                if (!canvas) {
                    if (typeof diagnosticLog === 'function') {
                        diagnosticLog('SIGNATURE_CANVAS_MISSING', 'signature-canvas element not found');
                    }
                    return;
                }
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    if (typeof diagnosticLog === 'function') {
                        diagnosticLog('SIGNATURE_CONTEXT_ERROR', 'Unable to get canvas context');
                    }
                    return;
                }
                
                let isDrawing = false;
                let lastX = 0;
                let lastY = 0;
                
                // Set canvas size and styling
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                // Mouse events
                canvas.addEventListener('mousedown', (e) => {
                    isDrawing = true;
                    const rect = canvas.getBoundingClientRect();
                    lastX = e.clientX - rect.left;
                    lastY = e.clientY - rect.top;
                });
                
                canvas.addEventListener('mousemove', (e) => {
                    if (!isDrawing) return;
                    const rect = canvas.getBoundingClientRect();
                    const currentX = e.clientX - rect.left;
                    const currentY = e.clientY - rect.top;
                    
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(currentX, currentY);
                    ctx.stroke();
                    
                    lastX = currentX;
                    lastY = currentY;
                });
                
                canvas.addEventListener('mouseup', () => {
                    isDrawing = false;
                    this.updateSignatureTimestamp();
                });
                
                canvas.addEventListener('mouseout', () => {
                    isDrawing = false;
                });
                
                // Touch events for mobile
                canvas.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const rect = canvas.getBoundingClientRect();
                    isDrawing = true;
                    lastX = touch.clientX - rect.left;
                    lastY = touch.clientY - rect.top;
                });
                
                canvas.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    if (!isDrawing) return;
                    const touch = e.touches[0];
                    const rect = canvas.getBoundingClientRect();
                    const currentX = touch.clientX - rect.left;
                    const currentY = touch.clientY - rect.top;
                    
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(currentX, currentY);
                    ctx.stroke();
                    
                    lastX = currentX;
                    lastY = currentY;
                });
                
                canvas.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    isDrawing = false;
                    this.updateSignatureTimestamp();
                });
                
            } catch (error) {
                console.error('Signature canvas initialization error:', error);
            }
        },
        
        updateSignatureTimestamp: function() {
            try {
                const timestampElement = document.getElementById('signature-date-time');
                if (timestampElement) {
                    const now = new Date();
                    timestampElement.textContent = `Signed on: ${now.toLocaleString()}`;
                }
            } catch (error) {
                console.error('Update signature timestamp error:', error);
            }
        },
        
        clearSignature: function() {
            try {
                const canvas = document.getElementById('signature-canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                
                const timestampElement = document.getElementById('signature-date-time');
                if (timestampElement) {
                    timestampElement.textContent = '';
                }
                
                const approval = document.getElementById('estimate-approval');
                if (approval) {
                    approval.checked = false;
                }
                
            } catch (error) {
                console.error('Clear signature error:', error);
            }
        },
        
        getSignatureData: function() {
            try {
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('SIGNATURE_GET_DATA_START');
                }
                
                const canvas = document.getElementById('signature-canvas');
                if (!canvas) {
                    if (typeof diagnosticLog === 'function') {
                        diagnosticLog('SIGNATURE_GET_CANVAS_MISSING');
                    }
                    return null;
                }
                
                // Check if canvas has any drawing with error handling
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    if (typeof diagnosticLog === 'function') {
                        diagnosticLog('SIGNATURE_GET_CONTEXT_ERROR');
                    }
                    return null;
                }
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixelData = imageData.data;
                
                // Check if any pixel is not transparent
                for (let i = 3; i < pixelData.length; i += 4) {
                    if (pixelData[i] !== 0) {
                        const signatureData = canvas.toDataURL();
                        if (typeof diagnosticLog === 'function') {
                            diagnosticLog('SIGNATURE_CAPTURED', { hasData: !!signatureData, dataLength: signatureData?.length });
                        }
                        return signatureData;
                    }
                }
                
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('SIGNATURE_EMPTY', 'No signature drawing found');
                }
                return null;
            } catch (error) {
                if (typeof diagnosticLog === 'function') {
                    diagnosticLog('SIGNATURE_GET_ERROR', { error: error.message });
                }
                console.error('Get signature data error:', error);
                return null;
            }
        },
        
        handleEstimateBusinessTypeChange: function(businessType) {
            try {
                console.log('🏢 InvoiceManager.handleEstimateBusinessTypeChange called with:', businessType);
                
                const servicesContent = document.getElementById('estimate-services-content');
                if (!servicesContent) {
                    console.error('❌ estimate-services-content not found');
                    return;
                }
                
                console.log('📦 Current services content before change:', servicesContent.innerHTML.substring(0, 100));
                
                if (businessType === 'concrete') {
                    console.log('🏗️ Setting up concrete services for estimate');
                    const newContent = this.createConcreteEstimateContent();
                    servicesContent.innerHTML = newContent;
                    
                    // Force DOM to update before proceeding
                    servicesContent.offsetHeight; // Force reflow
                    
                    this.bindEstimateConcreteEvents(servicesContent);
                    
                    // === SAFE-HOTFIX: ESTIMATE CALC NORMALIZE (BEGIN)
                    // Feature flag to force normalization
                    const ESTIMATE_CALC_FORCE_NORMALIZE = true;
                    
                    // DOM assertion and init for estimate calculator - add extra delay for DOM to settle
                    requestAnimationFrame(() => setTimeout(() => {
                        // Get active estimate root
                        const activeRoot = document.querySelector('#estimate-creation.view.active') || document.querySelector('#estimate-creation');
                        if (!activeRoot) {
                            console.log('[EST-CALC:NO_ACTIVE_ROOT]');
                            return;
                        }
                        
                        // DOM check within active root - verify all required IDs (using calc- prefix)
                        const domCheck = {
                            length: !!activeRoot.querySelector('#calc-length'),
                            width: !!activeRoot.querySelector('#calc-width'),
                            inches: !!activeRoot.querySelector('#calc-depth'),
                            sides: !!activeRoot.querySelector('#calc-sides'),
                            soil: !!activeRoot.querySelector('#calc-soil'),
                            tierRadios: !!activeRoot.querySelector('input[name="price-tier"]'),
                            calcResults: !!activeRoot.querySelector('#calc-results'),
                            outLow: !!activeRoot.querySelector('#out-price-low'),
                            outMid: !!activeRoot.querySelector('#out-price-mid'),
                            outHigh: !!activeRoot.querySelector('#out-price-high'),
                            useBtn: !!activeRoot.querySelector('#use-selected-price'),
                            servicesList: !!activeRoot.querySelector('#estimate-services-list')
                        };
                        console.log('[EST-CALC:DOM_CHECK]', domCheck);
                        
                        // Check if any required elements are missing
                        const allPresent = Object.values(domCheck).every(v => v === true);
                        
                        // === SAFE-HOTFIX: ESTIMATE CALC PARITY (BEGIN)
                        if (!allPresent && ESTIMATE_CALC_FORCE_NORMALIZE) {
                            // Force normalize - but ONLY inject if truly missing
                            const injected = [];
                            const container = servicesContent || activeRoot.querySelector('#estimate-services-content');
                            
                            // Only normalize elements that are truly missing - don't create duplicates
                            if (!domCheck.length || !domCheck.width || !domCheck.inches || !domCheck.sides || !domCheck.soil) {
                                // Check if the elements already exist in container (they should from createConcreteEstimateContent)
                                // If they exist, the problem is scope - don't create hidden duplicates
                                const existingLength = container.querySelector('#calc-length');
                                const existingWidth = container.querySelector('#calc-width');
                                const existingInches = container.querySelector('#calc-depth');
                                const existingSides = container.querySelector('#calc-sides');
                                const existingSoil = container.querySelector('#calc-soil');
                                
                                // Log what we found to debug the scope issue
                                if (!domCheck.length && existingLength) {
                                    console.log('[EST-CALC:SCOPE_ISSUE] #calc-length exists but not found in activeRoot');
                                }
                                if (!domCheck.width && existingWidth) {
                                    console.log('[EST-CALC:SCOPE_ISSUE] #calc-width exists but not found in activeRoot');
                                }
                                
                                // Only inject if truly missing from the entire container
                                const calcContainer = container.querySelector('.slab-calculator-container') || container;
                                
                                if (!domCheck.length && !existingLength) {
                                    const div = document.createElement('div');
                                    div.className = 'form-group';
                                    div.innerHTML = '<label for="calc-length">Length (ft):</label><input type="number" id="calc-length" class="slab-input" min="0" step="0.1" value="10">';
                                    calcContainer.appendChild(div);
                                    injected.push('calc-length');
                                }
                                if (!domCheck.width && !existingWidth) {
                                    const div = document.createElement('div');
                                    div.className = 'form-group';
                                    div.innerHTML = '<label for="calc-width">Width (ft):</label><input type="number" id="calc-width" class="slab-input" min="0" step="0.1" value="20">';
                                    calcContainer.appendChild(div);
                                    injected.push('calc-width');
                                }
                                if (!domCheck.inches && !existingInches) {
                                    const div = document.createElement('div');
                                    div.className = 'form-group';
                                    div.innerHTML = '<label for="calc-depth">Inches:</label><select id="calc-depth" class="slab-input"><option value="1" selected>1 inch</option></select>';
                                    calcContainer.appendChild(div);
                                    injected.push('calc-depth');
                                }
                                if (!domCheck.sides && !existingSides) {
                                    const div = document.createElement('div');
                                    div.className = 'form-group';
                                    div.innerHTML = '<label for="calc-sides">Sides:</label><select id="calc-sides" class="slab-input"><option value="1" selected>1 side</option></select>';
                                    calcContainer.appendChild(div);
                                    injected.push('calc-sides');
                                }
                                if (!domCheck.soil && !existingSoil) {
                                    const div = document.createElement('div');
                                    div.className = 'form-group';
                                    div.innerHTML = '<label for="calc-soil">Soil:</label><select id="calc-soil" class="slab-input"><option value="normal" selected>Normal</option></select>';
                                    calcContainer.appendChild(div);
                                    injected.push('calc-soil');
                                }
                            }
                        // === SAFE-HOTFIX: ESTIMATE CALC PARITY (END)
                            
                            // Ensure tier radios exist
                            if (!domCheck.tierRadios) {
                                const div = document.createElement('div');
                                div.style.display = 'none';
                                div.innerHTML = `
                                    <input type="radio" name="price-tier" value="low">
                                    <input type="radio" name="price-tier" value="mid" checked>
                                    <input type="radio" name="price-tier" value="high">
                                `;
                                container.appendChild(div);
                                injected.push('price-tier-radios');
                            }
                            
                            // Ensure calc-results container exists
                            if (!domCheck.calcResults) {
                                const existingResults = container.querySelector('#calculation-results');
                                if (existingResults) {
                                    existingResults.id = 'calc-results';
                                    injected.push('calc-results(renamed)');
                                } else {
                                    const div = document.createElement('div');
                                    div.id = 'calc-results';
                                    div.style.display = 'none';
                                    container.appendChild(div);
                                    injected.push('calc-results');
                                }
                            }
                            
                            // Ensure tier output spans exist
                            const resultsDiv = activeRoot.querySelector('#calc-results') || container.querySelector('#calc-results');
                            if (resultsDiv) {
                                if (!domCheck.outLow) {
                                    const span = document.createElement('span');
                                    span.id = 'out-price-low';
                                    span.style.display = 'none';
                                    resultsDiv.appendChild(span);
                                    injected.push('out-price-low');
                                }
                                if (!domCheck.outMid) {
                                    const span = document.createElement('span');
                                    span.id = 'out-price-mid';
                                    span.style.display = 'none';
                                    resultsDiv.appendChild(span);
                                    injected.push('out-price-mid');
                                }
                                if (!domCheck.outHigh) {
                                    const span = document.createElement('span');
                                    span.id = 'out-price-high';
                                    span.style.display = 'none';
                                    resultsDiv.appendChild(span);
                                    injected.push('out-price-high');
                                }
                            }
                            
                            if (injected.length > 0) {
                                console.log('[EST-CALC:NORMALIZED]', { injected });
                                
                                // Re-run DOM check to verify (using calc- prefix)
                                const verifyCheck = {
                                    length: !!activeRoot.querySelector('#calc-length'),
                                    width: !!activeRoot.querySelector('#calc-width'),
                                    inches: !!activeRoot.querySelector('#calc-depth'),
                                    sides: !!activeRoot.querySelector('#calc-sides'),
                                    soil: !!activeRoot.querySelector('#calc-soil'),
                                    tierRadios: !!activeRoot.querySelector('input[name="price-tier"]'),
                                    calcResults: !!activeRoot.querySelector('#calc-results'),
                                    outLow: !!activeRoot.querySelector('#out-price-low'),
                                    outMid: !!activeRoot.querySelector('#out-price-mid'),
                                    outHigh: !!activeRoot.querySelector('#out-price-high'),
                                    useBtn: !!activeRoot.querySelector('#use-selected-price'),
                                    servicesList: !!activeRoot.querySelector('#estimate-services-list')
                                };
                                console.log('[EST-CALC:DOM_CHECK_AFTER_NORMALIZE]', verifyCheck);
                            }
                        }
                        // === SAFE-HOTFIX: ESTIMATE CALC NORMALIZE (END)
                        
                        // === SAFE-HOTFIX: ESTIMATE CALC NORMALIZE (BEGIN)
                        // Ensure visibility
                        const unhidden = [];
                        const calcContainer = activeRoot.querySelector('.slab-calculator-container') || activeRoot.querySelector('.estimate-concrete-section');
                        if (calcContainer && window.getComputedStyle(calcContainer).display === 'none') {
                            calcContainer.style.display = 'block';
                            unhidden.push('.slab-calculator-container');
                        }
                        
                        // Ensure calc-results div is available and visible for output
                        const calcResultsDiv = activeRoot.querySelector('#calc-results');
                        if (calcResultsDiv) {
                            if (window.getComputedStyle(calcResultsDiv).display === 'none') {
                                // Keep it hidden initially, will be shown when results are calculated
                                // Just log that it's ready
                            }
                            console.log('[EST-CALC:RESULTS_DIV_READY]');
                        }
                        
                        if (unhidden.length > 0) {
                            console.log('[EST-CALC:UNHIDDEN]', { selectors: unhidden });
                        }
                        // === SAFE-HOTFIX: ESTIMATE CALC NORMALIZE (END)
                        
                        // Initialize calculator with retry logic
                        let retryCount = 0;
                        const maxRetries = 3;
                        
                        const tryInit = () => {
                            // === SAFE-HOTFIX: EXACT-ID-MATCH (Use calc- prefix)
                            const lengthEl = activeRoot.querySelector('#calc-length');
                            const widthEl = activeRoot.querySelector('#calc-width');
                            // === SAFE-HOTFIX: EXACT-ID-MATCH (END)
                            
                            if (lengthEl && widthEl) {
                                console.log('[EST-CALC:INIT_READY]');
                                if (window.ConcreteCalculator?.init) {
                                    window.ConcreteCalculator.init({ context: 'estimate' });
                                    console.log('[EST-CALC:INIT_OK]');
                                } else if (window.Calculator?.init) {
                                    window.Calculator.init({ context: 'estimate' });
                                    console.log('[EST-CALC:INIT_OK]');
                                }
                            } else if (retryCount < maxRetries) {
                                retryCount++;
                                console.log(`[EST-CALC:RETRY] Attempt ${retryCount}/${maxRetries}`);
                                setTimeout(tryInit, 200);
                            } else {
                                const missing = [];
                                // === SAFE-HOTFIX: EXACT-ID-MATCH (Use calc- prefix in logging)
                                if (!lengthEl) missing.push('calc-length');
                                if (!widthEl) missing.push('calc-width');
                                // === SAFE-HOTFIX: EXACT-ID-MATCH (END)
                                console.log('[EST-CALC:INIT_GIVEUP]', { missing });
                            }
                        };
                        
                        tryInit();
                        
                        // Setup delegated listener
                        if (window.SlabManager?.setupDelegatedListener) {
                            window.SlabManager.setupDelegatedListener();
                        }
                    }, 200)); // Increased delay to ensure DOM is ready
                    
                } else if (businessType === 'masonry') {
                    console.log('🧱 Setting up masonry services for estimate');
                    // Create masonry estimate content without duplicating entire form  
                    const newContent = this.createMasonryEstimateContent();
                    console.log('📝 New masonry content created:', newContent.substring(0, 100));
                    servicesContent.innerHTML = newContent;
                    this.bindEstimateMasonryEvents(servicesContent);
                    
                } else {
                    servicesContent.innerHTML = '<p class="empty-services">Select a business type above to add services.</p>';
                }
                
            } catch (error) {
                console.error('❌ Estimate business type change error:', error);
            }
        },
        
        getCalculatorMarkup: function() {
            // === SAFE-HOTFIX: EXACT-ID-MATCH (Use calc- prefix IDs like invoice)
            // Return the standard calculator markup with CORRECT calc- prefix IDs
            return `
                <div class="form-row">
                    <div class="form-group">
                        <label for="calc-length">Length (ft):</label>
                        <input type="number" id="calc-length" class="slab-input" min="0" step="0.1" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label for="calc-width">Width (ft):</label>
                        <input type="number" id="calc-width" class="slab-input" min="0" step="0.1" placeholder="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="calc-depth">Inches Settled:</label>
                        <select id="calc-depth" class="slab-input">
            // === SAFE-HOTFIX: EXACT-ID-MATCH (END)
                            <option value="0.5">0.5 inch</option>
                            <option value="1" selected>1 inch</option>
                            <option value="1.5">1.5 inches</option>
                            <option value="2">2 inches</option>
                            <option value="2.5">2.5 inches</option>
                            <option value="3">3 inches</option>
                            <option value="4">4 inches</option>
                            <option value="5">5 inches</option>
                            <option value="6">6 inches</option>
                            <option value="8">8 inches</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="foam-type">Foam Type:</label>
                        <select id="foam-type" class="slab-input">
                            <option value="RR401" selected>RR401 - Standard</option>
                            <option value="RR501">RR501 - Medium Density</option>
                            <option value="RR601">RR601 - High Density</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="location-type">Location:</label>
                        <select id="location-type" class="slab-input">
                            <option value="mid" selected>Mid</option>
                            <option value="edge">Edge</option>
                            <option value="corner">Corner</option>
                        </select>
                    </div>
                </div>
                <div class="calculator-actions">
                    <button type="button" id="calculate-price" class="btn btn-primary">
                        <i class="fas fa-calculator"></i> Calculate Price
                    </button>
                    <button type="button" id="use-selected-price" class="btn btn-success" style="display: none;">
                        <i class="fas fa-check"></i> Use Selected Price
                    </button>
                </div>
                <div class="material-calculation-display" id="calculation-results" style="display: none;">
                    <div class="calculation-summary">
                        <div class="calc-item">
                            <span>Square Footage:</span>
                            <span id="out-square-footage">0 sq ft</span>
                        </div>
                        <div class="calc-item">
                            <span>Foam Needed:</span>
                            <span id="out-pounds-needed">0 lbs</span>
                        </div>
                        <div class="calc-item">
                            <span>Calculated Price:</span>
                            <span id="out-price-calculated" class="price-highlight">$0</span>
                        </div>
                    </div>
                </div>
            `;
        },
        
        createConcreteEstimateContent: function() {
            // === SAFE-HOTFIX: EXACT INVOICE CLONE (BEGIN)
            // Return EXACT invoice calculator structure for estimate
            console.log('[EST-CALC:EXACT_CLONE] Creating exact invoice calculator clone for estimate');
            
            return `
                <div class="estimate-concrete-section" style="display: block;" data-calc-root="estimate">
                    <!-- ER Polyurethane Calculator - EXACT CLONE -->
                    <div class="calculator-section" id="er-poly-calculator">
                        <h4><i class="fas fa-calculator"></i> Concrete Leveling Price Calculator</h4>
                        <p class="calculator-help">Calculate pricing for polyurethane foam concrete leveling jobs</p>
                        
                        <!-- Workflow Steps -->
                        <div class="calc-workflow-steps">
                            <div class="calc-step active" id="step-dimensions">
                                <div class="calc-step-number">1</div>
                                <div class="calc-step-label">Enter Dimensions</div>
                            </div>
                            <div class="calc-step" id="step-settings">
                                <div class="calc-step-number">2</div>
                                <div class="calc-step-label">Configure Settings</div>
                            </div>
                            <div class="calc-step" id="step-calculate">
                                <div class="calc-step-number">3</div>
                                <div class="calc-step-label">Calculate Price</div>
                            </div>
                            <div class="calc-step" id="step-select">
                                <div class="calc-step-number">4</div>
                                <div class="calc-step-label">Select & Add</div>
                            </div>
                        </div>
                        
                        <!-- Slab Dimensions -->
                        <div class="calc-section">
                            <h5>Slab Dimensions</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="calc-length">
                                        Length (feet)
                                        <span class="help-icon" data-tooltip="Length of the concrete slab">
                                            <i class="fas fa-question-circle"></i>
                                        </span>
                                    </label>
                                    <input type="number" id="calc-length" data-testid="calc-length" 
                                           min="0" step="0.1" placeholder="Enter length" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="calc-width">
                                        Width (feet)
                                        <span class="help-icon" data-tooltip="Width of the concrete slab">
                                            <i class="fas fa-question-circle"></i>
                                        </span>
                                    </label>
                                    <input type="number" id="calc-width" data-testid="calc-width"
                                           min="0" step="0.1" placeholder="Enter width" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label for="calc-depth">
                                        Lift Height (inches)
                                        <span class="help-icon" data-tooltip="How many inches to lift the slab">
                                            <i class="fas fa-question-circle"></i>
                                        </span>
                                    </label>
                                    <input type="number" id="calc-depth" data-testid="calc-depth"
                                           min="0" step="0.1" placeholder="Enter lift height" class="form-control">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Settlement Pattern -->
                        <div class="calc-section">
                            <h5>Settlement Pattern</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="calc-sides">
                                        How is the slab settled?
                                        <span class="help-icon" data-tooltip="Select how many sides of the slab have settled">
                                            <i class="fas fa-question-circle"></i>
                                        </span>
                                    </label>
                                    <select id="calc-sides" data-testid="calc-sides" class="form-control">
                                        <option value="1">One side settled (most common)</option>
                                        <option value="2">Two sides/corner settled</option>
                                        <option value="3">Entire slab settled evenly</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Foam Type Selection -->
                        <div class="calc-section">
                            <h5>Foam Type & Application</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>
                                        Select Foam Density
                                        <span class="help-icon" data-tooltip="RR201 is standard density, RR401 is high density for heavy loads">
                                            <i class="fas fa-question-circle"></i>
                                        </span>
                                    </label>
                                    <div class="radio-group-vertical" id="foam-type-group">
                                        <label class="radio-option">
                                            <input type="radio" name="foamType" value="RR201" 
                                                   data-testid="calc-rr201" checked>
                                            <span class="radio-label">
                                                <strong>RR201 - Standard Density</strong>
                                                <small>For residential driveways, sidewalks, patios</small>
                                            </span>
                                        </label>
                                        <label class="radio-option">
                                            <input type="radio" name="foamType" value="RR401" 
                                                   data-testid="calc-rr401">
                                            <span class="radio-label">
                                                <strong>RR401 - High Density</strong>
                                                <small>For commercial, highways, heavy traffic areas</small>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>
                                        Application Type
                                        <span class="help-icon" data-tooltip="Standard lift raises concrete, void fill fills empty spaces under slab">
                                            <i class="fas fa-question-circle"></i>
                                        </span>
                                    </label>
                                    <div class="radio-group-vertical" id="app-type-group">
                                        <label class="radio-option">
                                            <input type="radio" name="applicationType" value="lift" 
                                                   id="calc-lift" checked>
                                            <span class="radio-label">
                                                <strong>Standard Lift</strong>
                                                <small>Lifting and leveling settled concrete</small>
                                            </span>
                                        </label>
                                        <label class="radio-option">
                                            <input type="radio" name="applicationType" value="void" 
                                                   id="calc-void-radio">
                                            <span class="radio-label">
                                                <strong>Void Fill</strong>
                                                <small>Filling voids under concrete (uses less material)</small>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Pricing -->
                        <div class="calc-section">
                            <h5>Material Pricing</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="calc-price-low">
                                        Minimum Price per Pound
                                        <span class="help-icon" data-tooltip="Your lowest price per pound of foam">
                                            <i class="fas fa-question-circle"></i>
                                        </span>
                                    </label>
                                    <div class="input-with-currency">
                                        <span class="currency-symbol">$</span>
                                        <input type="number" id="calc-price-low" data-testid="calc-price-low"
                                               min="0" step="0.01" placeholder="10.00" class="form-control">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="calc-price-high">
                                        Maximum Price per Pound
                                        <span class="help-icon" data-tooltip="Your highest price per pound of foam">
                                            <i class="fas fa-question-circle"></i>
                                        </span>
                                    </label>
                                    <div class="input-with-currency">
                                        <span class="currency-symbol">$</span>
                                        <input type="number" id="calc-price-high" data-testid="calc-price-high"
                                               min="0" step="0.01" placeholder="15.00" class="form-control">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Pro Settings Toggle -->
                        <div class="form-row">
                            <label>
                                <input type="checkbox" id="pro-toggle" data-testid="pro-toggle">
                                Show Pro Settings
                            </label>
                        </div>
                        
                        <!-- Pro Settings Panel (hidden by default) -->
                        <div id="pro-panel" data-testid="pro-panel" style="display: none;" 
                             class="pro-settings-panel">
                            <h5>Pro Settings</h5>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Wedge Multipliers:</label>
                                    <div class="pro-inputs">
                                        <label>k1 (1 side):</label>
                                        <input type="number" id="pro-k1" data-testid="pro-k1" 
                                               min="0" max="1" step="0.01" value="0.5" class="form-control">
                                        <label>k2 (2 sides):</label>
                                        <input type="number" id="pro-k2" data-testid="pro-k2"
                                               min="0" max="1" step="0.01" value="0.25" class="form-control">
                                        <label>k3 (entire):</label>
                                        <input type="number" id="pro-k3" data-testid="pro-k3"
                                               min="0" max="2" step="0.01" value="1.0" class="form-control">
                                    </div>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Foam Factors (lb/yd³):</label>
                                    <div class="pro-inputs">
                                        <label>RR201 Lift:</label>
                                        <input type="number" id="pro-f201" data-testid="pro-f201"
                                               min="0" step="1" value="100" class="form-control">
                                        <label>RR201 Void:</label>
                                        <input type="number" id="pro-f201v" data-testid="pro-f201v"
                                               min="0" step="1" value="70" class="form-control">
                                        <label>RR401 Lift:</label>
                                        <input type="number" id="pro-f401" data-testid="pro-f401"
                                               min="0" step="1" value="120" class="form-control">
                                        <label>RR401 Void:</label>
                                        <input type="number" id="pro-f401v" data-testid="pro-f401v"
                                               min="0" step="1" value="110" class="form-control">
                                    </div>
                                </div>
                            </div>
                            <div class="form-row">
                                <button type="button" id="pro-save" data-testid="pro-save" 
                                        class="btn btn-primary">Save</button>
                                <button type="button" id="pro-reset" data-testid="pro-reset"
                                        class="btn btn-secondary">Reset to Defaults</button>
                            </div>
                        </div>
                        
                        <!-- Calculate Button -->
                        <div class="form-row">
                            <button type="button" id="calculate-poly" class="btn btn-primary btn-large">
                                <i class="fas fa-calculator"></i> Calculate Price
                            </button>
                        </div>
                        
                        <!-- Calculator Results -->
                        <div class="calculator-results" id="calc-results" style="display: none;">
                            <h5><i class="fas fa-chart-bar"></i> Calculation Results</h5>
                            
                            <!-- Material Requirements -->
                            <div class="results-section">
                                <h6>Material Requirements</h6>
                                <div class="result-grid">
                                    <div class="result-item">
                                        <label>Volume:</label>
                                        <span class="result-value">
                                            <span id="out-ft3" data-testid="out-ft3">-</span> ft³
                                            (<span id="out-yd3" data-testid="out-yd3">-</span> yd³)
                                        </span>
                                    </div>
                                    <div class="result-item">
                                        <label>Foam Required:</label>
                                        <span class="result-value">
                                            <strong id="out-lbs" data-testid="out-lbs">-</strong> pounds
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Pricing Options -->
                            <div class="results-section">
                                <h6>Pricing Options</h6>
                                <div class="price-options">
                                    <label class="price-option">
                                        <input type="radio" name="priceSelection" value="low">
                                        <div class="price-card">
                                            <span class="price-label">Minimum</span>
                                            <span class="price-value" id="out-price-low" data-testid="out-price-low">$-</span>
                                            <small>Budget option</small>
                                        </div>
                                    </label>
                                    <label class="price-option recommended">
                                        <input type="radio" name="priceSelection" value="mid" checked>
                                        <div class="price-card">
                                            <span class="price-label">Recommended</span>
                                            <span class="price-value" id="out-price-mid" data-testid="out-price-mid">$-</span>
                                            <small>Standard pricing</small>
                                        </div>
                                    </label>
                                    <label class="price-option">
                                        <input type="radio" name="priceSelection" value="high">
                                        <div class="price-card">
                                            <span class="price-label">Maximum</span>
                                            <span class="price-value" id="out-price-high" data-testid="out-price-high">$-</span>
                                            <small>Premium option</small>
                                        </div>
                                    </label>
                                    <label class="price-option">
                                        <input type="radio" name="priceSelection" value="custom">
                                        <div class="price-card">
                                            <span class="price-label">Custom</span>
                                            <div class="custom-price-input">
                                                <span class="currency-symbol">$</span>
                                                <input type="number" id="custom-price" min="0" step="0.01" 
                                                       placeholder="Enter amount" class="form-control">
                                            </div>
                                            <small>Set your own price</small>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="form-row">
                                <!-- === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (BEGIN) -->
                                <button type="button" id="use-selected-price" data-action="use-selected-price" class="btn btn-success btn-large">
                                    <i class="fas fa-check"></i> Use Selected Price
                                </button>
                                <!-- === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (END) -->
                                <button type="button" id="recalculate" class="btn btn-secondary">
                                    <i class="fas fa-redo"></i> Recalculate
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Service List for Estimate -->
                    <div id="estimate-services-list" class="services-list" style="margin-top: 20px;">
                        <!-- Services will be added here -->
                    </div>
                </div>
            `;
            // === SAFE-HOTFIX: EXACT INVOICE CLONE (END)
        },
        
        createMasonryEstimateContent: function() {
            return `
                <div class="estimate-masonry-section">
                    <h4>Masonry Services</h4>
                    <div class="masonry-inputs">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="estimate-masonry-service">Service Type:</label>
                                <select id="estimate-masonry-service">
                                    <option value="brick-repair">Brick Repair</option>
                                    <option value="stone-fireplace">Stone Fireplace</option>
                                    <option value="chimney-repair">Chimney Repair</option>
                                    <option value="veneer-stone">Veneer Stone</option>
                                    <option value="custom">Custom Work</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="estimate-masonry-description">Description:</label>
                                <textarea id="estimate-masonry-description" rows="3" placeholder="Describe the work needed"></textarea>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="estimate-masonry-quantity">Quantity:</label>
                                <input type="number" id="estimate-masonry-quantity" min="0" step="0.1" placeholder="0">
                            </div>
                            <div class="form-group">
                                <label for="estimate-masonry-unit">Unit:</label>
                                <select id="estimate-masonry-unit">
                                    <option value="sq ft">Square Feet</option>
                                    <option value="linear ft">Linear Feet</option>
                                    <option value="each">Each</option>
                                    <option value="hours">Hours</option>
                                    <option value="project">Project</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="estimate-masonry-rate">Rate per Unit:</label>
                                <input type="number" id="estimate-masonry-rate" min="0" step="0.01" placeholder="0.00">
                            </div>
                        </div>
                    </div>
                    
                    <div class="calculator-actions">
                        <button type="button" id="estimate-add-masonry-service" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Add Service to Estimate
                        </button>
                    </div>
                </div>
            `;
        },
        
        bindEstimateConcreteEvents: function(container) {
            // === SAFE-HOTFIX: ESTIMATE CALC NORMALIZE (BEGIN)
            try {
                console.log('🔗 Binding concrete events for estimate');
                
                // === SAFE-HOTFIX: HIDE BUTTON INITIALLY (BEGIN)
                // Hide the Use Selected Price button initially (show only after calculation)
                const initialUseBtn = document.getElementById('use-selected-price');
                if (initialUseBtn) {
                    initialUseBtn.style.display = 'none';
                    initialUseBtn.disabled = true;
                    console.log('[EST-USE:BUTTON_HIDDEN] Button hidden initially');
                }
                // === SAFE-HOTFIX: HIDE BUTTON INITIALLY (END)
                
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (BEGIN)
                // Monitor for calculation results to show Use Selected Price button
                const observer = new MutationObserver((mutations) => {
                    const estimateRoot = document.querySelector('[data-calc-root="estimate"]');
                    const calcResults = document.getElementById('calc-results');
                    const useBtn = document.getElementById('use-selected-price');
                    
                    if (calcResults && useBtn) {
                        // Check if results are visible
                        if (calcResults.style.display !== 'none' && window.getComputedStyle(calcResults).display !== 'none') {
                            // Check if mid price has a value
                            const midPrice = document.getElementById('out-price-mid');
                            if (midPrice && midPrice.textContent && midPrice.textContent !== '$0' && midPrice.textContent !== '$-') {
                                // Remove disabled and show button
                                useBtn.disabled = false;
                                useBtn.style.display = 'inline-block';
                                useBtn.style.visibility = 'visible';
                                
                                const isInRoot = estimateRoot && estimateRoot.contains(useBtn);
                                console.log('[EST-USE:BUTTON_READY]', {
                                    selector: '#use-selected-price',
                                    enabled: !useBtn.disabled,
                                    inRoot: isInRoot
                                });
                                
                                // Extract mid price value for verification
                                const midValue = parseFloat(midPrice.textContent.replace(/[^0-9.-]/g, ''));
                                console.log('[EST-CALC:CALC_OK]', { mid: midValue });
                            }
                        }
                    }
                });
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (END)
                
                // Start observing
                const targetNode = container || document.getElementById('estimate-services-content');
                if (targetNode) {
                    observer.observe(targetNode, { 
                        attributes: true, 
                        attributeFilter: ['style'],
                        subtree: true 
                    });
                }
                
                // === SAFE-HOTFIX: ESTIMATE CALC PARITY (BEGIN)
                // Strict scoping - bind calculate button within estimate root only
                const activeRoot = document.querySelector('#estimate-creation.view.active') || document.querySelector('#estimate-creation');
                if (!activeRoot) {
                    console.log('[EST-CALC:NO_ROOT]');
                    return;
                }
                
                // === SAFE-HOTFIX: EXACT-ID-MATCH (Use calc- prefix IDs like invoice)
                // Get elements scoped to estimate root - using CORRECT calc- prefix IDs
                const calcBtn = activeRoot.querySelector('#calculate-poly'); // FIX: Correct button ID
                const lengthEl = activeRoot.querySelector('#calc-length');
                const widthEl = activeRoot.querySelector('#calc-width');
                const inchesEl = activeRoot.querySelector('#calc-depth');
                const sidesEl = activeRoot.querySelector('#calc-sides');
                const soilEl = activeRoot.querySelector('#calc-soil');
                // === SAFE-HOTFIX: EXACT-ID-MATCH (END)
                
                // Log what nodes we found
                console.log('[EST-CALC:NODES]', {
                    lengthEl: !!lengthEl,
                    widthEl: !!widthEl,
                    inchesEl: !!inchesEl,
                    sidesEl: !!sidesEl,
                    soilEl: !!soilEl,
                    tierMid: !!activeRoot.querySelector('input[name="price-tier"][value="mid"]')
                });
                
                // === FIX: Remove duplicate event binding - let calculator.js handle it
                // The calculator.js bindEvents will attach the proper event handler
                if (calcBtn) {
                    console.log('[EST-CALC:CALC_BTN_FOUND]', { id: calcBtn.id });
                    // Force calculator to rebind events if needed
                    if (window.ConcreteCalculator?.bindEvents) {
                        // Remove any existing bound attribute so calculator can bind
                        calcBtn.removeAttribute('data-calc-bound');
                        calcBtn.removeAttribute('data-est-bound');
                        window.ConcreteCalculator.bindEvents();
                        console.log('[EST-CALC:REBIND_EVENTS]');
                    }
                }
                // === SAFE-HOTFIX: ESTIMATE CALC PARITY (END)
                
                console.log('[EST-CALC:BIND_OK]');
                
            } catch (error) {
                console.error('❌ Error binding estimate concrete events:', error);
            }
            // === SAFE-HOTFIX: ESTIMATE CALC NORMALIZE (END)
        },
        
        bindEstimateMasonryEvents: function(container) {
            try {
                console.log('🔗 Binding masonry events for estimate');
                
                const addBtn = document.getElementById('estimate-add-masonry-service');
                if (addBtn) {
                    addBtn.addEventListener('click', () => {
                        this.addMasonryServiceToEstimate();
                    });
                }
                
            } catch (error) {
                console.error('❌ Error binding estimate masonry events:', error);
            }
        },
        
        calculateEstimatePrice: function() {
            try {
                // === SAFE-HOTFIX: EXACT-ID-MATCH (Use calc- prefix IDs)
                const length = parseFloat(document.getElementById('calc-length')?.value) || 0;
                const width = parseFloat(document.getElementById('calc-width')?.value) || 0;
                const inchesSettled = parseFloat(document.getElementById('calc-depth')?.value) || 1;
                const sidesSettled = document.getElementById('calc-sides')?.value || '1';
                const soilType = document.getElementById('calc-soil')?.value || 'mixed';
                const travelDistance = parseFloat(document.getElementById('estimate-travel-distance')?.value) || 0;
                // === SAFE-HOTFIX: EXACT-ID-MATCH (END)
                
                if (length <= 0 || width <= 0) {
                    return;
                }
                
                const squareFootage = length * width;
                const voidVolumeCuYd = (squareFootage * (inchesSettled / 12)) / 27;
                
                // === FIX: Check foam type and application type for correct factor
                const foamTypeRadio = document.querySelector('input[name="foamType"]:checked');
                const foamType = foamTypeRadio?.value || 'RR201';
                
                const applicationTypeRadio = document.querySelector('input[name="applicationType"]:checked');
                const isVoidFill = applicationTypeRadio?.value === 'void' || false;
                
                // Use correct foam factors based on type and application
                let foamFactorLbs;
                if (isVoidFill) {
                    // Void fill factors
                    foamFactorLbs = (foamType === 'RR401') ? 110 : 70; // RR401 void: 110, RR201 void: 70
                } else {
                    // Lift factors (default)
                    foamFactorLbs = (foamType === 'RR401') ? 120 : 100; // RR401 lift: 120, RR201 lift: 100
                }
                
                const materialWeight = voidVolumeCuYd * foamFactorLbs;
                // === FIX END
                
                // Calculate price range using the same logic as the calculator
                const materialCostLow = materialWeight * 7;
                const materialCostHigh = materialWeight * 10;
                
                const complexityFactors = { '1': 1.0, '2': 1.1, '3': 1.2, '4': 1.3 };
                const complexityFactor = complexityFactors[sidesSettled] || 1.0;
                
                const soilMultipliers = { clay: 1.2, sand: 0.9, mixed: 1.0, rock: 1.4, organic: 1.1 };
                const soilMultiplier = soilMultipliers[soilType] || 1.0;
                
                const equipmentCost = (travelDistance * 2 * 2.5) + 50;
                const envMultiplier = 1.05;
                
                const subLow = materialCostLow * complexityFactor * soilMultiplier * envMultiplier;
                const subHigh = materialCostHigh * complexityFactor * soilMultiplier * envMultiplier;
                
                const laborOHLow = (subLow + equipmentCost) * (3.33 - 1);
                const laborOHHigh = (subHigh + equipmentCost) * (5.0 - 1);
                
                const totalPriceLow = subLow + equipmentCost + laborOHLow;
                const totalPriceHigh = subHigh + equipmentCost + laborOHHigh;
                
                // Store calculation for price review
                this.currentEstimateCalculation = {
                    squareFootage,
                    voidVolume: voidVolumeCuYd,
                    materialWeight,
                    estimatedPriceLow: totalPriceLow,
                    estimatedPriceHigh: totalPriceHigh,
                    length,
                    width,
                    inchesSettled,
                    sidesSettled,
                    soilType,
                    travelDistance,
                    complexityFactor,
                    equipmentCosts: equipmentCost
                };
                
                // Update display
                document.getElementById('estimate-material-square-footage').textContent = `${squareFootage.toFixed(1)} sq ft`;
                document.getElementById('estimate-price-range').textContent = `$${totalPriceLow.toFixed(2)} - $${totalPriceHigh.toFixed(2)}`;
                
                // Show display and review button
                const display = document.querySelector('.material-calculation-display');
                if (display) display.style.display = 'block';
                
                const reviewBtn = document.getElementById('estimate-review-price');
                if (reviewBtn) reviewBtn.style.display = 'inline-block';
                
            } catch (error) {
                console.error('❌ Error calculating estimate price:', error);
            }
        },
        
        showEstimatePriceReview: function() {
            try {
                if (!this.currentEstimateCalculation) {
                    console.error('❌ No calculation data for price review');
                    return;
                }
                
                console.log('🔍 Showing price review for estimate with data:', this.currentEstimateCalculation);
                
                // Show price review modal in estimate context
                if (window.showPriceReview) {
                    window.showPriceReview(this.currentEstimateCalculation, true); // true = isEstimate
                } else {
                    console.error('❌ showPriceReview function not available');
                }
                
            } catch (error) {
                console.error('❌ Error showing estimate price review:', error);
            }
        },
        
        addMasonryServiceToEstimate: function() {
            try {
                const serviceType = document.getElementById('estimate-masonry-service')?.value;
                const description = document.getElementById('estimate-masonry-description')?.value?.trim();
                const quantityInput = document.getElementById('estimate-masonry-quantity')?.value?.trim();
                const unit = document.getElementById('estimate-masonry-unit')?.value;
                const rateInput = document.getElementById('estimate-masonry-rate')?.value?.trim();
                
                if (!description) {
                    alert('Please enter a service description');
                    document.getElementById('estimate-masonry-description')?.focus();
                    return;
                }
                
                // Enhanced quantity validation
                const quantity = parseFloat(quantityInput?.replace(/[^\d.-]/g, '') || '0');
                if (isNaN(quantity) || quantity <= 0) {
                    alert('Please enter a valid quantity greater than 0');
                    document.getElementById('estimate-masonry-quantity')?.focus();
                    return;
                }
                
                // Enhanced rate validation
                const rate = parseFloat(rateInput?.replace(/[^\d.-]/g, '') || '0');
                if (isNaN(rate) || rate <= 0) {
                    alert('Please enter a valid rate greater than $0.00');
                    document.getElementById('estimate-masonry-rate')?.focus();
                    return;
                }
                
                const service = {
                    type: 'masonry',
                    id: 'masonry_' + Date.now(),
                    description: description,
                    quantity: quantity,
                    unit: unit,
                    rate: rate,
                    amount: quantity * rate
                };
                
                this.addService(service);
                
                // Clear form
                document.getElementById('estimate-masonry-description').value = '';
                document.getElementById('estimate-masonry-quantity').value = '';
                document.getElementById('estimate-masonry-rate').value = '';
                
            } catch (error) {
                console.error('❌ Error adding masonry service to estimate:', error);
            }
        },
        
        // REMOVED - this function was causing duplicate fields and conflicts
        
        // REMOVED - this function was causing conflicts
        
        // REMOVED - this function was causing duplicate element issues
        
        addEstimateService: function() {
            try {
                const businessType = document.querySelector('input[name="estimateBusinessType"]:checked')?.value;
                
                if (businessType === 'concrete') {
                    
                    // Get fresh calculation data for price review
                    const calc = window.ConcreteCalculator?.calculateMaterialBasedPrice();
                    
                    if (!calc || calc.estimatedPriceLow <= 0 || calc.squareFootage <= 0) {
                        alert('Please configure the concrete calculator first with valid dimensions.');
                        return;
                    }
                    
                    // Show price review modal for estimates
                    if (window.showPriceReview) {
                        window.showPriceReview(calc, true); // true = isEstimate
                    } else {
                        this.addEstimateServiceWithCustomPrice({
                            ...calc,
                            customPrice: (calc.estimatedPriceLow + calc.estimatedPriceHigh) / 2
                        });
                    }
                    
                } else if (businessType === 'masonry') {
                    const service = this.collectMasonryService();
                    
                    if (service) {
                        // For masonry, add directly since it already has manual pricing
                        if (window.EstimateManager) {
                            window.EstimateManager.addService(service);
                        } else {
                            this.addService(service);
                        }
                        
                        if (window.App) {
                            window.App.showSuccess('Masonry service added to estimate');
                        }
                    } else {
                    }
                }
                
            } catch (error) {
            }
        },
        
        addEstimateServiceWithCustomPrice: function(serviceData) {
            try {
                
                const customPrice = serviceData.customPrice || serviceData.finalPrice;
                if (!customPrice || customPrice <= 0) {
                    throw new Error('Invalid custom price provided');
                }
                
                // EMERGENCY FIX: Get slab data for estimates too
                let estimateSlabsData = [];
                if (window.SlabManager && typeof window.SlabManager.getSlabsData === 'function') {
                    estimateSlabsData = window.SlabManager.getSlabsData();
                    console.log('🚨 EMERGENCY FIX: Retrieved slab data for estimate:', estimateSlabsData);
                }
                
                // === VERSION 9.16 FIX: Add dimensions property for display
                const dimensionsText = `${serviceData.length || 0} x ${serviceData.width || 0} x ${serviceData.inchesSettled || 0}"`;
                
                // Create estimate service object with custom price and slab details
                const service = {
                    type: 'concrete',
                    id: 'concrete_' + Date.now(),
                    description: this.getConcreteServiceDescription(serviceData),
                    dimensions: dimensionsText, // V9.16: Store dimensions separately for display
                    quantity: serviceData.squareFootage,
                    unit: 'sq ft',
                    rate: customPrice / serviceData.squareFootage,
                    amount: customPrice,
                    customPrice: true, // Flag to indicate custom pricing
                    // EMERGENCY FIX: Include slab breakdown for estimates too - MUST match PDF.js expectations
                    slabDetails: estimateSlabsData.length > 0 ? estimateSlabsData.map(slab => ({
                        dimensions: `${slab.length}'×${slab.width}'`, // EMERGENCY FIX: Use × symbol to match PDF format
                        liftHeight: slab.liftHeight,
                        sidesSettled: slab.sides,
                        squareFootage: slab.squareFootage,
                        price: slab.price
                    })) : [],
                    details: {
                        pricingMethod: 'material',
                        customPricing: {
                            originalLow: serviceData.estimatedPriceLow,
                            originalHigh: serviceData.estimatedPriceHigh,
                            recommendedPrice: serviceData.recommendedPrice,
                            customPrice: customPrice,
                            priceOverride: serviceData.priceOverride || false,
                            profitMargin: serviceData.profitMargin,
                            costBreakdown: serviceData.costBreakdown,
                            pricingFactors: serviceData.pricingFactors
                        },
                        dimensions: {
                            length: serviceData.length,
                            width: serviceData.width,
                            squareFootage: serviceData.squareFootage
                        },
                        settlement: {
                            inchesSettled: serviceData.inchesSettled,
                            sidesSettled: serviceData.sidesSettled
                        },
                        environmental: {
                            soilType: serviceData.soilType,
                            weatherConditions: serviceData.weatherConditions,
                            moistureLevel: serviceData.moistureLevel,
                            travelDistance: serviceData.travelDistance
                        },
                        pricing: {
                            estimatedLow: serviceData.estimatedPriceLow,
                            estimatedHigh: serviceData.estimatedPriceHigh,
                            materialWeight: serviceData.materialWeight,
                            complexityFactor: serviceData.complexityFactor,
                            equipmentCosts: serviceData.equipmentCosts,
                            cubicYards: serviceData.voidVolume,
                            pricePerSqFtLow: serviceData.pricePerSqFtLow,
                            pricePerSqFtHigh: serviceData.pricePerSqFtHigh
                        }
                    }
                };
                
                // EMERGENCY FIX: Validate estimate slab details structure before adding
                console.log('🚨 EMERGENCY VALIDATION: Estimate service structure for PDF:', {
                    type: service.type,
                    description: service.description,
                    hasSlabDetails: !!service.slabDetails,
                    slabCount: service.slabDetails ? service.slabDetails.length : 0,
                    slabDetailsStructure: service.slabDetails && service.slabDetails.length > 0 ? service.slabDetails[0] : null
                });
                
                // EMERGENCY FIX: Verify each estimate slab has required fields for PDF generation
                if (service.slabDetails && service.slabDetails.length > 0) {
                    service.slabDetails.forEach((slab, index) => {
                        const required = ['dimensions', 'liftHeight', 'sidesSettled', 'price'];
                        const missing = required.filter(field => !slab.hasOwnProperty(field));
                        if (missing.length > 0) {
                            console.error(`🚨 EMERGENCY ERROR: Estimate Slab ${index + 1} missing required fields:`, missing);
                        } else {
                            console.log(`✅ EMERGENCY VALIDATION: Estimate Slab ${index + 1} structure valid for PDF`);
                        }
                    });
                } else {
                    console.warn('⚠️ EMERGENCY WARNING: No slab details found for estimate - PDF itemization will show summary only');
                }
                
                // Add to EstimateManager
                if (window.EstimateManager) {
                    window.EstimateManager.addService(service);
                } else {
                    this.addService(service);
                }
                
                console.log('Custom price estimate service addition completed');
                
                // Show success feedback
                if (window.LoadingIndicator) {
                    window.LoadingIndicator.showSuccess(`Service added: ${service.description} - ${this.formatCurrency(customPrice)}`);
                }
                
                // Reset calculator if available
                if (window.ConcreteCalculator) {
                    window.ConcreteCalculator.resetCalculator();
                }
                
            } catch (error) {
                console.error('Add estimate service with custom price error:', error);
                
                // Show error feedback  
                if (window.LoadingIndicator) {
                    window.LoadingIndicator.showError('Failed to add service: ' + error.message);
                } else {
                    alert('Error adding service: ' + error.message);
                }
                throw error;
            }
        },
        
        collectConcreteService: function() {
            try {
                console.log('collectConcreteService called');
                console.log('ConcreteCalculator available?', !!window.ConcreteCalculator);
                
                // Get fresh calculation using business rules (same as addConcreteService in calculator.js)
                const calc = window.ConcreteCalculator?.calculateMaterialBasedPrice();
                console.log('Fresh calculation result:', calc);
                
                if (!calc) {
                    console.log('No calculation result received');
                    alert('Calculator not available. Please refresh the page.');
                    return null;
                }
                
                if (calc.estimatedPriceLow <= 0 || calc.squareFootage <= 0) {
                    console.log('Validation failed:', {
                        estimatedPriceLow: calc.estimatedPriceLow,
                        squareFootage: calc.squareFootage
                    });
                    alert('Please configure the concrete calculator first.');
                    return null;
                }
                
                // Use average of low and high estimates for service pricing
                const averagePrice = (calc.estimatedPriceLow + calc.estimatedPriceHigh) / 2;
                const averageRate = calc.squareFootage > 0 ? averagePrice / calc.squareFootage : 0;
                
                // Create service object from calculator data
                return {
                    type: 'concrete',
                    id: 'concrete_' + Date.now(),
                    description: this.getConcreteServiceDescription(calc),
                    quantity: calc.squareFootage,
                    unit: 'sq ft',
                    rate: averageRate,
                    amount: averagePrice,
                    details: {
                        pricingMethod: 'material',
                        length: calc.length,
                        width: calc.width,
                        inchesSettled: calc.inchesSettled,
                        sidesSettled: calc.sidesSettled,
                        complexityFactor: calc.complexityFactor,
                        environmentalMultiplier: calc.environmentalMultiplier,
                        equipmentCosts: calc.equipmentCosts,
                        laborAndOverhead: calc.laborAndOverhead,
                        materialCostLow: calc.materialCostLow,
                        materialCostHigh: calc.materialCostHigh,
                        estimatedPriceLow: calc.estimatedPriceLow,
                        estimatedPriceHigh: calc.estimatedPriceHigh,
                        cubicYards: calc.cubicYards,
                        weight: calc.weight,
                        pricePerSqFtLow: calc.pricePerSqFtLow,
                        pricePerSqFtHigh: calc.pricePerSqFtHigh
                    }
                };
            } catch (error) {
                console.error('Collect concrete service error:', error);
                return null;
            }
        },
        
        getConcreteServiceDescription: function(calc) {
            try {
                // Project type description
                const projectTypes = {
                    driveway: 'Driveway Concrete Leveling',
                    sidewalk: 'Sidewalk Concrete Leveling',
                    patio: 'Patio Concrete Leveling',
                    garage: 'Garage Floor Concrete Leveling',
                    basement: 'Basement Floor Concrete Leveling',
                    steps: 'Steps Concrete Leveling',
                    'pool-deck': 'Pool Deck Concrete Leveling',
                    custom: 'Custom Concrete Leveling'
                };
                
                // === VERSION 9.5 FIX: Add null check for projectType
                let description = calc.projectType ? (projectTypes[calc.projectType] || 'Concrete Leveling') : 'Concrete Leveling';
                
                // Add severity and accessibility details if not standard
                const details = [];
                // === VERSION 9.5 FIX: Add null check for severity
                if (calc.severity && calc.severity !== 'mild') {
                    details.push(calc.severity.charAt(0).toUpperCase() + calc.severity.slice(1) + ' damage');
                }
                // === VERSION 9.5 FIX: Add null check for accessibility
                if (calc.accessibility && calc.accessibility !== 'easy') {
                    details.push(calc.accessibility + ' access');
                }
                
                // Add pricing method if material-based
                if (calc.pricingMethod === 'material') {
                    details.push('Material-based pricing');
                }
                
                if (details.length > 0) {
                    description += ` (${details.join(', ')})`;
                }
                
                return description;
                
            } catch (error) {
                console.error('Service description error:', error);
                return 'Concrete Leveling Service';
            }
        },
        
        collectMasonryService: function() {
            try {
                const serviceType = document.getElementById('masonry-service')?.value;
                const description = document.getElementById('masonry-description')?.value;
                const jobPrice = parseFloat(document.getElementById('masonry-job-price')?.value || 0);
                
                if (!serviceType || serviceType === '' || jobPrice <= 0) {
                    alert('Please select a service type and enter a valid job price.');
                    return null;
                }
                
                return {
                    id: 'masonry_' + Date.now(),
                    type: 'masonry',
                    description: description || this.getServiceTypeName(serviceType),
                    quantity: 1,
                    unit: 'job',
                    rate: jobPrice,
                    amount: jobPrice,
                    details: {
                        serviceType: serviceType,
                        customDescription: description,
                        jobPricing: true
                    }
                };
                
            } catch (error) {
                console.error('Collect masonry service error:', error);
                return null;
            }
        },

        getServiceTypeName: function(serviceType) {
            const serviceNames = {
                'brick-installation': 'Brick Installation',
                'brick-repair': 'Brick Repair',
                'stone-fireplace': 'Stone Fireplace',
                'chimney-repair': 'Chimney Repair',
                'chimney-restoration': 'Chimney Restoration',
                'outdoor-fireplace': 'Outdoor Fireplace',
                'patio-construction': 'Patio Construction',
                'fire-pit': 'Fire Pit Installation',
                'outdoor-kitchen': 'Outdoor Kitchen',
                'veneer-stone': 'Veneer Stone Installation',
                'cultured-stone': 'Cultured Stone Application',
                'custom': 'Custom Masonry Work'
            };
            return serviceNames[serviceType] || 'Masonry Service';
        },
        
        addService: function(service) {
            try {
                // Initialize currentEstimate if not exists
                if (!this.currentEstimate || !this.currentEstimate.services) {
                    console.warn('Current estimate not initialized, initializing now...');
                    this.resetEstimate();
                }
                
                // Add service to current estimate
                this.currentEstimate.services.push(service);
                
                // Add to services list in UI
                this.addServiceToList(service);
                
                // Update totals
                this.updateEstimateTotals();
                
                console.log('Service added to estimate:', service);
                console.log('Current estimate services count:', this.currentEstimate.services.length);
                
            } catch (error) {
                console.error('Add service error:', error);
            }
        },
        
        removeService: function(serviceId) {
            try {
                // Remove from current estimate
                this.currentEstimate.services = this.currentEstimate.services.filter(
                    service => service.id !== serviceId
                );
                
                // Remove from UI
                const serviceElement = document.querySelector(`[data-service-id="${serviceId}"]`);
                if (serviceElement) {
                    serviceElement.remove();
                }
                
                // Update totals
                this.updateEstimateTotals();
                
                // Show empty message if no services
                this.checkEmptyServices();
                
            } catch (error) {
                console.error('Remove service error:', error);
            }
        },
        
        // === SAFE-HOTFIX: ESTIMATE SLAB REMOVE (BEGIN)
        removeServiceById: function(serviceId) {
            // Alias to removeService for consistency
            return this.removeService(serviceId);
        },
        // === SAFE-HOTFIX: ESTIMATE SLAB REMOVE (END)
        
        addServiceToList: function(service) {
            try {
                const servicesList = document.getElementById('estimate-services-list');
                if (!servicesList) {
                    // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (BEGIN)
                    console.log('[MAS-EST:LIST_NOT_FOUND]');
                    // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (END)
                    return;
                }
                
                // Remove empty message if present
                const emptyMessage = servicesList.querySelector('.empty-services');
                if (emptyMessage) {
                    emptyMessage.remove();
                }
                
                // Create service item
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item service-row'; // Added service-row for validation
                serviceItem.setAttribute('data-service-id', service.id);
                
                // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (BEGIN)
                // Check if this is a masonry service for estimate
                const isMasonryService = service.type && (service.type.startsWith('masonry') || service.type === 'masonry');
                
                if (isMasonryService) {
                    // Masonry services - show description with line breaks, quantity and amount
                    console.log('[MAS-EST:RENDER_ROW]', { 
                        id: service.id, 
                        qty: service.quantity || 1, 
                        amount: service.amount || service.price 
                    });
                    
                    // Convert newlines to <br> tags for proper line break display
                    const descriptionWithBreaks = (service.description || '').replace(/\n/g, '<br>');
                    
                    serviceItem.classList.add('service-item--masonry');
                    serviceItem.innerHTML = `
                        <div class="service-details">
                            <div style="white-space: pre-line; margin-bottom: 10px;">${descriptionWithBreaks}</div>
                            <span class="service-qty">Quantity: ${service.quantity || 1}</span>
                        </div>
                        <div class="service-actions">
                            <span class="service-amount">Amount: ${this.formatCurrency(service.amount || service.price)}</span>
                            <button class="remove-service" onclick="JStarkInvoicing.EstimateManager.removeService('${service.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                } else {
                    // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (END)
                    // === VERSION 9.15 FIX: Remove quantity × rate display for concrete
                    let serviceDetailsHtml = '';
                    if (service.details && service.details.jobPricing) {
                        // Job-based pricing (masonry) - show as single job
                        serviceDetailsHtml = `<p>Job Price: ${this.formatCurrency(service.amount)}</p>`;
                    }
                    // V9.15: Removed quantity × rate display for concrete services
                    
                    // Display dimensions if available
                    const displayDescription = service.dimensions ? 
                        `${service.description} - ${service.dimensions}` : 
                        service.description;
                    
                    serviceItem.innerHTML = `
                        <div class="service-details">
                            <h4>${displayDescription}</h4>
                            ${serviceDetailsHtml}
                            ${service.details ? this.getServiceDetailsHtml(service.details) : ''}
                        </div>
                        <div class="service-actions">
                            <span class="service-amount">${this.formatCurrency(service.amount)}</span>
                            <button class="remove-service" onclick="JStarkInvoicing.EstimateManager.removeService('${service.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `;
                    // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (BEGIN)
                }
                // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (END)
                
                servicesList.appendChild(serviceItem);
                
            } catch (error) {
                console.error('Add service to list error:', error);
            }
        },
        
        getServiceDetailsHtml: function(details) {
            try {
                let html = '';
                
                if (details.projectType) {
                    const multiplierInfo = [];
                    if (details.multipliers && details.multipliers.total > 1) {
                        if (details.severity !== 'mild') {
                            multiplierInfo.push(`${details.severity} damage`);
                        }
                        if (details.accessibility !== 'easy') {
                            multiplierInfo.push(`${details.accessibility} access`);
                        }
                    }
                    
                    if (multiplierInfo.length > 0) {
                        html += `<small class="service-modifiers">${multiplierInfo.join(', ')}</small>`;
                    }
                }
                
                return html;
                
            } catch (error) {
                console.error('Service details HTML error:', error);
                return '';
            }
        },
        
        updateEstimateTotals: function() {
            try {
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - Fix totals calculation
                // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (BEGIN)
                // Calculate subtotal from services - use 'total' or 'amount' or 'price' property
                const subtotal = this.currentEstimate.services.reduce((sum, service) => {
                    // Support both 'total' and 'amount' and 'price' properties for compatibility
                    const serviceAmount = service.total || service.amount || service.price || service.unitPrice || 0;
                    return sum + serviceAmount;
                }, 0);
                // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (END)
                
                // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (BEGIN)
                console.log('[MAS-EST:TOTALS]', {
                    services: this.currentEstimate.services.length,
                    subtotal: subtotal,
                    total: subtotal
                });
                // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (END)
                console.log('[EST-TOTALS:CALC]', {
                    services: this.currentEstimate.services.length,
                    subtotal: subtotal
                });
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END) - Fix totals calculation
                
                // No tax calculation
                const tax = 0;
                
                // Total equals subtotal (no tax)
                const total = subtotal;
                
                // Update current estimate
                this.currentEstimate.subtotal = subtotal;
                this.currentEstimate.tax = tax;
                this.currentEstimate.total = total;
                
                // Update UI (with null checks for removed elements)
                const subtotalEl = document.getElementById('estimate-subtotal');
                if (subtotalEl) subtotalEl.textContent = this.formatCurrency(subtotal);
                
                const taxEl = document.getElementById('estimate-tax');
                if (taxEl) taxEl.textContent = this.formatCurrency(tax);
                
                const totalEl = document.getElementById('estimate-grand-total');
                if (totalEl) totalEl.textContent = this.formatCurrency(total);
                
            } catch (error) {
                console.error('Update estimate totals error:', error);
            }
        },
        
        checkEmptyServices: function() {
            try {
                const servicesList = document.getElementById('estimate-services-list');
                const serviceItems = servicesList.querySelectorAll('.service-item');
                
                if (serviceItems.length === 0) {
                    servicesList.innerHTML = '<p class="empty-services">No services added yet. Add services using the sections above.</p>';
                }
                
            } catch (error) {
                console.error('Check empty services error:', error);
            }
        },
        
        handleEstimateSubmission: function() {
            try {
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                console.log('[EST:SUBMIT]');
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                
                // Validate form
                if (!this.validateEstimateForm()) {
                    return;
                }
                
                // Collect form data
                this.collectFormData();
                
                // Generate estimate number if new
                if (!this.currentEstimate.id) {
                    this.currentEstimate.id = this.generateEstimateId();
                    // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                    // Use proper estimate number format
                    const nextNum = window.App?.AppState?.nextEstimateNumber || 1;
                    this.currentEstimate.number = `EST-${String(nextNum).padStart(4, '0')}`;
                    // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                }
                
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                // Ensure estimate has all required fields
                this.currentEstimate.createdAt = this.currentEstimate.createdAt || new Date().toISOString();
                this.currentEstimate.businessType = this.currentEstimate.businessType || 
                    document.querySelector('input[name="estimateBusinessType"]:checked')?.value || 'concrete';
                
                console.log('[EST:OBJECT]', {
                    id: this.currentEstimate.id,
                    number: this.currentEstimate.number,
                    businessType: this.currentEstimate.businessType,
                    services: this.currentEstimate.services.length,
                    subtotal: this.currentEstimate.subtotal,
                    total: this.currentEstimate.total
                });
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                
                // Save estimate
                this.saveEstimate();
                
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - CKPT:6
                console.log('[EST:CREATED]', {
                    id: this.currentEstimate.id,
                    total: this.currentEstimate.total,
                    services: this.currentEstimate.services.length
                });
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END) - CKPT:6
                
                // Update AppState
                if (window.App && window.App.AppState) {
                    window.App.AppState.nextEstimateNumber++;
                    window.App.saveData();
                    window.App.updateDashboard();
                }
                
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (BEGIN)
                // Navigate to preview after save and log navigation
                if (window.App && window.App.showEstimatePreview) {
                    window.App.showSuccess('Estimate created successfully!');
                    console.log('[EST:NAV_AFTER_SAVE]', { to: 'estimate-preview' });
                    
                    // Navigate to preview immediately
                    window.App.showEstimatePreview(this.currentEstimate);
                } else {
                    // Fallback navigation
                    console.log('[EST:NAV_AFTER_SAVE]', { to: 'estimate-preview', fallback: true });
                    if (window.App && window.App.showView) {
                        window.App.showView('estimate-preview');
                        // Populate preview after navigation
                        setTimeout(() => this.populateEstimatePreview(this.currentEstimate), 100);
                    } else {
                        alert('Estimate created successfully!');
                    }
                }
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (END)
                
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - Return true for success
                return true; // Critical: app.js checks for truthy return value
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END)
                
            } catch (error) {
                // === SAFE-HOTFIX: SUBMISSION_CATCH (BEGIN)
                console.error('[SUBMIT:ERROR] Estimate submission failed:', error.message || error);
                console.error('Full error details:', error);
                if (window.App && window.App.showError) {
                    window.App.showError('Failed to create estimate: ' + (error.message || 'Unknown error'));
                }
                // === SAFE-HOTFIX: SUBMISSION_CATCH (END)
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - Return false on error
                return false;
                // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END)
            }
        },
        
        validateEstimateForm: function() {
            try {
                let isValid = true;
                const errors = [];
                
                // Check business type (radio buttons)
                const businessTypeRadio = document.querySelector('input[name="estimateBusinessType"]:checked');
                if (!businessTypeRadio) {
                    errors.push('Business Type is required');
                    isValid = false;
                }
                
                // Check other required fields
                const requiredFields = [
                    { id: 'estimate-customer-name', name: 'Customer Name' },
                    { id: 'estimate-date', name: 'Estimate Date' }
                ];
                
                requiredFields.forEach(field => {
                    const element = document.getElementById(field.id);
                    if (!element || !element.value.trim()) {
                        errors.push(`${field.name} is required`);
                        isValid = false;
                        
                        // Add error styling
                        if (element) {
                            element.style.borderColor = '#dc3545';
                        }
                    } else {
                        // Remove error styling
                        if (element) {
                            element.style.borderColor = '';
                        }
                    }
                });
                
                // Check if services are added
                if (this.currentEstimate.services.length === 0) {
                    errors.push('At least one service must be added');
                    isValid = false;
                } else {
                    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - CKPT:6
                    console.log('[EST:VALIDATION_OK]', { 
                        services: this.currentEstimate.services.length,
                        total: this.currentEstimate.total 
                    });
                    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END) - CKPT:6
                }
                
                // Show errors if any
                if (!isValid) {
                    const errorMessage = 'Please fix the following errors:\n\n• ' + errors.join('\n• ');
                    alert(errorMessage);
                }
                
                return isValid;
                
            } catch (error) {
                console.error('Form validation error:', error);
                return false;
            }
        },
        
        collectFormData: function() {
            try {
                // Get form values
                const businessTypeRadio = document.querySelector('input[name="estimateBusinessType"]:checked');
                this.currentEstimate.businessType = businessTypeRadio ? businessTypeRadio.value : '';
                
                this.currentEstimate.customerName = document.getElementById('estimate-customer-name').value.trim();
                this.currentEstimate.customerEmail = document.getElementById('estimate-customer-email').value.trim();
                this.currentEstimate.customerPhone = document.getElementById('estimate-customer-phone').value.trim();
                this.currentEstimate.customer = {
                    name: this.currentEstimate.customerName || '',
                    email: this.currentEstimate.customerEmail || '',
                    phone: this.currentEstimate.customerPhone || '',
                    street: document.getElementById('estimate-customer-street')?.value?.trim() || '',
                    city: document.getElementById('estimate-customer-city')?.value?.trim() || '',
                    state: document.getElementById('estimate-customer-state')?.value?.trim() || '',
                    zip: document.getElementById('estimate-customer-zip')?.value?.trim() || ''
                };
                this.currentEstimate.date = document.getElementById('estimate-date').value;
                // === VERSION 9.17: Notes field removed from UI, set to empty
                this.currentEstimate.notes = '';
                this.currentEstimate.status = document.getElementById('estimate-status').value;
                
                // Collect signature data
                this.currentEstimate.signature = this.getSignatureData();
                this.currentEstimate.signatureCustomerName = document.getElementById('signature-customer-name')?.value.trim() || '';
                this.currentEstimate.signatureTimestamp = document.getElementById('signature-date-time')?.textContent.replace('Signed on: ', '') || '';
                this.currentEstimate.approval = document.getElementById('estimate-approval')?.checked || false;
                
                // Set creation timestamp
                this.currentEstimate.createdAt = new Date().toISOString();
                this.currentEstimate.updatedAt = new Date().toISOString();
                
            } catch (error) {
                console.error('Collect form data error:', error);
            }
        },
        
        saveEstimate: function() {
            try {
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                let savedSuccessfully = false;
                let estimatesCount = 0;
                let nextEstimateNumber = 1;
                
                // Check if StorageManager has the methods we need
                const hasStorageMethods = window.StorageManager && 
                    typeof window.StorageManager.getEstimates === 'function' &&
                    typeof window.StorageManager.saveEstimates === 'function';
                
                if (hasStorageMethods) {
                    // Use StorageManager for proper persistence
                    const estimates = window.StorageManager.getEstimates() || [];
                    const existingIndex = estimates.findIndex(est => est.id === this.currentEstimate.id);
                    
                    if (existingIndex >= 0) {
                        estimates[existingIndex] = { ...this.currentEstimate };
                    } else {
                        estimates.push({ ...this.currentEstimate });
                    }
                    
                    // Save estimates array
                    window.StorageManager.saveEstimates(estimates);
                    
                    // Update next estimate number
                    nextEstimateNumber = window.StorageManager.getNextEstimateNumber() || 1;
                    if (!this.currentEstimate.id.includes('existing')) {
                        window.StorageManager.saveNextEstimateNumber(nextEstimateNumber + 1);
                    }
                    
                    estimatesCount = estimates.length;
                    savedSuccessfully = true;
                    console.log('[EST-SAVE:STORAGE_MANAGER] Used StorageManager');
                    
                } else if (window.App && window.App.AppState) {
                    // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                    // Check if estimate already exists (editing)
                    const existingIndex = window.App.AppState.estimates.findIndex(est => est.id === this.currentEstimate.id);
                    
                    if (existingIndex >= 0) {
                        // Update existing estimate
                        window.App.AppState.estimates[existingIndex] = { ...this.currentEstimate };
                    } else {
                        // Add new estimate
                        window.App.AppState.estimates.push({ ...this.currentEstimate });
                    }
                    
                    // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                    estimatesCount = window.App.AppState.estimates.length;
                    nextEstimateNumber = window.App.AppState.nextEstimateNumber || 1;
                    // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                    
                    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - Save to localStorage
                    // Critical: Must call saveData to persist to localStorage
                    if (window.App.saveData) {
                        window.App.saveData();
                        console.log('[EST-SAVE:PERSISTED] Estimate saved to localStorage');
                        // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                        savedSuccessfully = true;
                        // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                    }
                    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END)
                } else {
                    // Fallback to direct localStorage access
                    let estimates = [];
                    try {
                        const stored = localStorage.getItem('jstark_estimates');
                        if (stored) {
                            estimates = JSON.parse(stored);
                        }
                    } catch (e) {
                        console.error('Error loading estimates from localStorage:', e);
                    }
                    
                    const existingIndex = estimates.findIndex(est => est.id === this.currentEstimate.id);
                    
                    if (existingIndex >= 0) {
                        estimates[existingIndex] = { ...this.currentEstimate };
                    } else {
                        estimates.push({ ...this.currentEstimate });
                    }
                    
                    localStorage.setItem('jstark_estimates', JSON.stringify(estimates));
                    
                    // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                    // Update next estimate number in localStorage
                    const nextNum = parseInt(localStorage.getItem('jstark_nextEstimateNumber') || '1');
                    if (!this.currentEstimate.id.includes('existing')) {
                        localStorage.setItem('jstark_nextEstimateNumber', String(nextNum + 1));
                    }
                    
                    estimatesCount = estimates.length;
                    nextEstimateNumber = nextNum;
                    savedSuccessfully = true;
                    // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                }
                
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (BEGIN)
                if (savedSuccessfully) {
                    // Log successful save
                    console.log('[EST:SAVE_OK]', {
                        id: this.currentEstimate.id,
                        number: this.currentEstimate.number
                    });
                    
                    // Get invoice count for comparison
                    let invoicesCount = 0;
                    if (window.App && window.App.AppState && window.App.AppState.invoices) {
                        invoicesCount = window.App.AppState.invoices.length;
                    } else {
                        const storedInvoices = localStorage.getItem('jstark_invoices');
                        if (storedInvoices) {
                            try {
                                invoicesCount = JSON.parse(storedInvoices).length;
                            } catch (e) {}
                        }
                    }
                    
                    console.log('[EST:STORE_COUNTS]', {
                        invoices: invoicesCount,
                        estimates: estimatesCount
                    });
                    
                    // Store current estimate ID for navigation
                    this.currentEstimateId = this.currentEstimate.id;
                } else {
                    console.log('[EST:STORAGE_FAIL]');
                }
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (END)
                
            } catch (error) {
                console.error('Save estimate error:', error);
            }
        },
        
        previewEstimate: function() {
            try {
                // Capture customer data before preview
                if (window.App?.captureCustomerFromForm) {
                    window.App.captureCustomerFromForm(EstimateManager.currentEstimate);
                }
                
                // Normalize customer data
                EstimateManager.currentEstimate.customer = EstimateManager.normalizeCustomer(EstimateManager.currentEstimate);
                
                // Validate form first
                if (!this.validateEstimateForm()) {
                    return;
                }
                
                // Collect current form data
                this.collectFormData();
                
                // Generate preview
                if (window.App) {
                    window.App.showEstimatePreview(this.currentEstimate);
                } else {
                    this.generateEstimatePreview(this.currentEstimate);
                }
                
            } catch (error) {
                console.error('Preview estimate error:', error);
            }
        },
        
        generateEstimatePreview: function(estimate) {
            try {
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (BEGIN)
                // === SAFE-HOTFIX: PREVIEW_PIPELINE (BEGIN)
                // Store the current estimate being previewed so PDF generator uses the correct one
                this.previewedEstimate = estimate;
                
                // Clear any conflicting invoice preview state
                if (window.InvoiceManager) {
                    window.InvoiceManager.previewedEstimate = null;
                }
                
                // Set global preview state
                window.currentPreview = {
                    type: 'estimate',
                    id: estimate.id
                };
                
                console.log('[PREVIEW:SET] {type:\'estimate\', id:\'' + estimate.id + '\', number:' + estimate.number + '}');
                console.log('[PREVIEW:READY] {services:' + (estimate.services ? estimate.services.length : 0) + ',total:' + estimate.total + '}');
                // === SAFE-HOTFIX: PREVIEW_PIPELINE (END)
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (END)
                
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                const previewContent = document.getElementById('estimate-preview-content');
                if (!previewContent) {
                    console.log('[EST:PREVIEW_MISSING]', { selector: '#estimate-preview-content' });
                    return;
                }
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                
                const businessInfo = this.getBusinessInfo(estimate.businessType);
                
                // Get warranty block if concrete
                let warrantyBlock = '';
                if (window.PDFGenerator && window.PDFGenerator.renderWarrantyPreviewBlock) {
                    warrantyBlock = window.PDFGenerator.renderWarrantyPreviewBlock(estimate);
                }
                
                const estimateHtml = `
                    <div class="estimate-document business-${estimate.businessType}">
                        ${this.generateEstimateHeader(estimate, businessInfo)}
                        ${this.generateCustomerSection(estimate)}
                        ${this.generateServicesTable(estimate)}
                        ${this.generateTotalsSection(estimate)}
                        ${this.generateNotesSection(estimate)}
                        ${this.generateSignatureSection(estimate)}
                        ${this.generateFooterSection(estimate, businessInfo)}
                    </div>
                    ${warrantyBlock}
                `;
                
                previewContent.innerHTML = estimateHtml;
                
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                console.log('[EST:PREVIEW_READY]', {
                    id: estimate.id,
                    services: estimate.services?.length || 0,
                    total: estimate.total
                });
                
                // Bind PDF/Print button if present
                this.bindEstimatePDFButtons(estimate);
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                
            } catch (error) {
                console.error('Generate estimate preview error:', error);
            }
        },
        
        // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
        populateEstimatePreview: function(estimate) {
            // Alias to generateEstimatePreview for compatibility
            this.generateEstimatePreview(estimate);
        },
        
        bindEstimatePDFButtons: function(estimate) {
            // Bind download/print buttons
            const downloadBtn = document.querySelector('#estimate-preview .btn-download');
            const printBtn = document.querySelector('#estimate-preview .btn-print');
            
            if (downloadBtn && !downloadBtn.dataset.estPdfBound) {
                downloadBtn.addEventListener('click', () => this.downloadEstimatePDF(estimate));
                downloadBtn.dataset.estPdfBound = '1';
            }
            
            if (printBtn && !printBtn.dataset.estPdfBound) {
                printBtn.addEventListener('click', () => this.printEstimate(estimate));
                printBtn.dataset.estPdfBound = '1';
            }
        },
        
        downloadEstimatePDF: function(estimate) {
            console.log('[EST:PDF:START]', { id: estimate.id, businessType: estimate.businessType });
            
            // Use existing PDF generator with estimate context
            if (window.PDFGenerator) {
                window.PDFGenerator.generateEstimatePDF(estimate);
            } else {
                // Fallback to print
                this.printEstimate(estimate);
            }
            
            console.log('[EST:PDF:DONE]', { pages: estimate.businessType === 'concrete' ? 2 : 1 });
        },
        
        printEstimate: function(estimate) {
            // Use browser print for estimate preview
            window.print();
        },
        // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
        
        getBusinessInfo: function(businessType) {
            const businesses = {
                concrete: {
                    name: 'Superior Concrete Leveling LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com',
                    website: 'superiorconcrete.com'
                },
                masonry: {
                    name: 'J. Stark Masonry & Construction LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com',
                    website: 'jstarkmasonry.com'
                }
            };
            
            return businesses[businessType] || businesses.concrete;
        },
        
        generateEstimateHeader: function(estimate, businessInfo) {
            return `
                <div class="estimate-header">
                    <div class="company-details">
                        <img src="https://i.imgur.com/u294xgL.png" alt="Company Logo" class="company-logo">
                        <h2>${businessInfo.name}</h2>
                        <p>${businessInfo.address}</p>
                        <p>Phone: ${businessInfo.phone}</p>
                        <p>Email: ${businessInfo.email}</p>
                    </div>
                    <div class="estimate-meta">
                        <div class="estimate-number">Estimate #${estimate.number || 'PREVIEW'}</div>
                        <div class="estimate-date">Date: ${this.formatDate(estimate.date)}</div>
                        <div class="estimate-status">Status: ${(estimate.status || 'draft').toUpperCase()}</div>
                    </div>
                </div>
            `;
        },
        
        generateCustomerSection: function(estimate) {
            // Build customer object with proper fallbacks
            const customer = estimate.customer || {
                name: estimate.customerName || '',
                email: estimate.customerEmail || '',
                phone: estimate.customerPhone || '',
                street: '',
                city: '',
                state: '',
                zip: ''
            };
            
            // Format address lines
            const addressLines = formatAddressLines(customer);
            const addressHTML = addressLines.map(line => `<p>${line}</p>`).join('');
            
            return `
                <div class="customer-section">
                    <h3>For:</h3>
                    ${addressHTML}
                    ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
                    ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
                </div>
            `;
        },
        
        generateServicesTable: function(estimate) {
            // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
            // Check if this is a masonry estimate
            const isMasonry = estimate.businessType === 'masonry' || 
                              estimate.services?.some(s => s.type === 'masonry' || s.type?.startsWith('masonry'));
            
            if (isMasonry) {
                // Use simplified two-column display for masonry
                return this.generateMasonryServicesTable(estimate);
            }
            // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
            if (!estimate.services || estimate.services.length === 0) {
                return '<div class="no-services">No services added</div>';
            }
            
            const servicesRows = estimate.services.map(service => {
                if (service.details && service.details.jobPricing) {
                    return `
                        <tr>
                            <td style="white-space: pre-line;">${(service.description || '').replace(/\n/g, '<br>')}</td>
                            <td class="amount">1</td>
                            <td class="amount">job</td>
                            <td class="amount">${this.formatCurrency(service.amount)}</td>
                            <td class="amount">${this.formatCurrency(service.amount)}</td>
                        </tr>
                    `;
                } else {
                    // === VERSION 9.24: Append dimensions to description for display
                    const displayDesc = service.dimensions ? 
                        `${service.description} - ${service.dimensions}` : 
                        service.description;
                    return `
                        <tr>
                            <td style="white-space: pre-line;">${(displayDesc || '').replace(/\n/g, '<br>')}</td>
                            <td class="amount">${service.quantity}</td>
                            <td class="amount">${service.unit}</td>
                            <td class="amount">${this.formatCurrency(service.rate)}</td>
                            <td class="amount">${this.formatCurrency(service.amount)}</td>
                        </tr>
                    `;
                }
            }).join('');
            
            return `
                <table class="estimate-services-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${servicesRows}
                    </tbody>
                </table>
            `;
        },
        
        // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
        generateMasonryServicesTable: function(estimate) {
            const services = estimate.services || [];
            
            let rows = '';
            services.forEach(service => {
                const amount = service.amount || service.price || 0;
                rows += `
                    <tr>
                        <td>Quantity: ${service.quantity || 1}</td>
                        <td class="text-right">Amount: ${this.formatCurrency(amount)}</td>
                    </tr>
                `;
            });
            
            return `
                <div class="services-section">
                    <h3>Services</h3>
                    <table class="services-table">
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            `;
        },
        // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
        
        generateTotalsSection: function(estimate) {
            // No tax row at all
            return `
                <div class="estimate-totals-section">
                    <table class="estimate-totals-table">
                        <tr>
                            <td class="total-label">Subtotal:</td>
                            <td class="total-amount">${this.formatCurrency(estimate.subtotal)}</td>
                        </tr>
                        <tr class="grand-total">
                            <td class="total-label"><strong>Total:</strong></td>
                            <td class="total-amount"><strong>${this.formatCurrency(estimate.total)}</strong></td>
                        </tr>
                    </table>
                </div>
            `;
        },
        
        generateNotesSection: function(estimate) {
            if (!estimate.notes || !estimate.notes.trim()) {
                return '';
            }
            
            return `
                <div class="estimate-notes">
                    <h4>Notes:</h4>
                    <p>${estimate.notes.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        },
        
        generateSignatureSection: function(estimate) {
            if (!estimate.signature && !estimate.approval) {
                return '';
            }
            
            let signatureImageHtml = '';
            if (estimate.signature) {
                signatureImageHtml = `<img src="${estimate.signature}" alt="Customer Signature" class="signature-image">`;
            }
            
            let approvalText = '';
            if (estimate.approval) {
                approvalText = '<p class="approval-text">Approved by Customer</p>';
            }
            
            let signatureInfoHtml = '';
            if (estimate.signatureCustomerName || estimate.signatureTimestamp) {
                signatureInfoHtml = `
                    <div class="signature-info">
                        ${estimate.signatureCustomerName ? `<p>Signed by: <strong>${estimate.signatureCustomerName}</strong></p>` : ''}
                        ${estimate.signatureTimestamp ? `<p>Date: ${new Date(estimate.signatureTimestamp).toLocaleString()}</p>` : ''}
                    </div>
                `;
            }
            
            return `
                <div class=\"signature-section\">
                    <h4>Customer Approval</h4>
                    ${signatureImageHtml}
                    ${approvalText}
                    ${signatureInfoHtml}
                </div>
            `;
        },
        
        generateFooterSection: function(estimate, businessInfo) {
            // === SAFE-HOTFIX: Use InvoiceManager's warranty section if available
            let warrantySection = '';
            if (window.InvoiceManager && typeof window.InvoiceManager.generateWarrantySection === 'function') {
                warrantySection = window.InvoiceManager.generateWarrantySection(estimate);
            }
            
            return `
                <div class=\"estimate-footer\">
                    <div class=\"terms-conditions\">
                        <h4>Terms & Conditions</h4>
                        <p>This estimate is valid for 30 days. Work will commence upon signed approval and deposit.</p>
                        <p>For questions regarding this estimate, please contact us at ${businessInfo.phone}.</p>
                    </div>
                    ${warrantySection}
                    <p>Thank you for the opportunity to provide this estimate!</p>
                </div>
            `;
        },
        
        generateEstimateId: function() {
            return 'est_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        formatCurrency: function(amount) {
            try {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(amount || 0);
            } catch (error) {
                return '$' + (amount || 0).toFixed(2);
            }
        },
        
        formatDate: function(date) {
            try {
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                return date;
            }
        },
        
        // Reset current estimate
        resetEstimate: function() {
            this.currentEstimate = {
                id: null,
                number: null,
                businessType: '',
                customerName: '',
                customerEmail: '',
                customerPhone: '',
                customer: {
                    name: '',
                    email: '',
                    phone: '',
                    street: '',
                    city: '',
                    state: '',
                    zip: ''
                },
                date: '',
                services: [],
                subtotal: 0,
                tax: 0,
                total: 0,
                notes: '',
                status: 'draft',
                signature: null,
                signatureCustomerName: '',
                signatureTimestamp: null,
                approval: false
            };
            
            // Reset form
            const form = document.getElementById('estimate-form');
            if (form) {
                form.reset();
            }
            
            // Clear services list
            const servicesList = document.getElementById('estimate-services-list');
            if (servicesList) {
                servicesList.innerHTML = '<p class="empty-services">No services added yet. Add services using the sections above.</p>';
            }
            
            // Reset totals
            this.updateEstimateTotals();
            
            // Clear signature
            this.clearSignature();
        },
        
        // Load estimate for editing
        loadEstimate: function(estimate) {
            try {
                this.currentEstimate = { ...estimate };
                
                // Populate form fields
                this.populateFormWithEstimate(estimate);
                
            } catch (error) {
                console.error('Load estimate error:', error);
            }
        },
        
        // Populate form with estimate data
        populateFormWithEstimate: function(estimate) {
            try {
                // Basic fields
                // === VERSION 9.20: Fix customer data loading - check both nested and flat structures
                this.setFieldValue('estimate-customer-name', estimate.customer?.name || estimate.customerName || '');
                this.setFieldValue('estimate-customer-email', estimate.customer?.email || estimate.customerEmail || '');
                this.setFieldValue('estimate-customer-phone', estimate.customer?.phone || estimate.customerPhone || '');
                this.setFieldValue('estimate-customer-street', estimate.customer?.street || '');
                this.setFieldValue('estimate-customer-city', estimate.customer?.city || '');
                this.setFieldValue('estimate-customer-state', estimate.customer?.state || '');
                this.setFieldValue('estimate-customer-zip', estimate.customer?.zip || '');
                this.setFieldValue('estimate-date', estimate.date);
                // === VERSION 9.17: Notes field removed from UI, skip setting
                // this.setFieldValue('estimate-notes', estimate.notes);
                this.setFieldValue('estimate-status', estimate.status);
                
                // Business type radio
                const businessTypeRadio = document.querySelector(`input[name="estimateBusinessType"][value="${estimate.businessType}"]`);
                if (businessTypeRadio) {
                    businessTypeRadio.checked = true;
                    businessTypeRadio.dispatchEvent(new Event('change'));
                }
                
                // Clear existing services
                const servicesList = document.getElementById('estimate-services-list');
                if (servicesList) {
                    servicesList.innerHTML = '<p class="empty-services">No services added yet. Add services using the sections above.</p>';
                }
                
                // Re-add services
                if (estimate.services && estimate.services.length > 0) {
                    estimate.services.forEach(service => {
                        this.addServiceToList(service);
                    });
                }
                
                // Update totals
                this.updateEstimateTotals();
                
                // Signature
                if (estimate.signature) {
                    const canvas = document.getElementById('signature-canvas');
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        img.onload = () => {
                            ctx.drawImage(img, 0, 0);
                        };
                        img.src = estimate.signature;
                    }
                    this.setFieldValue('signature-customer-name', estimate.signatureCustomerName);
                    const timestampElement = document.getElementById('signature-date-time');
                    if (timestampElement) {
                        timestampElement.textContent = `Signed on: ${estimate.signatureTimestamp}`;
                    }
                    document.getElementById('estimate-approval').checked = estimate.approval;
                }
                
            } catch (error) {
                console.error('Populate form with estimate error:', error);
            }
        },
        
        // Convert estimate to invoice
        convertToInvoice: function(estimateId) {
            try {
                const estimate = window.App.AppState.estimates.find(est => est.id === estimateId);
                if (!estimate) {
                    throw new Error('Estimate not found');
                }
                
                // Create new invoice from estimate data
                const newInvoice = {
                    ...estimate,
                    id: InvoiceManager.generateInvoiceId(), // Use InvoiceManager's ID generator
                    number: window.App.AppState.nextInvoiceNumber,
                    status: 'draft', // Default status for new invoice
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    convertedFromEstimate: estimate.id
                };
                
                // Remove estimate-specific fields
                delete newInvoice.signature;
                delete newInvoice.signatureCustomerName;
                delete newInvoice.signatureTimestamp;
                delete newInvoice.approval;
                
                // Add to invoices array using centralized storage
                if (window.StorageManager) {
                    const success = window.StorageManager.addInvoice(newInvoice);
                    if (!success) {
                        console.error('❌ Failed to save converted invoice via StorageManager');
                        // Fallback to original method
                        window.App.AppState.invoices.push(newInvoice);
                        window.App.AppState.nextInvoiceNumber++;
                    } else {
                        console.log('✅ Converted invoice saved via centralized StorageManager');
                        // StorageManager handles incrementing the invoice number
                    }
                } else {
                    // Fallback if StorageManager not available
                    window.App.AppState.invoices.push(newInvoice);
                    window.App.AppState.nextInvoiceNumber++;
                }
                
                // Update original estimate status
                estimate.status = 'converted';
                estimate.convertedToInvoice = newInvoice.id;
                estimate.updatedAt = new Date().toISOString();
                
                // Save data and update dashboard
                window.App.saveData();
                window.App.updateDashboard();
                window.App.showSuccess(`Estimate ${estimate.number} converted to Invoice ${newInvoice.number}!`);
                
                return newInvoice;
                
            } catch (error) {
                console.error('Convert estimate to invoice error:', error);
                if (window.App) {
                    window.App.showError('Failed to convert estimate to invoice: ' + error.message);
                }
                throw error;
            }
        },
        
        // Helper to safely set field values
        setFieldValue: function(fieldId, value) {
            try {
                const field = document.getElementById(fieldId);
                if (field && value !== undefined && value !== null) {
                    field.value = value;
                }
            } catch (error) {
                console.error(`Error setting field ${fieldId}:`, error);
            }
        }
    };

    // Initialize managers when DOM is ready (PREVENT DUPLICATE INIT)
    if (!window.EstimateManager) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                // InvoiceManager already initialized above
                EstimateManager.init();
            });
        } else {
            // InvoiceManager already initialized above
            EstimateManager.init();
        }
        
        // Export handled after IIFE returns (see hotfix below)
    }

    // Export the managers for the main module
    return {
        InvoiceManager: InvoiceManager,
        EstimateManager: EstimateManager
    };

})();

// CRITICAL HOTFIX: Export InvoiceManager and EstimateManager to window for global access
// This fixes the "InvoiceManager not available" error
if (window.JStarkInvoicing && window.JStarkInvoicing.InvoiceManager) {
    window.InvoiceManager = window.JStarkInvoicing.InvoiceManager;
    console.log('✅ HOTFIX: window.InvoiceManager exported successfully');
}

if (window.JStarkInvoicing && window.JStarkInvoicing.EstimateManager) {
    window.EstimateManager = window.JStarkInvoicing.EstimateManager;
    console.log('✅ HOTFIX: window.EstimateManager exported successfully');
    
    // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (BEGIN)
    // Add method to handle masonry estimate service addition
    window.EstimateManager.addMasonryEstimateService = function() {
        const root = document.getElementById('estimate-creation');
        if (!root) {
            console.log('[MAS-EST:ROOT_NOT_FOUND]');
            return;
        }
        
        console.log('[MAS-EST:ADD_CLICK]');
        
        // Read inputs from estimate masonry section
        const serviceType = document.getElementById('estimate-masonry-service')?.value;
        const description = document.getElementById('estimate-masonry-description')?.value?.trim();
        // Fix: The field is actually estimate-masonry-rate, not estimate-masonry-price
        const rawPrice = document.getElementById('estimate-masonry-rate')?.value?.trim() || 
                        document.getElementById('estimate-masonry-price')?.value?.trim();
        
        console.log('[MAS-EST:INPUTS]', { 
            desc: description?.substring(0, 20) + '...', 
            rawPrice: rawPrice,
            qty: 1 
        });
        
        // Parse price
        const price = parseFloat((rawPrice || '').replace(/[$,\s]/g, ''));
        
        // Validate
        if (!price || price <= 0) {
            alert('Please enter a valid price greater than $0.00');
            return;
        }
        
        console.log('[MAS-EST:PARSED]', { price: price, qty: 1, amount: price });
        
        // Create service object
        const service = {
            id: 'svc_' + Date.now(),
            type: 'masonry',
            description: description || `Masonry Service - ${serviceType || 'General'}`,
            quantity: 1,
            price: price,
            amount: price
        };
        
        // Add to estimate
        if (this.currentEstimate && this.currentEstimate.services) {
            this.currentEstimate.services.push(service);
            console.log('[MAS-EST:STATE_OK]', { 
                services: this.currentEstimate.services.length, 
                subtotal: this.currentEstimate.subtotal || 0 
            });
        }
        
        // Check target list
        const listExists = !!document.getElementById('estimate-services-list');
        console.log('[MAS-EST:LIST_TARGET]', { '#estimate-services-list': listExists });
        
        // Add to UI
        this.addServiceToList(service);
        
        // Update totals
        console.log('[MAS-EST:TOTALS_FN]', { 'EstimateManager.updateEstimateTotals': true });
        this.updateEstimateTotals();
        
        // Clear form (fix: use estimate-masonry-rate which is the actual field)
        document.getElementById('estimate-masonry-service').value = '';
        document.getElementById('estimate-masonry-description').value = '';
        const priceField = document.getElementById('estimate-masonry-rate') || document.getElementById('estimate-masonry-price');
        if (priceField) priceField.value = '';
        
        console.log('[MAS-EST:READY]', { services: this.currentEstimate.services.length });
    };
    // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (END)
}

// === SAFE-HOTFIX: MASONRY BUTTON GLOBAL FIX (BEGIN)
// Ensure masonry button always works by setting up a global delegated handler
(function() {
    // Set up delegated click handler for masonry button
    document.addEventListener('click', function(e) {
        // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (BEGIN)
        // Check if clicked element is the masonry estimate add button
        if (e.target && (e.target.id === 'add-estimate-masonry-service' || e.target.closest('#add-estimate-masonry-service'))) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[MAS-EST:BIND]', { root: '#estimate-creation' });
            
            // Call EstimateManager method
            if (window.EstimateManager && typeof window.EstimateManager.addMasonryEstimateService === 'function') {
                window.EstimateManager.addMasonryEstimateService();
            } else {
                console.log('[MAS-EST:HANDLER_NOT_FOUND]');
            }
            return;
        }
        // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (END)
        
        // Check if clicked element is the masonry add button
        if (e.target && (e.target.id === 'add-masonry-service' || e.target.closest('#add-masonry-service'))) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[GLOBAL-FIX] Masonry button clicked');
            
            // Try InvoiceManager method first
            if (window.InvoiceManager && typeof window.InvoiceManager.addMasonryServiceFromForm === 'function') {
                console.log('[GLOBAL-FIX] Using InvoiceManager.addMasonryServiceFromForm');
                window.InvoiceManager.addMasonryServiceFromForm();
            } else {
                // Fallback: handle directly
                console.log('[GLOBAL-FIX] Using direct handler');
                
                const serviceType = document.getElementById('masonry-service')?.value;
                const description = document.getElementById('masonry-description')?.value?.trim();
                const priceStr = document.getElementById('masonry-job-price')?.value?.trim();
                const price = parseFloat(priceStr?.replace(/[^0-9.-]/g, '') || '0');
                
                // Validate
                if (!serviceType) {
                    alert('Please select a service type');
                    return;
                }
                if (!description) {
                    alert('Please enter a description');
                    return;
                }
                if (!price || price <= 0) {
                    alert('Please enter a valid price');
                    return;
                }
                
                // Create service object
                const service = {
                    id: 'masonry_' + Date.now(),
                    type: 'masonry_' + serviceType.replace(/-/g, '_'),
                    description: description,
                    price: price,
                    quantity: 1,
                    amount: price,
                    details: { jobPricing: true }
                };
                
                // Add to invoice
                if (window.InvoiceManager) {
                    window.InvoiceManager.addService(service);
                    
                    // Clear form
                    document.getElementById('masonry-service').value = '';
                    document.getElementById('masonry-description').value = '';
                    document.getElementById('masonry-job-price').value = '';
                    
                    console.log('[GLOBAL-FIX] Service added successfully');
                }
            }
        }
    });
    
    console.log('✅ MASONRY BUTTON GLOBAL FIX: Delegated handler installed');
})();
// === SAFE-HOTFIX: MASONRY BUTTON GLOBAL FIX (END)

/**
 * Pricing Data Validation and Migration Utilities
 * Ensures backward compatibility and data integrity
 */
(function() {
    
    const PricingDataManager = {
        // Migrate old service objects to new enhanced structure
        migrateService: function(service) {
            try {
                // If already has enhanced pricing structure, return as-is
                if (service.pricing && service.pricing.custom && service.pricing.suggested) {
                    return service;
                }
                
                // Create enhanced structure from legacy data
                const enhancedService = { ...service };
                
                // Build pricing structure from available data
                enhancedService.pricing = {
                    custom: {
                        amount: service.amount || 0,
                        rate: service.rate || 0,
                        userSet: service.customPrice || false,
                        timestamp: service.createdAt || new Date().toISOString()
                    },
                    suggested: {
                        lowEstimate: service.details?.pricing?.estimatedLow || service.amount * 0.9,
                        highEstimate: service.details?.pricing?.estimatedHigh || service.amount * 1.1,
                        recommended: service.amount,
                        profitMargin: {
                            low: 65.0,
                            high: 75.0,
                            average: 70.0
                        }
                    },
                    calculator: {
                        squareFootage: service.quantity || 0,
                        materialCosts: {
                            low: service.details?.materials?.materialCostLow || 0,
                            high: service.details?.materials?.materialCostHigh || 0,
                            average: (service.details?.materials?.materialCostLow + service.details?.materials?.materialCostHigh) / 2 || 0
                        },
                        equipmentCosts: service.details?.materials?.equipmentCosts || 50,
                        laborOverhead: {
                            low: service.amount * 0.6,
                            high: service.amount * 0.8
                        }
                    }
                };
                
                // Add metadata
                if (!enhancedService.details) enhancedService.details = {};
                if (!enhancedService.details.metadata) {
                    enhancedService.details.metadata = {
                        migrated: true,
                        migratedAt: new Date().toISOString(),
                        originalVersion: 'legacy',
                        pricingVersion: '2.0'
                    };
                }
                
                console.log('Migrated service to enhanced structure:', enhancedService);
                return enhancedService;
                
            } catch (error) {
                console.error('Service migration error:', error);
                return service; // Return original if migration fails
            }
        },
        
        // Batch migrate all services in storage
        migrateStoredServices: function() {
            try {
                if (window.App && window.App.AppState) {
                    let migrationCount = 0;
                    
                    // Migrate invoices
                    if (window.App.AppState.invoices) {
                        window.App.AppState.invoices.forEach(invoice => {
                            if (invoice.services) {
                                invoice.services = invoice.services.map(service => {
                                    const migrated = this.migrateService(service);
                                    if (migrated !== service) migrationCount++;
                                    return migrated;
                                });
                            }
                        });
                    }
                    
                    // Migrate estimates
                    if (window.App.AppState.estimates) {
                        window.App.AppState.estimates.forEach(estimate => {
                            if (estimate.services) {
                                estimate.services = estimate.services.map(service => {
                                    const migrated = this.migrateService(service);
                                    if (migrated !== service) migrationCount++;
                                    return migrated;
                                });
                            }
                        });
                    }
                    
                    // Save migrated data if any migrations occurred
                    if (migrationCount > 0) {
                        window.App.saveData();
                        console.log(`Service data migration completed: ${migrationCount} services migrated`);
                    }
                }
            } catch (error) {
                console.error('Batch migration error:', error);
            }
        },
        
        // Validate pricing data integrity
        validateServicePricingData: function(service) {
            try {
                const issues = [];
                
                // Check basic structure
                if (!service.pricing) {
                    issues.push('Missing pricing structure');
                    return { valid: false, issues };
                }
                
                // Validate custom pricing
                if (service.pricing.custom) {
                    const custom = service.pricing.custom;
                    if (!custom.amount || custom.amount <= 0) {
                        issues.push('Invalid custom amount');
                    }
                    if (!custom.rate || custom.rate <= 0) {
                        issues.push('Invalid custom rate');
                    }
                }
                
                // Validate suggested pricing
                if (service.pricing.suggested) {
                    const suggested = service.pricing.suggested;
                    if (suggested.lowEstimate >= suggested.highEstimate) {
                        issues.push('Invalid price range');
                    }
                }
                
                // Validate calculator data
                if (service.pricing.calculator) {
                    const calc = service.pricing.calculator;
                    if (!calc.squareFootage || calc.squareFootage <= 0) {
                        issues.push('Invalid square footage');
                    }
                    if (!calc.materialCosts) {
                        issues.push('Missing material costs');
                    }
                }
                
                return { valid: issues.length === 0, issues };
                
            } catch (error) {
                console.error('Service validation error:', error);
                return { valid: false, issues: ['Validation error occurred'] };
            }
        },
        
        // Get pricing summary for reports
        getPricingSummary: function(service) {
            try {
                if (!service.pricing) return null;
                
                const pricing = service.pricing;
                return {
                    customPrice: pricing.custom?.amount || 0,
                    suggestedRange: {
                        low: pricing.suggested?.lowEstimate || 0,
                        high: pricing.suggested?.highEstimate || 0
                    },
                    profitMargin: pricing.suggested?.profitMargin?.custom || 0,
                    materialCost: pricing.calculator?.materialCosts?.average || 0,
                    equipmentCost: pricing.calculator?.equipmentCosts || 0,
                    isCustomPricing: pricing.custom?.userSet || false,
                    withinRange: service.details?.customPricing?.validation?.withinSuggestedRange || false
                };
                
            } catch (error) {
                console.error('Get pricing summary error:', error);
                return null;
            }
        }
    };
    
    // Auto-migrate on load if needed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => PricingDataManager.migrateStoredServices(), 2000);
        });
    } else {
        setTimeout(() => PricingDataManager.migrateStoredServices(), 2000);
    }
    
    // Export utilities
    window.PricingDataManager = PricingDataManager;
    
    // === SAFE-HOTFIX: LIST_API_SHIMS (BEGIN)
    // Provide stable API methods for external callers (PDF, email, etc.)
    if (window.InvoiceManager && !window.InvoiceManager.getInvoices) {
        window.InvoiceManager.getInvoices = function() {
            console.log('[LIST:LOAD] {type:\'invoice\', source:\'shim\'}');
            
            // Try StorageManager first
            if (window.StorageManager && typeof window.StorageManager.getInvoices === 'function') {
                const invoices = window.StorageManager.getInvoices();
                console.log('[LIST:LOAD] {type:\'invoice\', count:' + (invoices ? invoices.length : 0) + '}');
                return invoices;
            }
            
            // Fallback to localStorage
            try {
                const data = localStorage.getItem('jstark_invoices');
                const invoices = data ? JSON.parse(data) : [];
                console.log('[LIST:LOAD] {type:\'invoice\', count:' + invoices.length + '}');
                return invoices;
            } catch (error) {
                console.error('Error loading invoices:', error);
                return [];
            }
        };
    }
    
    if (window.InvoiceManager && !window.InvoiceManager.getEstimates) {
        window.InvoiceManager.getEstimates = function() {
            console.log('[LIST:LOAD] {type:\'estimate\', source:\'shim\'}');
            
            // Try StorageManager first
            if (window.StorageManager && typeof window.StorageManager.getEstimates === 'function') {
                const estimates = window.StorageManager.getEstimates();
                console.log('[LIST:LOAD] {type:\'estimate\', count:' + (estimates ? estimates.length : 0) + '}');
                return estimates;
            }
            
            // Fallback to localStorage
            try {
                const data = localStorage.getItem('jstark_estimates');
                const estimates = data ? JSON.parse(data) : [];
                console.log('[LIST:LOAD] {type:\'estimate\', count:' + estimates.length + '}');
                return estimates;
            } catch (error) {
                console.error('Error loading estimates:', error);
                return [];
            }
        };
    }
    
    // Also add to EstimateManager if it exists
    if (window.EstimateManager && !window.EstimateManager.getEstimates) {
        window.EstimateManager.getEstimates = function() {
            // Delegate to InvoiceManager's implementation
            return window.InvoiceManager.getEstimates();
        };
    }
    // === SAFE-HOTFIX: LIST_API_SHIMS (END)
    
})();