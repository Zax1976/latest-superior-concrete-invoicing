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
    
    // Enhanced Error handling utility
    const ErrorHandler = {
        errorHistory: [],
        maxErrorHistory: 10,
        
        log: function(error, context = 'App', severity = 'error') {
            const errorInfo = {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : null,
                context: context,
                severity: severity,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            // Add to error history
            this.errorHistory.unshift(errorInfo);
            if (this.errorHistory.length > this.maxErrorHistory) {
                this.errorHistory.pop();
            }
            
            console.error(`[${context}]`, error);
            
            // Store critical errors in localStorage for debugging
            if (severity === 'critical') {
                try {
                    const criticalErrors = JSON.parse(localStorage.getItem('jstark_critical_errors') || '[]');
                    criticalErrors.unshift(errorInfo);
                    if (criticalErrors.length > 5) criticalErrors.pop();
                    localStorage.setItem('jstark_critical_errors', JSON.stringify(criticalErrors));
                } catch (e) {
                    console.warn('Could not store critical error:', e);
                }
            }
            
            if (severity === 'critical') {
                this.showUserError('Something went wrong. Please refresh the page to continue.', 'critical');
            } else if (severity === 'error') {
                this.showUserError('Something went wrong. Please try that again.');
            }
        },
        
        showUserError: function(message, type = 'error') {
            // Sanitize message to prevent XSS
            const safeMessage = this.sanitizeHTML(message);
            
            // Create or update error notification
            let errorDiv = document.getElementById('error-notification');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'error-notification';
                errorDiv.className = 'error-notification';
                document.body.appendChild(errorDiv);
            }
            
            const iconClass = type === 'critical' ? 'fa-skull-crossbones' : 'fa-exclamation-triangle';
            const typeClass = type === 'critical' ? 'critical' : 'error';
            
            errorDiv.className = `error-notification ${typeClass}`;
            errorDiv.innerHTML = `
                <div class="error-content">
                    <i class="fas ${iconClass}"></i>
                    <span>${safeMessage}</span>
                    <button onclick="this.parentElement.parentElement.style.display='none'" aria-label="Close error">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            errorDiv.style.display = 'block';
            
            // Auto-hide after appropriate time
            const hideTime = type === 'critical' ? 10000 : 5000;
            setTimeout(() => {
                if (errorDiv && errorDiv.style.display !== 'none') {
                    errorDiv.style.display = 'none';
                }
            }, hideTime);
        },
        
        showSuccess: function(message) {
            const safeMessage = this.sanitizeHTML(message);
            
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
                    <span>${safeMessage}</span>
                    <button onclick="this.parentElement.parentElement.style.display='none'" aria-label="Close success">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            successDiv.style.display = 'block';
            
            setTimeout(() => {
                if (successDiv && successDiv.style.display !== 'none') {
                    successDiv.style.display = 'none';
                }
            }, 3000);
        },
        
        sanitizeHTML: function(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        
        handleStorageQuota: function() {
            try {
                // Check if localStorage is near capacity
                const used = new Blob(Object.values(localStorage)).size;
                const quota = 5 * 1024 * 1024; // 5MB typical limit
                
                if (used > quota * 0.9) {
                    this.showUserError('You\'re running out of storage space. Click "Export to CSV" to download your invoices and free up space.', 'warning');
                    return false;
                }
                return true;
            } catch (error) {
                this.log(error, 'Storage Check');
                return false;
            }
        },
        
        recoverFromStorageError: function() {
            try {
                // Clear non-essential data
                const keysToKeep = ['jstark_invoices', 'jstark_customers', 'jstark_next_invoice_number'];
                const allKeys = Object.keys(localStorage);
                
                allKeys.forEach(key => {
                    if (!keysToKeep.includes(key) && key.startsWith('jstark_')) {
                        localStorage.removeItem(key);
                    }
                });
                
                this.showSuccess('Storage cleaned up. Please try again.');
                return true;
            } catch (error) {
                this.log(error, 'Storage Recovery', 'critical');
                return false;
            }
        },
        
        getErrorReport: function() {
            return {
                errors: this.errorHistory,
                localStorage: {
                    used: new Blob(Object.values(localStorage)).size,
                    keys: Object.keys(localStorage).filter(k => k.startsWith('jstark_'))
                },
                browser: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    cookieEnabled: navigator.cookieEnabled,
                    onLine: navigator.onLine
                },
                app: {
                    version: window.CacheManager ? window.CacheManager.currentVersion : 'unknown',
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                }
            };
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
                this.setupPerformanceOptimizations();
                
                console.log('Application initialized successfully');
                
            } catch (error) {
                ErrorHandler.log(error, 'App Initialization');
            }
        },
        
        loadData: function() {
            try {
                // Use StorageManager if available for proper data loading
                if (window.StorageManager) {
                    AppState.invoices = window.StorageManager.loadInvoices();
                    AppState.customers = window.StorageManager.loadCustomers();
                    AppState.nextInvoiceNumber = window.StorageManager.getNextInvoiceNumber();
                } else {
                    // Fallback to direct localStorage
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
                    this.showInvoiceCreation(null, false);
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
                // Check if we're in an input field
                const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
                
                // F1 or Ctrl+? for help
                if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.key === '?')) {
                    e.preventDefault();
                    this.showKeyboardShortcuts();
                    return;
                }
                
                // Escape key handling
                if (e.key === 'Escape') {
                    // Close modal if open
                    const modal = document.getElementById('keyboard-shortcuts-modal');
                    if (modal && modal.style.display !== 'none') {
                        this.closeKeyboardShortcuts();
                        return;
                    }
                    // Otherwise go back to dashboard
                    if (!isInputField) {
                        this.showDashboard();
                    }
                    return;
                }
                
                // Don't trigger shortcuts if typing in input fields (except for specific shortcuts)
                if (isInputField && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    return;
                }
                
                // Alt + N for new invoice
                if (e.altKey && e.key === 'n') {
                    e.preventDefault();
                    this.showInvoiceCreation(null, false);
                }
                
                // Alt + D for dashboard
                if (e.altKey && e.key === 'd') {
                    e.preventDefault();
                    this.showDashboard();
                }
                
                // Alt + L for invoice list
                if (e.altKey && e.key === 'l') {
                    e.preventDefault();
                    this.showInvoiceList();
                }
                
                // Alt + C for calculator focus
                if (e.altKey && e.key === 'c') {
                    e.preventDefault();
                    const squareFootageInput = document.getElementById('square-footage');
                    if (squareFootageInput) {
                        squareFootageInput.focus();
                    }
                }
                
                // Ctrl/Cmd + S for save draft
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    if (this.currentView === 'invoice-creation') {
                        this.autoSaveInvoice();
                        if (window.ErrorHandler) {
                            window.ErrorHandler.showSuccess('Draft saved!');
                        }
                    }
                }
                
                // Ctrl/Cmd + P for print/preview
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                    e.preventDefault();
                    if (this.currentView === 'invoice-creation') {
                        this.previewInvoice();
                    }
                }
                
                // Ctrl/Cmd + E for email
                if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                    e.preventDefault();
                    if (this.currentView === 'invoice-creation' && window.EmailManager) {
                        // Check if there's a valid invoice to email
                        const currentInvoice = this.getCurrentInvoiceData();
                        if (currentInvoice && currentInvoice.customerName) {
                            window.EmailManager.showEmailDialog(currentInvoice);
                        }
                    }
                }
                
                // Ctrl/Cmd + F for search
                if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                    e.preventDefault();
                    const searchInput = document.getElementById('search-invoices');
                    if (searchInput && this.currentView === 'invoice-list') {
                        searchInput.focus();
                        searchInput.select();
                    }
                }
                
                // Escape key to clear search and filters
                if (e.key === 'Escape' && this.currentView === 'invoice-list') {
                    const searchInput = document.getElementById('search-invoices');
                    const filterSelect = document.getElementById('filter-status');
                    
                    if (searchInput && searchInput.value.trim()) {
                        e.preventDefault();
                        searchInput.value = '';
                        this.filterInvoiceList('', filterSelect ? filterSelect.value : '');
                        this.toggleClearButton('');
                    } else if (filterSelect && filterSelect.value) {
                        e.preventDefault();
                        filterSelect.value = '';
                        this.filterInvoiceList(searchInput ? searchInput.value.trim() : '', '');
                    } else {
                        // If no search/filter is active, go to dashboard
                        this.showDashboard();
                    }
                }
                
                // Number keys 1-8 for project type selection (only in calculator view)
                if (this.currentView === 'invoice-creation' && !isInputField) {
                    const num = parseInt(e.key);
                    if (num >= 1 && num <= 8) {
                        e.preventDefault();
                        const projectButtons = document.querySelectorAll('.project-type-btn');
                        if (projectButtons[num - 1]) {
                            projectButtons[num - 1].click();
                        }
                    }
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Keyboard Shortcuts');
            }
        },
        
        showKeyboardShortcuts: function() {
            try {
                const modal = document.getElementById('keyboard-shortcuts-modal');
                if (modal) {
                    modal.style.display = 'flex';
                    // Focus the close button for accessibility
                    const closeButton = modal.querySelector('.modal-close');
                    if (closeButton) {
                        closeButton.focus();
                    }
                }
            } catch (error) {
                ErrorHandler.log(error, 'Show Keyboard Shortcuts');
            }
        },
        
        closeKeyboardShortcuts: function() {
            try {
                const modal = document.getElementById('keyboard-shortcuts-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            } catch (error) {
                ErrorHandler.log(error, 'Close Keyboard Shortcuts');
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
        
        showInvoiceCreation: function(businessType = null, checkForDraft = true) {
            try {
                this.showView('invoice-creation');
                this.resetInvoiceForm();
                
                // Only check for draft invoice when explicitly requested
                if (checkForDraft) {
                    setTimeout(() => {
                        this.loadDraftInvoice();
                    }, 100);
                }
                
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
                this.setupInvoiceListSearching();
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
                // Use the new updateInvoiceTable function to maintain consistency with search/filter
                this.updateInvoiceTable(AppState.invoices);
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
        
        // Loading indicator utilities
        showLoading: function(element, message = 'Loading...') {
            try {
                if (typeof element === 'string') {
                    element = document.getElementById(element);
                }
                
                if (!element) return;
                
                // Add loading class
                element.classList.add('loading');
                
                // Store original content
                if (!element.dataset.originalContent) {
                    element.dataset.originalContent = element.innerHTML;
                }
                
                // Show loading spinner
                element.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>${message}</span>
                    </div>
                `;
                
                // Disable if it's a button
                if (element.tagName === 'BUTTON') {
                    element.disabled = true;
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Show Loading');
            }
        },
        
        hideLoading: function(element) {
            try {
                if (typeof element === 'string') {
                    element = document.getElementById(element);
                }
                
                if (!element) return;
                
                // Remove loading class
                element.classList.remove('loading');
                
                // Restore original content
                if (element.dataset.originalContent) {
                    element.innerHTML = element.dataset.originalContent;
                    delete element.dataset.originalContent;
                }
                
                // Re-enable if it's a button
                if (element.tagName === 'BUTTON') {
                    element.disabled = false;
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Hide Loading');
            }
        },
        
        showGlobalLoading: function(message = 'Processing...') {
            try {
                let loadingOverlay = document.getElementById('global-loading');
                if (!loadingOverlay) {
                    loadingOverlay = document.createElement('div');
                    loadingOverlay.id = 'global-loading';
                    loadingOverlay.className = 'global-loading-overlay';
                    document.body.appendChild(loadingOverlay);
                }
                
                loadingOverlay.innerHTML = `
                    <div class="global-loading-content">
                        <div class="loading-spinner-large">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                        <p>${message}</p>
                    </div>
                `;
                
                loadingOverlay.style.display = 'flex';
                
            } catch (error) {
                ErrorHandler.log(error, 'Show Global Loading');
            }
        },
        
        hideGlobalLoading: function() {
            try {
                const loadingOverlay = document.getElementById('global-loading');
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
            } catch (error) {
                ErrorHandler.log(error, 'Hide Global Loading');
            }
        },
        
        showProgress: function(elementId, progress, message = 'Processing...') {
            try {
                const element = document.getElementById(elementId);
                if (!element) return;
                
                element.innerHTML = `
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(100, Math.max(0, progress))}%"></div>
                        </div>
                        <div class="progress-text">${message} (${Math.round(progress)}%)</div>
                    </div>
                `;
                
            } catch (error) {
                ErrorHandler.log(error, 'Show Progress');
            }
        },
        
        // Performance utilities
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        debounce: function(func, delay) {
            let timeoutId;
            return function() {
                const args = arguments;
                const context = this;
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(context, args), delay);
            };
        },
        
        setupPerformanceOptimizations: function() {
            try {
                // Throttle scroll events
                const throttledScrollHandler = this.throttle(this.handleScroll.bind(this), 16); // ~60fps
                window.addEventListener('scroll', throttledScrollHandler, { passive: true });
                
                // Throttle resize events
                const throttledResizeHandler = this.throttle(this.handleResize.bind(this), 250);
                window.addEventListener('resize', throttledResizeHandler, { passive: true });
                
                // Debounce search input
                const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
                searchInputs.forEach(input => {
                    const debouncedSearch = this.debounce(this.handleSearch.bind(this), 300);
                    input.addEventListener('input', debouncedSearch);
                });
                
                // Use Intersection Observer for lazy loading
                this.setupIntersectionObserver();
                
                console.log('Performance optimizations initialized');
                
            } catch (error) {
                ErrorHandler.log(error, 'Setup Performance Optimizations');
            }
        },
        
        handleScroll: function() {
            try {
                // Handle scroll-based functionality
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Show/hide scroll to top button
                const scrollToTopBtn = document.getElementById('scroll-to-top');
                if (scrollToTopBtn) {
                    if (scrollTop > 300) {
                        scrollToTopBtn.classList.add('visible');
                    } else {
                        scrollToTopBtn.classList.remove('visible');
                    }
                }
                
                // Update mobile header on scroll
                const mobileHeader = document.querySelector('.app-header');
                if (mobileHeader && window.innerWidth <= 768) {
                    if (scrollTop > 100) {
                        mobileHeader.classList.add('scrolled');
                    } else {
                        mobileHeader.classList.remove('scrolled');
                    }
                }
                
                // Trigger lazy loading for elements entering viewport
                this.checkLazyLoadElements();
                
            } catch (error) {
                ErrorHandler.log(error, 'Handle Scroll');
            }
        },
        
        handleResize: function() {
            try {
                // Handle responsive layout adjustments
                const currentWidth = window.innerWidth;
                
                // Close mobile menu on desktop
                if (currentWidth > 768) {
                    const mobileMenu = document.getElementById('header-actions');
                    const menuOverlay = document.getElementById('menu-overlay');
                    if (mobileMenu) mobileMenu.classList.remove('show');
                    if (menuOverlay) menuOverlay.classList.remove('show');
                }
                
                // Adjust mobile header padding
                this.adjustMobileHeaderPadding();
                
                // Recalculate table responsive behavior
                this.updateTableResponsiveness();
                
            } catch (error) {
                ErrorHandler.log(error, 'Handle Resize');
            }
        },
        
        handleSearch: function(event) {
            try {
                const query = event.target.value.trim();
                const searchType = event.target.dataset.searchType || 'general';
                
                if (query.length === 0) {
                    this.clearSearchResults();
                    return;
                }
                
                if (query.length < 2) {
                    return; // Wait for at least 2 characters
                }
                
                // Show loading indicator
                this.showSearchLoading(event.target);
                
                // Perform search based on type
                switch (searchType) {
                    case 'customers':
                        this.searchCustomers(query);
                        break;
                    case 'invoices':
                        this.searchInvoices(query);
                        break;
                    default:
                        this.performGeneralSearch(query);
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Handle Search');
            }
        },
        
        setupIntersectionObserver: function() {
            try {
                if ('IntersectionObserver' in window) {
                    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                this.loadLazyElement(entry.target);
                                observer.unobserve(entry.target);
                            }
                        });
                    }, {
                        rootMargin: '50px 0px',
                        threshold: 0.01
                    });
                    
                    // Observe lazy load elements
                    const lazyElements = document.querySelectorAll('[data-lazy]');
                    lazyElements.forEach(element => {
                        lazyImageObserver.observe(element);
                    });
                    
                    this.lazyImageObserver = lazyImageObserver;
                }
            } catch (error) {
                ErrorHandler.log(error, 'Setup Intersection Observer');
            }
        },
        
        loadLazyElement: function(element) {
            try {
                const src = element.dataset.lazy;
                if (src) {
                    if (element.tagName === 'IMG') {
                        element.src = src;
                        element.classList.add('loaded');
                    } else {
                        // Handle other lazy-loaded content
                        element.style.backgroundImage = `url(${src})`;
                        element.classList.add('loaded');
                    }
                    
                    element.removeAttribute('data-lazy');
                }
            } catch (error) {
                ErrorHandler.log(error, 'Load Lazy Element');
            }
        },
        
        checkLazyLoadElements: function() {
            try {
                // Fallback for browsers without Intersection Observer
                if (!this.lazyImageObserver) {
                    const lazyElements = document.querySelectorAll('[data-lazy]');
                    lazyElements.forEach(element => {
                        const rect = element.getBoundingClientRect();
                        if (rect.top <= window.innerHeight + 50 && rect.bottom >= -50) {
                            this.loadLazyElement(element);
                        }
                    });
                }
            } catch (error) {
                ErrorHandler.log(error, 'Check Lazy Load Elements');
            }
        },
        
        adjustMobileHeaderPadding: function() {
            try {
                if (window.innerWidth <= 768) {
                    const header = document.querySelector('.app-header');
                    const mainContent = document.querySelector('.main-content');
                    
                    if (header && mainContent) {
                        const headerHeight = header.offsetHeight;
                        mainContent.style.paddingTop = `${headerHeight + 20}px`;
                    }
                }
            } catch (error) {
                ErrorHandler.log(error, 'Adjust Mobile Header Padding');
            }
        },
        
        updateTableResponsiveness: function() {
            try {
                const tables = document.querySelectorAll('.invoice-table, .customer-table');
                tables.forEach(table => {
                    const wrapper = table.closest('.table-wrapper');
                    if (wrapper) {
                        if (table.scrollWidth > wrapper.clientWidth) {
                            wrapper.classList.add('scrollable');
                        } else {
                            wrapper.classList.remove('scrollable');
                        }
                    }
                });
            } catch (error) {
                ErrorHandler.log(error, 'Update Table Responsiveness');
            }
        },
        
        // Setup search functionality for invoice list
        setupInvoiceListSearching: function() {
            try {
                const searchInput = document.getElementById('search-invoices');
                const filterSelect = document.getElementById('filter-status');
                const clearButton = document.getElementById('clear-search');
                
                if (searchInput) {
                    // Remove any existing event listeners
                    const newSearchInput = searchInput.cloneNode(true);
                    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
                    
                    // Add debounced search functionality
                    const debouncedSearch = this.debounce((event) => {
                        const query = event.target.value.trim();
                        this.filterInvoiceList(query, filterSelect ? filterSelect.value : '');
                        this.toggleClearButton(query);
                    }, 300);
                    
                    newSearchInput.addEventListener('input', debouncedSearch);
                    newSearchInput.addEventListener('keyup', debouncedSearch);
                    
                    // Handle clear button click
                    if (clearButton) {
                        clearButton.addEventListener('click', () => {
                            newSearchInput.value = '';
                            this.filterInvoiceList('', filterSelect ? filterSelect.value : '');
                            this.toggleClearButton('');
                            newSearchInput.focus();
                        });
                    }
                }
                
                if (filterSelect) {
                    filterSelect.addEventListener('change', (event) => {
                        const query = searchInput ? searchInput.value.trim() : '';
                        this.filterInvoiceList(query, event.target.value);
                    });
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Setup Invoice List Searching');
            }
        },
        
        // Toggle clear button visibility
        toggleClearButton: function(query) {
            try {
                const clearButton = document.getElementById('clear-search');
                if (clearButton) {
                    clearButton.style.display = query && query.length > 0 ? 'flex' : 'none';
                }
            } catch (error) {
                ErrorHandler.log(error, 'Toggle Clear Button');
            }
        },
        
        // Filter invoice list based on search query and status
        filterInvoiceList: function(query = '', statusFilter = '') {
            try {
                let filteredInvoices = [...AppState.invoices];
                
                // Apply search filter
                if (query && query.length > 0) {
                    const lowerQuery = query.toLowerCase();
                    filteredInvoices = filteredInvoices.filter(invoice => {
                        return (
                            (invoice.customerName && invoice.customerName.toLowerCase().includes(lowerQuery)) ||
                            (invoice.number && invoice.number.toString().toLowerCase().includes(lowerQuery)) ||
                            (invoice.customerEmail && invoice.customerEmail.toLowerCase().includes(lowerQuery)) ||
                            (invoice.customerPhone && invoice.customerPhone.includes(query)) ||
                            (invoice.notes && invoice.notes.toLowerCase().includes(lowerQuery)) ||
                            (invoice.services && invoice.services.some(service => 
                                service.description && service.description.toLowerCase().includes(lowerQuery)
                            ))
                        );
                    });
                }
                
                // Apply status filter
                if (statusFilter && statusFilter !== '') {
                    filteredInvoices = filteredInvoices.filter(invoice => 
                        invoice.status === statusFilter
                    );
                }
                
                // Update the table with filtered results
                this.updateInvoiceTable(filteredInvoices, query, statusFilter);
                
            } catch (error) {
                ErrorHandler.log(error, 'Filter Invoice List');
            }
        },
        
        // Update invoice table with filtered results
        updateInvoiceTable: function(invoices, searchQuery = '', statusFilter = '') {
            try {
                const tableBody = document.getElementById('invoices-table-body');
                if (!tableBody) return;
                
                if (invoices.length === 0) {
                    const emptyMessage = searchQuery || statusFilter ? 
                        'No invoices found matching your search criteria.' : 
                        'No invoices found';
                    tableBody.innerHTML = `<tr><td colspan="7" class="empty-table">${emptyMessage}</td></tr>`;
                    return;
                }
                
                const invoicesHtml = invoices.map(invoice => `
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
                
                // Add visual feedback for active search/filter
                const searchInput = document.getElementById('search-invoices');
                const filterSelect = document.getElementById('filter-status');
                
                if (searchQuery || statusFilter) {
                    if (searchInput) searchInput.classList.add('active-search');
                    if (filterSelect && statusFilter) filterSelect.classList.add('active-filter');
                } else {
                    if (searchInput) searchInput.classList.remove('active-search');
                    if (filterSelect) filterSelect.classList.remove('active-filter');
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Update Invoice Table');
            }
        },
        
        // Search functionality
        searchInvoices: function(query) {
            try {
                const invoices = AppState.invoices || [];
                const lowerQuery = query.toLowerCase();
                
                const results = invoices.filter(invoice => {
                    return (
                        (invoice.customerName && invoice.customerName.toLowerCase().includes(lowerQuery)) ||
                        (invoice.number && invoice.number.toString().toLowerCase().includes(lowerQuery)) ||
                        (invoice.customerEmail && invoice.customerEmail.toLowerCase().includes(lowerQuery)) ||
                        (invoice.customerPhone && invoice.customerPhone.includes(query)) ||
                        (invoice.status && invoice.status.toLowerCase().includes(lowerQuery)) ||
                        (invoice.notes && invoice.notes.toLowerCase().includes(lowerQuery)) ||
                        (invoice.services && invoice.services.some(service => 
                            service.description && service.description.toLowerCase().includes(lowerQuery)
                        ))
                    );
                });
                
                this.displaySearchResults('invoices', results, query);
                
            } catch (error) {
                ErrorHandler.log(error, 'Search Invoices');
            }
        },
        
        searchCustomers: function(query) {
            try {
                if (window.StorageManager && window.StorageManager.searchCustomers) {
                    const results = window.StorageManager.searchCustomers(query);
                    this.displaySearchResults('customers', results, query);
                } else {
                    const customers = AppState.customers || [];
                    const lowerQuery = query.toLowerCase();
                    
                    const results = customers.filter(customer => 
                        (customer.name && customer.name.toLowerCase().includes(lowerQuery)) ||
                        (customer.email && customer.email.toLowerCase().includes(lowerQuery)) ||
                        (customer.phone && customer.phone.includes(query))
                    );
                    
                    this.displaySearchResults('customers', results, query);
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Search Customers');
            }
        },
        
        performGeneralSearch: function(query) {
            try {
                // Search both invoices and customers
                this.searchInvoices(query);
                this.searchCustomers(query);
                
            } catch (error) {
                ErrorHandler.log(error, 'Perform General Search');
            }
        },
        
        displaySearchResults: function(type, results, query) {
            try {
                const searchResultsContainer = document.getElementById(`${type}-search-results`) || 
                                             document.getElementById('search-results') ||
                                             this.createSearchResultsContainer(type);
                
                if (!searchResultsContainer) return;
                
                // Clear previous results
                searchResultsContainer.innerHTML = '';
                
                if (results.length === 0) {
                    searchResultsContainer.innerHTML = `
                        <div class="no-search-results">
                            <i class="fas fa-search"></i>
                            <p>No ${type} found for "${query}"</p>
                        </div>
                    `;
                    return;
                }
                
                // Display results
                const resultsHTML = results.map(result => {
                    if (type === 'invoices') {
                        return this.createInvoiceSearchResult(result);
                    } else if (type === 'customers') {
                        return this.createCustomerSearchResult(result);
                    }
                    return '';
                }).join('');
                
                searchResultsContainer.innerHTML = `
                    <div class="search-results-header">
                        <h3>Found ${results.length} ${type} for "${query}"</h3>
                        <button class="clear-search-btn" onclick="App.clearSearchResults()">
                            <i class="fas fa-times"></i> Clear
                        </button>
                    </div>
                    <div class="search-results-list">
                        ${resultsHTML}
                    </div>
                `;
                
                // Show the results container
                searchResultsContainer.style.display = 'block';
                
            } catch (error) {
                ErrorHandler.log(error, 'Display Search Results');
            }
        },
        
        createSearchResultsContainer: function(type) {
            try {
                const container = document.createElement('div');
                container.id = `${type}-search-results`;
                container.className = 'search-results-container';
                
                // Find appropriate place to insert
                const targetView = document.getElementById(`${type.slice(0, -1)}-list`) || 
                                 document.getElementById('dashboard') ||
                                 document.querySelector('.main-content');
                
                if (targetView) {
                    targetView.insertBefore(container, targetView.firstChild);
                }
                
                return container;
                
            } catch (error) {
                ErrorHandler.log(error, 'Create Search Results Container');
                return null;
            }
        },
        
        createInvoiceSearchResult: function(invoice) {
            const statusClass = invoice.status ? invoice.status.toLowerCase() : 'draft';
            const date = invoice.date ? new Date(invoice.date).toLocaleDateString() : 'No date';
            const total = invoice.total ? this.formatCurrency(invoice.total) : '$0.00';
            
            return `
                <div class="search-result-item invoice-result" data-invoice-id="${invoice.id}">
                    <div class="result-main">
                        <div class="result-header">
                            <span class="invoice-number">#${invoice.number || 'DRAFT'}</span>
                            <span class="invoice-status status-${statusClass}">${(invoice.status || 'draft').toUpperCase()}</span>
                        </div>
                        <div class="result-details">
                            <strong>${invoice.customerName || 'No customer'}</strong>
                            <span class="result-meta">${date} • ${total}</span>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-sm btn-outline" onclick="App.viewInvoice('${invoice.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="App.editInvoice('${invoice.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </div>
            `;
        },
        
        createCustomerSearchResult: function(customer) {
            const totalInvoices = customer.totalInvoices || 0;
            const totalAmount = customer.totalAmount ? this.formatCurrency(customer.totalAmount) : '$0.00';
            
            return `
                <div class="search-result-item customer-result" data-customer-name="${customer.name}">
                    <div class="result-main">
                        <div class="result-header">
                            <strong>${customer.name}</strong>
                        </div>
                        <div class="result-details">
                            ${customer.email ? `<span class="customer-email">${customer.email}</span>` : ''}
                            ${customer.phone ? `<span class="customer-phone">${customer.phone}</span>` : ''}
                            <span class="result-meta">${totalInvoices} invoices • ${totalAmount} total</span>
                        </div>
                    </div>
                    <div class="result-actions">
                        <button class="btn btn-sm btn-primary" onclick="App.createInvoiceForCustomer('${customer.name}')">
                            <i class="fas fa-plus"></i> New Invoice
                        </button>
                    </div>
                </div>
            `;
        },
        
        clearSearchResults: function() {
            try {
                const searchContainers = document.querySelectorAll('.search-results-container');
                searchContainers.forEach(container => {
                    container.style.display = 'none';
                    container.innerHTML = '';
                });
                
                // Clear search inputs
                const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
                searchInputs.forEach(input => {
                    input.value = '';
                });
                
            } catch (error) {
                ErrorHandler.log(error, 'Clear Search Results');
            }
        },
        
        showSearchLoading: function(inputElement) {
            try {
                const loader = inputElement.parentNode.querySelector('.search-loading') || 
                             this.createSearchLoader(inputElement.parentNode);
                if (loader) {
                    loader.style.display = 'block';
                }
            } catch (error) {
                ErrorHandler.log(error, 'Show Search Loading');
            }
        },
        
        createSearchLoader: function(parent) {
            try {
                const loader = document.createElement('div');
                loader.className = 'search-loading';
                loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                parent.appendChild(loader);
                return loader;
            } catch (error) {
                ErrorHandler.log(error, 'Create Search Loader');
                return null;
            }
        },
        
        // Invoice management functions
        viewInvoice: function(invoiceId) {
            try {
                const invoice = AppState.invoices.find(inv => inv.id === invoiceId);
                if (!invoice) {
                    ErrorHandler.showUserError('We couldn\'t find that invoice. It may have been deleted.');
                    return;
                }
                
                // Show invoice preview
                if (window.InvoiceManager) {
                    window.InvoiceManager.currentInvoice = invoice;
                    this.showInvoicePreview(invoice);
                } else {
                    console.log('Invoice details:', invoice);
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'View Invoice');
            }
        },
        
        editInvoice: function(invoiceId) {
            try {
                const invoice = AppState.invoices.find(inv => inv.id === invoiceId);
                if (!invoice) {
                    ErrorHandler.showUserError('We couldn\'t find that invoice. It may have been deleted.');
                    return;
                }
                
                // Load invoice into form for editing
                this.loadInvoiceIntoForm(invoice);
                this.showView('new-invoice');
                
            } catch (error) {
                ErrorHandler.log(error, 'Edit Invoice');
            }
        },
        
        createInvoiceForCustomer: function(customerName) {
            try {
                // Go to new invoice view and pre-fill customer
                this.showView('new-invoice');
                
                // Wait a moment for view to load
                setTimeout(() => {
                    const customerNameInput = document.getElementById('customer-name');
                    if (customerNameInput) {
                        customerNameInput.value = customerName;
                        customerNameInput.dispatchEvent(new Event('change'));
                        
                        // Auto-fill customer data
                        this.autoFillCustomerDefaults(customerName);
                    }
                }, 100);
                
            } catch (error) {
                ErrorHandler.log(error, 'Create Invoice For Customer');
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
                
                // Only offer to restore if less than 24 hours old and contains meaningful data
                const hasContent = draft.customerName || 
                                   (draft.services && draft.services.length > 0) || 
                                   draft.notes;
                
                if (hoursSinceLastSave < 24 && hasContent) {
                    // Check if this is just the original test customer from demo data
                    const isTestData = draft.customerName === 'Test Customer' || 
                                       draft.customerEmail === 'test@example.com' ||
                                       (draft.customerName && draft.customerName.toLowerCase().includes('test'));
                    
                    if (!isTestData) {
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
                    } else {
                        // Automatically discard test data drafts
                        localStorage.removeItem('jstark_draft_invoice');
                        return false;
                    }
                } else {
                    // Clean up old or empty drafts
                    localStorage.removeItem('jstark_draft_invoice');
                }
                
                return false;
            } catch (error) {
                console.error('Load draft error:', error);
                // Clean up corrupted draft data
                localStorage.removeItem('jstark_draft_invoice');
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
                    this.showInvoiceCreation(null, false);
                    
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
        
        exportToCSV: function() {
            try {
                const invoices = AppState.invoices || [];
                if (invoices.length === 0) {
                    ErrorHandler.showUserError('You don\'t have any invoices to export yet. Create your first invoice to get started!');
                    return;
                }

                // CSV headers
                const headers = [
                    'Invoice Number',
                    'Date',
                    'Status',
                    'Business Type',
                    'Customer Name',
                    'Customer Email',
                    'Customer Phone',
                    'Customer Address',
                    'Services',
                    'Subtotal',
                    'Tax',
                    'Total',
                    'Notes'
                ];

                // Convert invoices to CSV rows
                const rows = invoices.map(invoice => {
                    // Combine services into a single string
                    const servicesStr = (invoice.services || [])
                        .map(s => `${s.description} (${s.quantity} ${s.unit} @ $${s.rate})`)
                        .join('; ');

                    return [
                        invoice.number || '',
                        invoice.date || '',
                        invoice.status || 'draft',
                        invoice.businessType || '',
                        invoice.customerName || '',
                        invoice.customerEmail || '',
                        invoice.customerPhone || '',
                        invoice.customerAddress || '',
                        servicesStr,
                        invoice.subtotal || 0,
                        invoice.tax || 0,
                        invoice.total || 0,
                        (invoice.notes || '').replace(/"/g, '""') // Escape quotes in notes
                    ];
                });

                // Build CSV content
                let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
                csvContent += rows.map(row => 
                    row.map(cell => {
                        // Handle different data types
                        if (cell === null || cell === undefined) return '""';
                        if (typeof cell === 'number') return cell;
                        // Escape quotes and wrap in quotes
                        return `"${String(cell).replace(/"/g, '""')}"`;
                    }).join(',')
                ).join('\n');

                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                const fileName = `jstark_invoices_${new Date().toISOString().split('T')[0]}.csv`;
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                ErrorHandler.showSuccess(`Exported ${invoices.length} invoices to CSV`);
                
            } catch (error) {
                ErrorHandler.log(error, 'CSV Export');
                ErrorHandler.showUserError('We couldn\'t export your invoices. Please check your browser settings and try again.');
            }
        },

        exportCustomersToCSV: function() {
            try {
                const customers = AppState.customers || [];
                if (customers.length === 0) {
                    ErrorHandler.showUserError('You don\'t have any customers to export yet. Create your first invoice to add customers!');
                    return;
                }

                // CSV headers
                const headers = [
                    'Customer Name',
                    'Email',
                    'Phone',
                    'Address',
                    'First Invoice Date',
                    'Last Invoice Date',
                    'Total Invoices',
                    'Total Amount'
                ];

                // Convert customers to CSV rows
                const rows = customers.map(customer => [
                    customer.name || '',
                    customer.email || '',
                    customer.phone || '',
                    customer.address || '',
                    customer.firstInvoiceDate || '',
                    customer.lastInvoiceDate || '',
                    customer.totalInvoices || 0,
                    customer.totalAmount || 0
                ]);

                // Build CSV content
                let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
                csvContent += rows.map(row => 
                    row.map(cell => {
                        if (cell === null || cell === undefined) return '""';
                        if (typeof cell === 'number') return cell;
                        return `"${String(cell).replace(/"/g, '""')}"`;
                    }).join(',')
                ).join('\n');

                // Create and download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                const fileName = `jstark_customers_${new Date().toISOString().split('T')[0]}.csv`;
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                ErrorHandler.showSuccess(`Exported ${customers.length} customers to CSV`);
                
            } catch (error) {
                ErrorHandler.log(error, 'Customer CSV Export');
                ErrorHandler.showUserError('We couldn\'t export your customer list. Please check your browser settings and try again.');
            }
        },

        downloadBackup: function() {
            try {
                if (window.StorageManager && window.StorageManager.downloadBackup) {
                    const success = window.StorageManager.downloadBackup();
                    if (!success) {
                        ErrorHandler.showUserError('We couldn\'t create a backup file. Please try again.');
                    }
                } else {
                    ErrorHandler.showUserError('Backup functionality is not available. Please refresh the page and try again.');
                }
            } catch (error) {
                ErrorHandler.log(error, 'Download Backup');
            }
        },

        showSettingsDialog: function() {
            // Placeholder for settings dialog
            ErrorHandler.showUserError('Settings dialog coming soon! For now, email settings can be configured through the email dialog when sending invoices.');
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
        App.showInvoiceCreation(businessType, false);
    };
    
    window.showDashboard = function() {
        App.showDashboard();
    };
    
    window.showEstimateCalculator = function() {
        // Open invoice creation with calculator focus
        App.showInvoiceCreation(null, false);
        
        // Show calculator instructions
        setTimeout(() => {
            alert('Use the Concrete Leveling or Masonry Services sections below to calculate pricing. Select your business type first to see the calculator.');
        }, 500);
    };
    
    window.editInvoice = function() {
        App.showInvoiceCreation(null, false);
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
    
    // Mobile menu toggle
    window.toggleMobileMenu = function() {
        const headerActions = document.getElementById('header-actions');
        const menuOverlay = document.getElementById('menu-overlay');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        
        if (headerActions && menuOverlay) {
            const isOpen = headerActions.classList.contains('show');
            
            if (isOpen) {
                // Close menu
                headerActions.classList.remove('show');
                menuOverlay.classList.remove('show');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            } else {
                // Open menu
                headerActions.classList.add('show');
                menuOverlay.classList.add('show');
                menuToggle.innerHTML = '<i class="fas fa-times"></i>';
            }
        }
    };
    
    // Keyboard shortcuts modal functions
    window.showKeyboardShortcuts = function() {
        if (window.App) {
            window.App.showKeyboardShortcuts();
        }
    };
    
    window.closeKeyboardShortcuts = function() {
        if (window.App) {
            window.App.closeKeyboardShortcuts();
        }
    };
    
    // Close mobile menu when clicking a button
    document.addEventListener('click', function(e) {
        if (e.target.closest('.header-actions .btn')) {
            const headerActions = document.getElementById('header-actions');
            const menuOverlay = document.getElementById('menu-overlay');
            const menuToggle = document.querySelector('.mobile-menu-toggle');
            
            if (headerActions && headerActions.classList.contains('show')) {
                headerActions.classList.remove('show');
                menuOverlay.classList.remove('show');
                if (menuToggle) {
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        }
    });
    
    // Handle header scroll behavior on mobile
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    function updateHeaderOnScroll() {
        const header = document.querySelector('.app-header');
        const currentScrollY = window.scrollY;
        
        if (header) {
            // Add compact class when scrolled down
            if (currentScrollY > 50) {
                header.classList.add('compact');
            } else {
                header.classList.remove('compact');
            }
            
            // Hide/show header on scroll (optional)
            if (window.innerWidth <= 768) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    // Scrolling down - hide header
                    header.style.transform = 'translateY(-100%)';
                } else {
                    // Scrolling up - show header
                    header.style.transform = 'translateY(0)';
                }
            }
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateHeaderOnScroll);
            ticking = true;
        }
    }
    
    // Add scroll listener
    window.addEventListener('scroll', requestTick);
    
    // Reset header on window resize
    window.addEventListener('resize', function() {
        const header = document.querySelector('.app-header');
        if (header && window.innerWidth > 768) {
            header.style.transform = 'translateY(0)';
            header.classList.remove('compact');
        }
        adjustMainContentPadding();
    });
    
    // Dynamically adjust main content padding based on header height
    function adjustMainContentPadding() {
        const header = document.querySelector('.app-header');
        const mainContent = document.querySelector('.main-content');
        
        if (header && mainContent && window.innerWidth <= 768) {
            const headerHeight = header.offsetHeight;
            mainContent.style.paddingTop = headerHeight + 'px';
        } else if (mainContent) {
            mainContent.style.paddingTop = ''; // Reset for desktop
        }
    }
    
    // Call on load and after DOM changes
    document.addEventListener('DOMContentLoaded', adjustMainContentPadding);
    window.addEventListener('load', adjustMainContentPadding);
    
    // Also adjust when header compact state changes
    const headerObserver = new MutationObserver(adjustMainContentPadding);
    const headerElement = document.querySelector('.app-header');
    if (headerElement) {
        headerObserver.observe(headerElement, { 
            attributes: true, 
            attributeFilter: ['class'] 
        });
    }
    
})();