/**
 * === SAFE-HOTFIX: INV CALC SINGLE PANEL & USE PRICE (BEGIN)
 * Fix duplicate panels and Use Selected Price for invoice
 */

(function() {
    'use strict';
    
    console.log('[INV-CALC:INIT] Invoice calculator hotfix starting...');
    
    // Prevent duplicate panels - remove any "ER Poly Foam Calculation Results" panels
    function preventDuplicatePanels() {
        const invoiceView = document.getElementById('invoice-creation');
        if (!invoiceView || !invoiceView.classList.contains('active')) {
            return;
        }
        
        // Find all result panels
        const allPanels = invoiceView.querySelectorAll('.material-calculation-display, .calculation-results');
        const resultsPanels = [];
        
        allPanels.forEach(panel => {
            // Check if this is the duplicate "ER Poly Foam" panel
            if (panel.textContent.includes('ER Poly Foam Calculation Results')) {
                console.log('[INV-CALC:DUPLICATE_FOUND] Removing duplicate ER Poly Foam panel');
                panel.remove();
            } else if (panel.id === 'calc-results' || panel.classList.contains('calc-results')) {
                resultsPanels.push(panel);
            }
        });
        
        // Log diagnostic info
        console.log('[INV-CALC:SECTIONS]', { resultsPanels: resultsPanels.length });
        
        // Ensure only one results panel
        if (resultsPanels.length > 1) {
            console.warn('[INV-CALC:MULTIPLE_PANELS] Found multiple results panels, keeping first');
            for (let i = 1; i < resultsPanels.length; i++) {
                resultsPanels[i].remove();
            }
        }
    }
    
    // Ensure Use Selected Price button is visible after calculation
    function showUseSelectedPriceButton() {
        const invoiceView = document.getElementById('invoice-creation');
        if (!invoiceView || !invoiceView.classList.contains('active')) {
            return;
        }
        
        const useBtn = document.getElementById('use-selected-price');
        if (useBtn) {
            // Make sure button is visible
            useBtn.style.display = 'inline-block';
            useBtn.style.visibility = 'visible';
            useBtn.style.opacity = '1';
            
            // Set button text if empty
            if (!useBtn.textContent.trim()) {
                useBtn.innerHTML = '<i class="fas fa-check"></i> Use Selected Price';
            }
            
            // Ensure button type is button to prevent form submit
            useBtn.type = 'button';
            
            // Mark as bound for invoice to prevent duplicate handlers
            if (!useBtn.hasAttribute('data-inv-bound')) {
                useBtn.setAttribute('data-inv-bound', '1');
                console.log('[INV-CALC:BTN_READY] Use Selected Price button ready');
            }
        }
    }
    
    // Prevent form submission on Use Selected Price click
    function preventFormSubmit() {
        const useBtn = document.getElementById('use-selected-price');
        if (!useBtn) return;
        
        // Remove any inline onclick that might cause issues
        useBtn.removeAttribute('onclick');
        
        // Add capture phase listener to prevent any form submission
        useBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[INV-ADD:CLICK]');
            // Let slab-manager handle the actual service addition
        }, true);
    }
    
    // Monitor for calculation completion
    document.addEventListener('click', function(e) {
        if (e.target && e.target.textContent && e.target.textContent.includes('Calculate Price')) {
            // After calculation, ensure no duplicates and show button
            setTimeout(() => {
                preventDuplicatePanels();
                showUseSelectedPriceButton();
            }, 500);
            
            setTimeout(() => {
                preventDuplicatePanels();
                showUseSelectedPriceButton();
            }, 1000);
        }
    });
    
    // Monitor business type selection
    document.addEventListener('change', function(e) {
        if (e.target.name === 'businessType' && e.target.value === 'concrete') {
            setTimeout(() => {
                preventDuplicatePanels();
                preventFormSubmit();
            }, 500);
        }
    });
    
    // Monitor view changes
    const observer = new MutationObserver(() => {
        const invoiceView = document.getElementById('invoice-creation');
        if (invoiceView && invoiceView.classList.contains('active')) {
            const concreteSelected = document.getElementById('business-concrete')?.checked;
            if (concreteSelected) {
                preventDuplicatePanels();
                preventFormSubmit();
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
    
    // Initial setup
    setTimeout(() => {
        preventDuplicatePanels();
        preventFormSubmit();
    }, 1000);
    
    console.log('[INV-CALC:READY] Invoice calculator hotfix ready');
    
})();

// === SAFE-HOTFIX: INV CALC SINGLE PANEL & USE PRICE (END)