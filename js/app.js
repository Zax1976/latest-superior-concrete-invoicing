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
                
                // Business type change
                document.getElementById('business-type')?.addEventListener('change', (e) => {
                    this.handleBusinessTypeChange(e.target.value);
                });
                
                // Form submission
                document.getElementById('invoice-form')?.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleInvoiceSubmission();
                });
                
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
                
                if (businessType) {
                    const businessSelect = document.getElementById('business-type');
                    if (businessSelect) {
                        businessSelect.value = businessType;
                        this.handleBusinessTypeChange(businessType);
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
                    } else if (businessType === 'masonry') {
                        concreteSection.style.display = 'none';
                        masonrySection.style.display = 'block';
                    } else {
                        concreteSection.style.display = 'none';
                        masonrySection.style.display = 'none';
                    }
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Business Type Change');
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
                            <span class="status-badge status-${invoice.status}">${invoice.status}</span>
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
                if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
                    AppState.invoices = AppState.invoices.filter(inv => inv.id !== invoiceId);
                    this.saveData();
                    this.populateInvoiceList();
                    this.updateDashboard();
                    this.showSuccess('Invoice deleted successfully');
                }
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
        // TODO: Implement estimate calculator
        alert('Estimate calculator coming soon!');
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
            window.PDFGenerator.downloadCurrentInvoice();
        } else {
            alert('PDF functionality not available');
        }
    };
    
    // Add notification styles
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .error-notification,
        .success-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            display: none;
            animation: slideIn 0.3s ease-out;
        }
        
        .error-notification {
            border-left: 4px solid #dc3545;
        }
        
        .success-notification {
            border-left: 4px solid #28a745;
        }
        
        .error-content,
        .success-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
        }
        
        .error-content i {
            color: #dc3545;
            font-size: 1.2rem;
        }
        
        .success-content i {
            color: #28a745;
            font-size: 1.2rem;
        }
        
        .error-content button,
        .success-content button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: #666;
            margin-left: auto;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .invoice-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid #e0e0e0;
            transition: background-color 0.2s ease;
        }
        
        .invoice-item:hover {
            background-color: #f8f9fa;
        }
        
        .invoice-item:last-child {
            border-bottom: none;
        }
        
        .invoice-info h4 {
            margin-bottom: 0.5rem;
            color: #DC143C;
        }
        
        .invoice-info p {
            margin-bottom: 0.5rem;
            color: #666;
        }
        
        .invoice-date {
            color: #999;
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(notificationStyles);
    
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
    
})();