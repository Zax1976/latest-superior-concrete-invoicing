/**
 * === SIMPLE CALCULATOR FIX (BEGIN)
 * Minimal fix to ensure calculator shows and works
 */

(function() {
    'use strict';
    
    console.log('[SIMPLE-FIX:INIT] Simple calculator fix starting...');
    
    // Function to show calculator when concrete is selected
    function showCalculatorForConcrete() {
        const concreteRadio = document.getElementById('business-concrete');
        if (!concreteRadio || !concreteRadio.checked) {
            return;
        }
        
        console.log('[SIMPLE-FIX:SHOW] Showing calculator for concrete...');
        
        // Show concrete services section
        const concreteServices = document.getElementById('concrete-services');
        if (concreteServices) {
            concreteServices.style.display = 'block';
            concreteServices.style.visibility = 'visible';
            concreteServices.style.opacity = '1';
            console.log('[SIMPLE-FIX:SHOW] Concrete services shown');
        }
        
        // Show calculator
        const calculator = document.getElementById('er-poly-calculator');
        if (calculator) {
            calculator.style.display = 'block';
            calculator.style.visibility = 'visible';
            calculator.style.opacity = '1';
            console.log('[SIMPLE-FIX:SHOW] Calculator shown');
            
            // Make sure all child elements are visible
            const allChildren = calculator.querySelectorAll('*');
            allChildren.forEach(child => {
                if (child.style.display === 'none') {
                    child.style.display = '';
                }
            });
        }
        
        // Show any calculation display sections
        const calcDisplays = document.querySelectorAll('.material-calculation-display, .calculation-results, .price-display');
        calcDisplays.forEach(display => {
            if (display.style.display === 'none') {
                display.style.display = '';
            }
        });
    }
    
    // Listen for business type changes
    document.addEventListener('change', function(e) {
        if (e.target.name === 'businessType' && e.target.value === 'concrete') {
            console.log('[SIMPLE-FIX:CHANGE] Concrete selected');
            setTimeout(showCalculatorForConcrete, 100);
            setTimeout(showCalculatorForConcrete, 500);
        }
    });
    
    // Check periodically if concrete is selected but calculator is hidden
    setInterval(function() {
        const concreteRadio = document.getElementById('business-concrete');
        const calculator = document.getElementById('er-poly-calculator');
        
        if (concreteRadio && concreteRadio.checked && calculator) {
            // If concrete is selected but calculator is hidden, show it
            if (calculator.style.display === 'none' || calculator.offsetParent === null) {
                console.log('[SIMPLE-FIX:CHECK] Calculator was hidden, showing it...');
                showCalculatorForConcrete();
            }
        }
    }, 2000);
    
    // Initial check
    setTimeout(showCalculatorForConcrete, 500);
    
    console.log('[SIMPLE-FIX:READY] Simple calculator fix ready');
    
})();

// === SIMPLE CALCULATOR FIX (END)