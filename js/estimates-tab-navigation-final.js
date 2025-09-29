/**
 * === SAFE-HOTFIX: ESTIMATES TAB CLICKABILITY (BEGIN)
 * Final consolidated fix for Estimates tab navigation
 */

(function() {
    'use strict';
    
    console.log('[EST-TAB:INIT] Loading final navigation fix...');
    
    // Global flag to prevent multiple bindings
    window._estimatesTabFixed = window._estimatesTabFixed || false;
    
    function fixEstimatesTabNavigation() {
        // Skip if already fixed
        if (window._estimatesTabFixed) {
            console.log('[EST-TAB:SKIP] Already fixed');
            return;
        }
        
        // Wait for DOM to be ready
        if (!document.body) {
            setTimeout(fixEstimatesTabNavigation, 100);
            return;
        }
        
        // Find Estimates tab - try multiple selectors
        let estimatesTab = document.querySelector('#estimate-tab-btn');
        if (!estimatesTab) {
            estimatesTab = document.querySelector('button[id*="estimate"]');
        }
        if (!estimatesTab) {
            // Search by text content
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.textContent && btn.textContent.includes('Estimates')) {
                    estimatesTab = btn;
                    break;
                }
            }
        }
        
        if (!estimatesTab) {
            console.log('[EST-TAB:NOT_FOUND] Tab not found, will retry');
            setTimeout(fixEstimatesTabNavigation, 500);
            return;
        }
        
        console.log('[EST-TAB:FOUND]', {
            selector: estimatesTab.id || estimatesTab.className,
            visible: estimatesTab.offsetParent !== null
        });
        
        // Enable the tab
        estimatesTab.removeAttribute('disabled');
        estimatesTab.removeAttribute('aria-disabled');
        estimatesTab.style.pointerEvents = 'auto';
        estimatesTab.style.cursor = 'pointer';
        
        console.log('[EST-TAB:ENABLED]', {
            focusable: true,
            ariaDisabled: false,
            pointerEvents: 'auto'
        });
        
        // Override onclick directly
        estimatesTab.onclick = function(e) {
            console.log('[EST-TAB:CLICK]');
            e.preventDefault();
            e.stopPropagation();
            
            // Force navigation to estimate list
            console.log('[NAV:SHOW_VIEW] \'estimate-list\'');
            
            // Method 1: Use App.showEstimateList if available
            if (window.App && typeof window.App.showEstimateList === 'function') {
                window.App.showEstimateList();
            } 
            // Method 2: Use App.showView
            else if (window.App && typeof window.App.showView === 'function') {
                window.App.showView('estimate-list');
            }
            // Method 3: Direct DOM manipulation
            else {
                // Hide all views
                const views = document.querySelectorAll('.view');
                views.forEach(v => {
                    v.classList.remove('active');
                    v.style.display = 'none';
                });
                
                // Show estimate list
                const estimateList = document.getElementById('estimate-list');
                if (estimateList) {
                    estimateList.classList.add('active');
                    estimateList.style.display = 'block';
                    
                    // Populate the list
                    if (window.App && window.App.populateEstimateList) {
                        window.App.populateEstimateList();
                    }
                }
            }
            
            // Update tab appearance
            updateTabAppearance('estimate');
            
            return false;
        };
        
        // Also add event listener as backup
        estimatesTab.addEventListener('click', function(e) {
            if (estimatesTab.onclick) {
                estimatesTab.onclick(e);
            }
        }, true);
        
        // Add keyboard support
        estimatesTab.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                estimatesTab.onclick(e);
            }
        });
        
        console.log('[EST-TAB:BIND_OK]', { delegated: false });
        
        // Mark as fixed
        window._estimatesTabFixed = true;
        
        // Also fix Invoices tab to ensure it still works
        fixInvoicesTab();
    }
    
    function fixInvoicesTab() {
        // Find button by ID or by text content
        let invoicesTab = document.querySelector('#invoice-tab-btn');
        if (!invoicesTab) {
            // Find button containing "Invoices" text
            const buttons = document.querySelectorAll('button');
            invoicesTab = Array.from(buttons).find(btn => btn.textContent.includes('Invoices'));
        }
        
        if (invoicesTab && !invoicesTab.getAttribute('data-nav-fixed')) {
            invoicesTab.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (window.App && typeof window.App.showInvoiceList === 'function') {
                    window.App.showInvoiceList();
                } else if (window.App && typeof window.App.showView === 'function') {
                    window.App.showView('invoice-list');
                }
                
                updateTabAppearance('invoice');
                return false;
            };
            
            invoicesTab.setAttribute('data-nav-fixed', '1');
        }
    }
    
    function updateTabAppearance(activeTab) {
        const invoicesTab = document.querySelector('#invoice-tab-btn');
        const estimatesTab = document.querySelector('#estimate-tab-btn');
        
        if (invoicesTab) {
            if (activeTab === 'invoice') {
                invoicesTab.style.background = '#007bff';
                invoicesTab.style.color = 'white';
            } else {
                invoicesTab.style.background = '#e0e0e0';
                invoicesTab.style.color = '#333';
            }
        }
        
        if (estimatesTab) {
            if (activeTab === 'estimate') {
                estimatesTab.style.background = '#28a745';
                estimatesTab.style.color = 'white';
            } else {
                estimatesTab.style.background = '#e0e0e0';
                estimatesTab.style.color = '#333';
            }
        }
    }
    
    // Monitor for tabs being created/recreated
    const observer = new MutationObserver(function(mutations) {
        // If estimates tab is added/changed, reset the fix flag and reapply
        for (const mutation of mutations) {
            if (mutation.addedNodes) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && 
                        (node.id === 'estimate-tab-btn' || 
                         (node.textContent && node.textContent.includes('Estimates')))) {
                        console.log('[EST-TAB:RECREATED] Tab recreated, reapplying fix');
                        window._estimatesTabFixed = false;
                        setTimeout(fixEstimatesTabNavigation, 100);
                        return;
                    }
                }
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Apply fix at various times
    fixEstimatesTabNavigation();
    setTimeout(fixEstimatesTabNavigation, 500);
    setTimeout(fixEstimatesTabNavigation, 1000);
    setTimeout(fixEstimatesTabNavigation, 2000);
    setTimeout(fixEstimatesTabNavigation, 3000);
    
    // Global function for manual testing
    window.manualFixEstimatesTab = function() {
        window._estimatesTabFixed = false;
        fixEstimatesTabNavigation();
        console.log('[EST-TAB:MANUAL] Manual fix applied');
    };
    
    console.log('[EST-TAB:READY] Final navigation fix ready');
})();

// === SAFE-HOTFIX: ESTIMATES TAB CLICKABILITY (END)