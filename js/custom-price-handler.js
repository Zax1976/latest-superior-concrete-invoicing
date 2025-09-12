/**
 * Custom Price Handler for Concrete Calculator
 * Handles custom price selection in the pricing options
 */

(function() {
    'use strict';
    
    console.log('[CUSTOM-PRICE-HANDLER] Loading...');
    
    /**
     * Get the selected price based on the radio button selection
     * @returns {number|null} The selected price or null if invalid
     */
    function getSelectedPrice() {
        // === VERSION 9.6 FIX: Context-aware radio button selection
        let selectedOption = null;
        const estimateSection = document.querySelector('.estimate-concrete-section');
        if (estimateSection && estimateSection.style.display !== 'none') {
            // In estimate mode - search within estimate section
            selectedOption = estimateSection.querySelector('input[name="priceSelection"]:checked');
            console.log('[CUSTOM-PRICE-V9.6] Found radio in estimate context:', selectedOption?.value);
        } else {
            // In invoice mode - search globally
            selectedOption = document.querySelector('input[name="priceSelection"]:checked');
            console.log('[CUSTOM-PRICE-V9.6] Found radio in invoice context:', selectedOption?.value);
        }
        
        if (!selectedOption) {
            console.log('[CUSTOM-PRICE] No price option selected');
            return null;
        }
        
        const selection = selectedOption.value;
        console.log('[CUSTOM-PRICE] Selected option:', selection);
        
        let price = null;
        
        // === VERSION 9.4 FIX: Better scoping for calc-results
        // Check if we're in estimate mode first (estimateSection already declared above in V9.6)
        const isEstimateCheck = !!estimateSection || document.querySelector('input[name="estimateBusinessType"][value="concrete"]')?.checked;
        console.log('[CUSTOM-PRICE-V9.4] Estimate mode:', isEstimateCheck);
        
        // Find the correct calc-results element based on context
        let calcResults = null;
        if (isEstimateCheck) {
            // In estimate mode, look within estimate section first
            const estimateRoot = document.getElementById('estimate-services-content') || document.getElementById('estimate-form');
            calcResults = estimateRoot?.querySelector('#calc-results') || document.getElementById('calc-results');
        } else {
            // In invoice mode, use the regular one
            calcResults = document.getElementById('calc-results');
        }
        
        console.log('[CUSTOM-PRICE-V9.4] calc-results element:', calcResults);
        console.log('[CUSTOM-PRICE-V9.4] calc-results dataset:', calcResults?.dataset);
        
        switch(selection) {
            case 'low':
                // Try dataset first
                if (calcResults?.dataset?.priceLow) {
                    price = parseFloat(calcResults.dataset.priceLow);
                    console.log('[CUSTOM-PRICE] Got low price from dataset:', price);
                }
                // Fall back to element text
                if (!price || isNaN(price)) {
                    const lowElement = document.getElementById('out-price-low');
                    if (lowElement) {
                        price = parseFloat(lowElement.textContent.replace(/[$,]/g, ''));
                    }
                }
                break;
                
            case 'mid':
                // Try dataset first
                if (calcResults?.dataset?.priceMid) {
                    price = parseFloat(calcResults.dataset.priceMid);
                    console.log('[CUSTOM-PRICE] Got mid price from dataset:', price);
                }
                // Fall back to element text
                if (!price || isNaN(price)) {
                    const midElement = document.getElementById('out-price-mid');
                    if (midElement) {
                        price = parseFloat(midElement.textContent.replace(/[$,]/g, ''));
                    }
                }
                break;
                
            case 'high':
                // Try dataset first
                if (calcResults?.dataset?.priceHigh) {
                    price = parseFloat(calcResults.dataset.priceHigh);
                    console.log('[CUSTOM-PRICE] Got high price from dataset:', price);
                }
                // Fall back to element text
                if (!price || isNaN(price)) {
                    const highElement = document.getElementById('out-price-high');
                    if (highElement) {
                        price = parseFloat(highElement.textContent.replace(/[$,]/g, ''));
                    }
                }
                break;
                
            case 'custom':
                // === VERSION 9.11 FIX: Context-aware custom price input search
                let customInput = null;
                if (estimateSection && estimateSection.style.display !== 'none') {
                    // In estimate context, search within estimate section
                    customInput = estimateSection.querySelector('#custom-price');
                    console.log('[CUSTOM-PRICE-V9.11] Looking for custom input in estimate section');
                } else {
                    // In invoice context, use global search
                    customInput = document.getElementById('custom-price');
                    console.log('[CUSTOM-PRICE-V9.11] Looking for custom input globally');
                }
                
                if (customInput) {
                    price = parseFloat(customInput.value);
                    console.log('[CUSTOM-PRICE] Custom price entered:', price);
                } else {
                    console.log('[CUSTOM-PRICE] Custom input not found');
                }
                break;
                
            default:
                console.log('[CUSTOM-PRICE] Unknown selection:', selection);
        }
        
        console.log('[CUSTOM-PRICE] Final price:', price);
        return price;
    }
    
    /**
     * Handle the Use Selected Price button click
     */
    function handleUseSelectedPrice(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Prevent duplicate handling
        if (window._customPriceHandled) {
            console.log('[CUSTOM-PRICE] Already handled, preventing duplicate');
            return;
        }
        window._customPriceHandled = true;
        
        // === VERSION 9: Set global flag to prevent SlabManager from running ===
        window._customPriceActive = true;
        
        // Reset flags after a short delay
        setTimeout(() => {
            window._customPriceHandled = false;
            window._customPriceActive = false;
        }, 1000);
        
        console.log('[CUSTOM-PRICE] Use Selected Price clicked');
        
        const selectedPrice = getSelectedPrice();
        
        if (!selectedPrice || selectedPrice <= 0 || isNaN(selectedPrice)) {
            alert('Please select a valid price option or enter a custom amount greater than $0');
            return;
        }
        
        // Get the current calculation data
        let calc = window.ConcreteCalculator?.currentCalculation;
        
        // === VERSION 9.15 FIX: DOM fallback for BOTH estimate and invoice modes
        if (!calc) {
            console.log('[V9.15] No calculation data, attempting DOM fallback');
            
            // Build calculation data from DOM for both invoice and estimate modes
            const length = parseFloat(document.getElementById('calc-length')?.value) || 0;
            const width = parseFloat(document.getElementById('calc-width')?.value) || 0;
            const depth = parseFloat(document.getElementById('calc-depth')?.value) || 1;
            const sides = parseFloat(document.getElementById('calc-sides')?.value) || 1;
            
            if (length > 0 && width > 0) {
                // Extract prices from display
                const priceLowText = document.getElementById('out-price-low')?.textContent || '';
                const priceMidText = document.getElementById('out-price-mid')?.textContent || '';
                const priceHighText = document.getElementById('out-price-high')?.textContent || '';
                
                const priceLow = parseFloat(priceLowText.replace(/[$,]/g, '')) || 0;
                const priceMid = parseFloat(priceMidText.replace(/[$,]/g, '')) || 0;
                const priceHigh = parseFloat(priceHighText.replace(/[$,]/g, '')) || 0;
                
                calc = {
                    length: length,
                    width: width,
                    squareFootage: length * width,
                    inchesSettled: depth,
                    sidesSettled: sides,
                    estimatedPriceLow: priceLow,
                    estimatedPriceMid: priceMid,
                    estimatedPriceHigh: priceHigh
                };
                
                console.log('[V9.15] Built calculation from DOM:', calc);
            }
        }
        
        if (!calc) {
            console.error('[CUSTOM-PRICE] No calculation data available');
            alert('Please calculate pricing first before selecting a price');
            return;
        }
        
        console.log('[CUSTOM-PRICE] Using price:', selectedPrice, 'for calculation:', calc);
        
        // Determine if we're in estimate or invoice context
        const isEstimate = document.querySelector('input[name="estimateBusinessType"][value="concrete"]')?.checked || false;
        
        // Call the appropriate handler with the selected price
        if (isEstimate) {
            // For estimates, use EstimateManager if available
            if (window.EstimateManager && window.EstimateManager.addEstimateServiceWithCustomPrice) {
                console.log('[CUSTOM-PRICE] Adding to estimate with custom price:', selectedPrice);
                window.EstimateManager.addEstimateServiceWithCustomPrice({
                    ...calc,
                    customPrice: selectedPrice,
                    finalPrice: selectedPrice,
                    priceOverride: true
                });
            } else if (window.ConcreteCalculator && window.ConcreteCalculator.addConcreteServiceWithCustomPrice) {
                console.log('[CUSTOM-PRICE] Using ConcreteCalculator for estimate with price:', selectedPrice);
                window.ConcreteCalculator.addConcreteServiceWithCustomPrice({
                    ...calc,
                    customPrice: selectedPrice,
                    finalPrice: selectedPrice,
                    priceOverride: true,
                    isEstimate: true
                });
            } else {
                console.error('[CUSTOM-PRICE] No handler available for estimate');
                alert('Unable to add service. Please refresh the page and try again.');
            }
        } else {
            // For invoices, use ConcreteCalculator or InvoiceManager
            if (window.ConcreteCalculator && window.ConcreteCalculator.addConcreteServiceWithCustomPrice) {
                console.log('[CUSTOM-PRICE] Adding to invoice with custom price:', selectedPrice);
                window.ConcreteCalculator.addConcreteServiceWithCustomPrice({
                    ...calc,
                    customPrice: selectedPrice,
                    finalPrice: selectedPrice,
                    priceOverride: true
                });
            } else if (window.InvoiceManager && window.InvoiceManager.addConcreteServiceWithCustomPrice) {
                console.log('[CUSTOM-PRICE] Using InvoiceManager with price:', selectedPrice);
                window.InvoiceManager.addConcreteServiceWithCustomPrice({
                    ...calc,
                    customPrice: selectedPrice,
                    finalPrice: selectedPrice,
                    priceOverride: true
                });
            } else {
                console.error('[CUSTOM-PRICE] No handler available for invoice');
                alert('Unable to add service. Please refresh the page and try again.');
            }
        }
    }
    
    /**
     * Initialize the custom price handler
     */
    function init() {
        console.log('[CUSTOM-PRICE-HANDLER] Initializing...');
        
        // Use event delegation to handle button clicks
        document.addEventListener('click', function(e) {
            // Check if the clicked element is the use-selected-price button
            if (e.target && (e.target.id === 'use-selected-price' || e.target.closest('#use-selected-price'))) {
                handleUseSelectedPrice(e);
            }
        }, true); // Use capture phase to ensure we get the event first
        
        // Also add direct listener when button becomes available
        const attachDirectListener = () => {
            const button = document.getElementById('use-selected-price');
            if (button && !button.dataset.customHandlerAttached) {
                button.dataset.customHandlerAttached = 'true';
                button.addEventListener('click', handleUseSelectedPrice, true);
                console.log('[CUSTOM-PRICE-HANDLER] Direct listener attached to button');
            }
        };
        
        // Try to attach immediately
        attachDirectListener();
        
        // Also monitor for button creation
        const observer = new MutationObserver(() => {
            attachDirectListener();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('[CUSTOM-PRICE-HANDLER] Initialized successfully');
    }
    
    // Make functions available globally for debugging
    window.CustomPriceHandler = {
        getSelectedPrice: getSelectedPrice,
        handleUseSelectedPrice: handleUseSelectedPrice,
        init: init
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();