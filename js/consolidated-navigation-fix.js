/**
 * === CONSOLIDATED NAVIGATION FIX (BEGIN)
 * Single fix for all navigation issues - New Job button, Create Invoice, Create Estimate
 * This replaces and consolidates all previous navigation fixes
 */

(function() {
    'use strict';
    
    console.log('[NAV-FIX:INIT] Loading consolidated navigation fix...');
    
    // ============= FIX 1: NEW JOB DROPDOWN =============
    function fixNewJobDropdown() {
        console.log('[NAV-FIX:DROPDOWN] Fixing New Job dropdown...');
        
        // Ensure toggleNewJobDropdown works
        window.toggleNewJobDropdown = function() {
            console.log('[NAV-FIX:TOGGLE] Toggle New Job dropdown');
            
            const dropdown = document.getElementById('new-job-dropdown');
            if (!dropdown) {
                console.error('[NAV-FIX:ERROR] New job dropdown not found');
                return;
            }
            
            // Check current state
            const isVisible = dropdown.style.display === 'block' || dropdown.classList.contains('show');
            
            // Hide all dropdowns first
            document.querySelectorAll('.dropdown-menu').forEach(d => {
                d.classList.remove('show');
                d.style.display = 'none';
            });
            
            if (!isVisible) {
                // Show this dropdown
                console.log('[NAV-FIX:SHOW] Showing dropdown');
                dropdown.classList.add('show');
                dropdown.style.display = 'block';
                dropdown.style.opacity = '1';
                dropdown.style.visibility = 'visible';
                
                // Position it below the button
                const button = document.getElementById('new-job-btn');
                if (button) {
                    const rect = button.getBoundingClientRect();
                    dropdown.style.position = 'absolute';
                    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
                    dropdown.style.left = rect.left + 'px';
                    dropdown.style.minWidth = rect.width + 'px';
                    dropdown.style.zIndex = '1000';
                }
                
                // Add click-outside listener
                setTimeout(() => {
                    document.addEventListener('click', function closeOnClickOutside(e) {
                        if (!e.target.closest('#new-job-btn') && !e.target.closest('#new-job-dropdown')) {
                            dropdown.style.display = 'none';
                            dropdown.classList.remove('show');
                            document.removeEventListener('click', closeOnClickOutside);
                        }
                    });
                }, 100);
            } else {
                console.log('[NAV-FIX:HIDE] Hiding dropdown');
            }
        };
    }
    
    // ============= FIX 2: CREATE NEW INVOICE =============
    function fixCreateNewInvoice() {
        console.log('[NAV-FIX:INVOICE] Fixing createNewInvoice...');
        
        window.createNewInvoice = function(businessType) {
            console.log('[NAV-FIX:CREATE_INVOICE] Creating invoice with type:', businessType);
            
            // Hide all views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
                view.style.display = 'none';
            });
            
            // Show invoice creation
            const invoiceView = document.getElementById('invoice-creation');
            if (invoiceView) {
                invoiceView.classList.add('active');
                invoiceView.style.display = 'block';
                
                // Update app state
                if (window.App && window.App.AppState) {
                    window.App.AppState.currentView = 'invoice-creation';
                }
                
                // Set business type
                setTimeout(() => {
                    const radio = document.getElementById(`business-${businessType}`);
                    if (radio) {
                        radio.checked = true;
                        radio.click();
                        
                        // Trigger change event
                        const event = new Event('change', { bubbles: true });
                        radio.dispatchEvent(event);
                    }
                }, 100);
                
                // Scroll to top
                window.scrollTo(0, 0);
                
                console.log('[NAV-FIX:SUCCESS] Invoice creation view opened');
            } else {
                console.error('[NAV-FIX:ERROR] Invoice creation view not found');
            }
        };
    }
    
    // ============= FIX 3: CREATE NEW ESTIMATE =============
    function fixCreateNewEstimate() {
        console.log('[NAV-FIX:ESTIMATE] Fixing createNewEstimate...');
        
        window.createNewEstimate = function(businessType) {
            console.log('[NAV-FIX:CREATE_ESTIMATE] Creating estimate with type:', businessType);
            
            // Hide all views
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
                view.style.display = 'none';
            });
            
            // Show estimate creation
            const estimateView = document.getElementById('estimate-creation');
            if (estimateView) {
                estimateView.classList.add('active');
                estimateView.style.display = 'block';
                
                // Update app state
                if (window.App && window.App.AppState) {
                    window.App.AppState.currentView = 'estimate-creation';
                }
                
                // Set business type - try multiple selectors
                setTimeout(() => {
                    let radio = document.getElementById(`estimate-business-${businessType}`);
                    if (!radio) {
                        radio = document.querySelector(`#estimate-creation input[name="estimateBusinessType"][value="${businessType}"]`);
                    }
                    if (radio) {
                        radio.checked = true;
                        radio.click();
                        
                        // Trigger change event
                        const event = new Event('change', { bubbles: true });
                        radio.dispatchEvent(event);
                        
                        console.log('[NAV-FIX:RADIO] Set estimate business type to:', businessType);
                    } else {
                        console.warn('[NAV-FIX:RADIO] Could not find estimate business type radio for:', businessType);
                    }
                }, 100);
                
                // Scroll to top
                window.scrollTo(0, 0);
                
                console.log('[NAV-FIX:SUCCESS] Estimate creation view opened');
            } else {
                console.error('[NAV-FIX:ERROR] Estimate creation view not found');
            }
        };
    }
    
    // ============= FIX 4: QUICK ACTION BUTTONS =============
    function fixQuickActionButtons() {
        console.log('[NAV-FIX:QUICK] Fixing quick action buttons...');
        
        // Create Invoice quick action
        window.showCreateInvoiceOptions = function() {
            console.log('[NAV-FIX:QUICK_INVOICE] Create Invoice quick action clicked');
            
            // Get last used business type
            const invoices = JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
            const lastType = invoices.length > 0 ? 
                invoices[invoices.length - 1].businessType : 'concrete';
            
            // Directly create invoice
            window.createNewInvoice(lastType);
        };
        
        // Create Estimate quick action
        window.showCreateEstimateOptions = function() {
            console.log('[NAV-FIX:QUICK_ESTIMATE] Create Estimate quick action clicked');
            
            // Get last used business type
            const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
            const invoices = JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
            const allDocs = [...estimates, ...invoices].sort((a, b) => 
                new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
            );
            const lastType = allDocs.length > 0 ? allDocs[0].businessType : 'concrete';
            
            // Directly create estimate
            window.createNewEstimate(lastType);
        };
    }
    
    // ============= FIX 5: SHOW DASHBOARD =============
    function fixShowDashboard() {
        console.log('[NAV-FIX:DASHBOARD] Fixing showDashboard...');
        
        // Ensure showDashboard works
        if (!window.showDashboard) {
            window.showDashboard = function() {
                console.log('[NAV-FIX:DASHBOARD] Navigating to dashboard');
                
                // Hide all views
                document.querySelectorAll('.view').forEach(view => {
                    view.classList.remove('active');
                    view.style.display = 'none';
                });
                
                // Show dashboard
                const dashboard = document.getElementById('dashboard');
                if (dashboard) {
                    dashboard.classList.add('active');
                    dashboard.style.display = 'block';
                    
                    // Update app state
                    if (window.App && window.App.AppState) {
                        window.App.AppState.currentView = 'dashboard';
                    }
                    
                    // Refresh dashboard data if App is available
                    if (window.App && window.App.showDashboard) {
                        window.App.showDashboard();
                    }
                } else {
                    console.error('[NAV-FIX:ERROR] Dashboard not found');
                }
            };
        }
    }
    
    // ============= FIX 6: VIEW JOBS TABS =============
    function fixViewJobsTabs() {
        console.log('[NAV-FIX:TABS] Setting up View Jobs tabs...');
        
        function addTabsToView(container, activeTab = 'invoice') {
            // Check if tabs already exist
            if (container.querySelector('.view-jobs-tabs-container')) {
                return;
            }
            
            // Get counts
            const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
            const invoices = JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
            
            // Create tabs HTML
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'view-jobs-tabs-container';
            tabsContainer.innerHTML = `
                <style>
                    .view-jobs-tabs-container {
                        display: flex;
                        gap: 0;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #e0e0e0;
                        background: #f8f9fa;
                        border-radius: 8px 8px 0 0;
                        overflow: hidden;
                    }
                    .view-jobs-tab {
                        flex: 1;
                        padding: 15px 20px;
                        border: none;
                        background: transparent;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 500;
                        color: #666;
                        transition: all 0.3s;
                        position: relative;
                    }
                    .view-jobs-tab:hover {
                        background: #e9ecef;
                        color: #333;
                    }
                    .view-jobs-tab.active {
                        background: white;
                        color: #007bff;
                        font-weight: 600;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .view-jobs-tab.active::after {
                        content: '';
                        position: absolute;
                        bottom: -2px;
                        left: 0;
                        right: 0;
                        height: 3px;
                        background: #007bff;
                    }
                    .view-jobs-tab span.count {
                        background: #6c757d;
                        color: white;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        margin-left: 8px;
                    }
                    .view-jobs-tab.active span.count {
                        background: #007bff;
                    }
                </style>
                <button class="view-jobs-tab ${activeTab === 'invoice' ? 'active' : ''}" data-tab="invoice">
                    <i class="fas fa-file-invoice"></i> Invoices 
                    <span class="count">${invoices.length}</span>
                </button>
                <button class="view-jobs-tab ${activeTab === 'estimate' ? 'active' : ''}" data-tab="estimate">
                    <i class="fas fa-file-contract"></i> Estimates 
                    <span class="count">${estimates.length}</span>
                </button>
            `;
            
            // Find where to insert tabs
            const header = container.querySelector('.list-header') || container.querySelector('h2');
            if (header) {
                header.parentNode.insertBefore(tabsContainer, header);
            } else {
                container.insertBefore(tabsContainer, container.firstChild);
            }
            
            // Add click handlers
            tabsContainer.querySelectorAll('.view-jobs-tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabType = this.dataset.tab;
                    console.log('[NAV-FIX:TAB_CLICK]', tabType);
                    
                    // Update active states
                    tabsContainer.querySelectorAll('.view-jobs-tab').forEach(t => {
                        t.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    // Switch views
                    if (tabType === 'invoice') {
                        if (window.App && window.App.showInvoiceList) {
                            window.App.showInvoiceList();
                        }
                    } else if (tabType === 'estimate') {
                        if (window.App && window.App.showEstimateList) {
                            window.App.showEstimateList();
                        }
                    }
                    
                    // Re-add tabs after view switch
                    setTimeout(() => checkAndAddTabs(), 100);
                });
            });
        }
        
        function checkAndAddTabs() {
            const invoiceList = document.getElementById('invoice-list');
            const estimateList = document.getElementById('estimate-list');
            
            if (invoiceList && invoiceList.classList.contains('active')) {
                addTabsToView(invoiceList, 'invoice');
            } else if (estimateList && estimateList.classList.contains('active')) {
                addTabsToView(estimateList, 'estimate');
            }
        }
        
        // Monitor for view changes
        const observer = new MutationObserver(() => {
            checkAndAddTabs();
        });
        
        const invoiceList = document.getElementById('invoice-list');
        const estimateList = document.getElementById('estimate-list');
        
        if (invoiceList) {
            observer.observe(invoiceList, { attributes: true });
        }
        if (estimateList) {
            observer.observe(estimateList, { attributes: true });
        }
        
        // Initial check
        checkAndAddTabs();
    }
    
    // ============= INITIALIZATION =============
    function initialize() {
        console.log('[NAV-FIX:INIT] Applying all navigation fixes...');
        
        // Apply all fixes
        fixNewJobDropdown();
        fixCreateNewInvoice();
        fixCreateNewEstimate();
        fixQuickActionButtons();
        fixShowDashboard();
        fixViewJobsTabs();
        
        // Re-apply after delays to override any conflicting scripts
        setTimeout(() => {
            fixNewJobDropdown();
            fixCreateNewInvoice();
            fixCreateNewEstimate();
            fixQuickActionButtons();
            fixViewJobsTabs();
        }, 500);
        
        setTimeout(() => {
            fixQuickActionButtons();
            fixCreateNewEstimate();
            fixViewJobsTabs();
        }, 1000);
        
        setTimeout(() => {
            fixQuickActionButtons();
            fixCreateNewEstimate();
        }, 2000);
        
        console.log('[NAV-FIX:READY] All navigation fixes applied');
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Also initialize on load event to catch late scripts
    window.addEventListener('load', initialize);
    
})();

// === CONSOLIDATED NAVIGATION FIX (END)