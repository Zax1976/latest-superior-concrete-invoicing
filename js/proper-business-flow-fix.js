/**
 * === PROPER BUSINESS FLOW FIX (BEGIN)
 * Fixes radio button visibility and ensures flows remain separate
 */

(function() {
    'use strict';
    
    console.log('[FLOW-FIX:INIT] Ensuring proper business flow separation...');
    
    // Function to determine which flow we're in
    function getCurrentFlow() {
        // Check if we're in invoice creation view
        const invoiceView = document.getElementById('invoice-creation');
        const estimateView = document.getElementById('estimate-creation');
        
        if (invoiceView && invoiceView.classList.contains('active')) {
            // Check current URL or any other indicator of flow type
            // For now, we'll check what's already selected or visible
            const concreteSelected = document.getElementById('business-concrete')?.checked;
            const masonrySelected = document.getElementById('business-masonry')?.checked;
            
            // If nothing selected yet, check what should be available
            // This needs to be determined by the initial setup
            return 'invoice'; // Generic invoice flow
        }
        
        if (estimateView && estimateView.classList.contains('active')) {
            return 'estimate';
        }
        
        return null;
    }
    
    // Function to fix radio buttons based on flow
    function fixRadioButtonsForFlow() {
        const flow = getCurrentFlow();
        if (!flow) return;
        
        console.log('[FLOW-FIX:FLOW] Current flow:', flow);
        
        if (flow === 'invoice') {
            const invoiceView = document.getElementById('invoice-creation');
            if (!invoiceView) return;
            
            // Fix concrete radio button
            const concreteRadio = document.getElementById('business-concrete');
            if (concreteRadio) {
                concreteRadio.style.width = 'auto';
                concreteRadio.style.minWidth = '20px';
                concreteRadio.style.height = 'auto';
                concreteRadio.style.minHeight = '20px';
                concreteRadio.style.margin = '5px';
                concreteRadio.style.display = 'inline-block';
                concreteRadio.style.visibility = 'visible';
                concreteRadio.style.opacity = '1';
                concreteRadio.style.position = 'relative';
                concreteRadio.style.zIndex = '10';
                concreteRadio.style.pointerEvents = 'auto';
                
                const concreteLabel = concreteRadio.closest('label');
                if (concreteLabel) {
                    concreteLabel.style.display = 'flex';
                    concreteLabel.style.alignItems = 'center';
                    concreteLabel.style.cursor = 'pointer';
                    concreteLabel.style.pointerEvents = 'auto';
                }
            }
            
            // Fix masonry radio button - it should exist but be properly styled
            const masonryRadio = document.getElementById('business-masonry');
            if (masonryRadio) {
                masonryRadio.style.width = 'auto';
                masonryRadio.style.minWidth = '20px';
                masonryRadio.style.height = 'auto';
                masonryRadio.style.minHeight = '20px';
                masonryRadio.style.margin = '5px';
                masonryRadio.style.display = 'inline-block';
                masonryRadio.style.visibility = 'visible';
                masonryRadio.style.opacity = '1';
                masonryRadio.style.position = 'relative';
                masonryRadio.style.zIndex = '10';
                masonryRadio.style.pointerEvents = 'auto';
                
                const masonryLabel = masonryRadio.closest('label');
                if (masonryLabel) {
                    masonryLabel.style.display = 'flex';
                    masonryLabel.style.alignItems = 'center';
                    masonryLabel.style.cursor = 'pointer';
                    masonryLabel.style.pointerEvents = 'auto';
                }
            }
            
            // Make business selector visible
            const businessSelector = invoiceView.querySelector('.business-selector');
            if (businessSelector) {
                businessSelector.style.display = 'flex';
                businessSelector.style.visibility = 'visible';
                businessSelector.style.opacity = '1';
            }
        }
        
        if (flow === 'estimate') {
            const estimateView = document.getElementById('estimate-creation');
            if (!estimateView) return;
            
            // Fix estimate radio buttons
            const estimateRadios = document.querySelectorAll('input[name="estimateBusinessType"]');
            estimateRadios.forEach(radio => {
                radio.style.width = 'auto';
                radio.style.minWidth = '20px';
                radio.style.height = 'auto';
                radio.style.minHeight = '20px';
                radio.style.margin = '5px';
                radio.style.display = 'inline-block';
                radio.style.visibility = 'visible';
                radio.style.opacity = '1';
                radio.style.position = 'relative';
                radio.style.zIndex = '10';
                radio.style.pointerEvents = 'auto';
                
                const label = radio.closest('label');
                if (label) {
                    label.style.display = 'flex';
                    label.style.alignItems = 'center';
                    label.style.cursor = 'pointer';
                    label.style.pointerEvents = 'auto';
                }
            });
            
            const businessSelector = estimateView.querySelector('.business-selector');
            if (businessSelector) {
                businessSelector.style.display = 'flex';
                businessSelector.style.visibility = 'visible';
                businessSelector.style.opacity = '1';
            }
        }
    }
    
    // Function to handle business type selection - CRITICAL FOR FLOW SEPARATION
    function handleBusinessTypeSelection(e) {
        if (e.target.name === 'businessType') {
            if (e.target.value === 'concrete') {
                console.log('[FLOW-FIX:SELECT] Concrete selected - showing concrete services ONLY');
                
                // Show ONLY concrete services
                const concreteServices = document.getElementById('concrete-services');
                if (concreteServices) {
                    concreteServices.style.display = 'block';
                    concreteServices.style.visibility = 'visible';
                    concreteServices.style.opacity = '1';
                }
                
                // Show calculator for concrete
                const calculator = document.getElementById('er-poly-calculator');
                if (calculator) {
                    calculator.style.display = 'block';
                    calculator.style.visibility = 'visible';
                    calculator.style.opacity = '1';
                }
                
                // HIDE masonry services - CRITICAL
                const masonryServices = document.getElementById('masonry-services');
                if (masonryServices) {
                    masonryServices.style.display = 'none';
                    masonryServices.style.visibility = 'hidden';
                }
                
                // Show calculation display
                setTimeout(() => {
                    const calcDisplay = document.getElementById('material-calculation-display');
                    if (calcDisplay) {
                        calcDisplay.style.display = 'block';
                    }
                }, 500);
            }
            
            if (e.target.value === 'masonry') {
                console.log('[FLOW-FIX:SELECT] Masonry selected - showing masonry services ONLY');
                
                // Show ONLY masonry services
                const masonryServices = document.getElementById('masonry-services');
                if (masonryServices) {
                    masonryServices.style.display = 'block';
                    masonryServices.style.visibility = 'visible';
                    masonryServices.style.opacity = '1';
                }
                
                // HIDE concrete services and calculator - CRITICAL
                const concreteServices = document.getElementById('concrete-services');
                if (concreteServices) {
                    concreteServices.style.display = 'none';
                    concreteServices.style.visibility = 'hidden';
                }
                
                const calculator = document.getElementById('er-poly-calculator');
                if (calculator) {
                    calculator.style.display = 'none';
                    calculator.style.visibility = 'hidden';
                }
                
                // Hide calculation display
                const calcDisplay = document.getElementById('material-calculation-display');
                if (calcDisplay) {
                    calcDisplay.style.display = 'none';
                }
            }
        }
        
        // Handle estimate business type
        if (e.target.name === 'estimateBusinessType') {
            if (e.target.value === 'concrete') {
                console.log('[FLOW-FIX:EST-SELECT] Estimate concrete selected');
                
                const concreteServices = document.getElementById('estimate-concrete-services');
                if (concreteServices) {
                    concreteServices.style.display = 'block';
                    concreteServices.style.visibility = 'visible';
                    concreteServices.style.opacity = '1';
                }
                
                const calculator = document.getElementById('estimate-er-poly-calculator');
                if (calculator) {
                    calculator.style.display = 'block';
                    calculator.style.visibility = 'visible';
                    calculator.style.opacity = '1';
                }
                
                // Hide masonry in estimate
                const masonryServices = document.getElementById('estimate-masonry-services');
                if (masonryServices) {
                    masonryServices.style.display = 'none';
                }
            }
            
            if (e.target.value === 'masonry') {
                console.log('[FLOW-FIX:EST-SELECT] Estimate masonry selected');
                
                const masonryServices = document.getElementById('estimate-masonry-services');
                if (masonryServices) {
                    masonryServices.style.display = 'block';
                    masonryServices.style.visibility = 'visible';
                    masonryServices.style.opacity = '1';
                }
                
                // Hide concrete in estimate
                const concreteServices = document.getElementById('estimate-concrete-services');
                if (concreteServices) {
                    concreteServices.style.display = 'none';
                }
                
                const calculator = document.getElementById('estimate-er-poly-calculator');
                if (calculator) {
                    calculator.style.display = 'none';
                }
            }
        }
    }
    
    // Handle calculate button clicks
    document.addEventListener('click', function(e) {
        if (e.target.textContent && e.target.textContent.includes('Calculate Price')) {
            console.log('[FLOW-FIX:CALC] Calculate Price clicked');
            
            // Ensure display sections are visible after calculation
            setTimeout(() => {
                const displaySections = document.querySelectorAll('.material-calculation-display, .calculation-results, .price-display');
                displaySections.forEach(section => {
                    section.style.display = 'block';
                    section.style.visibility = 'visible';
                    section.style.opacity = '1';
                });
            }, 500);
        }
    });
    
    // Override navigation functions
    const originalShowCreateInvoiceOptions = window.showCreateInvoiceOptions;
    window.showCreateInvoiceOptions = function() {
        if (originalShowCreateInvoiceOptions) {
            originalShowCreateInvoiceOptions.apply(this, arguments);
        }
        setTimeout(fixRadioButtonsForFlow, 100);
        setTimeout(fixRadioButtonsForFlow, 500);
    };
    
    const originalShowCreateEstimateOptions = window.showCreateEstimateOptions;
    window.showCreateEstimateOptions = function() {
        if (originalShowCreateEstimateOptions) {
            originalShowCreateEstimateOptions.apply(this, arguments);
        }
        setTimeout(fixRadioButtonsForFlow, 100);
        setTimeout(fixRadioButtonsForFlow, 500);
    };
    
    // Add event listener for business type changes
    document.addEventListener('change', handleBusinessTypeSelection);
    
    // Monitor view changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if ((target.id === 'invoice-creation' || target.id === 'estimate-creation') && 
                    target.classList.contains('active')) {
                    setTimeout(fixRadioButtonsForFlow, 100);
                }
            }
        });
    });
    
    const invoiceView = document.getElementById('invoice-creation');
    const estimateView = document.getElementById('estimate-creation');
    
    if (invoiceView) {
        observer.observe(invoiceView, { attributes: true });
    }
    if (estimateView) {
        observer.observe(estimateView, { attributes: true });
    }
    
    // Initial fix
    setTimeout(fixRadioButtonsForFlow, 500);
    
    console.log('[FLOW-FIX:READY] Proper business flow fix ready');
    
})();

// === PROPER BUSINESS FLOW FIX (END)