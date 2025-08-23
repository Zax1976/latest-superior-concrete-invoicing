/**
 * === SAFE-HOTFIX: INVOICE CALC PRICE FIX (BEGIN)
 * Fix invoice calculator "Use Selected Price" button not working
 */

(function() {
    'use strict';
    
    console.log('[INV-CALC-FIX:INIT] Loading invoice calculator fix...');
    
    // Function to ensure calculator runs and populates prices
    function ensureInvoiceCalculatorWorks() {
        // Check if we're in invoice context
        const invoiceCreation = document.getElementById('invoice-creation');
        if (!invoiceCreation || !invoiceCreation.classList.contains('active')) {
            return;
        }
        
        // Find the calculate button
        const calculateBtn = document.getElementById('calculate-poly') || 
                           document.querySelector('button[onclick*="calculateMaterialBasedPrice"]');
        
        if (calculateBtn) {
            // Store original onclick
            const originalOnclick = calculateBtn.onclick;
            
            // Wrap the calculate button to ensure prices are populated
            calculateBtn.onclick = function(e) {
                console.log('[INV-CALC-FIX:CALCULATE] Running invoice calculator...');
                
                // Call original calculator
                if (originalOnclick) {
                    originalOnclick.call(this, e);
                }
                
                // After calculation, verify prices are populated
                setTimeout(() => {
                    verifyAndFixPrices();
                }, 100);
            };
        }
    }
    
    // Function to verify prices are populated and fix if needed
    function verifyAndFixPrices() {
        const priceLow = document.getElementById('out-price-low');
        const priceMid = document.getElementById('out-price-mid');
        const priceHigh = document.getElementById('out-price-high');
        
        // Check if prices are still empty
        if (priceMid && (priceMid.textContent === '$-' || priceMid.textContent === '-')) {
            console.log('[INV-CALC-FIX:EMPTY_PRICES] Prices not populated, attempting fix...');
            
            // Try to get prices from calc-results dataset
            const calcResults = document.getElementById('calc-results');
            if (calcResults && calcResults.dataset) {
                const ds = calcResults.dataset;
                
                if (ds.priceLow && priceLow) {
                    priceLow.textContent = '$' + parseFloat(ds.priceLow).toFixed(2);
                }
                if (ds.priceMid && priceMid) {
                    priceMid.textContent = '$' + parseFloat(ds.priceMid).toFixed(2);
                }
                if (ds.priceHigh && priceHigh) {
                    priceHigh.textContent = '$' + parseFloat(ds.priceHigh).toFixed(2);
                }
                
                console.log('[INV-CALC-FIX:PRICES_FIXED]', {
                    low: priceLow?.textContent,
                    mid: priceMid?.textContent,
                    high: priceHigh?.textContent
                });
            }
        }
    }
    
    // Function to fix the Use Selected Price button for invoice
    function fixUseSelectedPriceForInvoice() {
        // Find the Use Selected Price button
        const useBtn = document.getElementById('use-selected-price');
        if (!useBtn) return;
        
        // Add a pre-click handler to ensure prices are available
        const originalOnclick = useBtn.onclick;
        
        useBtn.onclick = function(e) {
            console.log('[INV-CALC-FIX:USE_CLICK] Use Selected Price clicked in invoice');
            
            // Check if we're in invoice context
            const isInvoice = !document.querySelector('.estimate-concrete-section') &&
                            !document.querySelector('input[name="estimateBusinessType"][value="concrete"]:checked') &&
                            document.getElementById('invoice-creation')?.classList.contains('active');
            
            if (isInvoice) {
                // Verify prices are available
                const priceMid = document.getElementById('out-price-mid');
                if (priceMid && (priceMid.textContent === '$-' || priceMid.textContent === '-')) {
                    console.log('[INV-CALC-FIX:NO_PRICE] No price available, please calculate first');
                    alert('Please click "Calculate Price" first to generate prices.');
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                // Log the price that will be used
                const priceText = priceMid?.textContent?.trim();
                const priceValue = priceText ? parseFloat(priceText.replace(/[^0-9.-]/g, '')) : 0;
                console.log('[INV-CALC-FIX:PRICE_READY]', { price: priceValue });
            }
            
            // Call original handler
            if (originalOnclick) {
                return originalOnclick.call(this, e);
            }
        };
    }
    
    // Function to ensure invoice inputs are readable
    function fixInvoiceInputs() {
        // Make sure invoice calculator inputs have proper IDs
        const invoiceCreation = document.getElementById('invoice-creation');
        if (!invoiceCreation) return;
        
        // Verify input IDs are correct
        const inputs = {
            'calc-length': 'Length input',
            'calc-width': 'Width input', 
            'calc-depth': 'Depth input',
            'calc-sides': 'Sides input'
        };
        
        Object.keys(inputs).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                // Make sure input is visible and enabled
                input.style.visibility = 'visible';
                input.disabled = false;
                console.log('[INV-CALC-FIX:INPUT_OK]', { id, value: input.value });
            } else {
                console.log('[INV-CALC-FIX:INPUT_MISSING]', { id });
            }
        });
    }
    
    // Initialize fixes when DOM is ready
    function initFixes() {
        ensureInvoiceCalculatorWorks();
        fixUseSelectedPriceForInvoice();
        fixInvoiceInputs();
        
        // Also check when view changes
        if (window.App) {
            const originalShowView = window.App.showView;
            if (originalShowView && !originalShowView._invoiceCalcFixed) {
                window.App.showView = function(viewId) {
                    const result = originalShowView.apply(this, arguments);
                    
                    if (viewId === 'invoice-creation') {
                        setTimeout(() => {
                            ensureInvoiceCalculatorWorks();
                            fixUseSelectedPriceForInvoice();
                            fixInvoiceInputs();
                        }, 100);
                    }
                    
                    return result;
                };
                window.App.showView._invoiceCalcFixed = true;
            }
        }
    }
    
    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFixes);
    } else {
        initFixes();
    }
    
    // Also run after a delay to catch dynamic content
    setTimeout(initFixes, 1000);
    setTimeout(initFixes, 2000);
    
    console.log('[INV-CALC-FIX:READY] Invoice calculator fix loaded');
    
})();

// === SAFE-HOTFIX: INVOICE CALC PRICE FIX (END)