/**
 * === SAFE-HOTFIX: DASHBOARD BUTTONS FIX (BEGIN)
 * Fix dashboard quick action buttons for Create Invoice and Create Estimate
 */

(function() {
    'use strict';
    
    console.log('[DASHBOARD-FIX:INIT] Loading dashboard buttons fix...');
    
    // Override the problematic functions with working implementations
    function fixDashboardButtons() {
        console.log('[DASHBOARD-FIX:PATCHING] Fixing dashboard button functions...');
        
        // Fix Create Invoice button
        window.showCreateInvoiceOptions = function() {
            console.log('[DASHBOARD-FIX:INVOICE] Create Invoice button clicked');
            
            // Method 1: Click the actual New Job button to trigger its dropdown
            const newJobBtn = document.getElementById('new-job-btn');
            if (newJobBtn) {
                console.log('[DASHBOARD-FIX:CLICK] Clicking New Job button');
                newJobBtn.click();
                
                // After dropdown opens, focus on invoice options
                setTimeout(() => {
                    const dropdown = document.getElementById('new-job-dropdown');
                    if (dropdown && dropdown.classList.contains('show')) {
                        const concreteOption = dropdown.querySelector('button[onclick*="concrete"]');
                        if (concreteOption) {
                            concreteOption.focus();
                            console.log('[DASHBOARD-FIX:FOCUS] Focused on Concrete Invoice option');
                        }
                    }
                }, 100);
                
                return;
            }
            
            // Method 2: Try to manually trigger the dropdown toggle
            if (window.toggleNewJobDropdown) {
                console.log('[DASHBOARD-FIX:TOGGLE] Calling toggleNewJobDropdown');
                window.toggleNewJobDropdown();
                return;
            }
            
            // Method 3: Force dropdown visibility with styles
            const dropdown = document.getElementById('new-job-dropdown');
            if (dropdown) {
                console.log('[DASHBOARD-FIX:FORCE] Forcing dropdown visibility');
                
                // Remove any hiding classes/styles
                dropdown.classList.remove('hide', 'hidden', 'd-none');
                dropdown.classList.add('show');
                
                // Force display with inline styles
                dropdown.style.display = 'block';
                dropdown.style.visibility = 'visible';
                dropdown.style.opacity = '1';
                
                // Position it correctly
                const button = document.getElementById('new-job-btn');
                if (button) {
                    const rect = button.getBoundingClientRect();
                    dropdown.style.position = 'absolute';
                    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
                    dropdown.style.left = rect.left + 'px';
                }
                
                return;
            }
            
            // Method 4: Fallback - directly navigate to invoice creation
            console.log('[DASHBOARD-FIX:FALLBACK] Using direct navigation to invoice');
            if (window.createNewInvoice) {
                // Check recent activity to determine preferred type
                const invoices = JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
                const lastInvoice = invoices[invoices.length - 1];
                const preferredType = lastInvoice?.businessType || 'concrete';
                
                console.log('[DASHBOARD-FIX:CREATE] Creating', preferredType, 'invoice');
                window.createNewInvoice(preferredType);
            } else if (window.App && window.App.showInvoiceCreation) {
                // Ultimate fallback
                window.App.showInvoiceCreation();
            }
        };
        
        // Fix Create Estimate button
        window.showCreateEstimateOptions = function() {
            console.log('[DASHBOARD-FIX:ESTIMATE] Create Estimate button clicked');
            
            // Method 1: Click the actual New Job button to trigger its dropdown
            const newJobBtn = document.getElementById('new-job-btn');
            if (newJobBtn) {
                console.log('[DASHBOARD-FIX:CLICK] Clicking New Job button for estimate');
                newJobBtn.click();
                
                // After dropdown opens, focus on estimate options
                setTimeout(() => {
                    const dropdown = document.getElementById('new-job-dropdown');
                    if (dropdown && dropdown.classList.contains('show')) {
                        const estimateOptions = dropdown.querySelectorAll('button[onclick*="Estimate"]');
                        if (estimateOptions.length > 0) {
                            estimateOptions[0].focus();
                            console.log('[DASHBOARD-FIX:FOCUS] Focused on first Estimate option');
                        }
                    }
                }, 100);
                
                return;
            }
            
            // Method 2: Try to manually trigger the dropdown toggle
            if (window.toggleNewJobDropdown) {
                console.log('[DASHBOARD-FIX:TOGGLE] Calling toggleNewJobDropdown for estimate');
                window.toggleNewJobDropdown();
                return;
            }
            
            // Method 3: Force dropdown visibility with styles
            const dropdown = document.getElementById('new-job-dropdown');
            if (dropdown) {
                console.log('[DASHBOARD-FIX:FORCE] Forcing dropdown visibility for estimate');
                
                // Remove any hiding classes/styles
                dropdown.classList.remove('hide', 'hidden', 'd-none');
                dropdown.classList.add('show');
                
                // Force display with inline styles
                dropdown.style.display = 'block';
                dropdown.style.visibility = 'visible';
                dropdown.style.opacity = '1';
                
                // Position it correctly
                const button = document.getElementById('new-job-btn');
                if (button) {
                    const rect = button.getBoundingClientRect();
                    dropdown.style.position = 'absolute';
                    dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
                    dropdown.style.left = rect.left + 'px';
                }
                
                // Focus on estimate option
                setTimeout(() => {
                    const estimateOptions = dropdown.querySelectorAll('button[onclick*="Estimate"]');
                    if (estimateOptions.length > 0) {
                        estimateOptions[0].focus();
                    }
                }, 100);
                
                return;
            }
            
            // Method 4: Fallback - directly navigate to estimate creation
            console.log('[DASHBOARD-FIX:FALLBACK] Using direct navigation to estimate');
            if (window.createNewEstimate) {
                // Check recent activity to determine preferred type
                const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
                const lastEstimate = estimates[estimates.length - 1];
                const preferredType = lastEstimate?.businessType || 'concrete';
                
                console.log('[DASHBOARD-FIX:CREATE] Creating', preferredType, 'estimate');
                window.createNewEstimate(preferredType);
            } else if (window.App && window.App.showEstimateCreation) {
                // Ultimate fallback
                window.App.showEstimateCreation();
            }
        };
        
        console.log('[DASHBOARD-FIX:PATCHED] Dashboard button functions fixed');
    }
    
    // Also ensure dropdown toggle function works
    function ensureDropdownToggle() {
        if (!window.toggleNewJobDropdown) {
            window.toggleNewJobDropdown = function() {
                console.log('[DASHBOARD-FIX:TOGGLE] Toggle new job dropdown');
                const dropdown = document.getElementById('new-job-dropdown');
                if (!dropdown) {
                    console.error('[DASHBOARD-FIX:ERROR] New job dropdown not found');
                    return;
                }
                
                const isVisible = dropdown.classList.contains('show');
                
                // Hide all dropdowns
                const allDropdowns = document.querySelectorAll('.dropdown-menu.show');
                allDropdowns.forEach(d => d.classList.remove('show'));
                
                // Toggle this dropdown
                if (!isVisible) {
                    dropdown.classList.add('show');
                }
                
                // Add click-outside listener
                if (!isVisible) {
                    setTimeout(() => {
                        document.addEventListener('click', function closeDropdown(e) {
                            if (!e.target.closest('.dropdown')) {
                                dropdown.classList.remove('show');
                                document.removeEventListener('click', closeDropdown);
                            }
                        });
                    }, 100);
                }
            };
        }
    }
    
    // Also add keyboard support for quick actions
    function addKeyboardSupport() {
        document.addEventListener('keydown', function(e) {
            // Only work on dashboard
            const dashboard = document.getElementById('dashboard');
            if (!dashboard || !dashboard.classList.contains('active')) return;
            
            // Alt+N for new invoice
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                console.log('[DASHBOARD-FIX:HOTKEY] Alt+N pressed');
                window.showCreateInvoiceOptions();
            }
            
            // Alt+E for new estimate
            if (e.altKey && e.key === 'e') {
                e.preventDefault();
                console.log('[DASHBOARD-FIX:HOTKEY] Alt+E pressed');
                window.showCreateEstimateOptions();
            }
        });
    }
    
    // Initialize fixes
    function initialize() {
        fixDashboardButtons();
        ensureDropdownToggle();
        addKeyboardSupport();
        
        // Also fix after a delay to override any late-loading scripts
        setTimeout(fixDashboardButtons, 500);
        setTimeout(fixDashboardButtons, 1000);
        setTimeout(fixDashboardButtons, 2000);
        
        console.log('[DASHBOARD-FIX:READY] Dashboard buttons fix ready');
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();

// === SAFE-HOTFIX: DASHBOARD BUTTONS FIX (END)