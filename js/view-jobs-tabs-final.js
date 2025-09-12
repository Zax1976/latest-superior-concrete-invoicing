/**
 * === SAFE-HOTFIX: VIEW JOBS SHOWS ESTIMATES TAB - FINAL VERSION
 * Adds tabs to switch between invoices and estimates
 */

(function() {
    'use strict';
    
    console.log('[VIEW-JOBS-TABS-FINAL] Loading...');
    
    // Function to add tabs to the current view
    function addTabs() {
        // Check if tabs already exist
        if (document.querySelector('.estimates-invoice-tabs')) {
            return;
        }
        
        // Find the active view
        let targetElement = null;
        let viewType = null;
        
        // Check invoice list
        const invoiceList = document.getElementById('invoice-list');
        if (invoiceList && (invoiceList.classList.contains('active') || invoiceList.style.display !== 'none')) {
            targetElement = invoiceList.querySelector('h2');
            viewType = 'invoice';
        }
        
        // Check estimate list
        const estimateList = document.getElementById('estimate-list');
        if (!targetElement && estimateList && (estimateList.classList.contains('active') || estimateList.style.display !== 'none')) {
            targetElement = estimateList.querySelector('h2');
            viewType = 'estimate';
        }
        
        if (!targetElement) {
            return;
        }
        
        // Get counts
        const estimates = JSON.parse(localStorage.getItem('jstark_estimates') || '[]');
        const invoices = JSON.parse(localStorage.getItem('jstark_invoices') || '[]');
        
        // Create tabs container
        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'estimates-invoice-tabs';
        tabsDiv.innerHTML = `
            <style>
                .estimates-invoice-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    padding: 10px 0;
                    border-bottom: 2px solid #ddd;
                }
                .estimates-invoice-tabs button {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                }
                .estimates-invoice-tabs button:hover {
                    opacity: 0.9;
                }
                .estimates-invoice-tabs button.active {
                    font-weight: bold;
                }
            </style>
            <button id="invoice-tab-btn" class="${viewType === 'invoice' ? 'active' : ''}" 
                    style="background: ${viewType === 'invoice' ? '#007bff' : '#e0e0e0'}; 
                           color: ${viewType === 'invoice' ? 'white' : '#333'};">
                📄 Invoices (${invoices.length})
            </button>
            <button id="estimate-tab-btn" class="${viewType === 'estimate' ? 'active' : ''}" 
                    style="background: ${viewType === 'estimate' ? '#28a745' : '#e0e0e0'}; 
                           color: ${viewType === 'estimate' ? 'white' : '#333'};">
                📋 Estimates (${estimates.length})
            </button>
        `;
        
        // Insert tabs before the h2
        targetElement.parentNode.insertBefore(tabsDiv, targetElement);
        
        // Add click handlers
        document.getElementById('invoice-tab-btn').addEventListener('click', function() {
            if (window.App && window.App.showInvoiceList) {
                window.App.showInvoiceList();
                setTimeout(addTabs, 300);
            }
        });
        
        document.getElementById('estimate-tab-btn').addEventListener('click', function() {
            if (window.App && window.App.showEstimateList) {
                window.App.showEstimateList();
                setTimeout(addTabs, 300);
            }
        });
        
        console.log('[VIEW-JOBS-TABS-FINAL] ✅ Tabs added');
    }
    
    // Try to add tabs whenever a view changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // Check if invoice-list or estimate-list became active
                const target = mutation.target;
                if ((target.id === 'invoice-list' || target.id === 'estimate-list') && 
                    target.classList.contains('active')) {
                    setTimeout(addTabs, 100);
                }
            }
        });
    });
    
    // Start observing
    setTimeout(function() {
        const invoiceList = document.getElementById('invoice-list');
        const estimateList = document.getElementById('estimate-list');
        
        if (invoiceList) {
            observer.observe(invoiceList, { attributes: true });
        }
        if (estimateList) {
            observer.observe(estimateList, { attributes: true });
        }
        
        console.log('[VIEW-JOBS-TABS-FINAL] ✅ Observer started');
    }, 1000);
    
    // Override the View Jobs button handler
    const overrideViewJobs = function() {
        const originalShowAllInvoices = window.showAllInvoices;
        
        window.showAllInvoices = function() {
            console.log('[VIEW-JOBS-TABS-FINAL] View Jobs clicked');
            
            // Call original
            if (originalShowAllInvoices) {
                originalShowAllInvoices();
            } else if (window.App && window.App.showInvoiceList) {
                window.App.showInvoiceList();
            }
            
            // Add tabs
            setTimeout(addTabs, 300);
            setTimeout(addTabs, 600);
            setTimeout(addTabs, 1000);
        };
        
        console.log('[VIEW-JOBS-TABS-FINAL] ✅ View Jobs override installed');
    };
    
    // Install override immediately and after delays
    overrideViewJobs();
    setTimeout(overrideViewJobs, 100);
    setTimeout(overrideViewJobs, 500);
    
    // Also override estimate list show
    setTimeout(function() {
        if (window.App && window.App.showEstimateList) {
            const original = window.App.showEstimateList;
            window.App.showEstimateList = function() {
                const result = original.apply(this, arguments);
                setTimeout(addTabs, 300);
                return result;
            };
            console.log('[VIEW-JOBS-TABS-FINAL] ✅ Estimate list enhanced');
        }
    }, 1000);
    
    console.log('[VIEW-JOBS-TABS-FINAL] ✅ Loaded');
})();