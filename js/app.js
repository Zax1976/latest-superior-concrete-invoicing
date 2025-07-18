/**
 * J. Stark Business Invoicing System - Main Application
 * Handles navigation, state management, and core functionality
 */

(function() {
    'use strict';
    
    // Application state
    const AppState = {
        currentView: 'dashboard',
        currentInvoice: null,
        invoices: [],
        customers: [],
        nextInvoiceNumber: 1
    };
    
    // Error handling utility
    const ErrorHandler = {
        log: function(error, context = 'App') {
            console.error(`[${context}]`, error);
            this.showUserError('An error occurred. Please try again.');
        },
        
        showUserError: function(message) {
            // Create or update error notification
            let errorDiv = document.getElementById('error-notification');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'error-notification';
                errorDiv.className = 'error-notification';
                document.body.appendChild(errorDiv);
            }
            
            errorDiv.innerHTML = `
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }
            }, 5000);
        }
    };
    
    // Main Application object
    const App = {
        init: function() {
            try {
                console.log('Initializing J. Stark Invoicing System...');
                
                this.loadData();
                this.bindEvents();
                this.updateDashboard();
                this.setCurrentDate();
                this.setupAutoSave();
                
                console.log('Application initialized successfully');
                
            } catch (error) {
                ErrorHandler.log(error, 'App Initialization');
            }
        },
        
        loadData: function() {
            try {
                // Load data from localStorage
                const savedInvoices = localStorage.getItem('jstark_invoices');
                const savedCustomers = localStorage.getItem('jstark_customers');
                const savedInvoiceNumber = localStorage.getItem('jstark_next_invoice_number');
                
                if (savedInvoices) {
                    AppState.invoices = JSON.parse(savedInvoices);
                }
                
                if (savedCustomers) {
                    AppState.customers = JSON.parse(savedCustomers);
                }
                
                if (savedInvoiceNumber) {
                    AppState.nextInvoiceNumber = parseInt(savedInvoiceNumber);
                }
                
                // Initialize with sample data if none exists
                if (AppState.invoices.length === 0) {
                    this.createSampleData();
                }
                
                console.log('Data loaded:', {
                    invoices: AppState.invoices.length,
                    customers: AppState.customers.length,
                    nextNumber: AppState.nextInvoiceNumber
                });
                
            } catch (error) {
                ErrorHandler.log(error, 'Data Loading');
            }
        },
        
        saveData: function() {
            try {
                localStorage.setItem('jstark_invoices', JSON.stringify(AppState.invoices));
                localStorage.setItem('jstark_customers', JSON.stringify(AppState.customers));
                localStorage.setItem('jstark_next_invoice_number', AppState.nextInvoiceNumber.toString());
                
            } catch (error) {
                ErrorHandler.log(error, 'Data Saving');
            }
        },
        
        bindEvents: function() {
            try {
                // Navigation events
                document.getElementById('new-invoice-btn')?.addEventListener('click', () => {
                    this.showInvoiceCreation();
                });
                
                document.getElementById('view-invoices-btn')?.addEventListener('click', () => {
                    this.showInvoiceList();
                });
                
                // Business type radio buttons (new UI)
                const businessRadios = document.querySelectorAll('input[name="businessType"]');
                businessRadios.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        this.handleBusinessTypeChange(e.target.value);
                        this.updateStepIndicator(2); // Move to step 2
                    });
                });
                
                // Form submission
                document.getElementById('invoice-form')?.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleInvoiceSubmission();
                });
                
                // Customer name auto-fill
                const customerNameInput = document.getElementById('customer-name');
                if (customerNameInput) {
                    customerNameInput.addEventListener('blur', () => {
                        this.autoFillCustomerDefaults(customerNameInput.value);
                    });
                    
                    // Setup autocomplete on input focus
                    customerNameInput.addEventListener('focus', () => {
                        this.setupCustomerAutocomplete();
                    });
                }
                
                // Preview button
                document.getElementById('preview-invoice')?.addEventListener('click', () => {
                    this.previewInvoice();
                });
                
                // Add keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    this.handleKeyboardShortcuts(e);
                });
                
            } catch (error) {
                ErrorHandler.log(error, 'Event Binding');
            }
        },
        
        handleKeyboardShortcuts: function(e) {
            try {
                // Ctrl/Cmd + N for new invoice
                if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                    e.preventDefault();
                    this.showInvoiceCreation();
                }
                
                // Ctrl/Cmd + L for invoice list
                if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                    e.preventDefault();
                    this.showInvoiceList();
                }
                
                // Escape to go back to dashboard
                if (e.key === 'Escape') {
                    this.showDashboard();
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Keyboard Shortcuts');
            }
        },
        
        setCurrentDate: function() {
            try {
                const today = new Date().toISOString().split('T')[0];
                const dateInput = document.getElementById('invoice-date');
                if (dateInput) {
                    dateInput.value = today;
                }
            } catch (error) {
                ErrorHandler.log(error, 'Set Current Date');
            }
        },
        
        showView: function(viewId) {
            try {
                // Hide all views
                document.querySelectorAll('.view').forEach(view => {
                    view.classList.remove('active');
                });
                
                // Show selected view
                const targetView = document.getElementById(viewId);
                if (targetView) {
                    targetView.classList.add('active');
                    AppState.currentView = viewId;
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Show View');
            }
        },
        
        showDashboard: function() {
            try {
                this.showView('dashboard');
                this.updateDashboard();
            } catch (error) {
                ErrorHandler.log(error, 'Show Dashboard');
            }
        },
        
        showInvoiceCreation: function(businessType = null) {
            try {
                this.showView('invoice-creation');
                this.resetInvoiceForm();
                
                // Check for draft invoice after a brief delay
                setTimeout(() => {
                    this.loadDraftInvoice();
                }, 100);
                
                if (businessType) {
                    const radio = document.getElementById(`business-${businessType}`);
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Show Invoice Creation');
            }
        },
        
        showInvoiceList: function() {
            try {
                this.showView('invoice-list');
                this.populateInvoiceList();
            } catch (error) {
                ErrorHandler.log(error, 'Show Invoice List');
            }
        },
        
        showInvoicePreview: function(invoice) {
            try {
                this.showView('invoice-preview');
                this.generateInvoicePreview(invoice);
            } catch (error) {
                ErrorHandler.log(error, 'Show Invoice Preview');
            }
        },
        
        handleBusinessTypeChange: function(businessType) {
            try {
                const concreteSection = document.getElementById('concrete-services');
                const masonrySection = document.getElementById('masonry-services');
                
                if (concreteSection && masonrySection) {
                    if (businessType === 'concrete') {
                        concreteSection.style.display = 'block';
                        masonrySection.style.display = 'none';
                        this.loadFrequentServices('concrete');
                    } else if (businessType === 'masonry') {
                        concreteSection.style.display = 'none';
                        masonrySection.style.display = 'block';
                        this.loadFrequentServices('masonry');
                    } else {
                        concreteSection.style.display = 'none';
                        masonrySection.style.display = 'none';
                    }
                }
                
                // Save last used business type
                if (window.StorageManager) {
                    window.StorageManager.saveLastUsedValues({ lastBusinessType: businessType });
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Business Type Change');
            }
        },
        
        loadFrequentServices: function(businessType) {
            try {
                if (!window.StorageManager) return;
                
                const frequentServices = window.StorageManager.loadFrequentServices();
                const filtered = frequentServices.filter(service => 
                    (businessType === 'concrete' && service.type === 'concrete') ||
                    (businessType === 'masonry' && service.type === 'masonry')
                );
                
                const container = document.querySelector(`#frequent-services-${businessType} .frequent-services-grid`);
                const section = document.getElementById(`frequent-services-${businessType}`);
                
                if (!container || !section) return;
                
                if (filtered.length > 0) {
                    section.style.display = 'block';
                    container.innerHTML = filtered.map(service => `
                        <button type="button" class="frequent-service-btn" onclick='App.addFrequentService(${JSON.stringify(service)})'>
                            <i class="fas fa-history frequent-service-icon"></i>
                            <div class="frequent-service-info">
                                <div class="frequent-service-name">${service.description}</div>
                                <div class="frequent-service-details">
                                    ${service.quantity} ${service.unit} @ ${this.formatCurrency(service.rate)}/${service.unit}
                                </div>
                            </div>
                        </button>
                    `).join('');
                } else {
                    section.style.display = 'none';
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Load Frequent Services');
            }
        },
        
        addFrequentService: function(service) {
            try {
                // Add service to the invoice
                if (window.InvoiceManager) {
                    window.InvoiceManager.addServiceToInvoice(service);
                }
                this.showSuccess('Service added from recent history');
            } catch (error) {
                ErrorHandler.log(error, 'Add Frequent Service');
            }
        },
        
        resetInvoiceForm: function() {
            try {
                const form = document.getElementById('invoice-form');
                if (form) {
                    form.reset();
                }
                
                // Clear services list
                this.clearServicesList();
                
                // Reset totals
                this.updateInvoiceTotals();
                
                // Set current date
                this.setCurrentDate();
                
                // Reset business type sections
                this.handleBusinessTypeChange('');
                
                // Reset invoice manager
                if (window.InvoiceManager) {
                    window.InvoiceManager.resetInvoice();
                }
                
                // Clear current invoice state
                AppState.currentInvoice = null;
                
            } catch (error) {
                ErrorHandler.log(error, 'Reset Invoice Form');
            }
        },
        
        clearServicesList: function() {
            try {
                const servicesList = document.getElementById('services-list');
                if (servicesList) {
                    servicesList.innerHTML = '<p class="empty-services">No services added yet. Add services using the sections above.</p>';
                }
                
                // Reset current invoice services
                if (AppState.currentInvoice) {
                    AppState.currentInvoice.services = [];
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Clear Services List');
            }
        },
        
        updateDashboard: function() {
            try {
                const totalInvoices = AppState.invoices.length;
                const totalRevenue = AppState.invoices.reduce((sum, invoice) => {
                    return sum + (invoice.total || 0);
                }, 0);
                const pendingInvoices = AppState.invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length;
                const paidInvoices = AppState.invoices.filter(inv => inv.status === 'paid').length;
                
                // Update dashboard stats
                document.getElementById('total-invoices').textContent = totalInvoices;
                document.getElementById('total-revenue').textContent = this.formatCurrency(totalRevenue);
                document.getElementById('pending-invoices').textContent = pendingInvoices;
                document.getElementById('paid-invoices').textContent = paidInvoices;
                
                // Update recent invoices
                this.updateRecentInvoices();
                
            } catch (error) {
                ErrorHandler.log(error, 'Update Dashboard');
            }
        },
        
        updateRecentInvoices: function() {
            try {
                const recentInvoicesList = document.getElementById('recent-invoices-list');
                if (!recentInvoicesList) return;
                
                const recentInvoices = AppState.invoices
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5);
                
                if (recentInvoices.length === 0) {
                    recentInvoicesList.innerHTML = '<p class="empty-state">No invoices created yet. Create your first invoice above!</p>';
                    return;
                }
                
                const invoicesHtml = recentInvoices.map(invoice => `
                    <div class="invoice-item">
                        <div class="invoice-info">
                            <h4>Invoice #${invoice.number}</h4>
                            <p>${invoice.customerName} - ${this.formatCurrency(invoice.total)}</p>
                            <span class="status-badge status-${invoice.status}">
                                ${this.getStatusIcon(invoice.status)}
                                ${invoice.status}
                            </span>
                        </div>
                        <div class="invoice-date">
                            ${new Date(invoice.date).toLocaleDateString()}
                        </div>
                    </div>
                `).join('');
                
                recentInvoicesList.innerHTML = invoicesHtml;
                
            } catch (error) {
                ErrorHandler.log(error, 'Update Recent Invoices');
            }
        },
        
        populateInvoiceList: function() {
            try {
                const tableBody = document.getElementById('invoices-table-body');
                if (!tableBody) return;
                
                if (AppState.invoices.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7" class="empty-table">No invoices found</td></tr>';
                    return;
                }
                
                const invoicesHtml = AppState.invoices.map(invoice => `
                    <tr>
                        <td>#${invoice.number}</td>
                        <td>${invoice.customerName}</td>
                        <td>${invoice.businessType === 'concrete' ? 'Superior Concrete' : 'J. Stark Masonry'}</td>
                        <td>${new Date(invoice.date).toLocaleDateString()}</td>
                        <td>${this.formatCurrency(invoice.total)}</td>
                        <td>
                            <select class="status-dropdown" onchange="App.updateInvoiceStatus('${invoice.id}', this.value)">
                                <option value="draft" ${invoice.status === 'draft' ? 'selected' : ''}>Draft</option>
                                <option value="sent" ${invoice.status === 'sent' ? 'selected' : ''}>Sent</option>
                                <option value="paid" ${invoice.status === 'paid' ? 'selected' : ''}>Paid</option>
                                <option value="overdue" ${invoice.status === 'overdue' ? 'selected' : ''}>Overdue</option>
                            </select>
                        </td>
                        <td>
                            <div class="action-buttons-table">
                                <button class="action-btn-sm view-btn" onclick="App.viewInvoice('${invoice.id}')" title="View">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-btn-sm edit-btn" onclick="App.editInvoice('${invoice.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn-sm delete-btn" onclick="App.deleteInvoice('${invoice.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
                
                tableBody.innerHTML = invoicesHtml;
                
            } catch (error) {
                ErrorHandler.log(error, 'Populate Invoice List');
            }
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
        
        showLoading: function() {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
            }
        },
        
        hideLoading: function() {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        },
        
        showSuccess: function(message) {
            // Create success notification
            let successDiv = document.getElementById('success-notification');
            if (!successDiv) {
                successDiv = document.createElement('div');
                successDiv.id = 'success-notification';
                successDiv.className = 'success-notification';
                document.body.appendChild(successDiv);
            }
            
            successDiv.innerHTML = `
                <div class="success-content">
                    <i class="fas fa-check-circle"></i>
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            successDiv.style.display = 'block';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                if (successDiv) {
                    successDiv.style.display = 'none';
                }
            }, 3000);
        },
        
        updateStepIndicator: function(stepNumber) {
            const steps = document.querySelectorAll('.step');
            steps.forEach((step, index) => {
                if (index < stepNumber) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });
        },
        
        getStatusIcon: function(status) {
            const icons = {
                'draft': '<i class="fas fa-pencil-alt"></i>',
                'sent': '<i class="fas fa-paper-plane"></i>',
                'paid': '<i class="fas fa-check-circle"></i>',
                'overdue': '<i class="fas fa-exclamation-triangle"></i>'
            };
            return icons[status] || '<i class="fas fa-file-invoice"></i>';
        },
        
        setupCustomerAutocomplete: function() {
            try {
                const customerInput = document.getElementById('customer-name');
                if (!customerInput) return;
                
                // Create datalist for autocomplete
                let datalist = document.getElementById('customer-list');
                if (!datalist) {
                    datalist = document.createElement('datalist');
                    datalist.id = 'customer-list';
                    document.body.appendChild(datalist);
                    customerInput.setAttribute('list', 'customer-list');
                }
                
                // Populate with existing customers
                const customers = AppState.customers;
                datalist.innerHTML = customers.map(customer => 
                    `<option value="${customer.name}">${customer.email || ''}</option>`
                ).join('');
                
            } catch (error) {
                ErrorHandler.log(error, 'Setup Customer Autocomplete');
            }
        },
        
        autoFillCustomerDefaults: function(customerName) {
            try {
                if (!customerName) return;
                
                // Find customer in database
                const customer = AppState.customers.find(c => c.name === customerName);
                if (!customer) return;
                
                // Load customer defaults
                const defaults = window.StorageManager?.loadCustomerDefaults(customer.id) || {};
                
                // Fill in customer info
                if (customer.email) document.getElementById('customer-email').value = customer.email;
                if (customer.phone) document.getElementById('customer-phone').value = customer.phone;
                if (customer.address) document.getElementById('customer-address').value = customer.address;
                
                // Auto-select business type if there's a preference
                if (defaults.preferredBusinessType) {
                    const radio = document.getElementById(`business-${defaults.preferredBusinessType}`);
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
                
                // Auto-fill last used values for this customer
                if (defaults.lastProjectType) {
                    const projectBtn = document.querySelector(`[data-type="${defaults.lastProjectType}"]`);
                    if (projectBtn) {
                        projectBtn.click();
                    }
                }
                
                this.showSuccess('Customer information auto-filled');
                
            } catch (error) {
                ErrorHandler.log(error, 'Auto Fill Customer Defaults');
            }
        },
        
        setupAutoSave: function() {
            try {
                let autoSaveTimer = null;
                const autoSaveInterval = 30000; // 30 seconds
                
                // Track form changes
                const form = document.getElementById('invoice-form');
                if (!form) return;
                
                const formInputs = form.querySelectorAll('input, select, textarea');
                formInputs.forEach(input => {
                    input.addEventListener('change', () => {
                        // Clear existing timer
                        if (autoSaveTimer) clearTimeout(autoSaveTimer);
                        
                        // Set new timer
                        autoSaveTimer = setTimeout(() => {
                            this.autoSaveDraft();
                        }, 5000); // Auto-save 5 seconds after last change
                    });
                });
                
                // Periodic auto-save
                setInterval(() => {
                    if (this.hasUnsavedChanges()) {
                        this.autoSaveDraft();
                    }
                }, autoSaveInterval);
                
                // Warn before leaving page with unsaved changes
                window.addEventListener('beforeunload', (e) => {
                    if (this.hasUnsavedChanges()) {
                        e.preventDefault();
                        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                    }
                });
                
            } catch (error) {
                ErrorHandler.log(error, 'Setup Auto Save');
            }
        },
        
        autoSaveDraft: function() {
            try {
                const form = document.getElementById('invoice-form');
                if (!form) return;
                
                // Get form data
                const formData = new FormData(form);
                // Get business type from radio buttons
                const businessTypeRadio = document.querySelector('input[name="businessType"]:checked');
                const draftData = {
                    businessType: businessTypeRadio ? businessTypeRadio.value : '',
                    customerName: formData.get('customerName'),
                    customerEmail: formData.get('customerEmail'),
                    customerPhone: formData.get('customerPhone'),
                    customerAddress: formData.get('customerAddress'),
                    invoiceDate: formData.get('invoiceDate'),
                    invoiceNotes: formData.get('invoiceNotes'),
                    lastSaved: new Date().toISOString()
                };
                
                // Save to localStorage
                localStorage.setItem('jstark_draft_invoice', JSON.stringify(draftData));
                
                // Show subtle notification
                this.showAutoSaveNotification();
                
            } catch (error) {
                console.error('Auto-save error:', error);
            }
        },
        
        loadDraftInvoice: function() {
            try {
                const draftData = localStorage.getItem('jstark_draft_invoice');
                if (!draftData) return false;
                
                const draft = JSON.parse(draftData);
                const lastSaved = new Date(draft.lastSaved);
                const hoursSinceLastSave = (new Date() - lastSaved) / (1000 * 60 * 60);
                
                // Only offer to restore if less than 24 hours old
                if (hoursSinceLastSave < 24) {
                    this.showConfirmDialog(
                        'Restore Draft Invoice?',
                        `You have an unsaved invoice from ${lastSaved.toLocaleString()}. Would you like to continue working on it?`,
                        () => {
                            // Restore draft
                            this.restoreDraft(draft);
                            localStorage.removeItem('jstark_draft_invoice');
                        },
                        () => {
                            // Discard draft
                            localStorage.removeItem('jstark_draft_invoice');
                        }
                    );
                    return true;
                }
                
                return false;
            } catch (error) {
                console.error('Load draft error:', error);
                return false;
            }
        },
        
        restoreDraft: function(draft) {
            try {
                if (draft.businessType) {
                    const radio = document.querySelector(`input[name="businessType"][value="${draft.businessType}"]`);
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
                
                if (draft.customerName) document.getElementById('customer-name').value = draft.customerName;
                if (draft.customerEmail) document.getElementById('customer-email').value = draft.customerEmail;
                if (draft.customerPhone) document.getElementById('customer-phone').value = draft.customerPhone;
                if (draft.customerAddress) document.getElementById('customer-address').value = draft.customerAddress;
                if (draft.invoiceDate) document.getElementById('invoice-date').value = draft.invoiceDate;
                if (draft.invoiceNotes) document.getElementById('invoice-notes').value = draft.invoiceNotes;
                
                this.showSuccess('Draft invoice restored successfully');
                
            } catch (error) {
                ErrorHandler.log(error, 'Restore Draft');
            }
        },
        
        hasUnsavedChanges: function() {
            // Check if there are any services added or form has been modified
            const servicesList = document.getElementById('services-list');
            if (servicesList && servicesList.querySelector('.service-item')) {
                return true;
            }
            
            const form = document.getElementById('invoice-form');
            if (form) {
                const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
                for (let input of inputs) {
                    if (input.value.trim()) return true;
                }
            }
            
            return false;
        },
        
        showAutoSaveNotification: function() {
            // Create or update auto-save indicator
            let indicator = document.getElementById('auto-save-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'auto-save-indicator';
                indicator.className = 'auto-save-indicator';
                document.body.appendChild(indicator);
            }
            
            indicator.innerHTML = '<i class="fas fa-save"></i> Draft saved';
            indicator.classList.add('show');
            
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        },
        
        showConfirmDialog: function(title, message, onConfirm, onCancel) {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.innerHTML = `
                <div class="dialog-header">
                    <h3>${title}</h3>
                </div>
                <div class="dialog-body">
                    <p>${message}</p>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
                    <button class="btn btn-primary" id="confirm-btn">Confirm</button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            // Add event listeners
            document.getElementById('confirm-btn').addEventListener('click', () => {
                overlay.remove();
                if (onConfirm) onConfirm();
            });
            
            document.getElementById('cancel-btn').addEventListener('click', () => {
                overlay.remove();
                if (onCancel) onCancel();
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    if (onCancel) onCancel();
                }
            });
        },
        
        createSampleData: function() {
            try {
                // Create sample invoices for demonstration
                const sampleInvoices = [
                    {
                        id: 'inv_sample_1',
                        number: 1,
                        businessType: 'concrete',
                        customerName: 'John Smith',
                        customerEmail: 'john.smith@email.com',
                        customerPhone: '(440) 555-0123',
                        customerAddress: '123 Main St, Geneva, OH 44041',
                        date: '2024-01-15',
                        services: [{
                            id: 'concrete_1',
                            type: 'concrete',
                            description: 'Driveway Concrete Leveling',
                            quantity: 250,
                            unit: 'sq ft',
                            rate: 15.00,
                            amount: 3750.00
                        }],
                        subtotal: 3750.00,
                        tax: 309.38,
                        total: 4059.38,
                        notes: 'Payment due within 30 days',
                        status: 'sent',
                        createdAt: '2024-01-15T10:00:00Z',
                        updatedAt: '2024-01-15T10:00:00Z'
                    },
                    {
                        id: 'inv_sample_2',
                        number: 2,
                        businessType: 'masonry',
                        customerName: 'Sarah Johnson',
                        customerEmail: 'sarah.johnson@email.com',
                        customerPhone: '(440) 555-0456',
                        customerAddress: '456 Oak Ave, Geneva, OH 44041',
                        date: '2024-01-20',
                        services: [{
                            id: 'masonry_1',
                            type: 'masonry',
                            description: 'Outdoor Fireplace Construction',
                            quantity: 1,
                            unit: 'project',
                            rate: 2500.00,
                            amount: 2500.00
                        }],
                        subtotal: 2500.00,
                        tax: 206.25,
                        total: 2706.25,
                        notes: 'Materials included in price',
                        status: 'paid',
                        createdAt: '2024-01-20T14:30:00Z',
                        updatedAt: '2024-01-20T14:30:00Z'
                    }
                ];
                
                AppState.invoices = sampleInvoices;
                AppState.nextInvoiceNumber = 3;
                this.saveData();
                
                console.log('Sample data created');
                
            } catch (error) {
                ErrorHandler.log(error, 'Sample Data Creation');
            }
        },
        
        handleInvoiceSubmission: function() {
            try {
                // This method is called from the form submission
                if (window.InvoiceManager) {
                    window.InvoiceManager.handleInvoiceSubmission();
                } else {
                    console.error('InvoiceManager not available');
                }
            } catch (error) {
                ErrorHandler.log(error, 'Invoice Submission');
            }
        },
        
        previewInvoice: function() {
            try {
                // This method is called from the preview button
                if (window.InvoiceManager) {
                    window.InvoiceManager.previewInvoice();
                } else {
                    console.error('InvoiceManager not available');
                }
            } catch (error) {
                ErrorHandler.log(error, 'Preview Invoice');
            }
        },
        
        generateInvoicePreview: function(invoice) {
            try {
                if (window.InvoiceManager) {
                    window.InvoiceManager.generateInvoicePreview(invoice);
                } else {
                    console.error('InvoiceManager not available');
                }
            } catch (error) {
                ErrorHandler.log(error, 'Generate Preview');
            }
        },
        
        addServiceToList: function(service) {
            try {
                if (window.InvoiceManager) {
                    window.InvoiceManager.addService(service);
                } else {
                    console.error('InvoiceManager not available');
                }
            } catch (error) {
                ErrorHandler.log(error, 'Add Service');
            }
        },
        
        updateInvoiceTotals: function() {
            try {
                if (window.InvoiceManager) {
                    window.InvoiceManager.updateInvoiceTotals();
                } else {
                    console.error('InvoiceManager not available');
                }
            } catch (error) {
                ErrorHandler.log(error, 'Update Totals');
            }
        },
        
        // Public methods for global access
        viewInvoice: function(invoiceId) {
            try {
                const invoice = AppState.invoices.find(inv => inv.id === invoiceId);
                if (invoice) {
                    this.showInvoicePreview(invoice);
                }
            } catch (error) {
                ErrorHandler.log(error, 'View Invoice');
            }
        },
        
        editInvoice: function(invoiceId) {
            try {
                const invoice = AppState.invoices.find(inv => inv.id === invoiceId);
                if (invoice) {
                    AppState.currentInvoice = invoice;
                    this.showInvoiceCreation();
                    
                    // Use InvoiceManager to load the invoice for editing
                    if (window.InvoiceManager) {
                        window.InvoiceManager.loadInvoice(invoice);
                    } else {
                        // Fallback to app method
                        this.populateFormWithInvoice(invoice);
                    }
                }
            } catch (error) {
                ErrorHandler.log(error, 'Edit Invoice');
            }
        },
        
        deleteInvoice: function(invoiceId) {
            try {
                const invoice = AppState.invoices.find(inv => inv.id === invoiceId);
                if (!invoice) return;
                
                this.showConfirmDialog(
                    'Delete Invoice?',
                    `Are you sure you want to delete invoice #${invoice.number} for ${invoice.customerName}? This action cannot be undone.`,
                    () => {
                        // Confirm delete
                        AppState.invoices = AppState.invoices.filter(inv => inv.id !== invoiceId);
                        this.saveData();
                        this.populateInvoiceList();
                        this.updateDashboard();
                        this.showSuccess('Invoice deleted successfully');
                    }
                );
            } catch (error) {
                ErrorHandler.log(error, 'Delete Invoice');
            }
        },
        
        updateInvoiceStatus: function(invoiceId, newStatus) {
            try {
                const invoice = AppState.invoices.find(inv => inv.id === invoiceId);
                if (invoice) {
                    invoice.status = newStatus;
                    invoice.updatedAt = new Date().toISOString();
                    this.saveData();
                    this.updateDashboard();
                    this.showSuccess(`Invoice status updated to ${newStatus}`);
                }
            } catch (error) {
                ErrorHandler.log(error, 'Update Invoice Status');
            }
        },
        
        populateFormWithInvoice: function(invoice) {
            try {
                // Populate basic fields
                document.getElementById('business-type').value = invoice.businessType;
                document.getElementById('customer-name').value = invoice.customerName;
                document.getElementById('customer-email').value = invoice.customerEmail || '';
                document.getElementById('customer-phone').value = invoice.customerPhone || '';
                document.getElementById('customer-address').value = invoice.customerAddress || '';
                document.getElementById('invoice-date').value = invoice.date;
                document.getElementById('invoice-notes').value = invoice.notes || '';
                document.getElementById('invoice-status').value = invoice.status || 'draft';
                
                // Handle business type change
                this.handleBusinessTypeChange(invoice.businessType);
                
                // Populate services
                if (invoice.services && invoice.services.length > 0) {
                    invoice.services.forEach(service => {
                        this.addServiceToList(service);
                    });
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Populate Form');
            }
        }
    };
    
    // Global functions for onclick handlers
    window.createNewInvoice = function(businessType) {
        App.showInvoiceCreation(businessType);
    };
    
    window.showDashboard = function() {
        App.showDashboard();
    };
    
    window.showEstimateCalculator = function() {
        // Open invoice creation with calculator focus
        App.showInvoiceCreation();
        
        // Show calculator instructions
        setTimeout(() => {
            alert('Use the Concrete Leveling or Masonry Services sections below to calculate pricing. Select your business type first to see the calculator.');
        }, 500);
    };
    
    window.editInvoice = function() {
        App.showInvoiceCreation();
    };
    
    window.printInvoice = function() {
        window.print();
    };
    
    window.downloadPDF = function() {
        // This will be implemented in pdf.js
        if (window.PDFGenerator) {
            const success = window.PDFGenerator.downloadCurrentInvoice();
            if (success) {
                App.showSuccess('Invoice PDF generated successfully!');
            } else {
                ErrorHandler.showUserError('Failed to generate PDF. Please try again.');
            }
        } else {
            ErrorHandler.showUserError('PDF functionality not available');
        }
    };
    
    // Notification styles are now handled in CSS file
    
    // Initialize app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            App.init();
        });
    } else {
        App.init();
    }
    
    // Export App for global access
    window.App = App;
    window.App.AppState = AppState;
    
    // Global functions for HTML onclick handlers
    window.createNewInvoice = function(businessType) {
        App.showInvoiceCreation();
        if (businessType) {
            const radio = document.getElementById(`business-${businessType}`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        }
    };
    
    window.createQuickInvoice = function() {
        // Get the last invoice
        const lastInvoice = AppState.invoices[AppState.invoices.length - 1];
        if (lastInvoice) {
            App.showInvoiceCreation();
            // Pre-fill with last invoice data
            setTimeout(() => {
                const businessRadio = document.getElementById(`business-${lastInvoice.businessType}`);
                if (businessRadio) {
                    businessRadio.checked = true;
                    businessRadio.dispatchEvent(new Event('change'));
                }
                
                // Pre-fill customer info
                document.getElementById('customer-name').value = lastInvoice.customerName || '';
                document.getElementById('customer-email').value = lastInvoice.customerEmail || '';
                document.getElementById('customer-phone').value = lastInvoice.customerPhone || '';
                document.getElementById('customer-address').value = lastInvoice.customerAddress || '';
                
                App.showSuccess('Form pre-filled with last invoice data. Update as needed.');
                App.updateStepIndicator(3);
            }, 100);
        } else {
            App.showInvoiceCreation();
            App.showSuccess('No previous invoice found. Starting fresh.');
        }
    };
    
    window.showDashboard = function() {
        App.showView('dashboard');
    };
    
    window.editInvoice = function() {
        // Implementation for edit invoice
        App.showView('invoice-creation');
    };
    
    window.printInvoice = function() {
        window.print();
    };
    
    window.downloadPDF = function() {
        if (window.PDFGenerator) {
            const success = window.PDFGenerator.downloadCurrentInvoice();
            if (success) {
                App.showSuccess('Invoice PDF generated successfully!');
            } else {
                ErrorHandler.showUserError('Failed to generate PDF. Please try again.');
            }
        } else {
            ErrorHandler.showUserError('PDF functionality not available');
        }
    };
    
    window.emailInvoice = function() {
        if (window.EmailService && window.InvoiceManager) {
            const invoice = window.InvoiceManager.currentInvoice;
            if (invoice && invoice.services && invoice.services.length > 0) {
                window.EmailService.showEmailDialog(invoice);
            } else {
                ErrorHandler.showUserError('Please create or preview an invoice first before emailing.');
            }
        } else {
            ErrorHandler.showUserError('Email functionality not available');
        }
    };
    
    window.showEstimateCalculator = function() {
        App.showInvoiceCreation();
        App.showSuccess('Use the calculator in step 3 to create estimates');
    };
    
    window.showEmailSettings = function() {
        if (window.EmailService) {
            window.EmailService.showSettingsDialog();
        } else {
            ErrorHandler.showUserError('Email service not available');
        }
    };
    
})();