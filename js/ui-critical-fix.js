/**
 * === CRITICAL-HOTFIX: UI FIXES FOR TABS AND DROPDOWNS (BEGIN)
 * Fixes View Jobs tabs disappearing and dashboard quick action buttons
 */

(function() {
    'use strict';
    
    console.log('[UI-CRITICAL-FIX:INIT] Loading critical UI fixes...');
    
    // ============= FIX 1: VIEW JOBS TABS =============
    function ensureViewJobsTabs() {
        console.log('[UI-CRITICAL-FIX:TABS] Ensuring View Jobs tabs...');
        
        // Function to add tabs to View Jobs
        function addTabsToView(container, activeTab = 'invoice') {
            // Check if tabs already exist
            if (container.querySelector('.view-jobs-tabs-container')) {
                console.log('[UI-CRITICAL-FIX:TABS] Tabs already exist');
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
                        border-radius: 0;
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
                    console.log('[UI-CRITICAL-FIX:TAB_CLICK]', tabType);
                    
                    // Update active states
                    tabsContainer.querySelectorAll('.view-jobs-tab').forEach(t => {
                        t.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    // Switch views
                    if (tabType === 'invoice') {
                        if (window.App && window.App.showInvoiceList) {
                            window.App.showInvoiceList();
                        } else {
                            // Direct DOM manipulation fallback
                            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                            const invoiceList = document.getElementById('invoice-list');
                            if (invoiceList) {
                                invoiceList.classList.add('active');
                                invoiceList.style.display = 'block';
                            }
                        }
                    } else if (tabType === 'estimate') {
                        if (window.App && window.App.showEstimateList) {
                            window.App.showEstimateList();
                        } else {
                            // Direct DOM manipulation fallback
                            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                            const estimateList = document.getElementById('estimate-list');
                            if (estimateList) {
                                estimateList.classList.add('active');
                                estimateList.style.display = 'block';
                            }
                        }
                    }
                    
                    // Re-add tabs after view switch
                    setTimeout(() => ensureViewJobsTabs(), 100);
                });
            });
            
            console.log('[UI-CRITICAL-FIX:TABS] Tabs added successfully');
        }
        
        // Check if we're in invoice or estimate list view
        const invoiceList = document.getElementById('invoice-list');
        const estimateList = document.getElementById('estimate-list');
        
        if (invoiceList && invoiceList.classList.contains('active')) {
            addTabsToView(invoiceList, 'invoice');
        } else if (estimateList && estimateList.classList.contains('active')) {
            addTabsToView(estimateList, 'estimate');
        }
    }
    
    // ============= FIX 2: DASHBOARD QUICK ACTIONS =============
    function fixQuickActionButtons() {
        console.log('[UI-CRITICAL-FIX:BUTTONS] Fixing quick action buttons...');
        
        // Override the functions with working implementations
        window.showCreateInvoiceOptions = function() {
            console.log('[UI-CRITICAL-FIX:INVOICE_BTN] Create Invoice clicked');
            
            // DIRECT METHOD: Force show invoice creation view
            console.log('[UI-CRITICAL-FIX:DIRECT] Forcing invoice creation view');
            
            // Hide all views
            document.querySelectorAll('.view').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
                v.setAttribute('data-view-state', 'inactive');
            });
            
            // Show invoice creation view
            const invoiceCreation = document.getElementById('invoice-creation');
            if (invoiceCreation) {
                invoiceCreation.classList.add('active');
                invoiceCreation.style.display = 'block';
                invoiceCreation.setAttribute('data-view-state', 'active');
                
                // Update app state
                if (window.App && window.App.AppState) {
                    window.App.AppState.currentView = 'invoice-creation';
                }
                
                // Scroll to top
                window.scrollTo(0, 0);
                
                // Get preferred business type
                const recentInvoices = JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
                const lastType = recentInvoices.length > 0 ? 
                    recentInvoices[recentInvoices.length - 1].businessType : 'concrete';
                
                console.log('[UI-CRITICAL-FIX:TYPE] Setting business type to:', lastType);
                
                // Set business type
                setTimeout(() => {
                    const businessRadio = document.getElementById(`business-${lastType}`);
                    if (businessRadio) {
                        businessRadio.checked = true;
                        businessRadio.dispatchEvent(new Event('change', { bubbles: true }));
                        businessRadio.click();
                    }
                }, 200);
                
                console.log('[UI-CRITICAL-FIX:SUCCESS] Invoice creation view is now active');
            } else {
                console.error('[UI-CRITICAL-FIX:ERROR] invoice-creation view not found');
                
                // Fallback to App method
                if (window.App && window.App.showInvoiceCreation) {
                    window.App.showInvoiceCreation();
                }
            }
        };
        
        window.showCreateEstimateOptions = function() {
            console.log('[UI-CRITICAL-FIX:ESTIMATE_BTN] Create Estimate clicked');
            
            // Direct navigation - skip dropdown
            const recentEstimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
            const lastType = recentEstimates.length > 0 ? 
                recentEstimates[recentEstimates.length - 1].businessType : 'concrete';
            
            console.log('[UI-CRITICAL-FIX:CREATE] Creating', lastType, 'estimate');
            
            if (window.createNewEstimate) {
                window.createNewEstimate(lastType);
            } else if (window.App && window.App.createNewEstimate) {
                window.App.createNewEstimate(lastType);
            } else {
                // Ultimate fallback - show estimate creation view
                console.log('[UI-CRITICAL-FIX:FALLBACK] Using direct view switch');
                document.querySelectorAll('.view').forEach(v => {
                    v.classList.remove('active');
                    v.style.display = 'none';
                });
                
                const estimateCreation = document.getElementById('estimate-creation');
                if (estimateCreation) {
                    estimateCreation.classList.add('active');
                    estimateCreation.style.display = 'block';
                    
                    // Set business type
                    const businessRadio = document.querySelector(`#estimate-creation input[value="${lastType}"]`);
                    if (businessRadio) {
                        businessRadio.checked = true;
                        businessRadio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        };
        
        console.log('[UI-CRITICAL-FIX:BUTTONS] Quick action buttons fixed');
    }
    
    // ============= FIX 3: ENSURE DROPDOWN WORKS =============
    function fixDropdownFunctionality() {
        // Fix the toggle function to actually work
        const originalToggle = window.toggleNewJobDropdown;
        
        window.toggleNewJobDropdown = function() {
            console.log('[UI-CRITICAL-FIX:DROPDOWN] Toggle dropdown called');
            
            const dropdown = document.getElementById('new-job-dropdown');
            if (!dropdown) {
                console.error('[UI-CRITICAL-FIX:DROPDOWN] Dropdown not found');
                return;
            }
            
            const isVisible = dropdown.style.display === 'block';
            
            if (isVisible) {
                // Hide it
                dropdown.style.display = 'none';
                dropdown.classList.remove('show');
            } else {
                // Show it
                dropdown.style.display = 'block';
                dropdown.classList.add('show');
                dropdown.style.position = 'absolute';
                dropdown.style.zIndex = '1000';
                
                // Position below button
                const button = document.getElementById('new-job-btn');
                if (button) {
                    const rect = button.getBoundingClientRect();
                    dropdown.style.top = (rect.bottom + 5) + 'px';
                    dropdown.style.left = rect.left + 'px';
                    dropdown.style.minWidth = rect.width + 'px';
                }
                
                // Add click outside listener
                setTimeout(() => {
                    document.addEventListener('click', function closeDropdown(e) {
                        if (!e.target.closest('#new-job-btn') && !e.target.closest('#new-job-dropdown')) {
                            dropdown.style.display = 'none';
                            dropdown.classList.remove('show');
                            document.removeEventListener('click', closeDropdown);
                        }
                    });
                }, 100);
            }
        };
    }
    
    // ============= MONITOR VIEW CHANGES =============
    function monitorViewChanges() {
        // Use MutationObserver to detect when views change
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id === 'invoice-list' || target.id === 'estimate-list') {
                        if (target.classList.contains('active')) {
                            console.log('[UI-CRITICAL-FIX:VIEW_CHANGE] View became active:', target.id);
                            setTimeout(ensureViewJobsTabs, 100);
                        }
                    }
                }
            });
        });
        
        // Observe invoice and estimate list views
        const invoiceList = document.getElementById('invoice-list');
        const estimateList = document.getElementById('estimate-list');
        
        if (invoiceList) {
            observer.observe(invoiceList, { attributes: true });
        }
        if (estimateList) {
            observer.observe(estimateList, { attributes: true });
        }
    }
    
    // ============= INITIALIZATION =============
    function initialize() {
        console.log('[UI-CRITICAL-FIX:INIT] Initializing all fixes...');
        
        // Apply all fixes
        ensureViewJobsTabs();
        fixQuickActionButtons();
        fixDropdownFunctionality();
        monitorViewChanges();
        
        // Re-apply after delays to catch dynamic content
        setTimeout(() => {
            ensureViewJobsTabs();
            fixQuickActionButtons();
        }, 500);
        
        setTimeout(() => {
            ensureViewJobsTabs();
            fixQuickActionButtons();
        }, 1000);
        
        setTimeout(() => {
            ensureViewJobsTabs();
            fixQuickActionButtons();
        }, 2000);
        
        console.log('[UI-CRITICAL-FIX:READY] All UI fixes applied');
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();

// === CRITICAL-HOTFIX: UI FIXES FOR TABS AND DROPDOWNS (END)