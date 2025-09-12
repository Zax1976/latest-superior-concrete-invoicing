/**
 * Mobile Menu Handler
 * Creates and manages hamburger menu for mobile/tablet devices
 */

(function() {
    'use strict';
    
    // Only initialize on mobile/tablet (NOT desktop)
    function initMobileMenu() {
        // === SAFE-HOTFIX: MOBILE_NAV_BIND (BEGIN)
        // Remove any existing menu if screen is desktop size
        if (window.innerWidth > 1024) {
            const existingToggle = document.querySelector('.mobile-menu-toggle');
            const existingNav = document.querySelector('.mobile-nav');
            if (existingToggle) existingToggle.remove();
            if (existingNav) existingNav.remove();
            return;
        }
        
        // Check if menu already exists
        if (document.querySelector('.mobile-menu-toggle')) {
            console.log('[MOBILE-NAV:FOUND] {btn:true, panel:' + !!document.querySelector('.mobile-nav') + '}');
            return;
        }
        // === SAFE-HOTFIX: MOBILE_NAV_BIND (END)
        
        // Create hamburger menu button
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.setAttribute('aria-label', 'Menu');
        menuToggle.innerHTML = '<span></span><span></span><span></span>';
        
        // Ensure visibility with inline styles as backup
        menuToggle.style.cssText = `
            display: block !important;
            position: fixed !important;
            top: 3px !important;
            right: 10px !important;
            z-index: 100001 !important;
            width: 44px !important;
            height: 44px !important;
            background: rgba(255, 255, 255, 0.95) !important;
            border: 2px solid #DC143C !important;
            border-radius: 5px !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
            cursor: pointer !important;
            padding: 0 !important;
        `;
        
        // Style the hamburger lines
        const spans = menuToggle.querySelectorAll('span');
        spans.forEach((span, index) => {
            span.style.cssText = `
                display: block !important;
                width: 24px !important;
                height: 3px !important;
                background-color: #DC143C !important;
                margin: 5px auto !important;
                border-radius: 2px !important;
                transition: all 0.3s ease !important;
            `;
        });
        
        // Create mobile navigation
        const mobileNav = document.createElement('nav');
        mobileNav.className = 'mobile-nav';
        mobileNav.setAttribute('role', 'navigation');
        mobileNav.innerHTML = `
            <div class="mobile-nav-content">
                <a href="#" class="mobile-nav-item" data-action="dashboard">
                    <i class="icon">🏠</i> Dashboard
                </a>
                <div style="padding: 10px 20px; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Create New</div>
                <a href="#" class="mobile-nav-item btn-primary" data-action="new-invoice">
                    <i class="icon">📄</i> New Invoice
                </a>
                <a href="#" class="mobile-nav-item btn-primary" data-action="new-estimate">
                    <i class="icon">📋</i> New Estimate
                </a>
                <div style="padding: 10px 20px; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">View</div>
                <a href="#" class="mobile-nav-item" data-action="view-invoices">
                    <i class="icon">📂</i> View Invoices
                </a>
                <a href="#" class="mobile-nav-item" data-action="view-estimates">
                    <i class="icon">📊</i> View Estimates
                </a>
                <a href="#" class="mobile-nav-item" data-action="customers">
                    <i class="icon">👥</i> Customers
                </a>
                <div style="padding: 10px 20px; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Other</div>
                <a href="#" class="mobile-nav-item" data-action="settings">
                    <i class="icon">⚙️</i> Settings
                </a>
            </div>
        `;
        
        // === SAFE-HOTFIX: MOBILE_NAV_BIND (BEGIN)
        // Add to body
        document.body.appendChild(menuToggle);
        document.body.appendChild(mobileNav);
        console.log('[MOBILE-NAV:BOUND] Menu created and added to DOM');
        // === SAFE-HOTFIX: MOBILE_NAV_BIND (END)
        
        // Toggle menu function
        function toggleMenu() {
            const isActive = menuToggle.classList.contains('active');
            
            if (isActive) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        }
        
        // Open menu
        function openMobileMenu() {
            // === SAFE-HOTFIX: MOBILE_NAV_BIND (BEGIN)
            menuToggle.classList.add('active');
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('[MOBILE-NAV:OPEN]');
            // === SAFE-HOTFIX: MOBILE_NAV_BIND (END)
            
            // Add escape key listener
            document.addEventListener('keydown', handleEscape);
        }
        
        // Close menu
        window.closeMobileMenu = function() {
            // === SAFE-HOTFIX: MOBILE_NAV_BIND (BEGIN)
            menuToggle.classList.remove('active');
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
            console.log('[MOBILE-NAV:CLOSE]');
            // === SAFE-HOTFIX: MOBILE_NAV_BIND (END)
            
            // Remove escape key listener
            document.removeEventListener('keydown', handleEscape);
        };
        
        // Handle escape key
        function handleEscape(e) {
            if (e.key === 'Escape') {
                window.closeMobileMenu();
            }
        }
        
        // Add click event to toggle button
        menuToggle.addEventListener('click', toggleMenu);
        
        // Add click handlers for menu items
        mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const action = this.getAttribute('data-action');
                
                // Close menu first
                window.closeMobileMenu();
                
                // Then perform action
                if (window.App) {
                    switch(action) {
                        case 'dashboard':
                            window.App.showDashboard && window.App.showDashboard();
                            break;
                        case 'new-invoice':
                            // Call the global function that exists
                            if (window.createNewInvoice) {
                                window.createNewInvoice('concrete');
                            } else if (window.App && window.App.showInvoiceCreation) {
                                window.App.showInvoiceCreation();
                            }
                            break;
                        case 'new-estimate':
                            // Call the global function that exists
                            if (window.createNewEstimate) {
                                window.createNewEstimate('concrete');
                            } else if (window.App && window.App.showEstimateCreation) {
                                window.App.showEstimateCreation();
                            }
                            break;
                        case 'view-invoices':
                            window.App.showInvoiceList && window.App.showInvoiceList();
                            break;
                        case 'view-estimates':
                            window.App.showEstimateList && window.App.showEstimateList();
                            break;
                        case 'customers':
                            window.App.showCustomerList && window.App.showCustomerList();
                            break;
                        case 'settings':
                            window.App.showSettings && window.App.showSettings();
                            break;
                    }
                }
            });
        });
        
        // Close menu when clicking outside
        mobileNav.addEventListener('click', function(e) {
            if (e.target === mobileNav) {
                window.closeMobileMenu();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 1024) {
                // Remove menu on desktop
                const toggle = document.querySelector('.mobile-menu-toggle');
                const nav = document.querySelector('.mobile-nav');
                if (toggle) toggle.remove();
                if (nav) nav.remove();
            } else {
                // Re-initialize on mobile if needed
                if (!document.querySelector('.mobile-menu-toggle')) {
                    initMobileMenu();
                }
            }
        });
    }
    
    // Add data-labels to table cells for mobile card view
    function addTableLabels() {
        const tables = document.querySelectorAll('.invoices-table, .estimates-table, .jobs-table');
        
        tables.forEach(table => {
            const headers = table.querySelectorAll('thead th');
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        const label = headers[index].textContent.trim();
                        cell.setAttribute('data-label', label);
                    }
                });
            });
        });
    }
    
    // Fix form field colors on mobile (prevent dark mode)
    function fixMobileColors() {
        if (window.innerWidth <= 1024) {
            // Force light theme
            document.documentElement.style.setProperty('--white', '#ffffff');
            document.documentElement.style.setProperty('--light-gray', '#f4f4f4');
            document.documentElement.style.setProperty('--dark-gray', '#333333');
            document.documentElement.style.setProperty('--border-color', '#e0e0e0');
            
            // Remove any dark mode class
            document.body.classList.remove('dark-mode', 'dark-theme');
        }
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initMobileMenu();
            addTableLabels();
            fixMobileColors();
        });
    } else {
        initMobileMenu();
        addTableLabels();
        fixMobileColors();
    }
    
    // Re-initialize when views change
    // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (BEGIN)
    if (window.App) {
        const originalShowView = window.App.showView;
        window.App.showView = function(viewName) {
            // CRITICAL: Must return the Promise from originalShowView
            const result = originalShowView.call(this, viewName);
            
            // Handle both Promise and non-Promise returns
            if (result && typeof result.then === 'function') {
                return result.then(res => {
                    // === SAFE-HOTFIX: MOBILE_NAV_RESTORE (BEGIN)
                    setTimeout(() => {
                        // Re-initialize mobile menu after view change
                        initMobileMenu();
                        console.log('[MOBILE-NAV:REBOUND] After view change');
                        
                        addTableLabels();
                        fixMobileColors();
                    }, 100);
                    // === SAFE-HOTFIX: MOBILE_NAV_RESTORE (END)
                    return res;
                });
            } else {
                // Fallback for non-Promise return
                setTimeout(() => {
                    // === SAFE-HOTFIX: MOBILE_NAV_RESTORE (BEGIN)
                    // Re-initialize mobile menu after view change
                    initMobileMenu();
                    console.log('[MOBILE-NAV:REBOUND] After view change (non-promise)');
                    // === SAFE-HOTFIX: MOBILE_NAV_RESTORE (END)
                    
                    addTableLabels();
                    fixMobileColors();
                }, 100);
                return result;
            }
        };
    }
    // === SAFE-HOTFIX: NAV_PROMISE_CONTRACT (END)
    
    // Handle dynamic content
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Check if tables were added
                const addedNodes = Array.from(mutation.addedNodes);
                const hasTables = addedNodes.some(node => 
                    node.nodeType === 1 && (
                        node.classList?.contains('invoices-table') ||
                        node.classList?.contains('estimates-table') ||
                        node.classList?.contains('jobs-table') ||
                        node.querySelector?.('.invoices-table, .estimates-table, .jobs-table')
                    )
                );
                
                if (hasTables) {
                    setTimeout(addTableLabels, 100);
                }
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();