/**
 * J. Stark Business Invoicing System - Invoice Management
 * Handles invoice creation, preview, and management
 */

(function() {
    'use strict';
    
    // Invoice Manager object
    const InvoiceManager = {
        currentInvoice: {
            id: null,
            number: null,
            businessType: '',
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customerAddress: '',
            date: '',
            services: [],
            subtotal: 0,
            tax: 0,
            total: 0,
            notes: '',
            status: 'draft'
        },
        
        taxRate: 0.0825, // 8.25% tax rate for Ohio
        
        init: function() {
            try {
                this.bindEvents();
                console.log('Invoice Manager initialized');
            } catch (error) {
                console.error('Invoice Manager initialization error:', error);
            }
        },
        
        bindEvents: function() {
            try {
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
                
            } catch (error) {
                console.error('Invoice Manager event binding error:', error);
            }
        },
        
        addService: function(service) {
            try {
                // Add service to current invoice
                this.currentInvoice.services.push(service);
                
                // Add to services list in UI
                this.addServiceToList(service);
                
                // Update totals
                this.updateInvoiceTotals();
                
                console.log('Service added:', service);
                
            } catch (error) {
                console.error('Add service error:', error);
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
                const servicesList = document.getElementById('services-list');
                if (!servicesList) return;
                
                // Remove empty message if present
                const emptyMessage = servicesList.querySelector('.empty-services');
                if (emptyMessage) {
                    emptyMessage.remove();
                }
                
                // Create service item
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.setAttribute('data-service-id', service.id);
                serviceItem.innerHTML = `
                    <div class="service-details">
                        <h4>${service.description}</h4>
                        <p>${service.quantity} ${service.unit} × ${this.formatCurrency(service.rate)}</p>
                        ${service.details ? this.getServiceDetailsHtml(service.details) : ''}
                    </div>
                    <div class="service-actions">
                        <span class="service-amount">${this.formatCurrency(service.amount)}</span>
                        <button class="remove-service" onclick="InvoiceManager.removeService('${service.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                
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
        
        updateInvoiceTotals: function() {
            try {
                // Calculate subtotal from services
                const subtotal = this.currentInvoice.services.reduce((sum, service) => {
                    return sum + (service.amount || 0);
                }, 0);
                
                // Calculate tax
                const tax = subtotal * this.taxRate;
                
                // Calculate total
                const total = subtotal + tax;
                
                // Update current invoice
                this.currentInvoice.subtotal = subtotal;
                this.currentInvoice.tax = tax;
                this.currentInvoice.total = total;
                
                // Update UI
                document.getElementById('invoice-subtotal').textContent = this.formatCurrency(subtotal);
                document.getElementById('invoice-tax').textContent = this.formatCurrency(tax);
                document.getElementById('invoice-grand-total').textContent = this.formatCurrency(total);
                
            } catch (error) {
                console.error('Update totals error:', error);
            }
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
        
        handleInvoiceSubmission: function() {
            try {
                // Validate form
                if (!this.validateInvoiceForm()) {
                    return;
                }
                
                // Collect form data
                this.collectFormData();
                
                // Generate invoice number if new
                if (!this.currentInvoice.id) {
                    this.currentInvoice.id = this.generateInvoiceId();
                    this.currentInvoice.number = window.App?.AppState?.nextInvoiceNumber || 1;
                }
                
                // Status is already set from form data
                
                // Save invoice
                this.saveInvoice();
                
                // Update AppState
                if (window.App && window.App.AppState) {
                    window.App.AppState.nextInvoiceNumber++;
                    window.App.saveData();
                    window.App.updateDashboard();
                }
                
                // Show success and redirect
                if (window.App) {
                    window.App.showSuccess('Invoice created successfully!');
                    
                    // Show preview
                    setTimeout(() => {
                        window.App.showInvoicePreview(this.currentInvoice);
                    }, 1000);
                } else {
                    alert('Invoice created successfully!');
                }
                
            } catch (error) {
                console.error('Invoice submission error:', error);
                if (window.App) {
                    window.App.showError('Failed to create invoice. Please try again.');
                }
            }
        },
        
        validateInvoiceForm: function() {
            try {
                const requiredFields = [
                    { id: 'business-type', name: 'Business Type' },
                    { id: 'customer-name', name: 'Customer Name' },
                    { id: 'invoice-date', name: 'Invoice Date' }
                ];
                
                let isValid = true;
                const errors = [];
                
                // Check required fields
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
                if (this.currentInvoice.services.length === 0) {
                    errors.push('At least one service must be added');
                    isValid = false;
                }
                
                // Show errors if any
                if (!isValid) {
                    const errorMessage = 'Please fix the following errors:\\n\\n• ' + errors.join('\\n• ');
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
                this.currentInvoice.businessType = document.getElementById('business-type').value;
                this.currentInvoice.customerName = document.getElementById('customer-name').value.trim();
                this.currentInvoice.customerEmail = document.getElementById('customer-email').value.trim();
                this.currentInvoice.customerPhone = document.getElementById('customer-phone').value.trim();
                this.currentInvoice.customerAddress = document.getElementById('customer-address').value.trim();
                this.currentInvoice.date = document.getElementById('invoice-date').value;
                this.currentInvoice.notes = document.getElementById('invoice-notes').value.trim();
                this.currentInvoice.status = document.getElementById('invoice-status').value;
                
                // Set creation timestamp
                this.currentInvoice.createdAt = new Date().toISOString();
                this.currentInvoice.updatedAt = new Date().toISOString();
                
            } catch (error) {
                console.error('Collect form data error:', error);
            }
        },
        
        saveInvoice: function() {
            try {
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
                // Validate form first
                if (!this.validateInvoiceForm()) {
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
        
        generateInvoicePreview: function(invoice) {
            try {
                const previewContent = document.getElementById('invoice-preview-content');
                if (!previewContent) return;
                
                const businessInfo = this.getBusinessInfo(invoice.businessType);
                const invoiceHtml = `
                    <div class="invoice-document business-${invoice.businessType}">
                        ${this.generateInvoiceHeader(invoice, businessInfo)}
                        ${this.generateCustomerSection(invoice)}
                        ${this.generateServicesTable(invoice)}
                        ${this.generateTotalsSection(invoice)}
                        ${this.generateNotesSection(invoice)}
                        ${this.generateFooterSection(invoice, businessInfo)}
                    </div>
                `;
                
                previewContent.innerHTML = invoiceHtml;
                
            } catch (error) {
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
            return `
                <div class="customer-section">
                    <h3>Bill To:</h3>
                    <p><strong>${invoice.customerName}</strong></p>
                    ${invoice.customerEmail ? `<p>Email: ${invoice.customerEmail}</p>` : ''}
                    ${invoice.customerPhone ? `<p>Phone: ${invoice.customerPhone}</p>` : ''}
                    ${invoice.customerAddress ? `<p>Address: ${invoice.customerAddress}</p>` : ''}
                </div>
            `;
        },
        
        generateServicesTable: function(invoice) {
            if (!invoice.services || invoice.services.length === 0) {
                return '<div class="no-services">No services added</div>';
            }
            
            const servicesRows = invoice.services.map(service => `
                <tr>
                    <td>${service.description}</td>
                    <td class="amount">${service.quantity}</td>
                    <td class="amount">${service.unit}</td>
                    <td class="amount">${this.formatCurrency(service.rate)}</td>
                    <td class="amount">${this.formatCurrency(service.amount)}</td>
                </tr>
            `).join('');
            
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
            return `
                <div class="invoice-totals-section">
                    <table class="invoice-totals-table">
                        <tr>
                            <td class="total-label">Subtotal:</td>
                            <td class="total-amount">${this.formatCurrency(invoice.subtotal)}</td>
                        </tr>
                        <tr>
                            <td class="total-label">Tax (8.25%):</td>
                            <td class="total-amount">${this.formatCurrency(invoice.tax)}</td>
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
                    <p>${invoice.notes.replace(/\\n/g, '<br>')}</p>
                </div>
            `;
        },
        
        generateFooterSection: function(invoice, businessInfo) {
            return `
                <div class="invoice-footer">
                    <div class="payment-terms">
                        <h4>Payment Terms</h4>
                        <p>Payment is due within 30 days of invoice date.</p>
                        <p>Make checks payable to: ${businessInfo.name}</p>
                        <p>Mail payments to: ${businessInfo.address}</p>
                        <p>For questions about this invoice, please contact us at ${businessInfo.phone}</p>
                    </div>
                    <p>Thank you for your business!</p>
                </div>
            `;
        },
        
        generateInvoiceId: function() {
            return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
                customerAddress: '',
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
                this.setFieldValue('customer-name', invoice.customerName);
                this.setFieldValue('customer-email', invoice.customerEmail);
                this.setFieldValue('customer-phone', invoice.customerPhone);
                this.setFieldValue('customer-address', invoice.customerAddress);
                this.setFieldValue('invoice-date', invoice.date);
                this.setFieldValue('invoice-notes', invoice.notes);
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
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            InvoiceManager.init();
        });
    } else {
        InvoiceManager.init();
    }
    
    // Export for global access
    window.InvoiceManager = InvoiceManager;
    
})();