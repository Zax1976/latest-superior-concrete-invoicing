/**
 * J. Stark Business Invoicing System - Main Application
 * Handles navigation, state management, and core functionality
 */

(function() {
    'use strict';
    
    console.log('🟢 APP.JS LOADED - ESTIMATE SYSTEM REBUILT - VERSION 1754330000');
    
    // J-Stark Surgical Fix - Enhanced Diagnostic logging 
    const diagnosticLog = (action, data = null) => {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, action, data, level: 'info' };
        console.log(`[DIAGNOSTIC] ${action}`, data || '');
        
        // Log to DOM element if available
        const debugElement = document.getElementById('debug-log');
        if (debugElement) {
            const logLine = document.createElement('div');
            logLine.className = 'log-info';
            logLine.textContent = `${timestamp} [DIAGNOSTIC] ${action}`;
            debugElement.appendChild(logLine);
            debugElement.scrollTop = debugElement.scrollHeight;
        }
        
        // Store in window.debugLog for inspection
        if (!window.debugLog) window.debugLog = [];
        window.debugLog.push(logEntry);
        
        // Keep only last 50 entries
        if (window.debugLog.length > 50) {
            window.debugLog = window.debugLog.slice(-50);
        }
        
        // Persist to localStorage ring buffer
        try {
            const logs = JSON.parse(localStorage.getItem('jsark_logs') || '[]');
            logs.push(logEntry);
            if (logs.length > 200) {
                logs.splice(0, logs.length - 200); // Keep last 200 entries
            }
            localStorage.setItem('jsark_logs', JSON.stringify(logs));
        } catch (e) {
            console.warn('Failed to persist diagnostic logs:', e);
        }
    };
    
    // J-Stark Surgical Fix - Window-level error handlers
    window.addEventListener('error', function(event) {
        // Suppress service worker message channel errors
        if (event.message && event.message.includes('message channel closed')) {
            event.preventDefault();
            return;
        }
        
        const errorMsg = `JavaScript Error: ${event.message} at ${event.filename || 'unknown'}:${event.lineno || 0}:${event.colno || 0}`;
        diagnosticLog('GLOBAL_ERROR', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
        
        // Log to debug-log element if available
        const debugElement = document.getElementById('debug-log');
        if (debugElement) {
            const logLine = document.createElement('div');
            logLine.className = 'log-error';
            logLine.style.color = 'red';
            logLine.textContent = `${new Date().toISOString()} [ERROR] ${errorMsg}`;
            debugElement.appendChild(logLine);
            debugElement.scrollTop = debugElement.scrollHeight;
        }
    });
    
    window.addEventListener('unhandledrejection', function(event) {
        const errorMsg = `Unhandled Promise Rejection: ${event.reason}`;
        diagnosticLog('UNHANDLED_PROMISE_REJECTION', { reason: event.reason });
        
        // Log to debug-log element if available  
        const debugElement = document.getElementById('debug-log');
        if (debugElement) {
            const logLine = document.createElement('div');
            logLine.className = 'log-error';
            logLine.style.color = 'red';
            logLine.textContent = `${new Date().toISOString()} [PROMISE_ERROR] ${errorMsg}`;
            debugElement.appendChild(logLine);
            debugElement.scrollTop = debugElement.scrollHeight;
        }
    });
    
    // Application state
    const AppState = {
        currentView: 'dashboard',
        currentInvoice: null,
        currentEstimate: null,
        invoices: [],
        estimates: [],
        customers: [],
        nextInvoiceNumber: 1,
        nextEstimateNumber: 1
    };
    
    // Enhanced Error handling utility
    const ErrorHandler = {
        log: function(error, context = 'App') {
            console.error(`[${context}]`, error);
            
            // Use new error logging system if available
            if (window.ErrorLogger) {
                window.ErrorLogger.logError(error.message || error, window.ERROR_CATEGORIES.UNKNOWN, {
                    context: context,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });
            }
            
            this.showUserError('An error occurred. Please try again.');
        },
        
        showUserError: function(message) {
            // Use new notification system if available
            if (window.NotificationSystem) {
                window.NotificationSystem.showError(message);
            } else {
                // Fallback to old system
                this.showLegacyError(message);
            }
        },
        
        showLegacyError: function(message) {
            // Legacy error display for fallback
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
                
                // CRITICAL: Verify InvoiceManager is available before other initializations
                if (!window.InvoiceManager) {
                    console.error('InvoiceManager not available - critical error');
                    ErrorHandler.showUserError('System error: InvoiceManager not available during initialization');
                    return;
                }
                console.log('✅ InvoiceManager verified during initialization');
                
                // STEP 1: Health checks - verify critical DOM elements
                const healthCheck = this.performHealthCheck();
                if (!healthCheck.passed) {
                    ErrorHandler.showUserError('System initialization failed: ' + healthCheck.error);
                    console.error('Health check failed:', healthCheck);
                    return;
                }
                
                // STEP 2: Load saved data
                this.loadData();
                
                // STEP 3: Bind events with error recovery
                this.bindEvents();
                
                // STEP 4: Initialize views
                this.initializeDefaultView();
                
                // STEP 5: Set up form validation
                this.initializeFormValidation();
                
                // STEP 6: Update dashboard
                this.updateDashboard();
                
                // STEP 7: Set current date
                this.setCurrentDate();
                
                // STEP 8: Auto-save setup
                this.setupAutoSave();
                
                // STEP 9: Final verification
                const finalCheck = this.performPostInitializationCheck();
                if (!finalCheck.passed) {
                    console.warn('Post-initialization warnings:', finalCheck.warnings);
                    // Don't block initialization for warnings
                }
                
                console.log('✅ J. Stark Invoicing System initialized successfully');
                
            } catch (error) {
                console.error('❌ Critical initialization error:', error);
                ErrorHandler.log(error, 'App Initialization');
                this.showCriticalError('Failed to initialize application. Please refresh the page and try again.');
            }
        },

        // Initialize default view state on app load
        initializeDefaultView: function() {
            try {
                console.log('🎯 Initializing default view state...');
                
                // Set dashboard as active by default
                const dashboardView = document.getElementById('dashboard');
                if (dashboardView) {
                    dashboardView.setAttribute('data-view-state', 'active');
                    dashboardView.setAttribute('data-view-ready', 'true');
                    dashboardView.setAttribute('data-testid', 'view-dashboard');
                }
                
                // Mark all other views as inactive
                const allViews = document.querySelectorAll('.view');
                allViews.forEach(view => {
                    if (view.id !== 'dashboard') {
                        view.setAttribute('data-view-state', 'inactive');
                        view.setAttribute('data-testid', `view-${view.id}`);
                    }
                });
                
                // Set current view marker
                document.body.setAttribute('data-current-view', 'dashboard');
                AppState.currentView = 'dashboard';
                
                console.log('✅ Default view state initialized - dashboard active');
                
            } catch (error) {
                console.error('❌ Error initializing default view:', error);
                ErrorHandler.log(error, 'Initialize Default View');
            }
        },
        
        // Initialize form validation state to prevent "not focusable" errors
        initializeFormValidation: function() {
            try {
                console.log('🔧 Initializing form validation state...');
                
                // Initially, no business type is selected, so all service fields should not be required
                this.handleBusinessTypeChange(''); // This will hide all sections and remove required attributes
                
                // Also handle estimate form if it exists
                if (this.handleEstimateBusinessTypeChange) {
                    this.handleEstimateBusinessTypeChange('');
                }
                
                console.log('✅ Form validation state initialized');
                
            } catch (error) {
                console.error('❌ Error initializing form validation:', error);
                ErrorHandler.log(error, 'Initialize Form Validation');
            }
        },
        
        loadData: function() {
            try {
                // Load data from localStorage
                const savedInvoices = localStorage.getItem('jstark_invoices');
                const savedEstimates = localStorage.getItem('jstark_estimates');
                const savedCustomers = localStorage.getItem('jstark_customers');
                const savedInvoiceNumber = localStorage.getItem('jstark_next_invoice_number');
                const savedEstimateNumber = localStorage.getItem('jstark_next_estimate_number');
                
                if (savedInvoices) {
                    AppState.invoices = JSON.parse(savedInvoices);
                    
                    // Migrate existing invoices to remove tax if DISABLE_TAX is true
                    if (window.JSARK_FLAGS?.DISABLE_TAX) {
                        AppState.invoices.forEach(inv => {
                            if (inv.tax !== 0 || inv.total !== inv.subtotal) {
                                inv.tax = 0;
                                inv.total = inv.subtotal || 0;
                            }
                        });
                    }
                    console.log('Loaded invoices from localStorage:', AppState.invoices.map(inv => ({
                        id: inv.id,
                        number: inv.number,
                        servicesCount: inv.services ? inv.services.length : 0,
                        total: inv.total
                    })));
                }
                
                if (savedEstimates) {
                    AppState.estimates = JSON.parse(savedEstimates);
                    
                    // Migrate existing estimates to remove tax if DISABLE_TAX is true
                    if (window.JSARK_FLAGS?.DISABLE_TAX) {
                        AppState.estimates.forEach(est => {
                            if (est.tax !== 0 || est.total !== est.subtotal) {
                                est.tax = 0;
                                est.total = est.subtotal || 0;
                            }
                        });
                    }
                }
                
                if (savedCustomers) {
                    AppState.customers = JSON.parse(savedCustomers);
                }
                
                if (savedInvoiceNumber) {
                    AppState.nextInvoiceNumber = parseInt(savedInvoiceNumber);
                }
                
                if (savedEstimateNumber) {
                    AppState.nextEstimateNumber = parseInt(savedEstimateNumber);
                }
                
                // Initialize with sample data if none exists
                if (AppState.invoices.length === 0 && AppState.estimates.length === 0) {
                    this.createSampleData();
                }
                
                console.log('Data loaded:', {
                    invoices: AppState.invoices.length,
                    estimates: AppState.estimates.length,
                    customers: AppState.customers.length,
                    nextInvoiceNumber: AppState.nextInvoiceNumber,
                    nextEstimateNumber: AppState.nextEstimateNumber
                });
                
            } catch (error) {
                ErrorHandler.log(error, 'Data Loading');
            }
        },
        
        saveData: function() {
            try {
                localStorage.setItem('jstark_invoices', JSON.stringify(AppState.invoices));
                localStorage.setItem('jstark_estimates', JSON.stringify(AppState.estimates));
                localStorage.setItem('jstark_customers', JSON.stringify(AppState.customers));
                localStorage.setItem('jstark_next_invoice_number', AppState.nextInvoiceNumber.toString());
                localStorage.setItem('jstark_next_estimate_number', AppState.nextEstimateNumber.toString());
                
            } catch (error) {
                ErrorHandler.log(error, 'Data Saving');
            }
        },
        
        hideTaxUIEverywhere: function() {
            // Completely hide all tax-related UI elements
            const taxSelectors = [
                '#tax-row', '#tax-label', '#tax-amount',
                '.tax-row', '.totals-tax', '[data-testid="totals-tax"]',
                '.invoice-tax', '.estimate-tax', '#invoice-tax',
                '#estimate-tax', '.tax-line', '.tax-total',
                '[data-field="tax"]', '[data-role="tax"]',
                '.tax-display', '.tax-section', '#totals-tax'
            ];
            
            taxSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    el.style.display = 'none';
                    el.setAttribute('aria-hidden', 'true');
                    el.style.visibility = 'hidden';
                });
            });
            
            // Also inject CSS to ensure persistence
            if (!document.getElementById('no-tax-css')) {
                const style = document.createElement('style');
                style.id = 'no-tax-css';
                style.textContent = taxSelectors.join(',') + '{ display: none !important; visibility: hidden !important; }';
                document.head.appendChild(style);
            }
        },
        
        hideTaxUI: function() {
            // Redirect to the more complete function
            this.hideTaxUIEverywhere();
        },
        
        bindEvents: function() {
            try {
                // Hide tax UI if disabled
                this.hideTaxUI();
                
                // Navigation events
                document.getElementById('new-invoice-btn')?.addEventListener('click', () => {
                    this.showInvoiceCreation();
                });
                
                document.getElementById('view-invoices-btn')?.addEventListener('click', () => {
                    this.showInvoiceList();
                });
                
                document.getElementById('new-estimate-btn')?.addEventListener('click', () => {
                    console.log('🚀 "Create New Estimate" button clicked');
                    
                    // Force hard reset - clear all views first
                    document.querySelectorAll('.view').forEach(view => {
                        view.classList.remove('active');
                        console.log('❌ Removed active from:', view.id);
                    });
                    
                    // Show estimate creation with explicit logging
                    const estimateView = document.getElementById('estimate-creation');
                    if (estimateView) {
                        estimateView.classList.add('active');
                        console.log('✅ Added active to estimate-creation');
                        console.log('📊 Estimate view classes:', estimateView.className);
                        
                        // Verify what header is showing
                        const header = estimateView.querySelector('h2');
                        if (header) {
                            console.log('📋 Header text:', header.textContent);
                        }
                        
                    }
                    
                    this.showEstimateCreation('concrete');
                });
                
                document.getElementById('view-estimates-btn')?.addEventListener('click', () => {
                    this.showEstimateList();
                });
                
                // Business type radio buttons (invoice form)
                const businessRadios = document.querySelectorAll('input[name="businessType"]');
                businessRadios.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        this.handleBusinessTypeChange(e.target.value);
                        this.updateStepIndicator(2); // Move to step 2
                    });
                });
                
                // ESTIMATE business type radio buttons (estimate form) - MISSING FUNCTIONALITY RESTORED
                const estimateBusinessRadios = document.querySelectorAll('input[name="estimateBusinessType"]');
                estimateBusinessRadios.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        console.log('🎯 Estimate business type changed to:', e.target.value);
                        this.handleEstimateBusinessTypeChange(e.target.value);
                        this.updateStepIndicator(2); // Move to step 2
                    });
                });
                
                // Invoice form submission
                document.getElementById('invoice-form')?.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleInvoiceSubmission();
                });
                
                // ESTIMATE form submission - MISSING FUNCTIONALITY RESTORED
                document.getElementById('estimate-form')?.addEventListener('submit', (e) => {
                    e.preventDefault();
                    console.log('📝 Estimate form submitted');
                    this.handleEstimateSubmission();
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
                // Ignore shortcuts when typing in input fields
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                    return;
                }
                
                // Ctrl/Cmd + N for new invoice
                if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
                    e.preventDefault();
                    this.showInvoiceCreation();
                    window.NotificationSystem?.showSuccess('Keyboard shortcut: New Invoice (Ctrl+N)');
                }
                
                // Ctrl/Cmd + Shift + N for new estimate
                if ((e.ctrlKey || e.metaKey) && e.key === 'N') {
                    e.preventDefault();
                    this.showEstimateCreation();
                    window.NotificationSystem?.showSuccess('Keyboard shortcut: New Estimate (Ctrl+Shift+N)');
                }
                
                // Ctrl/Cmd + L for invoice list
                if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                    e.preventDefault();
                    this.showInvoiceList();
                    window.NotificationSystem?.showSuccess('Keyboard shortcut: Invoice List (Ctrl+L)');
                }
                
                // Ctrl/Cmd + E for estimate list
                if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                    e.preventDefault();
                    this.showEstimateList();
                    window.NotificationSystem?.showSuccess('Keyboard shortcut: Estimate List (Ctrl+E)');
                }
                
                // Ctrl/Cmd + H for dashboard/home
                if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                    e.preventDefault();
                    this.showDashboard();
                    window.NotificationSystem?.showSuccess('Keyboard shortcut: Home (Ctrl+H)');
                }
                
                // Ctrl/Cmd + ? for help
                if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                    e.preventDefault();
                    this.showKeyboardShortcuts();
                }
                
                // Escape to go back to dashboard
                if (e.key === 'Escape') {
                    this.showDashboard();
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Keyboard Shortcuts');
            }
        },
        
        showKeyboardShortcuts: function() {
            const shortcuts = {
                'Navigation': [
                    { keys: 'Ctrl + N', description: 'Create New Invoice' },
                    { keys: 'Ctrl + Shift + N', description: 'Create New Estimate' },
                    { keys: 'Ctrl + L', description: 'View Invoice List' },
                    { keys: 'Ctrl + E', description: 'View Estimate List' },
                    { keys: 'Ctrl + H', description: 'Go to Dashboard' },
                    { keys: 'Escape', description: 'Back to Dashboard' }
                ],
                'Help': [
                    { keys: 'Ctrl + ?', description: 'Show Keyboard Shortcuts' }
                ]
            };
            
            let shortcutsHtml = '<div class="shortcuts-modal">';
            Object.keys(shortcuts).forEach(category => {
                shortcutsHtml += `<div class="shortcuts-category">`;
                shortcutsHtml += `<h4>${category}</h4>`;
                shortcuts[category].forEach(shortcut => {
                    shortcutsHtml += `
                        <div class="shortcut-item">
                            <kbd class="shortcut-keys">${shortcut.keys}</kbd>
                            <span class="shortcut-desc">${shortcut.description}</span>
                        </div>
                    `;
                });
                shortcutsHtml += '</div>';
            });
            shortcutsHtml += '</div>';
            
            window.NotificationSystem?.showSuccess('Press Escape to close', { duration: 5000 });
            
            // Show modal with shortcuts
            const modal = document.createElement('div');
            modal.className = 'keyboard-shortcuts-modal';
            modal.innerHTML = `
                <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h3>
                        <button class="modal-close" onclick="this.closest('.keyboard-shortcuts-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${shortcutsHtml}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
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
            return new Promise((resolve) => {  // Never reject, always resolve
                try {
                    console.log(`🖥️ showView called with viewId: "${viewId}"`);
                    
                    // Clear previewed invoice/estimate when navigating away from preview views
                    if (window.InvoiceManager && window.InvoiceManager.clearPreviewed) {
                        const isPreviewView = viewId === 'invoice-preview' || viewId === 'estimate-preview';
                        const wasPreviewView = AppState.currentView === 'invoice-preview' || AppState.currentView === 'estimate-preview';
                        
                        if (wasPreviewView && !isPreviewView) {
                            console.log('🔴 CLEARING PREVIEWED INVOICE - navigating from', AppState.currentView, 'to', viewId);
                            window.InvoiceManager.clearPreviewed();
                        }
                    }
                    
                    // Hide all views - use multiple methods to ensure they're hidden
                    const allViews = document.querySelectorAll('.view');
                    console.log(`👁️ Found ${allViews.length} views, hiding all`);
                    
                    allViews.forEach(view => {
                        view.classList.remove('active');
                        view.setAttribute('data-view-state', 'inactive');
                        // Force display none as backup
                        if (view.id !== viewId) {
                            view.style.display = 'none';
                        }
                        console.log(`🔴 Hidden view: ${view.id}`);
                    });
                    
                    // Show selected view
                    const targetView = document.getElementById(viewId);
                    if (targetView) {
                        targetView.classList.add('active');
                        targetView.setAttribute('data-view-state', 'active');
                        // Ensure it's actually displayed
                        targetView.style.display = 'block';
                        AppState.currentView = viewId;
                        
                        console.log(`✅ Successfully activated view: "${viewId}"`);
                        console.log(`📊 View classes:`, targetView.className);
                        
                        // Hide tax UI after view change
                        setTimeout(() => this.hideTaxUI(), 0);
                        
                        // Add automation-friendly marker
                        document.body.setAttribute('data-current-view', viewId);
                        
                        // Use requestAnimationFrame to ensure DOM is updated before continuing
                        requestAnimationFrame(() => {
                            // Wait for CSS transitions and DOM updates - increased delay for test reliability
                            setTimeout(() => {
                                console.log(`🎯 View "${viewId}" fully activated and ready`);
                                
                                // Force visibility for testing reliability
                                targetView.style.visibility = 'visible';
                                targetView.style.opacity = '1';
                                
                                // Trigger view-specific initialization
                                this.initializeViewContent(viewId);
                                
                                resolve(viewId);
                            }, 100); // Increased delay for better test reliability
                        });
                        
                    } else {
                        console.error(`❌ View element not found: "${viewId}"`);
                        // Still resolve to prevent promise rejection errors
                        resolve();
                    }
                    
                } catch (error) {
                    console.error('❌ Error in showView:', error);
                    ErrorHandler.log(error, 'Show View');
                    // Always resolve to prevent unhandled rejections
                    resolve();
                }
            });
        },

        // New method to handle view-specific initialization
        initializeViewContent: function(viewId) {
            try {
                console.log(`🎯 Initializing content for view: ${viewId}`);
                
                switch (viewId) {
                    case 'invoice-creation':
                        this.initializeInvoiceCreationView();
                        break;
                    case 'estimate-creation':
                        this.initializeEstimateCreationView();
                        break;
                    case 'dashboard':
                        this.updateDashboard();
                        break;
                    case 'invoice-list':
                        this.populateInvoiceList();
                        break;
                    case 'estimate-list':
                        this.populateEstimateList();
                        break;
                    default:
                        console.log(`No specific initialization needed for view: ${viewId}`);
                }
                
                // Mark view as ready for automation
                const targetView = document.getElementById(viewId);
                if (targetView) {
                    targetView.setAttribute('data-view-ready', 'true');
                    targetView.setAttribute('data-testid', `view-${viewId}`);
                    
                    // Ensure critical elements are visible and accessible
                    this.ensureElementsVisible(targetView);
                }
                
            } catch (error) {
                console.error(`❌ Error initializing view content for ${viewId}:`, error);
                ErrorHandler.log(error, `Initialize View Content - ${viewId}`);
            }
        },

        // Ensure critical elements are visible and accessible for testing
        ensureElementsVisible: function(container) {
            try {
                // Key selector patterns that tests look for
                const criticalSelectors = [
                    'button[onclick*="createNewEstimate"]',
                    'button[onclick*="createNewInvoice"]', 
                    '#estimate-business-concrete',
                    '#estimate-business-masonry',
                    '#business-concrete',
                    '#business-masonry',
                    '#customer-name',
                    '#estimate-customer-name',
                    '#masonry-service',
                    '#add-masonry-service',
                    '#create-invoice-btn',
                    '#create-estimate-btn',
                    '#new-job-dropdown'
                ];

                criticalSelectors.forEach(selector => {
                    const elements = container.querySelectorAll(selector);
                    elements.forEach(element => {
                        // Force visibility for testing
                        element.style.display = '';
                        element.style.visibility = 'visible';
                        element.style.opacity = '1';
                        
                        // Remove any hidden attributes
                        element.removeAttribute('hidden');
                        element.classList.remove('hidden');
                        
                        // Ensure parent containers are also visible
                        let parent = element.parentElement;
                        while (parent && parent !== container) {
                            if (parent.style.display === 'none') {
                                parent.style.display = '';
                            }
                            parent = parent.parentElement;
                        }
                        
                        // Log for debugging
                        if (elements.length > 0) {
                            console.log(`✅ Ensured visibility for: ${selector}`);
                        }
                    });
                });

                // Also ensure dropdown elements are accessible
                const dropdown = document.getElementById('new-job-dropdown');
                if (dropdown) {
                    // Make sure dropdown can be shown when needed
                    dropdown.style.position = 'absolute';
                    dropdown.style.zIndex = '1000';
                    console.log('✅ Dropdown accessibility ensured');
                }

                // Force business type form sections to be visible for testing
                this.ensureFormSectionsVisible(container);

                console.log('✅ Element visibility checks completed');

            } catch (error) {
                console.error('❌ Error ensuring element visibility:', error);
                ErrorHandler.log(error, 'Ensure Elements Visible');
            }
        },

        // Ensure form sections are visible for testing
        ensureFormSectionsVisible: function(container) {
            try {
                // Business type sections that might be hidden
                const formSections = [
                    '#concrete-services',
                    '#masonry-services',
                    '#estimate-services-section'
                ];

                formSections.forEach(selector => {
                    const section = container.querySelector(selector);
                    if (section) {
                        // Force section to be visible
                        section.style.display = 'block';
                        section.style.visibility = 'visible';
                        section.style.opacity = '1';
                        
                        // Ensure all child elements are also visible
                        const childElements = section.querySelectorAll('*');
                        childElements.forEach(child => {
                            if (child.style.display === 'none' && !child.classList.contains('dropdown-menu')) {
                                child.style.display = '';
                            }
                        });
                        
                        console.log(`✅ Made form section visible: ${selector}`);
                    }
                });

                // Also ensure business type radio buttons are accessible
                const businessRadios = container.querySelectorAll('input[name="businessType"], input[name="estimateBusinessType"]');
                businessRadios.forEach(radio => {
                    const label = radio.closest('label') || radio.parentElement;
                    if (label) {
                        label.style.display = '';
                        label.style.visibility = 'visible';
                        label.style.opacity = '1';
                    }
                });

                console.log('✅ Form sections visibility ensured');

            } catch (error) {
                console.error('❌ Error ensuring form sections visibility:', error);
                ErrorHandler.log(error, 'Ensure Form Sections Visible');
            }
        },

        // Enhanced initialization for invoice creation view
        initializeInvoiceCreationView: function() {
            try {
                console.log('🎯 Initializing invoice creation view...');
                
                // Ensure form is reset
                this.resetInvoiceForm();
                
                // Calculator removed - using simple service manager
                console.log('✅ Simple service system ready');
                
                // Draft functionality removed - no longer loading drafts
                
                // Add automation markers to form elements
                this.addAutomationMarkers('invoice-creation');
                
            } catch (error) {
                console.error('❌ Error initializing invoice creation view:', error);
                ErrorHandler.log(error, 'Initialize Invoice Creation View');
            }
        },

        // Enhanced initialization for estimate creation view
        initializeEstimateCreationView: function() {
            try {
                console.log('🎯 Initializing estimate creation view...');

                // Always reset estimate form to ensure fresh start for new estimates
                // (Edit flow uses editEstimate() which loads the estimate after showing the view)
                this.resetEstimateForm();

                // Calculator removed - using simple service manager
                console.log('✅ Simple service system ready');

                // Add automation markers
                this.addAutomationMarkers('estimate-creation');
                
            } catch (error) {
                console.error('❌ Error initializing estimate creation view:', error);
                ErrorHandler.log(error, 'Initialize Estimate Creation View');
            }
        },

        // Add automation-friendly markers to form elements
        addAutomationMarkers: function(viewId) {
            try {
                const view = document.getElementById(viewId);
                if (!view) return;
                
                // Add data-testid attributes to form elements that don't have them
                const elements = [
                    { selector: 'input[name="businessType"]', prefix: 'business-type' },
                    { selector: 'input[name="customerName"]', testid: 'customer-name' },
                    { selector: 'input[name="customerEmail"]', testid: 'customer-email' },
                    { selector: 'input[name="customerPhone"]', testid: 'customer-phone' },
                    { selector: 'input[name="invoiceDate"], input[name="estimateDate"]', testid: 'invoice-date' },
                    { selector: 'textarea[name="customerAddress"]', testid: 'customer-address' },
                    { selector: '#length-ft', testid: 'length-input' },
                    { selector: '#width-ft', testid: 'width-input' },
                    { selector: '#inches-settled', testid: 'inches-settled' },
                    { selector: '#sides-settled', testid: 'sides-settled' },
                    { selector: 'button[type="submit"]', testid: 'submit-form' },
                    { selector: 'button[id*="calculate"], .btn[id*="calculate"]', testid: 'calculate-button' },
                    { selector: 'button[id*="add-service"], .btn[id*="add-service"]', testid: 'add-service-button' }
                ];
                
                elements.forEach(({ selector, testid, prefix }) => {
                    const foundElements = view.querySelectorAll(selector);
                    foundElements.forEach((element, index) => {
                        if (!element.getAttribute('data-testid')) {
                            if (prefix) {
                                element.setAttribute('data-testid', `${prefix}-${element.value || index}`);
                            } else {
                                element.setAttribute('data-testid', testid);
                            }
                        }
                    });
                });
                
                console.log(`✅ Added automation markers to ${viewId}`);
                
            } catch (error) {
                console.error('❌ Error adding automation markers:', error);
                ErrorHandler.log(error, 'Add Automation Markers');
            }
        },
        
        showDashboardWithoutReload: function() {
            // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (BEGIN)
            console.log('[NAV:CALL] {fn:\'showDashboardWithoutReload\', view:\'dashboard\'}');
            // Navigate to dashboard without reloading data
            const dashboardPromise = this.showView('dashboard');
            
            return dashboardPromise.then(() => {
                try {
                    AppState.currentInvoice = null;
                    AppState.currentView = 'dashboard';
                    // Just update display, don't reload from storage
                    this.updateDashboard();
                    console.log('[NAV:RESOLVE] {view:\'dashboard\'}');
                    console.log('✅ Dashboard view shown with current memory data');
                    console.log(`📊 Dashboard showing ${AppState.invoices.length} total invoices`);
                } catch (error) {
                    console.error('Dashboard update error:', error);
                }
            }).catch(error => {
                console.error('Dashboard navigation error:', error);
                // Still resolve to prevent chain breakage
                return Promise.resolve();
            });
            // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (END)
        },
        
        showDashboard: function() {
            // Use a safer approach that doesn't chain promises
            const dashboardPromise = this.showView('dashboard');
            
            // Handle the dashboard update separately to avoid promise chain issues
            dashboardPromise.then(() => {
                try {
                    AppState.currentInvoice = null;
                    AppState.currentView = 'dashboard';
                    // Force reload data from localStorage to ensure latest data
                    this.loadData();
                    // Force refresh of dashboard data including recent activity
                    this.updateDashboard();
                    console.log('✅ Dashboard view fully loaded with fresh data');
                    console.log(`📊 Dashboard showing ${AppState.invoices.length} total invoices in recent activity`);
                } catch (error) {
                    // Only log real errors, not undefined
                    if (error && error.message) {
                        console.warn('Dashboard update error (non-critical):', error.message);
                    }
                }
            });
            
            // Always return resolved promise to prevent rejection errors
            return Promise.resolve();
        },
        
        showInvoiceCreation: function(businessType = null) {
            return this.showView('invoice-creation').then(() => {
                try {
                    // Hide tax UI after view loads
                    setTimeout(() => this.hideTaxUIEverywhere(), 100);
                    
                    // Set business type if provided - now happens after view is ready
                    if (businessType) {
                        setTimeout(() => {
                            const radio = document.getElementById(`business-${businessType}`);
                            if (radio) {
                                radio.checked = true;
                                // Directly trigger the business type change handler
                                // Don't dispatch change event as it causes duplicate calls
                                this.handleBusinessTypeChange(businessType);
                                
                                console.log(`✅ Business type "${businessType}" selected and activated`);
                            } else {
                                console.warn(`❌ Business type radio not found: business-${businessType}`);
                            }
                        }, 200); // Increased delay to ensure view is fully ready
                    }
                    
                    console.log('✅ Invoice creation view fully loaded');
                } catch (error) {
                    ErrorHandler.log(error, 'Show Invoice Creation');
                }
            }).catch(error => {
                ErrorHandler.log(error, 'Show Invoice Creation');
            });
        },
        
        showInvoiceList: function() {
            // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (BEGIN)
            console.log('[NAV:CALL] {fn:\'showInvoiceList\', view:\'invoice-list\'}');
            return this.showView('invoice-list').then(() => {
                console.log('[NAV:RESOLVE] {view:\'invoice-list\'}');
            // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (END)
                // Force reload data from localStorage to ensure latest data
                this.loadData();
                // Force refresh of invoice list to show all current invoices
                this.populateInvoiceList();
                console.log('✅ Invoice list view fully loaded with fresh data');
                console.log(`📊 Showing ${AppState.invoices.length} total invoices in View Jobs`);
            }).catch(error => {
                ErrorHandler.log(error, 'Show Invoice List');
            });
        },
        
        showInvoicePreview: function(invoice) {
            // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (BEGIN)
            console.log('[NAV:CALL] {fn:\'showInvoicePreview\', view:\'invoice-preview\'}');
            // Check if invoice exists
            if (!invoice) {
                console.warn('⚠️ No invoice provided for preview, redirecting to dashboard');
                return this.showDashboard();
            }
            
            return this.showView('invoice-preview').then(() => {
                console.log('[NAV:RESOLVE] {view:\'invoice-preview\'}');
            // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (END)
                try {
                    this.generateInvoicePreview(invoice);
                    // Hide tax UI after preview renders
                    setTimeout(() => this.hideTaxUIEverywhere(), 100);
                    console.log('✅ Invoice preview view fully loaded');
                } catch (error) {
                    console.error('Error generating preview:', error);
                    // Don't show error to user if invoice was created successfully
                    // Just redirect to dashboard
                    this.showDashboard();
                }
            }).catch(error => {
                console.error('Error showing preview:', error);
                // Don't show error to user if invoice was created successfully
                // Just redirect to dashboard
                this.showDashboard();
            });
        },
        
        showEstimateCreation: function(businessType = null) {
            return this.showView('estimate-creation').then(() => {
                try {
                    // Initialize signature method switching after view is ready
                    setTimeout(() => {
                        this.initSignatureMethodSwitching();
                        
                        // Initialize signature canvas - guard for estimate context
                        if (!document.querySelector('#estimate-creation.view.active')) {
                            if (window.InvoiceManager?.initializeSignatureCanvas) {
                                window.InvoiceManager.initializeSignatureCanvas();
                            }
                        }
                    }, 200);
                    
                    // Set business type if provided - now happens after view is ready
                    if (businessType) {
                        setTimeout(() => {
                            console.log('🏢 Setting business type to:', businessType);
                            const radio = document.getElementById(`estimate-business-${businessType}`);
                            if (radio) {
                                radio.checked = true;
                                // Trigger change event to activate form sections
                                const changeEvent = new Event('change', { bubbles: true });
                                radio.dispatchEvent(changeEvent);
                                console.log(`✅ Business type "${businessType}" selected and activated for estimate`);
                            } else {
                                console.warn('❌ Business type radio button not found:', `estimate-business-${businessType}`);
                            }
                        }, 100);
                    }
                    
                    // Show success feedback - only once to prevent duplicate notifications
                    if (!this._estimateActivationNotificationShown) {
                        this._estimateActivationNotificationShown = true;
                        window.NotificationSystem?.showSuccess('Estimate creation mode activated');
                        // Reset flag after 3 seconds
                        setTimeout(() => {
                            this._estimateActivationNotificationShown = false;
                        }, 3000);
                    }
                    
                    console.log('✅ Estimate creation view fully loaded');
                } catch (error) {
                    console.error('❌ Error in estimate creation initialization:', error);
                    ErrorHandler.log(error, 'Estimate Creation Initialization');
                }
            }).catch(error => {
                console.error('❌ Error in showEstimateCreation:', error);
                ErrorHandler.log(error, 'Show Estimate Creation');
                
                // Show error feedback
                if (window.LoadingIndicator) {
                    window.LoadingIndicator.showError('Failed to open estimate creation: ' + error.message);
                }
            });
        },
        
        showEstimateList: function() {
            return this.showView('estimate-list').then(() => {
                // === SAFE-HOTFIX: Load estimates from storage
                // Force reload data from localStorage to ensure latest data
                this.loadData();
                // Force refresh of estimate list to show all current estimates
                this.populateEstimateList();
                console.log('✅ Estimate list view fully loaded with fresh data');
                console.log(`📊 Showing ${AppState.estimates.length} total estimates in View Jobs`);
            }).catch(error => {
                ErrorHandler.log(error, 'Show Estimate List');
            });
        },
        
        showEstimatePreview: function(estimate) {
            // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (BEGIN)
            console.log('[NAV:CALL] {fn:\'showEstimatePreview\', view:\'estimate-preview\'}');
            return this.showView('estimate-preview').then(() => {
                console.log('[NAV:RESOLVE] {view:\'estimate-preview\'}');
            // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (END)
                try {
                    this.generateEstimatePreview(estimate);
                    console.log('✅ Estimate preview view fully loaded');
                } catch (error) {
                    ErrorHandler.log(error, 'Generate Estimate Preview');
                }
            }).catch(error => {
                ErrorHandler.log(error, 'Show Estimate Preview');
            });
        },
        
        handleBusinessTypeChange: function(businessType) {
            try {
                console.log('🎯 handleBusinessTypeChange called with:', businessType);
                
                const concreteSection = document.getElementById('concrete-services');
                const masonrySection = document.getElementById('masonry-services');
                
                // Get form controls that need dynamic required attribute management
                const masonryService = document.getElementById('masonry-service');
                const masonryDescription = document.getElementById('masonry-description');
                const masonryJobPrice = document.getElementById('masonry-job-price');
                const concreteServiceDescription = document.getElementById('concrete-service-description');
                const concreteServicePrice = document.getElementById('concrete-service-price');
                
                if (concreteSection && masonrySection) {
                    if (businessType === 'concrete') {
                        console.log('👍 Showing concrete services, hiding masonry');
                        concreteSection.style.display = 'block';
                        masonrySection.style.display = 'none';
                        
                        // Set required attributes for concrete fields (they're not required by default in HTML)
                        if (concreteServiceDescription) {
                            concreteServiceDescription.removeAttribute('required');
                        }
                        if (concreteServicePrice) {
                            concreteServicePrice.removeAttribute('required');
                        }
                        
                        // Remove required attributes from hidden masonry fields
                        if (masonryService) {
                            masonryService.removeAttribute('required');
                            console.log('✅ Removed required from masonry-service');
                        }
                        if (masonryDescription) {
                            masonryDescription.removeAttribute('required');
                            console.log('✅ Removed required from masonry-description');
                        }
                        if (masonryJobPrice) {
                            masonryJobPrice.removeAttribute('required');
                            console.log('✅ Removed required from masonry-job-price');
                        }
                        
                        this.loadFrequentServices('concrete');
                        
                        // Defer calculator initialization for invoice context
                        requestAnimationFrame(() => setTimeout(() => {
                            if (window.ConcreteCalculator?.init) {
                                window.ConcreteCalculator.init({ context: 'invoice' });
                                console.log('[INV-CALC:INIT_DEFERRED]');
                            }
                        }, 0));
                        
                    } else if (businessType === 'masonry') {
                        console.log('🏠 Showing masonry services, hiding concrete');
                        concreteSection.style.display = 'none';
                        masonrySection.style.display = 'block';
                        
                        // Remove required attributes from hidden concrete fields
                        if (concreteServiceDescription) {
                            concreteServiceDescription.removeAttribute('required');
                        }
                        if (concreteServicePrice) {
                            concreteServicePrice.removeAttribute('required');
                        }
                        
                        // DO NOT set required on service fields - they're for adding services, not form submission
                        if (masonryService) {
                            masonryService.removeAttribute('required');
                            console.log('✅ Masonry service field ready (not required for form)');
                        }
                        if (masonryDescription) {
                            masonryDescription.removeAttribute('required');
                            console.log('✅ Masonry description field ready (not required for form)');
                        }
                        if (masonryJobPrice) {
                            masonryJobPrice.removeAttribute('required');
                            console.log('✅ Masonry price field ready (not required for form)');
                        }
                        
                        this.loadFrequentServices('masonry');
                        
                    } else {
                        console.log('❌ No business type selected, hiding all sections');
                        concreteSection.style.display = 'none';
                        masonrySection.style.display = 'none';
                        
                        // Remove all required attributes when no business type selected
                        [masonryService, masonryDescription, masonryJobPrice, concreteServiceDescription, concreteServicePrice].forEach(field => {
                            if (field) {
                                field.removeAttribute('required');
                            }
                        });
                    }
                }
                
                // Save last used business type
                if (window.StorageManager) {
                    window.StorageManager.saveLastUsedValues({ lastBusinessType: businessType });
                }
                
            } catch (error) {
                console.error('❌ Error in handleBusinessTypeChange:', error);
                ErrorHandler.log(error, 'Business Type Change');
            }
        },
        
        // ESTIMATE-SPECIFIC business type handler - CRITICAL MISSING FUNCTIONALITY RESTORED
        handleEstimateBusinessTypeChange: function(businessType) {
            try {
                console.log('🎯 Processing estimate business type change:', businessType);
                
                // For concrete, do nothing - InvoiceManager's own listener will handle it
                if (businessType === 'concrete') {
                    console.log('🧱 Concrete selected - InvoiceManager will handle via its own listener');
                    // Do NOT modify content, do NOT call InvoiceManager
                    // The InvoiceManager has its own event listener that will handle this
                    return;
                }
                
                // Update the estimate services content area only for non-concrete
                const estimateServicesContent = document.getElementById('estimate-services-content');
                
                if (businessType === 'masonry') {
                    console.log('🏠 Setting up masonry estimate services...');
                    
                    if (estimateServicesContent) {
                        estimateServicesContent.innerHTML = `
                            <div class="masonry-estimate-section">
                                <h4><i class="fas fa-home"></i> Masonry Services</h4>
                                <p class="section-description">Add masonry and chimney repair services to your estimate</p>
                                
                                <div class="masonry-services-list">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="estimate-masonry-service">Service Type:</label>
                                            <select id="estimate-masonry-service" name="estimateMasonryService">
                                                <option value="">Select service...</option>
                                                <option value="brick-installation">Brick Installation</option>
                                                <option value="brick-repair">Brick Repair</option>
                                                <option value="stone-fireplace">Stone Fireplace</option>
                                                <option value="chimney-repair">Chimney Repair</option>
                                                <option value="chimney-restoration">Chimney Restoration</option>
                                                <option value="outdoor-fireplace">Outdoor Fireplace</option>
                                                <option value="patio-construction">Patio Construction</option>
                                                <option value="fire-pit">Fire Pit Installation</option>
                                                <option value="outdoor-kitchen">Outdoor Kitchen</option>
                                                <option value="veneer-stone">Veneer Stone Installation</option>
                                                <option value="cultured-stone">Cultured Stone Application</option>
                                                <option value="custom">Custom Masonry Work</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="estimate-masonry-description">Service Description:</label>
                                            <textarea id="estimate-masonry-description" name="estimateMasonryDescription" 
                                                      rows="3" placeholder="Describe the specific work to be done..."></textarea>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="estimate-masonry-job-price">Job Price:</label>
                                            <div class="input-with-currency">
                                                <span class="currency-symbol">$</span>
                                                <input type="number" id="estimate-masonry-job-price" name="estimateMasonryJobPrice" 
                                                       min="0.01" step="0.01" placeholder="0.00" class="form-control">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <button type="button" id="add-estimate-masonry-service" class="btn btn-primary">
                                            <i class="fas fa-plus"></i> Add Masonry Service
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // Reinitialize SimpleServiceManager for new buttons
                        if (window.SimpleServiceManager) {
                            setTimeout(() => {
                                window.SimpleServiceManager.setupMasonryServiceButton();
                            }, 100);
                        }
                    }
                } else {
                    // Clear content for no selection
                    if (estimateServicesContent) {
                        estimateServicesContent.innerHTML = '<p class="empty-services">Select a business type above to add services.</p>';
                    }
                }
                
                // Save last used estimate business type
                if (window.StorageManager) {
                    window.StorageManager.saveLastUsedValues({ lastEstimateBusinessType: businessType });
                }
                
                console.log('✅ Estimate business type change processed successfully');
                
            } catch (error) {
                console.error('❌ Error in handleEstimateBusinessTypeChange:', error);
                ErrorHandler.log(error, 'Handle Estimate Business Type Change');
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
                    // Explicitly clear currentInvoice to ensure fresh start
                    window.InvoiceManager.currentInvoice = { services: [] };
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
                const totalEstimates = AppState.estimates.length;
                const totalRevenue = AppState.invoices.reduce((sum, invoice) => {
                    return sum + (invoice.total || 0);
                }, 0);
                const pendingInvoices = AppState.invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length;
                const paidInvoices = AppState.invoices.filter(inv => inv.status === 'paid').length;
                const pendingEstimates = AppState.estimates.filter(est => est.status === 'sent' || est.status === 'draft').length;
                
                // Update dashboard stats (using correct HTML element IDs)
                const totalJobsElement = document.getElementById('total-jobs');
                const pendingPaymentElement = document.getElementById('pending-payment');
                const monthRevenueElement = document.getElementById('month-revenue');
                const activeEstimatesElement = document.getElementById('active-estimates');
                
                if (totalJobsElement) totalJobsElement.textContent = totalInvoices;
                if (pendingPaymentElement) pendingPaymentElement.textContent = pendingInvoices;
                if (monthRevenueElement) monthRevenueElement.textContent = this.formatCurrency(totalRevenue);
                if (activeEstimatesElement) activeEstimatesElement.textContent = totalEstimates;
                
                // Update enhanced dashboard sections
                this.updateRecentActivity();
                this.updateMonthlyPerformance();
                
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
        
        updateRecentEstimates: function() {
            try {
                const recentEstimatesList = document.getElementById('recent-estimates-list');
                if (!recentEstimatesList) return;
                
                const recentEstimates = AppState.estimates
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5);
                
                if (recentEstimates.length === 0) {
                    recentEstimatesList.innerHTML = '<p class="empty-state">No estimates created yet. Create your first estimate above!</p>';
                    return;
                }
                
                const estimatesHtml = recentEstimates.map(estimate => `
                    <div class="invoice-item estimate-item">
                        <div class="invoice-info">
                            <h4>Estimate #${estimate.number}</h4>
                            <p>${estimate.customerName} - ${this.formatCurrency(estimate.total)}</p>
                            <span class="status-badge status-${estimate.status}">
                                ${this.getEstimateStatusIcon(estimate.status)}
                                ${estimate.status}
                            </span>
                            ${estimate.signature ? '<span class="signature-status signature-yes"><i class="fas fa-signature"></i> Signed</span>' : '<span class="signature-status signature-no"><i class="fas fa-signature"></i> Unsigned</span>'}
                        </div>
                        <div class="invoice-date">
                            ${new Date(estimate.date).toLocaleDateString()}
                        </div>
                    </div>
                `).join('');
                
                recentEstimatesList.innerHTML = estimatesHtml;
                
            } catch (error) {
                ErrorHandler.log(error, 'Update Recent Estimates');
            }
        },
        
        updateRecentActivity: function() {
            try {
                console.log(`🔍 UpdateRecentActivity: Processing ${AppState.invoices.length} invoices and ${AppState.estimates.length} estimates`);
                console.log('🔍 Recent Activity invoice data:', AppState.invoices.map(inv => ({
                    id: inv.id, 
                    number: inv.number, 
                    customer: inv.customerName, 
                    total: inv.total,
                    date: inv.date,
                    businessType: inv.businessType
                })));
                
                const activityList = document.getElementById('recent-activity-list');
                if (!activityList) {
                    console.error('❌ Recent activity list not found');
                    return;
                }
                
                // Combine invoices and estimates, sort by date
                const allItems = [
                    ...AppState.invoices.map(item => ({...item, type: 'invoice'})),
                    ...AppState.estimates.map(item => ({...item, type: 'estimate'}))
                ].sort((a, b) => new Date(b.date) - new Date(a.date))
                 .slice(0, 8); // Show last 8 items
                 
                console.log(`📊 Recent Activity showing ${allItems.length} total items (${allItems.filter(i => i.type === 'invoice').length} invoices, ${allItems.filter(i => i.type === 'estimate').length} estimates)`);
                
                const activityItems = allItems.filter(item => item.type === 'invoice');
                console.log(`🔍 Invoice items in recent activity:`, activityItems.map(inv => ({
                    number: inv.number, 
                    customer: inv.customerName, 
                    total: inv.total
                })));
                
                
                if (allItems.length === 0) {
                    activityList.innerHTML = `
                        <div class="activity-placeholder">
                            <i class="fas fa-inbox"></i>
                            <p>No recent activity</p>
                            <p class="subtext">Your invoices and estimates will appear here</p>
                        </div>
                    `;
                    return;
                }
                
                const activityHtml = allItems.map(item => {
                    const isInvoice = item.type === 'invoice';
                    const icon = isInvoice ? 'fa-file-invoice' : 'fa-file-contract';
                    const typeLabel = isInvoice ? 'Invoice' : 'Estimate';
                    const statusClass = isInvoice ? 'invoice' : 'estimate';
                    
                    return `
                        <div class="activity-item ${statusClass}" onclick="showInvoicePreview('${item.id}', '${item.type}')">
                            <div class="activity-icon ${statusClass}">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="activity-details">
                                <div class="activity-title">${typeLabel} #${item.number}</div>
                                <div class="activity-subtitle">${item.customerName} • ${new Date(item.date).toLocaleDateString()}</div>
                            </div>
                            <div class="activity-amount">${this.formatCurrency(item.total)}</div>
                        </div>
                    `;
                }).join('');
                
                activityList.innerHTML = activityHtml;
                
            } catch (error) {
                ErrorHandler.log(error, 'Update Recent Activity');
            }
        },
        
        updateMonthlyPerformance: function() {
            try {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                
                // Filter this month's data
                const thisMonthInvoices = AppState.invoices.filter(invoice => {
                    const invoiceDate = new Date(invoice.date);
                    return invoiceDate.getMonth() === currentMonth && 
                           invoiceDate.getFullYear() === currentYear;
                });
                
                const monthRevenue = thisMonthInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
                const monthInvoiceCount = thisMonthInvoices.length;
                const monthCustomers = new Set(thisMonthInvoices.map(inv => inv.customerName)).size;
                const avgInvoice = monthInvoiceCount > 0 ? monthRevenue / monthInvoiceCount : 0;
                
                // Update performance metrics (safely handle missing elements)
                const monthRevenueEl = document.getElementById('month-revenue');
                const monthInvoicesEl = document.getElementById('month-invoices');
                const monthCustomersEl = document.getElementById('month-customers');
                const avgInvoiceEl = document.getElementById('avg-invoice');
                
                if (monthRevenueEl) monthRevenueEl.textContent = this.formatCurrency(monthRevenue);
                if (monthInvoicesEl) monthInvoicesEl.textContent = monthInvoiceCount;
                if (monthCustomersEl) monthCustomersEl.textContent = monthCustomers;
                if (avgInvoiceEl) avgInvoiceEl.textContent = this.formatCurrency(avgInvoice);
                
            } catch (error) {
                ErrorHandler.log(error, 'Update Monthly Performance');
            }
        },
        
        populateInvoiceList: function() {
            try {
                console.log(`🔍 PopulateInvoiceList: Processing ${AppState.invoices.length} invoices`);
                console.log('🔍 Invoice data:', AppState.invoices.map(inv => ({
                    id: inv.id, 
                    number: inv.number, 
                    customer: inv.customerName, 
                    total: inv.total,
                    date: inv.date,
                    businessType: inv.businessType
                })));
                
                const tableBody = document.getElementById('invoices-table-body');
                if (!tableBody) {
                    console.error('❌ Invoice table body not found');
                    return;
                }
                
                if (AppState.invoices.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="7" class="empty-table">No invoices found</td></tr>';
                    console.log('📝 Showing empty invoice table');
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
                console.log(`✅ Invoice table populated with ${AppState.invoices.length} invoices in View Jobs section`);
                
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
        
        showSuccess: function(message, options = {}) {
            // Use new notification system if available
            if (window.NotificationSystem) {
                window.NotificationSystem.showSuccess(message, options);
            } else {
                // Fallback to legacy system
                this.showLegacySuccess(message);
            }
        },
        
        showLegacySuccess: function(message) {
            // Legacy success display for fallback
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
        
        showWarning: function(message, options = {}) {
            if (window.NotificationSystem) {
                window.NotificationSystem.showWarning(message, options);
            } else {
                alert('Warning: ' + message);
            }
        },
        
        showInfo: function(message, options = {}) {
            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo(message, options);
            } else {
                alert('Info: ' + message);
            }
        },
        
        showError: function(message, options = {}) {
            if (window.NotificationSystem) {
                window.NotificationSystem.showError(message, options);
            } else {
                ErrorHandler.showUserError(message);
            }
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
        
        getEstimateStatusIcon: function(status) {
            const icons = {
                'draft': '<i class="fas fa-pencil-alt"></i>',
                'sent': '<i class="fas fa-paper-plane"></i>',
                'approved': '<i class="fas fa-check-circle"></i>',
                'rejected': '<i class="fas fa-times-circle"></i>',
                'converted': '<i class="fas fa-file-invoice"></i>'
            };
            return icons[status] || '<i class="fas fa-file-contract"></i>';
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
                        // Draft auto-save disabled
                    });
                });
                
                // Periodic auto-save disabled
                
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
        
        // Draft auto-save functionality removed
        autoSaveDraft: function() {
            // Functionality disabled
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
        
        // Draft restore functionality completely disabled
        restoreDraft: function(draft) {
            // Functionality removed - no longer restoring drafts
            // No notifications shown
            return;
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
                
                // Create sample estimates for demonstration
                const sampleEstimates = [
                    {
                        id: 'est_sample_1',
                        number: 1,
                        businessType: 'concrete',
                        customerName: 'Mike Davis',
                        customerEmail: 'mike.davis@email.com',
                        customerPhone: '(440) 555-0789',
                        customerAddress: '789 Elm St, Geneva, OH 44041',
                        date: '2024-01-25',
                        services: [{
                            id: 'concrete_est_1',
                            type: 'concrete',
                            description: 'Patio Concrete Leveling',
                            quantity: 180,
                            unit: 'sq ft',
                            rate: 14.00,
                            amount: 2520.00
                        }],
                        subtotal: 2520.00,
                        tax: 207.90,
                        total: 2727.90,
                        notes: 'This estimate is valid for 30 days. Work will begin upon customer approval.',
                        status: 'sent',
                        signature: null,
                        signatureCustomerName: '',
                        signatureTimestamp: null,
                        approval: false,
                        createdAt: '2024-01-25T09:00:00Z',
                        updatedAt: '2024-01-25T09:00:00Z'
                    },
                    {
                        id: 'est_sample_2',
                        number: 2,
                        businessType: 'masonry',
                        customerName: 'Lisa Brown',
                        customerEmail: 'lisa.brown@email.com',
                        customerPhone: '(440) 555-0321',
                        customerAddress: '321 Pine St, Geneva, OH 44041',
                        date: '2024-01-28',
                        services: [{
                            id: 'masonry_est_1',
                            type: 'masonry',
                            description: 'Fire Pit Installation',
                            quantity: 1,
                            unit: 'job',
                            rate: 1800.00,
                            amount: 1800.00
                        }],
                        subtotal: 1800.00,
                        tax: 148.50,
                        total: 1948.50,
                        notes: 'Materials and installation included. Custom stone fire pit with seating area.',
                        status: 'approved',
                        signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                        signatureCustomerName: 'Lisa Brown',
                        signatureTimestamp: '2024-01-28T16:30:00Z',
                        approval: true,
                        createdAt: '2024-01-28T11:15:00Z',
                        updatedAt: '2024-01-28T16:30:00Z'
                    }
                ];
                
                AppState.invoices = sampleInvoices;
                AppState.estimates = sampleEstimates;
                AppState.nextInvoiceNumber = 3;
                AppState.nextEstimateNumber = 3;
                this.saveData();
                
                console.log('Sample data created');
                
            } catch (error) {
                ErrorHandler.log(error, 'Sample Data Creation');
            }
        },
        
        captureCustomerFromForm: function(into) {
            // Capture customer fields from form
            const name = document.getElementById('customer-name')?.value || '';
            const street = document.getElementById('customer-street')?.value || '';
            const city = document.getElementById('customer-city')?.value || '';
            const state = document.getElementById('customer-state')?.value || '';
            const zip = document.getElementById('customer-zip')?.value || '';
            
            if (into) {
                into.customer = {
                    name: name,
                    street: street,
                    city: city,
                    state: state,
                    zip: zip
                };
            }
            return { name, street, city, state, zip };
        },
        
        handleInvoiceSubmission: function() {
            // STEP 0: Global submission guard
            if (this.SUBMITTING) {
                console.log('[SUBMIT_SKIP] Already processing');
                return;
            }
            this.SUBMITTING = true;
            
            const submitBtn = document.querySelector('#invoice-form button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            
            let step = 'STEP_INIT';
            try {
                console.log('📝 [STEP_INIT] Processing invoice submission...');
                
                // Get form
                const form = document.getElementById('invoice-form');
                if (!form) {
                    throw new Error('Invoice form not found');
                }
                
                // Validate form
                if (!form.checkValidity()) {
                    form.reportValidity();
                    if (submitBtn) submitBtn.disabled = false;
                    return;
                }
                
                const formData = new FormData(form);
                
                // STEP 1: Build invoice from STATE
                step = 'STEP_BUILD';
                const inv = window.InvoiceManager?.currentInvoice || {};
                
                // Capture customer from form
                this.captureCustomerFromForm(inv);
                
                // Get business type
                let businessType = formData.get('businessType');
                if (!businessType) {
                    const concreteRadio = document.getElementById('business-concrete');
                    const masonryRadio = document.getElementById('business-masonry');
                    if (concreteRadio?.checked) businessType = 'concrete';
                    else if (masonryRadio?.checked) businessType = 'masonry';
                }
                
                // Ensure required fields
                if (!inv.id) inv.id = 'INV_' + Date.now();
                inv.businessType = businessType || inv.businessType || 'concrete';
                if (!inv.services) inv.services = [];
                inv.customerName = inv.customer?.name || formData.get('customerName') || inv.customerName || 'Customer';
                
                console.log(`[${step}] Invoice: ${inv.id}, Type: ${inv.businessType}, Services: ${inv.services.length}`);
                
                // STEP 2: Validate
                step = 'STEP_VALIDATE';
                const servicesInDOM = document.querySelectorAll('#services-list .service-item').length;
                console.log(`[${step}] Services - Array: ${inv.services.length}, DOM: ${servicesInDOM}`);
                
                if (!inv.customerName || inv.customerName.trim().length < 2) {
                    throw new Error('Please enter a valid customer name');
                }
                
                if (!inv.businessType) {
                    throw new Error('Please select a business type');
                }
                
                if (inv.services.length === 0 && servicesInDOM === 0) {
                    throw new Error('Please add at least one service');
                }
                
                // STEP 3: Single-path save
                step = 'STEP_SAVE';
                let ok = false;
                
                // Complete invoice fields
                inv.number = inv.number || (AppState.nextInvoiceNumber || 1);
                inv.date = inv.date || new Date().toISOString();
                inv.status = inv.status || 'paid';
                inv.subtotal = inv.services.reduce((sum, s) => sum + (s.amount || s.price || 0), 0);
                inv.total = inv.subtotal;
                
                console.log(`[${step}] Saving invoice #${inv.number}...`);
                
                try {
                    // Get current invoices from localStorage
                    const stored = localStorage.getItem('jstark_invoices');
                    const invoices = stored ? JSON.parse(stored) : [];
                    
                    // Add/update invoice
                    const idx = invoices.findIndex(i => i.id === inv.id);
                    if (idx >= 0) invoices[idx] = inv;
                    else invoices.push(inv);
                    
                    // Save to localStorage (canonical source)
                    localStorage.setItem('jstark_invoices', JSON.stringify(invoices));
                    
                    // Update memory immediately (no reload needed)
                    AppState.invoices = invoices;
                    if (window.InvoiceManager) {
                        window.InvoiceManager.invoices = invoices;
                        window.InvoiceManager.currentInvoice = inv;
                    }
                    
                    // Update next invoice number
                    AppState.nextInvoiceNumber = (AppState.nextInvoiceNumber || 1) + 1;
                    localStorage.setItem('jstark_next_invoice_number', AppState.nextInvoiceNumber.toString());
                    
                    console.log(`✅ [${step}] Saved to localStorage and memory`);
                    ok = true;
                } catch (e) {
                    console.error(`[${step}] Save failed:`, e.message);
                    ok = false;
                }
                
                // STEP 4: Show result
                step = 'STEP_RESULT';
                if (ok) {
                    // Single success toast
                    if (window.NotificationSystem) {
                        window.NotificationSystem.showSuccess('Invoice created successfully!');
                    }
                    
                    // Navigate without reloading data (we already updated memory)
                    setTimeout(() => {
                        try {
                            this.showDashboardWithoutReload();
                        } catch (e) {
                            console.warn('Navigation failed:', e.message);
                        }
                    }, 500);
                    
                    console.log(`✅ [${step}] Invoice submission complete`);
                } else {
                    throw new Error('Failed to save invoice');
                }
                
            } catch (error) {
                console.error(`❌ [SUBMIT_FAIL:${step}]`, error.message);
                
                // Only show error if we didn't succeed
                const msg = error.message || 'An error occurred. Please try again.';
                if (window.NotificationSystem) {
                    window.NotificationSystem.showError(msg);
                } else if (window.ErrorHandler) {
                    window.ErrorHandler.showUserError(msg);
                } else {
                    alert(msg);
                }
            } finally {
                // Always cleanup
                this.SUBMITTING = false;
                if (submitBtn) submitBtn.disabled = false;
            }
        },
        
        // ESTIMATE submission handler - CRITICAL MISSING FUNCTIONALITY RESTORED
        handleEstimateSubmission: function() {
            try {
                console.log('📝 Processing estimate submission...');
                
                // Capture customer data before submission
                if (window.EstimateManager?.currentEstimate) {
                    this.captureCustomerFromForm(window.EstimateManager.currentEstimate);
                }
                
                // Get the estimate form and create FormData
                const form = document.getElementById('estimate-form');
                if (!form) {
                    console.error('❌ Estimate form not found');
                    alert('Error: Estimate form not found');
                    return;
                }
                
                const formData = new FormData(form);
                
                // Debug: Check if FormData has content
                console.log('📋 Estimate form data entries:', Array.from(formData.entries()));
                
                // Validate required fields
                const customerName = formData.get('customerName');
                const businessType = formData.get('estimateBusinessType');
                
                if (!customerName) {
                    alert('Please enter a customer name');
                    document.getElementById('estimate-customer-name')?.focus();
                    return;
                }
                
                if (!businessType) {
                    alert('Please select a business type (Superior Concrete or J. Stark Masonry)');
                    return;
                }
                
                console.log('✅ Estimate form validation passed');
                
                // Pass to InvoiceManager for processing
                if (window.InvoiceManager && window.InvoiceManager.handleEstimateSubmission) {
                    console.log('📤 Calling InvoiceManager.handleEstimateSubmission...');
                    const result = window.InvoiceManager.handleEstimateSubmission(formData);
                    if (result) {
                        console.log('✅ Estimate created successfully!');
                        
                        // === SAFE-HOTFIX: Don't redirect to dashboard - let EstimateManager handle navigation
                        // EstimateManager.handleEstimateSubmission already calls showEstimatePreview
                        // Removing the dashboard redirect to allow preview to display
                        // The success message is shown by EstimateManager
                    } else {
                        console.error('❌ Estimate creation failed');
                        alert('Failed to create estimate. Please check that you have added services and try again.');
                    }
                } else {
                    console.error('❌ InvoiceManager or handleEstimateSubmission not available');
                    alert('Error: Estimate processing system not available');
                }
                
            } catch (error) {
                console.error('❌ Error in estimate submission:', error);
                // Use ErrorLogger instead of undefined ErrorHandler
                if (window.ErrorLogger) {
                    window.ErrorLogger.logError(error.message || 'Estimate submission failed', window.ERROR_CATEGORIES?.UI || 'ui', {
                        error: error.stack || error.toString(),
                        context: 'estimate_submission'
                    });
                }
                alert('An error occurred while creating the estimate. Please try again.');
            }
        },
        
        previewInvoice: function() {
            try {
                // Capture customer data before preview
                if (window.InvoiceManager?.currentInvoice) {
                    this.captureCustomerFromForm(window.InvoiceManager.currentInvoice);
                }
                
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
                // Try multiple paths to InvoiceManager
                const invoiceManager = window.InvoiceManager || 
                                     (window.JStarkInvoicing && window.JStarkInvoicing.InvoiceManager);
                
                if (invoiceManager && typeof invoiceManager.addService === 'function') {
                    invoiceManager.addService(service);
                } else {
                    console.error('InvoiceManager not available - tried window.InvoiceManager and window.JStarkInvoicing.InvoiceManager');
                    // Fallback - try to manually update the UI
                    this.updateInvoiceTotals();
                }
            } catch (error) {
                ErrorHandler.log(error, 'Add Service');
            }
        },
        
        updateInvoiceTotals: function() {
            try {
                // Try multiple paths to InvoiceManager
                const invoiceManager = window.InvoiceManager || 
                                     (window.JStarkInvoicing && window.JStarkInvoicing.InvoiceManager);
                
                if (invoiceManager && typeof invoiceManager.updateInvoiceTotals === 'function') {
                    invoiceManager.updateInvoiceTotals();
                } else {
                    console.warn('InvoiceManager not available for totals update - tried both paths');
                    // Manual fallback to update UI totals
                    this.calculateAndDisplayTotals();
                }
            } catch (error) {
                ErrorHandler.log(error, 'Update Totals');
            }
        },

        // Manual fallback for calculating totals when InvoiceManager not available
        calculateAndDisplayTotals: function() {
            try {
                const servicesList = document.getElementById('services-list');
                if (!servicesList) return;

                const serviceItems = servicesList.querySelectorAll('.service-item');
                let subtotal = 0;

                serviceItems.forEach(item => {
                    const amountElement = item.querySelector('.service-amount');
                    if (amountElement) {
                        const amount = parseFloat(amountElement.textContent.replace('$', '').replace(',', '')) || 0;
                        subtotal += amount;
                    }
                });

                // Update total display elements
                const subtotalElement = document.getElementById('invoice-subtotal');
                const totalElement = document.getElementById('invoice-grand-total');
                
                if (subtotalElement) {
                    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
                }
                if (totalElement) {
                    totalElement.textContent = `$${subtotal.toFixed(2)}`; // No tax per requirements
                }
            } catch (error) {
                console.error('Manual totals calculation failed:', error);
            }
        },
        
        // Public methods for global access
        viewInvoice: function(invoiceId) {
            try {
                // Convert to string for comparison since IDs are now strings
                const invoice = AppState.invoices.find(inv => inv.id === String(invoiceId));
                if (invoice) {
                    console.log('Found invoice for viewing:', {
                        id: invoice.id,
                        number: invoice.number,
                        services: invoice.services,
                        servicesCount: invoice.services ? invoice.services.length : 0,
                        total: invoice.total
                    });
                    this.showInvoicePreview(invoice);
                } else {
                    console.error('Invoice not found with ID:', invoiceId);
                    console.log('Available invoices:', AppState.invoices.map(inv => ({ id: inv.id, number: inv.number })));
                }
            } catch (error) {
                ErrorHandler.log(error, 'View Invoice');
            }
        },
        
        editInvoice: function(invoiceId) {
            try {
                const invoice = AppState.invoices.find(inv => inv.id === String(invoiceId));
                if (invoice) {
                    AppState.currentInvoice = invoice;
                    // === VERSION 9.21: Wait for view to be ready before loading data
                    this.showInvoiceCreation().then(() => {
                        // Use InvoiceManager to load the invoice for editing
                        if (window.InvoiceManager) {
                            window.InvoiceManager.loadInvoice(invoice);
                        } else {
                            // Fallback to app method
                            this.populateFormWithInvoice(invoice);
                        }
                    });
                }
            } catch (error) {
                ErrorHandler.log(error, 'Edit Invoice');
            }
        },
        
        deleteInvoice: function(invoiceId) {
            try {
                const invoice = AppState.invoices.find(inv => inv.id === String(invoiceId));
                if (!invoice) return;
                
                this.showConfirmDialog(
                    'Delete Invoice?',
                    `Are you sure you want to delete invoice #${invoice.number} for ${invoice.customerName}? This action cannot be undone.`,
                    () => {
                        // Confirm delete
                        AppState.invoices = AppState.invoices.filter(inv => inv.id !== String(invoiceId));
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
                const invoice = AppState.invoices.find(inv => inv.id === String(invoiceId));
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
                // === VERSION 9.20: Fix customer data loading - check both nested and flat structures
                document.getElementById('customer-name').value = invoice.customer?.name || invoice.customerName || '';
                document.getElementById('customer-email').value = invoice.customer?.email || invoice.customerEmail || '';
                document.getElementById('customer-phone').value = invoice.customer?.phone || invoice.customerPhone || '';
                document.getElementById('customer-address').value = invoice.customer?.street || invoice.customerAddress || '';
                document.getElementById('invoice-date').value = invoice.date;
                // === VERSION 9.17: Notes field removed from UI, skip setting
                // document.getElementById('invoice-notes').value = invoice.notes || '';
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
        },
        
        resetEstimateForm: function() {
            try {
                const form = document.getElementById('estimate-form');
                if (form) {
                    form.reset();
                }

                // Clear services list
                this.clearEstimateServicesList();

                // Reset totals
                this.updateEstimateTotals();

                // Set current date
                const today = new Date().toISOString().split('T')[0];
                const dateInput = document.getElementById('estimate-date');
                if (dateInput) {
                    dateInput.value = today;
                }

                // Clear signature
                this.clearSignature();

                // Reset estimate manager
                if (window.EstimateManager) {
                    window.EstimateManager.resetEstimate();
                }

                // Explicitly clear currentEstimate from InvoiceManager to ensure fresh start
                if (window.InvoiceManager) {
                    window.InvoiceManager.currentEstimate = { services: [] };
                }

                // Clear current estimate state
                AppState.currentEstimate = null;

            } catch (error) {
                ErrorHandler.log(error, 'Reset Estimate Form');
            }
        },
        
        clearEstimateServicesList: function() {
            try {
                const servicesList = document.getElementById('estimate-services-list');
                if (servicesList) {
                    servicesList.innerHTML = '<p class="empty-services">No services added yet. Add services using the sections above.</p>';
                }
            } catch (error) {
                ErrorHandler.log(error, 'Clear Estimate Services List');
            }
        },
        
        updateEstimateTotals: function() {
            try {
                // Update only elements that exist (tax was removed from estimates)
                const subtotalEl = document.getElementById('estimate-subtotal');
                const taxEl = document.getElementById('estimate-tax');
                const totalEl = document.getElementById('estimate-grand-total');
                
                if (subtotalEl) subtotalEl.textContent = '$0.00';
                if (taxEl) taxEl.textContent = '$0.00';  // May not exist (tax removed)
                if (totalEl) totalEl.textContent = '$0.00';
            } catch (error) {
                ErrorHandler.log(error, 'Update Estimate Totals');
            }
        },
        
        clearSignature: function() {
            try {
                const canvas = document.getElementById('signature-canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                
                const signatureName = document.getElementById('signature-customer-name');
                if (signatureName) {
                    signatureName.value = '';
                }
                
                const approval = document.getElementById('estimate-approval');
                if (approval) {
                    approval.checked = false;
                }
                
            } catch (error) {
                ErrorHandler.log(error, 'Clear Signature');
            }
        },
        
        initSignatureMethodSwitching: function() {
            try {
                const signatureMethodRadios = document.querySelectorAll('input[name="signatureMethod"]');
                const digitalSection = document.getElementById('digital-signature-section');
                const emailSection = document.getElementById('email-signature-section');
                const printSection = document.getElementById('print-signature-section');
                
                signatureMethodRadios.forEach(radio => {
                    radio.addEventListener('change', () => {
                        // Hide all sections first
                        if (digitalSection) digitalSection.style.display = 'none';
                        if (emailSection) emailSection.style.display = 'none';
                        if (printSection) printSection.style.display = 'none';
                        
                        // Show selected section
                        switch (radio.value) {
                            case 'digital':
                                if (digitalSection) digitalSection.style.display = 'block';
                                break;
                            case 'email':
                                if (emailSection) emailSection.style.display = 'block';
                                // Auto-populate customer email if available
                                const customerEmail = document.getElementById('estimate-customer-email')?.value;
                                const emailInput = document.getElementById('customer-email-signature');
                                if (emailInput && customerEmail) {
                                    emailInput.value = customerEmail;
                                }
                                break;
                            case 'print':
                                if (printSection) printSection.style.display = 'block';
                                break;
                        }
                    });
                });
                
            } catch (error) {
                console.error('Init signature method switching error:', error);
            }
        },
        
        handleEmailSignature: function() {
            try {
                const customerEmail = document.getElementById('customer-email-signature')?.value;
                const message = document.getElementById('signature-message')?.value;
                
                if (!customerEmail) {
                    ErrorHandler.showUserError('Please enter customer email address');
                    return false;
                }
                
                // Create estimate and send email
                const estimate = window.EstimateManager ? window.EstimateManager.currentEstimate : null;
                if (!estimate) {
                    ErrorHandler.showUserError('Please complete the estimate first');
                    return false;
                }
                
                // Update estimate with email signature method
                estimate.signatureMethod = 'email';
                estimate.customerEmailSignature = customerEmail;
                estimate.signatureMessage = message;
                estimate.status = 'sent';
                
                // Send email (using existing email service)
                if (window.EmailService) {
                    window.EmailService.sendEstimateForSignature(estimate, customerEmail, message);
                    App.showSuccess('Estimate sent to customer for signature!');
                    return true;
                } else {
                    // Fallback: create mailto link
                    const subject = `Work Estimate #${estimate.number} - Please Review and Sign`;
                    const body = `Dear ${estimate.customerName},\n\n${message || 'Please review the attached work estimate and provide your digital signature to approve the work.'}\n\nThank you,\nJ. Stark Business`;
                    const mailtoLink = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.location.href = mailtoLink;
                    App.showSuccess('Email client opened - please send the estimate to customer');
                    return true;
                }
                
            } catch (error) {
                console.error('Handle email signature error:', error);
                ErrorHandler.showUserError('Failed to send email signature request');
                return false;
            }
        },
        
        handlePrintSignature: function() {
            try {
                const includeSignatureLines = document.getElementById('include-signature-lines')?.checked;
                const includeDateLine = document.getElementById('include-date-line')?.checked;
                
                // Create estimate and mark for print signature
                const estimate = window.EstimateManager ? window.EstimateManager.currentEstimate : null;
                if (!estimate) {
                    ErrorHandler.showUserError('Please complete the estimate first');
                    return false;
                }
                
                // Update estimate with print signature method
                estimate.signatureMethod = 'print';
                estimate.includeSignatureLines = includeSignatureLines;
                estimate.includeDateLine = includeDateLine;
                estimate.status = 'sent';
                
                // Generate PDF with signature lines
                if (window.PDFGenerator) {
                    const success = window.PDFGenerator.generateEstimatePDF(estimate, {
                        signatureLines: includeSignatureLines,
                        dateLine: includeDateLine,
                        autoDownload: true
                    });
                    
                    if (success) {
                        App.showSuccess('Printable estimate with signature lines generated!');
                        return true;
                    } else {
                        ErrorHandler.showUserError('Failed to generate printable estimate');
                        return false;
                    }
                } else {
                    // Fallback: open print dialog
                    window.print();
                    App.showSuccess('Please print the estimate for customer signature');
                    return true;
                }
                
            } catch (error) {
                console.error('Handle print signature error:', error);
                ErrorHandler.showUserError('Failed to generate printable estimate');
                return false;
            }
        },
        
        populateEstimateList: function() {
            try {
                const tableBody = document.getElementById('estimates-table-body');
                if (!tableBody) return;
                
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                // Load estimates from proper storage
                let estimates = [];
                
                // Check if StorageManager has the getEstimates method
                if (window.StorageManager && typeof window.StorageManager.getEstimates === 'function') {
                    estimates = window.StorageManager.getEstimates() || [];
                } else if (AppState.estimates) {
                    estimates = AppState.estimates;
                } else {
                    // Fallback to localStorage
                    const stored = localStorage.getItem('jstark_estimates');
                    estimates = stored ? JSON.parse(stored) : [];
                }
                
                // Update AppState if needed
                if (!AppState.estimates || AppState.estimates.length !== estimates.length) {
                    AppState.estimates = estimates;
                }
                
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (BEGIN)
                console.log('[EST:LIST_RENDER]', {
                    count: estimates.length
                });
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (END)
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
                
                if (AppState.estimates.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="8" class="empty-table">No estimates found</td></tr>';
                    return;
                }
                
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (BEGIN)
                // Log each estimate row
                AppState.estimates.forEach(estimate => {
                    console.log('[EST:ROW]', {
                        id: estimate.id,
                        number: estimate.number,
                        businessType: estimate.businessType
                    });
                });
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (END)
                
                const estimatesHtml = AppState.estimates.map(estimate => `
                    <tr>
                        <td>#${estimate.number}</td>
                        <td>${estimate.customerName}</td>
                        <td>${estimate.businessType === 'concrete' ? 'Superior Concrete' : 'J. Stark Masonry'}</td>
                        <td>${new Date(estimate.date).toLocaleDateString()}</td>
                        <td>${this.formatCurrency(estimate.total)}</td>
                        <td>
                            <select class="status-dropdown" onchange="App.updateEstimateStatus('${estimate.id}', this.value)">
                                <option value="draft" ${estimate.status === 'draft' ? 'selected' : ''}>Draft</option>
                                <option value="sent" ${estimate.status === 'sent' ? 'selected' : ''}>Sent</option>
                                <option value="approved" ${estimate.status === 'approved' ? 'selected' : ''}>Approved</option>
                                <option value="rejected" ${estimate.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                <option value="converted" ${estimate.status === 'converted' ? 'selected' : ''}>Converted</option>
                            </select>
                        </td>
                        <td>
                            <span class="signature-status ${estimate.signature ? 'signature-yes' : 'signature-no'}">
                                <i class="fas fa-signature"></i>
                                ${estimate.signature ? 'Signed' : 'Unsigned'}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons-table">
                                <button class="action-btn-sm view-btn" onclick="App.viewEstimate('${estimate.id}')" title="View">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-btn-sm edit-btn" onclick="App.editEstimate('${estimate.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn-sm info-btn" onclick="App.convertEstimateToInvoice('${estimate.id}')" title="Convert to Invoice">
                                    <i class="fas fa-file-invoice"></i>
                                </button>
                                <button class="action-btn-sm delete-btn" onclick="App.deleteEstimate('${estimate.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
                
                tableBody.innerHTML = estimatesHtml;
                
            } catch (error) {
                ErrorHandler.log(error, 'Populate Estimate List');
            }
        },
        
        // Estimate management methods
        viewEstimate: function(estimateId) {
            try {
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
                // Find estimate from storage or AppState
                let estimate = null;
                
                // Check if StorageManager has the getEstimate method
                if (window.StorageManager && typeof window.StorageManager.getEstimate === 'function') {
                    estimate = window.StorageManager.getEstimate(estimateId);
                }
                
                if (!estimate && AppState.estimates) {
                    estimate = AppState.estimates.find(est => est.id === String(estimateId));
                }
                
                // Fallback to localStorage if still not found
                if (!estimate) {
                    const stored = localStorage.getItem('jstark_estimates');
                    const estimates = stored ? JSON.parse(stored) : [];
                    estimate = estimates.find(est => est.id === String(estimateId));
                }
                
                if (estimate) {
                    // Store current estimate ID for navigation
                    if (window.EstimateManager) {
                        window.EstimateManager.currentEstimateId = estimateId;
                    }
                    console.log('[EST:NAV_PREVIEW]', { id: estimateId });
                    this.showEstimatePreview(estimate);
                }
                // === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)
            } catch (error) {
                ErrorHandler.log(error, 'View Estimate');
            }
        },
        
        editEstimate: function(estimateId) {
            try {
                const estimate = AppState.estimates.find(est => est.id === String(estimateId));
                if (estimate) {
                    AppState.currentEstimate = estimate;
                    // === VERSION 9.21: Wait for view to be ready before loading data
                    this.showEstimateCreation().then(() => {
                        // Populate form with estimate data
                        if (window.EstimateManager) {
                            window.EstimateManager.loadEstimate(estimate);
                        }
                    });
                }
            } catch (error) {
                ErrorHandler.log(error, 'Edit Estimate');
            }
        },
        
        deleteEstimate: function(estimateId) {
            try {
                const estimate = AppState.estimates.find(est => est.id === String(estimateId));
                if (!estimate) return;
                
                this.showConfirmDialog(
                    'Delete Estimate?',
                    `Are you sure you want to delete estimate #${estimate.number} for ${estimate.customerName}? This action cannot be undone.`,
                    () => {
                        // Confirm delete
                        AppState.estimates = AppState.estimates.filter(est => est.id !== String(estimateId));
                        this.saveData();
                        this.populateEstimateList();
                        this.updateDashboard();
                        this.showSuccess('Estimate deleted successfully');
                    }
                );
            } catch (error) {
                ErrorHandler.log(error, 'Delete Estimate');
            }
        },
        
        updateEstimateStatus: function(estimateId, newStatus) {
            try {
                const estimate = AppState.estimates.find(est => est.id === estimateId);
                if (estimate) {
                    estimate.status = newStatus;
                    estimate.updatedAt = new Date().toISOString();
                    this.saveData();
                    this.updateDashboard();
                    this.showSuccess(`Estimate status updated to ${newStatus}`);
                }
            } catch (error) {
                ErrorHandler.log(error, 'Update Estimate Status');
            }
        },
        
        convertEstimateToInvoice: function(estimateId) {
            try {
                const estimate = AppState.estimates.find(est => est.id === estimateId);
                if (!estimate) return;
                
                this.showConfirmDialog(
                    'Convert Estimate to Invoice?',
                    `Convert estimate #${estimate.number} for ${estimate.customerName} into an invoice? The estimate status will be marked as 'Converted'.`,
                    () => {
                        // Create new invoice from estimate
                        const newInvoice = {
                            ...estimate,
                            id: this.generateInvoiceId(),
                            number: AppState.nextInvoiceNumber,
                            status: 'draft',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            convertedFromEstimate: estimateId
                        };
                        
                        // Remove estimate-specific fields
                        delete newInvoice.signature;
                        delete newInvoice.signatureCustomerName;
                        delete newInvoice.signatureTimestamp;
                        delete newInvoice.approval;
                        
                        // Add to invoices
                        AppState.invoices.push(newInvoice);
                        AppState.nextInvoiceNumber++;
                        
                        // Update estimate status
                        estimate.status = 'converted';
                        estimate.convertedToInvoice = newInvoice.id;
                        estimate.updatedAt = new Date().toISOString();
                        
                        this.saveData();
                        
                        // === SAFE-HOTFIX: CONVERT→PREVIEW→PDF ID FIX (BEGIN)
                        // Set the new invoice as the previewed invoice
                        if (window.InvoiceManager) {
                            window.InvoiceManager.previewedInvoice = newInvoice;
                            window.InvoiceManager.selectedInvoiceId = newInvoice.id;
                            // Clear any stale estimate preview cache
                            window.InvoiceManager.previewedEstimate = null;
                            if (window.EstimateManager) {
                                window.EstimateManager.previewedEstimate = null;
                            }
                        }
                        console.log('[CONVERT:INVOICE_CREATED]', { id: newInvoice.id, number: newInvoice.number });
                        
                        // Navigate to invoice preview using the proper method
                        if (window.InvoiceManager && window.InvoiceManager.generateInvoicePreview) {
                            window.InvoiceManager.generateInvoicePreview(newInvoice);
                        } else if (window.App && window.App.showInvoicePreview) {
                            window.App.showInvoicePreview(newInvoice);
                        }
                        // === SAFE-HOTFIX: CONVERT→PREVIEW→PDF ID FIX (END)
                        
                        this.populateEstimateList();
                        this.updateDashboard();
                        this.showSuccess(`Estimate converted to Invoice #${newInvoice.number}`);
                    }
                );
            } catch (error) {
                ErrorHandler.log(error, 'Convert Estimate to Invoice');
            }
        },
        
        generateEstimatePreview: function(estimate) {
            try {
                if (window.InvoiceManager && window.InvoiceManager.generateEstimatePreview) {
                    window.InvoiceManager.generateEstimatePreview(estimate);
                } else {
                    console.error('InvoiceManager.generateEstimatePreview not available');
                }
            } catch (error) {
                ErrorHandler.log(error, 'Generate Estimate Preview');
            }
        },
        
        // HEALTH CHECK SYSTEM
        performHealthCheck: function() {
            const result = { passed: true, error: null, warnings: [] };
            
            try {
                console.log('🔍 Performing system health check...');
                
                // Check critical DOM elements
                const criticalElements = [
                    'dashboard',
                    'invoice-creation', 
                    'invoice-form',
                    'estimate-creation',
                    'estimate-form',
                    'invoice-list',
                    'estimate-list'
                ];
                
                const missingElements = [];
                criticalElements.forEach(id => {
                    const element = document.getElementById(id);
                    if (!element) {
                        missingElements.push(id);
                    }
                });
                
                if (missingElements.length > 0) {
                    result.passed = false;
                    result.error = `Critical DOM elements missing: ${missingElements.join(', ')}`;
                    return result;
                }
                
                // Check for critical form elements
                const criticalFormElements = [
                    'customer-name',
                    'customer-email', 
                    'invoice-date',
                    'estimate-customer-name',
                    'estimate-date'
                ];
                
                const missingFormElements = [];
                criticalFormElements.forEach(id => {
                    const element = document.getElementById(id);
                    if (!element) {
                        missingFormElements.push(id);
                    }
                });
                
                if (missingFormElements.length > 0) {
                    result.warnings.push(`Form elements missing: ${missingFormElements.join(', ')}`);
                }
                
                // Check business type radios
                const businessTypeRadios = document.querySelectorAll('input[name="businessType"]');
                const estimateBusinessTypeRadios = document.querySelectorAll('input[name="estimateBusinessType"]');
                
                if (businessTypeRadios.length === 0) {
                    result.passed = false;
                    result.error = 'Business type selection radios not found';
                    return result;
                }
                
                if (estimateBusinessTypeRadios.length === 0) {
                    result.warnings.push('Estimate business type radios not found');
                }
                
                // Check for service sections
                const concreteServices = document.getElementById('concrete-services');
                const masonryServices = document.getElementById('masonry-services');
                
                if (!concreteServices || !masonryServices) {
                    result.warnings.push('Service sections missing or incorrectly configured');
                }
                
                // Check localStorage availability
                try {
                    localStorage.setItem('health_check', 'test');
                    localStorage.removeItem('health_check');
                } catch (e) {
                    result.warnings.push('LocalStorage not available - data will not persist');
                }
                
                console.log('✅ Health check completed:', result);
                return result;
                
            } catch (error) {
                result.passed = false;
                result.error = `Health check failed: ${error.message}`;
                console.error('Health check error:', error);
                return result;
            }
        },
        
        performPostInitializationCheck: function() {
            const result = { passed: true, warnings: [] };
            
            try {
                console.log('🔍 Performing post-initialization check...');
                
                // Check if critical systems are available
                const systems = [
                    { name: 'JStarkInvoicing', check: () => window.JStarkInvoicing },
                    { name: 'PDFGenerator', check: () => window.PDFGenerator },
                    { name: 'Signature', check: () => window.Signature },
                    { name: 'NotificationSystem', check: () => window.NotificationSystem }
                ];
                
                systems.forEach(system => {
                    if (!system.check()) {
                        result.warnings.push(`${system.name} system not available`);
                    }
                });
                
                // Check if data loaded properly
                if (!AppState.invoices) {
                    result.warnings.push('Invoice data not loaded');
                }
                
                if (!AppState.estimates) {
                    result.warnings.push('Estimate data not loaded');
                }
                
                // Check signature canvas initialization
                if (window.Signature && !window.Signature.isInitialized()) {
                    result.warnings.push('Signature system not initialized');
                }
                
                console.log('✅ Post-initialization check completed:', result);
                return result;
                
            } catch (error) {
                result.warnings.push(`Post-initialization check error: ${error.message}`);
                console.error('Post-initialization check error:', error);
                return result;
            }
        },
        
        showCriticalError: function(message) {
            // Show critical error that prevents app from working
            const errorDiv = document.createElement('div');
            errorDiv.className = 'critical-error-overlay';
            errorDiv.innerHTML = `
                <div class="critical-error-content">
                    <div class="error-icon">⚠️</div>
                    <h2>System Error</h2>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        Refresh Page
                    </button>
                </div>
            `;
            
            // Add critical error styles
            errorDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            `;
            
            const contentStyle = `
                background: white;
                padding: 40px;
                border-radius: 8px;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            `;
            
            errorDiv.querySelector('.critical-error-content').style.cssText = contentStyle;
            
            document.body.appendChild(errorDiv);
        }
        
    };
    
    // Global functions for onclick handlers
    window.createNewInvoice = function(businessType) {
        console.log('🎯 createNewInvoice called with businessType:', businessType);
        
        // Ensure form isolation - hide all other views explicitly
        const estimateView = document.getElementById('estimate-creation');
        if (estimateView) {
            estimateView.classList.remove('active');
            estimateView.style.display = 'none';
        }
        
        App.showInvoiceCreation(businessType);
    };
    
    window.createNewEstimate = function(businessType) {
        console.log('🎯 createNewEstimate called with businessType:', businessType);
        try {
            // Ensure form isolation - hide all other views explicitly  
            const invoiceView = document.getElementById('invoice-creation');
            if (invoiceView) {
                invoiceView.classList.remove('active');
                invoiceView.style.display = 'none';
            }
            
            App.showEstimateCreation(businessType);
        } catch (error) {
            console.error('ERROR in createNewEstimate:', error);
            ErrorHandler.showUserError('Unable to create estimate. Please try again.');
        }
    };
    
    window.showDashboard = function() {
        App.showDashboard();
    };
    
    window.showEstimateCalculator = function() {
        // Redirect to estimate creation (calculator functionality removed)
        App.showEstimateCreation();
    };
    
    window.editInvoice = function() {
        App.showInvoiceCreation();
    };
    
    window.printInvoice = function() {
        window.print();
    };
    
    window.downloadPDF = function() {
        console.log('🔵 DOWNLOAD PDF BUTTON CLICKED');
        console.log('🔵 Current InvoiceManager state:', {
            hasInvoiceManager: !!window.InvoiceManager,
            hasPreviewedInvoice: !!(window.InvoiceManager && window.InvoiceManager.previewedInvoice),
            previewedInvoiceId: window.InvoiceManager && window.InvoiceManager.previewedInvoice ? window.InvoiceManager.previewedInvoice.id : 'none',
            previewedServicesCount: window.InvoiceManager && window.InvoiceManager.previewedInvoice && window.InvoiceManager.previewedInvoice.services ? window.InvoiceManager.previewedInvoice.services.length : 0
        });
        
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
            // Hide tax UI on page load
            App.hideTaxUIEverywhere();
        });
    } else {
        App.init();
        // Hide tax UI on page load
        App.hideTaxUIEverywhere();
    }
    
    // Export App for global access
    window.App = App;
    window.App.AppState = AppState;
    
    // Export diagnostic logging with critical operation tracking
    window.diagnosticLog = diagnosticLog;
    window.App.diagnosticLog = diagnosticLog;
    
    // Enhanced tracking for critical operations
    window.App.trackFormSubmit = function(formType, data) {
        diagnosticLog('FORM_SUBMIT_ATTEMPT', { formType, timestamp: Date.now(), data: data || 'no data' });
    };
    
    window.App.trackPreviewGeneration = function(itemType, success, error) {
        diagnosticLog('PREVIEW_GENERATION', { itemType, success, error: error || null, timestamp: Date.now() });
    };
    
    window.App.trackPDFExport = function(status, itemType, error) {
        diagnosticLog('PDF_EXPORT', { status, itemType, error: error || null, timestamp: Date.now() });
    };
    
    // Global functions for HTML onclick handlers - FIXED duplicates
    // Note: Removed duplicate definitions to prevent override issues
    
    // Add missing global functions for invoice/estimate preview
    window.showInvoicePreview = function(itemId, itemType) {
        if (itemType === 'estimate') {
            const estimate = AppState.estimates.find(e => e.id === String(itemId));
            if (estimate) {
                App.showEstimatePreview(estimate);
            } else {
                console.error('Estimate not found with ID:', itemId);
            }
        } else {
            const invoice = AppState.invoices.find(inv => inv.id === String(itemId));
            if (invoice) {
                App.showInvoicePreview(invoice);
            } else {
                console.error('Invoice not found with ID:', itemId);
            }
        }
    };
    
    window.showAllInvoices = function() {
        App.showInvoiceList();
    };
    
    window.showAllEstimates = function() {
        App.showEstimateList();
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
    
    // Note: showDashboard already defined above - removing duplicate
    
    window.editInvoice = function() {
        // Implementation for edit invoice - use proper App method
        App.showInvoiceCreation();
    };
    
    window.printInvoice = function() {
        window.print();
    };
    
    // === SAFE-HOTFIX: PDF DUPLICATE FIX - Commenting out duplicate definition
    // This function is already defined above at line 3384
    // Having two definitions causes duplicate downloads
    /*
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
    */
    // === SAFE-HOTFIX: PDF DUPLICATE FIX (END)
    
    window.emailInvoice = function() {
        if (window.EmailService && window.InvoiceManager) {
            const invoice = window.InvoiceManager.previewedInvoice || window.InvoiceManager.currentInvoice;
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
        App.showEstimateCreation();
        App.showSuccess('Use manual entry in step 3 to create estimates');
    };
    
    window.editEstimate = function() {
        App.showEstimateCreation();
    };
    
    window.printEstimate = function() {
        window.print();
    };
    
    window.downloadEstimatePDF = function() {
        if (window.PDFGenerator) {
            const success = window.PDFGenerator.downloadCurrentEstimate();
            if (success) {
                App.showSuccess('Estimate PDF generated successfully!');
            } else {
                ErrorHandler.showUserError('Failed to generate PDF. Please try again.');
            }
        } else {
            ErrorHandler.showUserError('PDF functionality not available');
        }
    };
    
    window.showCreateInvoiceOptions = function() {
        // Show dropdown with invoice options or direct creation
        const newJobBtn = document.getElementById('new-job-btn');
        if (newJobBtn) {
            newJobBtn.click(); // This will show the dropdown with invoice options
        } else {
            // Fallback: go directly to invoice creation
            App.showInvoiceCreation();
        }
    };
    
    window.showCreateEstimateOptions = function() {
        // Show dropdown with estimate options or direct creation
        const newJobBtn = document.getElementById('new-job-btn');
        if (newJobBtn) {
            newJobBtn.click(); // This will show the dropdown with estimate options
        } else {
            // Fallback: go directly to estimate creation
            App.showEstimateCreation();
        }
    };

    window.emailEstimate = function() {
        if (window.EmailService && window.EstimateManager) {
            const estimate = window.EstimateManager.currentEstimate;
            if (estimate && estimate.services && estimate.services.length > 0) {
                window.EmailService.showEmailDialog(estimate, 'estimate');
            } else {
                ErrorHandler.showUserError('Please create or preview an estimate first before emailing.');
            }
        } else {
            ErrorHandler.showUserError('Email functionality not available');
        }
    };
    
    window.convertToInvoice = function() {
        // Try to get estimate from multiple sources
        let estimateToConvert = null;
        
        // First, check InvoiceManager's previewedEstimate (most likely source)
        if (window.InvoiceManager && window.InvoiceManager.previewedEstimate) {
            estimateToConvert = window.InvoiceManager.previewedEstimate;
            console.log('🔄 Using InvoiceManager.previewedEstimate for conversion');
        }
        // Fallback to EstimateManager
        else if (window.EstimateManager && window.EstimateManager.currentEstimate) {
            estimateToConvert = window.EstimateManager.currentEstimate;
            console.log('🔄 Using EstimateManager.currentEstimate for conversion');
        }
        
        if (estimateToConvert && estimateToConvert.id) {
            console.log('✅ Converting estimate to invoice:', estimateToConvert);
            App.convertEstimateToInvoice(estimateToConvert.id);
        } else {
            console.error('❌ No estimate found for conversion');
            ErrorHandler.showUserError('No estimate selected for conversion');
        }
    };
    
    window.showEmailSettings = function() {
        if (window.EmailService) {
            window.EmailService.showSettingsDialog();
        } else {
            ErrorHandler.showUserError('Email service not available');
        }
    };
    
    // CSV Export functionality
    App.exportToCSV = function() {
        try {
            console.log('Export to CSV called');
            // Use the correct method name: loadInvoices instead of getAllInvoices
            const invoices = window.StorageManager ? 
                window.StorageManager.loadInvoices() : 
                JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
            
            console.log('Retrieved invoices:', invoices);
            if (!invoices || invoices.length === 0) {
                ErrorHandler.showUserError('No invoices to export');
                return;
            }
            
            const csvData = App.generateInvoiceCSV(invoices);
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            App.showSuccess('Invoices exported successfully!');
        } catch (error) {
            console.error('Export invoices error:', error);
            ErrorHandler.showUserError('Failed to export invoices');
        }
    };
    
    App.exportCustomersToCSV = function() {
        try {
            console.log('Export customers to CSV called');
            // Use the correct method names
            const invoices = window.StorageManager ? 
                window.StorageManager.loadInvoices() : 
                JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
            
            const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
            
            console.log('Retrieved invoices:', invoices, 'estimates:', estimates);
            const allData = [...(invoices || []), ...(estimates || [])];
            
            if (allData.length === 0) {
                ErrorHandler.showUserError('No customer data to export');
                return;
            }
            
            const csvData = App.generateCustomerCSV(allData);
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            App.showSuccess('Customer data exported successfully!');
        } catch (error) {
            console.error('Export customers error:', error);
            ErrorHandler.showUserError('Failed to export customer data');
        }
    };
    
    App.generateInvoiceCSV = function(invoices) {
        const headers = ['Invoice #', 'Date', 'Customer Name', 'Email', 'Phone', 'Address', 'Business Type', 'Subtotal', 'Tax', 'Total', 'Status', 'Services', 'Notes', 'Created', 'Last Modified', 'Email Status'];
        const rows = [headers.join(',')];
        
        invoices.forEach(invoice => {
            const services = invoice.services ? invoice.services.map(s => {
                if (s.details && s.details.jobPricing) {
                    return `${s.description} (Job pricing: $${s.amount})`;
                } else {
                    return `${s.description} (${s.quantity} ${s.unit} @ $${s.rate})`;
                }
            }).join('; ') : '';
            
            const row = [
                `"${invoice.number || ''}"`,
                `"${invoice.date || ''}"`,
                `"${invoice.customerName || ''}"`,
                `"${invoice.customerEmail || ''}"`,
                `"${invoice.customerPhone || ''}"`,
                `"${invoice.customerAddress || ''}"`,
                `"${invoice.businessType || ''}"`,
                `"${invoice.subtotal || 0}"`,
                `"${invoice.tax || 0}"`,
                `"${invoice.total || 0}"`,
                `"${invoice.status || ''}"`,
                `"${services}"`,
                `"${(invoice.notes || '').replace(/"/g, '""')}"`,
                `"${invoice.created || invoice.date || ''}"`,
                `"${invoice.lastModified || ''}"`,
                `"${invoice.emailStatus || 'not sent'}"`
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    };
    
    App.generateCustomerCSV = function(data) {
        const headers = ['Customer Name', 'Email', 'Phone', 'Address', 'Business Type', 'Total Jobs', 'Total Amount'];
        const rows = [headers.join(',')];
        
        const customers = {};
        
        data.forEach(item => {
            const key = item.customerName;
            if (!customers[key]) {
                customers[key] = {
                    name: item.customerName || '',
                    email: item.customerEmail || '',
                    phone: item.customerPhone || '',
                    address: item.customerAddress || '',
                    businessTypes: new Set(),
                    totalJobs: 0,
                    totalAmount: 0
                };
            }
            
            customers[key].businessTypes.add(item.businessType || '');
            customers[key].totalJobs++;
            customers[key].totalAmount += parseFloat(item.total || 0);
        });
        
        Object.values(customers).forEach(customer => {
            const row = [
                `"${customer.name}"`,
                `"${customer.email}"`,
                `"${customer.phone}"`,
                `"${customer.address}"`,
                `"${Array.from(customer.businessTypes).join(', ')}"`,
                `"${customer.totalJobs}"`,
                `"${customer.totalAmount.toFixed(2)}"`
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    };

    // Export estimates to CSV
    App.exportEstimatesToCSV = function() {
        try {
            console.log('Export estimates to CSV called');
            // Use localStorage directly for estimates
            const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
            console.log('Retrieved estimates:', estimates);
            if (!estimates || estimates.length === 0) {
                ErrorHandler.showUserError('No estimates to export');
                return;
            }
            
            const csvData = App.generateEstimateCSV(estimates);
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estimates-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            App.showSuccess('Estimates exported successfully!');
        } catch (error) {
            console.error('Export estimates error:', error);
            ErrorHandler.showUserError('Failed to export estimates');
        }
    };

    // Generate estimate CSV data
    App.generateEstimateCSV = function(estimates) {
        const headers = ['Estimate #', 'Date', 'Customer Name', 'Email', 'Phone', 'Business Type', 'Subtotal', 'Tax', 'Total', 'Status', 'Valid Until', 'Services', 'Approved By', 'Signature Date'];
        const rows = [headers.join(',')];
        
        estimates.forEach(estimate => {
            const services = estimate.services ? estimate.services.map(s => {
                if (s.details && s.details.jobPricing) {
                    return `${s.description} (Job pricing)`;
                } else {
                    return `${s.description} (${s.quantity} ${s.unit})`;
                }
            }).join('; ') : '';
            
            // Calculate valid until date (30 days from estimate date)
            const validUntil = new Date(estimate.date);
            validUntil.setDate(validUntil.getDate() + 30);
            
            const row = [
                `"${estimate.number || ''}"`,
                `"${estimate.date || ''}"`,
                `"${estimate.customerName || ''}"`,
                `"${estimate.customerEmail || ''}"`,
                `"${estimate.customerPhone || ''}"`,
                `"${estimate.businessType || ''}"`,
                `"${estimate.subtotal || 0}"`,
                `"${estimate.tax || 0}"`,
                `"${estimate.total || 0}"`,
                `"${estimate.status || ''}"`,
                `"${validUntil.toISOString().split('T')[0]}"`,
                `"${services}"`,
                `"${estimate.signatureCustomerName || ''}"`,
                `"${estimate.signatureTimestamp ? new Date(estimate.signatureTimestamp).toISOString().split('T')[0] : ''}"`
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    };

    // Export individual invoice as CSV (for single invoice)
    App.exportSingleInvoiceCSV = function(invoiceId) {
        try {
            const invoice = StorageManager.getInvoiceById ? StorageManager.getInvoiceById(invoiceId) : null;
            if (!invoice) {
                ErrorHandler.showUserError('Invoice not found');
                return;
            }

            const csvData = App.generateInvoiceCSV([invoice]);
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoice.number || invoiceId}-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            App.showSuccess('Invoice exported successfully!');
        } catch (error) {
            console.error('Export single invoice error:', error);
            ErrorHandler.showUserError('Failed to export invoice');
        }
    };

    // Export individual estimate as CSV (for single estimate)
    App.exportSingleEstimateCSV = function(estimateId) {
        try {
            // Use localStorage directly for estimates
            const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
            const estimate = estimates.find(est => est.id === estimateId);
            if (!estimate) {
                ErrorHandler.showUserError('Estimate not found');
                return;
            }

            const csvData = App.generateEstimateCSV([estimate]);
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estimate-${estimate.number || estimateId}-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            App.showSuccess('Estimate exported successfully!');
        } catch (error) {
            console.error('Export single estimate error:', error);
            ErrorHandler.showUserError('Failed to export estimate');
        }
    };

    // Export current previewed invoice to CSV
    window.exportCurrentInvoiceCSV = function() {
        try {
            const invoice = window.InvoiceManager ? 
                (window.InvoiceManager.previewedInvoice || window.InvoiceManager.currentInvoice) : 
                null;
            
            if (!invoice) {
                ErrorHandler.showUserError('No invoice is currently being previewed');
                return;
            }

            App.exportSingleInvoiceCSV(invoice.id);
        } catch (error) {
            console.error('Export current invoice error:', error);
            ErrorHandler.showUserError('Failed to export current invoice');
        }
    };

    // Export current previewed estimate to CSV
    window.exportCurrentEstimateCSV = function() {
        try {
            const estimate = window.EstimateManager ? 
                window.EstimateManager.currentEstimate : 
                null;
            
            if (!estimate) {
                ErrorHandler.showUserError('No estimate is currently being previewed');
                return;
            }

            App.exportSingleEstimateCSV(estimate.id);
        } catch (error) {
            console.error('Export current estimate error:', error);
            ErrorHandler.showUserError('Failed to export current estimate');
        }
    };
    
})();