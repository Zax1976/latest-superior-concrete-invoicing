/**
 * J. Stark Business Invoicing System - Concrete Leveling Calculator
 * Handles concrete leveling pricing calculations with multipliers
 */

(function() {
    'use strict';
    
    // Concrete leveling pricing data - Traditional method
    const ConcreteRates = {
        driveway: 15.00,
        sidewalk: 12.00,
        patio: 14.00,
        garage: 16.00,
        basement: 18.00,
        steps: 20.00,
        'pool-deck': 17.00,
        custom: 0.00
    };
    
    const SeverityMultipliers = {
        mild: 1.0,
        moderate: 1.3,
        severe: 1.6
    };
    
    const AccessibilityMultipliers = {
        easy: 1.0,
        moderate: 1.1,
        difficult: 1.25
    };
    
    // Enhanced Material-based pricing data - Comprehensive Industry Standards
    const MaterialPricing = {
        // Base material costs (polyurethane foam injection)
        pricePerPoundLow: 7.00,
        pricePerPoundHigh: 10.00,
        weightPerCubicYard: 120, // lbs per cubic yard
        
        // Enhanced multiplier table based on settlement depth (inches) and sides settled
        // These values account for void volume calculations and material distribution
        multiplierTable: {
            0.5: { 1: 0.0008, 2: 0.0012, 3: 0.0016 },
            1: { 1: 0.0015, 2: 0.0023, 3: 0.0031 },
            1.5: { 1: 0.0023, 2: 0.0034, 3: 0.0046 },
            2: { 1: 0.0030, 2: 0.0045, 3: 0.0061 },
            2.5: { 1: 0.0038, 2: 0.0057, 3: 0.0077 },
            3: { 1: 0.0046, 2: 0.0069, 3: 0.0092 },
            3.5: { 1: 0.0053, 2: 0.008, 3: 0.0107 },
            4: { 1: 0.0061, 2: 0.0091, 3: 0.0122 },
            4.5: { 1: 0.0069, 2: 0.0104, 3: 0.0139 },
            5: { 1: 0.0077, 2: 0.0115, 3: 0.0154 },
            5.5: { 1: 0.0084, 2: 0.0126, 3: 0.0169 },
            6: { 1: 0.0092, 2: 0.0138, 3: 0.0185 },
            6.5: { 1: 0.0100, 2: 0.0150, 3: 0.0200 },
            7: { 1: 0.0108, 2: 0.0162, 3: 0.0216 },
            8: { 1: 0.0123, 2: 0.0185, 3: 0.0247 }
        },
        
        // Soil type modifiers - affects material penetration and volume needed
        soilTypeMultipliers: {
            clay: 1.2,      // Dense clay requires more material
            sand: 0.9,      // Sandy soil allows better penetration
            mixed: 1.0,     // Standard mixed soil
            rock: 1.4,      // Rocky conditions require more pressure/material
            organic: 1.1    // Organic soil with moderate compaction
        },
        
        // Environmental condition modifiers
        conditionMultipliers: {
            temperature: {
                cold: 1.1,    // Cold weather affects material flow
                normal: 1.0,  // Standard conditions
                hot: 0.95     // Hot weather improves material flow
            },
            moisture: {
                dry: 0.95,    // Dry conditions are ideal
                normal: 1.0,  // Standard moisture
                wet: 1.15     // Wet conditions require more material
            }
        },
        
        // Equipment and labor factors
        equipmentFactors: {
            mobilization: 150,    // Base mobilization cost
            setupTime: 75,        // Setup time cost per job
            cleanupTime: 50,      // Cleanup time cost per job
            travelDistance: 2.5   // Cost per mile for travel
        },
        
        // Markup multipliers for final pricing with profit margins
        markupMultiplierLow: 3.33,   // Conservative markup (3.33x material cost)
        markupMultiplierHigh: 5.0,   // Premium markup (5x material cost)
        
        // Advanced pricing tiers based on project size
        sizeTierMultipliers: {
            small: { min: 0, max: 50, multiplier: 1.2 },       // < 50 sq ft
            medium: { min: 50, max: 200, multiplier: 1.0 },    // 50-200 sq ft
            large: { min: 200, max: 500, multiplier: 0.9 },    // 200-500 sq ft
            xlarge: { min: 500, max: 999999, multiplier: 0.8 } // > 500 sq ft
        },
        
        // Complexity factors for different project types
        projectComplexityFactors: {
            driveway: { base: 1.0, complexity: 'medium' },
            sidewalk: { base: 0.9, complexity: 'low' },
            patio: { base: 1.0, complexity: 'medium' },
            garage: { base: 1.1, complexity: 'high' },
            basement: { base: 1.3, complexity: 'high' },
            steps: { base: 1.4, complexity: 'very_high' },
            'pool-deck': { base: 1.2, complexity: 'high' },
            custom: { base: 1.0, complexity: 'medium' }
        }
    };
    
    // Calculator object
    const ConcreteCalculator = {
        currentCalculation: {
            // Material-based calculation fields (only method)
            pricingMethod: 'material',
            length: 0,
            width: 0,
            squareFootage: 0,
            inchesSettled: 1,
            sidesSettled: 1,
            materialCostLow: 0,
            materialCostHigh: 0,
            estimatedPriceLow: 0,
            estimatedPriceHigh: 0,
            pricePerSqFtLow: 0,
            pricePerSqFtHigh: 0,
            total: 0,
            // Enhanced calculation fields
            soilType: 'mixed',
            weatherConditions: 'normal',
            moistureLevel: 'normal',
            travelDistance: 0,
            sizeTier: 'medium',
            complexityFactor: 1.0,
            equipmentCosts: 0,
            totalMultipliers: 1.0,
            voidVolume: 0,
            materialWeight: 0,
            laborHours: 0
        },
        
        init: function(opts) {
            try {
                // Store initialization context
                if (!window.Calculator) window.Calculator = {};
                window.Calculator.context = opts?.context;
                
                // Get root element for scoped queries - be more flexible
                let root = document;
                if (opts?.context === 'estimate') {
                    root = document.querySelector('#estimate-creation.view.active') || 
                           document.querySelector('#estimate-creation') || 
                           document;
                } else if (opts?.context === 'invoice') {
                    root = document.querySelector('#invoice-creation.view.active') || 
                           document.querySelector('#invoice-creation') || 
                           document;
                }
                
                // Check for required elements - try multiple selectors
                const lengthEl = root.querySelector('#slab-length') || 
                                root.querySelector('#calc-length') || 
                                root.querySelector('#estimate-length-ft') || 
                                root.querySelector('#length-ft');
                const widthEl = root.querySelector('#slab-width') || 
                               root.querySelector('#calc-width') || 
                               root.querySelector('#estimate-width-ft') || 
                               root.querySelector('#width-ft');
                
                if (!lengthEl || !widthEl) {
                    // Collect all missing required elements
                    const missing = [];
                    if (!lengthEl) missing.push('slab-length');
                    if (!widthEl) missing.push('slab-width');
                    
                    // Additional required elements check
                    const inchesEl = root.querySelector('#inches-settled');
                    const calcBtn = root.querySelector('#calculate-price');
                    if (!inchesEl) missing.push('inches-settled');
                    if (!calcBtn) missing.push('calculate-price');
                    
                    console.log('[CALC:EL_MISSING]', { 
                        context: opts?.context || 'unknown',
                        missing: missing
                    });
                    return; // Exit silently if elements not found
                }
                
                // Log pro settings if they exist
                const proSettings = {
                    f201: document.getElementById('pro-f201')?.value || 100,
                    f401: document.getElementById('pro-f401')?.value || 120,
                    f201v: document.getElementById('pro-f201v')?.value || 70,
                    f401v: document.getElementById('pro-f401v')?.value || 110
                };
                console.log('[pro-settings]', proSettings);
                
                this.bindEvents();
                this.updateMaterialCalculation(); // Initial calculation
                this.ensureDisplayVisibility(); // Ensure calculator display is visible
                
                // Mark state as ready after successful init
                if (window.Calculator) {
                    window.Calculator.initialized = true;
                    console.log('[CALC:STATE_READY]', { context: opts?.context });
                }
            } catch (error) {
                console.error('Calculator initialization error:', error);
            }
        },
        
        ensureDisplayVisibility: function() {
            // Make sure calculator display sections are visible
            const context = this.getCurrentContext();
            const displaySections = [
                '.material-calculation-display',
                '.enhanced-material-calculation',
                '.calculation-results',
                '.pricing-details'
            ];
            
            displaySections.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (window.getComputedStyle(el).display === 'none') {
                        el.style.display = 'block';
                        el.classList.add('calculation-visible');
                        
                        // Add subtle animation to show the section is now visible
                        el.style.opacity = '0';
                        el.style.transform = 'translateY(10px)';
                        setTimeout(() => {
                            el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                        }, 50);
                    }
                });
            });
            
            // Ensure specific result elements are visible
            const resultElements = [
                'material-square-footage',
                'material-cubic-yards', 
                'material-weight',
                'estimated-price-low',
                'estimated-price-high'
            ];
            
            resultElements.forEach(id => {
                const element = document.getElementById(id) || document.getElementById(`estimate-${id}`);
                if (element && element.closest('[style*="display: none"]')) {
                    const parent = element.closest('[style*="display: none"]');
                    if (parent) {
                        parent.style.display = 'block';
                    }
                }
            });
        },
        
        updateMaterialCalculation: function() {
            try {
                // Get input values using proper context-aware selectors
                const context = this.getCurrentContext();
                
                let lengthEl, widthEl, inchesEl, sidesEl, soilEl, weatherEl, moistureEl, travelEl;
                
                if (context === 'estimate') {
                    // For estimate context, try estimate-prefixed elements first, with proper fallback
                    lengthEl = document.getElementById('estimate-length-ft');
                    if (!lengthEl) lengthEl = document.getElementById('length-ft');
                    
                    widthEl = document.getElementById('estimate-width-ft');
                    if (!widthEl) widthEl = document.getElementById('width-ft');
                    
                    inchesEl = document.getElementById('estimate-inches-settled');
                    if (!inchesEl) inchesEl = document.getElementById('inches-settled');
                    
                    sidesEl = document.getElementById('estimate-sides-settled');
                    if (!sidesEl) sidesEl = document.getElementById('sides-settled');
                    
                    soilEl = document.getElementById('estimate-soil-type');
                    if (!soilEl) soilEl = document.getElementById('soil-type');
                    
                    weatherEl = document.getElementById('estimate-weather-conditions');
                    if (!weatherEl) weatherEl = document.getElementById('weather-conditions');
                    
                    moistureEl = document.getElementById('estimate-moisture-level');
                    if (!moistureEl) moistureEl = document.getElementById('moisture-level');
                    
                    travelEl = document.getElementById('estimate-travel-distance');
                    if (!travelEl) travelEl = document.getElementById('travel-distance');
                } else {
                    // For invoice context, use calc- prefixed elements (fallback to standard)
                    lengthEl = document.getElementById('calc-length') || document.getElementById('length-ft');
                    widthEl = document.getElementById('calc-width') || document.getElementById('width-ft');
                    inchesEl = document.getElementById('calc-depth') || document.getElementById('inches-settled');
                    sidesEl = document.getElementById('calc-sides') || document.getElementById('sides-settled');
                    soilEl = document.getElementById('calc-soil') || document.getElementById('soil-type');
                    weatherEl = document.getElementById('calc-weather') || document.getElementById('weather-conditions');
                    moistureEl = document.getElementById('calc-moisture') || document.getElementById('moisture-level');
                    travelEl = document.getElementById('calc-travel') || document.getElementById('travel-distance');
                }
                
                // Verify at least the critical elements exist
                if (!lengthEl || !widthEl) {
                    // Debug only - elements might not be ready yet
                    if (window.DEBUG_MODE) {
                        console.log('Calculator elements not ready:', {
                            context: context,
                            lengthEl: !!lengthEl,
                            widthEl: !!widthEl
                        });
                    }
                    // Graceful exit instead of error - prevents crashes
                    return false;
                }
                
                // Get values with proper null checks
                const length = parseFloat(lengthEl?.value) || 0;
                const width = parseFloat(widthEl?.value) || 0;
                const inchesSettled = parseFloat(inchesEl?.value) || 1;
                const sidesSettled = parseFloat(sidesEl?.value) || 1;
                const soilType = soilEl?.value || 'mixed';
                const weatherConditions = weatherEl?.value || 'normal';
                const moistureLevel = moistureEl?.value || 'normal';
                const travelDistance = parseFloat(travelEl?.value) || 0;
                
                // Debug logging for troubleshooting
                console.log('Calculator input values:', {
                    context: context,
                    length: length,
                    width: width,
                    inchesSettled: inchesSettled,
                    sidesSettled: sidesSettled
                });
                
                
                // Update current calculation
                this.currentCalculation.length = length;
                this.currentCalculation.width = width;
                this.currentCalculation.squareFootage = length * width;
                this.currentCalculation.inchesSettled = inchesSettled;
                this.currentCalculation.sidesSettled = sidesSettled;
                this.currentCalculation.soilType = soilType;
                this.currentCalculation.weatherConditions = weatherConditions;
                this.currentCalculation.moistureLevel = moistureLevel;
                this.currentCalculation.travelDistance = travelDistance;
                
                // Debug logging to confirm values are stored
                console.log('💾 Values stored in currentCalculation:', {
                    length: this.currentCalculation.length,
                    width: this.currentCalculation.width,
                    squareFootage: this.currentCalculation.squareFootage,
                    inchesSettled: this.currentCalculation.inchesSettled,
                    sidesSettled: this.currentCalculation.sidesSettled
                });
                
                // Calculate using material-based pricing
                const result = this.calculateMaterialBasedPrice();
                
                // Debug logging to confirm calculation result has values
                console.log('🧮 Calculation result received:', {
                    squareFootage: result.squareFootage,
                    length: result.length,
                    width: result.width,
                    estimatedPriceLow: result.estimatedPriceLow,
                    estimatedPriceHigh: result.estimatedPriceHigh
                });
                
                // Update calculation results with all necessary properties
                // Preserve the input values we already have
                this.currentCalculation = {
                    ...this.currentCalculation,
                    ...result,
                    // Ensure input values are preserved
                    length: this.currentCalculation.length,
                    width: this.currentCalculation.width,
                    squareFootage: this.currentCalculation.squareFootage,
                    inchesSettled: this.currentCalculation.inchesSettled,
                    sidesSettled: this.currentCalculation.sidesSettled,
                    // Update result values
                    estimatedPriceLow: result.estimatedPriceLow,
                    estimatedPriceHigh: result.estimatedPriceHigh,
                    materialWeight: result.weight,
                    materialCostLow: result.materialCostLow,
                    materialCostHigh: result.materialCostHigh,
                    voidVolume: result.voidVolume || result.cubicYards,
                    equipmentCosts: result.equipmentCosts,
                    complexityFactor: result.complexityFactor,
                    sizeTier: result.sizeTier
                };
                
                // Update display with enhanced error handling
                this.updateTotalDisplay();
                
                // Force display visibility if results are valid
                if (result.estimatedPriceLow > 0 && result.estimatedPriceHigh > 0) {
                    this.ensureDisplayVisibility();
                    
                    // Store canonical state for Use Selected Price button
                    if (!window.Calculator) window.Calculator = {};
                    window.Calculator.state = window.Calculator.state || {};
                    window.Calculator.state.lastInputs = {
                        length: this.currentCalculation.length,
                        width: this.currentCalculation.width,
                        inchesSettled: this.currentCalculation.inchesSettled,
                        sidesSettled: this.currentCalculation.sidesSettled,
                        soilType: document.getElementById('soil-type')?.value || 'mixed',
                        selectedFoam: document.getElementById('foam-type')?.value || 'RR401',
                        tierSelected: 'mid'
                    };
                    window.Calculator.state.lastResult = {
                        low: result.estimatedPriceLow,
                        mid: result.estimatedPriceMid || ((result.estimatedPriceLow + result.estimatedPriceHigh) / 2),
                        high: result.estimatedPriceHigh,
                        calibratedLow: result.calibratedPriceLow || result.estimatedPriceLow,
                        calibratedMid: result.calibratedPriceMid || result.estimatedPriceMid || ((result.estimatedPriceLow + result.estimatedPriceHigh) / 2),
                        calibratedHigh: result.calibratedPriceHigh || result.estimatedPriceHigh
                    };
                    // Store the selected tier from radio or default
                    const tierRadio = document.querySelector('input[name="price-tier"]:checked');
                    window.Calculator.state.tier = tierRadio?.value || 'mid';
                    
                    // Add visual feedback for successful calculation
                    const calculationSection = document.querySelector('.material-calculation-display');
                    if (calculationSection) {
                        calculationSection.classList.add('calculation-updated');
                        setTimeout(() => {
                            calculationSection.classList.remove('calculation-updated');
                        }, 1000);
                    }
                }
                
            } catch (error) {
                console.error('Update material calculation error:', error);
                // Show user-friendly error message
                if (window.NotificationSystem) {
                    window.NotificationSystem.showError('Calculation error: Please check your inputs and try again.');
                }
            }
        },
        
        forceCalculation: function() {
            try {
                
                // Check business type selection using correct selectors
                const concreteRadio = document.querySelector('input[name="businessType"][value="concrete"]');
                const masonryRadio = document.querySelector('input[name="businessType"][value="masonry"]');
                const estimateConcreteRadio = document.querySelector('input[name="estimateBusinessType"][value="concrete"]');
                const estimateMasonryRadio = document.querySelector('input[name="estimateBusinessType"][value="masonry"]');
                
                
                // Check section visibility
                const concreteSection = document.getElementById('concrete-services');
                const masonrySection = document.getElementById('masonry-services');
                
                // Validate required inputs using correct selectors
                const context = this.getCurrentContext();
                let lengthInput = document.getElementById('length-ft');
                let widthInput = document.getElementById('width-ft');
                
                // For estimate context, also try estimate-prefixed IDs
                if (context === 'estimate') {
                    lengthInput = document.getElementById('estimate-length-ft') || lengthInput;
                    widthInput = document.getElementById('estimate-width-ft') || widthInput;
                }
                
                // If not found, the input fields might not exist yet or have different IDs
                if (!lengthInput || !widthInput) {
                    
                    // The estimate page might need to create the calculator dynamically
                    if (isEstimatePage && concreteSection && concreteSection.style.display === 'block') {
                        alert('The concrete calculator needs to be properly loaded. Please refresh the page and try again.');
                        return;
                    }
                }
                
                
                // Test if we can force set values to see if the inputs work
                if (lengthInput && widthInput && (!lengthInput.value || !widthInput.value)) {
                    
                    // Check if inputs are disabled or readonly
                    
                    // Check if there are any event listeners preventing input
                    
                    // Let's also try to focus the first input to help the user
                    lengthInput.focus();
                }
                
                // Force concrete section to be visible if it's hidden
                // Check if we're on estimate page and concrete is selected
                const isEstimatePage = estimateConcreteRadio && estimateConcreteRadio.checked;
                const isInvoicePage = concreteRadio && concreteRadio.checked;
                
                if ((isEstimatePage || isInvoicePage) && concreteSection && concreteSection.style.display === 'none') {
                    concreteSection.style.display = 'block';
                    if (masonrySection) {
                        masonrySection.style.display = 'none';
                    }
                } else if (!isEstimatePage && !isInvoicePage) {
                    alert('Please select "Superior Concrete Leveling" as your business type first, then try calculating again.');
                    return;
                }
                
                let length = parseFloat(lengthInput?.value) || 0;
                let width = parseFloat(widthInput?.value) || 0;
                
                // If values are still empty, try to get them via prompt as a workaround
                if (length <= 0 || width <= 0) {
                    
                    const lengthPrompt = prompt('Enter the length in feet:', '10');
                    const widthPrompt = prompt('Enter the width in feet:', '20');
                    
                    if (lengthPrompt && widthPrompt) {
                        length = parseFloat(lengthPrompt) || 0;
                        width = parseFloat(widthPrompt) || 0;
                        
                        // Set the values in the input fields too
                        if (lengthInput) lengthInput.value = length;
                        if (widthInput) widthInput.value = width;
                        
                    } else {
                        alert('Please enter both length and width values greater than 0 to calculate pricing.');
                        return;
                    }
                }
                
                if (length <= 0 || width <= 0) {
                    alert('Please enter both length and width values greater than 0 to calculate pricing.');
                    // Focus on the first empty field
                    if (length <= 0) {
                        lengthInput?.focus();
                    } else if (width <= 0) {
                        widthInput?.focus();
                    }
                    return;
                }
                
                // Force update the calculation
                this.updateMaterialCalculation();
                
                // Show success message if calculation worked
                const calc = this.currentCalculation;
                if (calc.estimatedPriceLow > 0 && calc.estimatedPriceHigh > 0) {
                    // Force immediate display update
                    this.updateTotalDisplay();
                    this.updateMaterialDisplay(calc);
                    this.ensureDisplayVisibility();
                    
                    // Scroll to results
                    const resultsSection = document.querySelector('.material-calculation-display');
                    if (resultsSection) {
                        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } else {
                    alert('Calculation failed. Please check your inputs and try again.');
                }
                
            } catch (error) {
                console.error('Force calculation error:', error);
                alert('Error performing calculation. Please try again.');
            }
        },

        updateTotalDisplay: function() {
            try {
                const calc = this.currentCalculation;
                const context = this.getCurrentContext();
                
                // Update the main total display with price range using context-aware selector
                let totalDisplay = document.getElementById('concrete-total');
                if (!totalDisplay && context === 'estimate') {
                    totalDisplay = document.getElementById('estimate-concrete-total');
                }
                
                if (totalDisplay) {
                    if (calc.estimatedPriceLow > 0 && calc.estimatedPriceHigh > 0) {
                        const rangeText = `${this.formatCurrency(calc.estimatedPriceLow)} - ${this.formatCurrency(calc.estimatedPriceHigh)}`;
                        totalDisplay.textContent = rangeText;
                        
                        // Add visual feedback for update
                        totalDisplay.style.backgroundColor = '#90EE90';
                        setTimeout(() => {
                            totalDisplay.style.backgroundColor = '';
                        }, 800);
                    } else {
                        totalDisplay.textContent = '$0.00 - $0.00';
                    }
                } else {
                    // Silently skip - display element is optional
                }
                
                // Update all the detailed displays if they exist
                this.updateEnhancedMaterialDisplay(calc);
                
                // Enable/disable add service button using context-aware selector
                let addServiceBtn = document.getElementById('add-concrete-service');
                if (!addServiceBtn && context === 'estimate') {
                    addServiceBtn = document.getElementById('estimate-add-concrete-service');
                }
                
                if (addServiceBtn) {
                    const shouldDisable = calc.estimatedPriceLow <= 0 || calc.squareFootage <= 0;
                    addServiceBtn.disabled = shouldDisable;
                    
                    // Update button text to reflect status
                    if (!shouldDisable) {
                        addServiceBtn.textContent = addServiceBtn.textContent.replace('(Calculate First)', '');
                    } else {
                        if (!addServiceBtn.textContent.includes('(Calculate First)')) {
                            addServiceBtn.textContent += ' (Calculate First)';
                        }
                    }
                } else {
                    // Silently skip - button might not be needed in all contexts
                }
                
            } catch (error) {
                console.error('Update total display error:', error);
            }
        },

        updateEnhancedMaterialDisplay: function(calc) {
            try {
                
                // Use business rules calculation for display - context-aware selection
                const context = this.getCurrentContext();
                const isEstimate = context === 'estimate';
                
                // Try to get values from form inputs first, fallback to calc parameter
                // Use context-aware selectors (estimate vs invoice)
                const lengthElement = document.getElementById(isEstimate ? 'estimate-length-ft' : 'length-ft');
                const widthElement = document.getElementById(isEstimate ? 'estimate-width-ft' : 'width-ft');
                const inchesElement = document.getElementById(isEstimate ? 'estimate-inches-settled' : 'inches-settled');
                const sidesElement = document.getElementById(isEstimate ? 'estimate-sides-settled' : 'sides-settled');
                const travelElement = document.getElementById(isEstimate ? 'estimate-travel-distance' : 'travel-distance');
                
                
                // Get values from elements or fallback to calc parameter
                const length = parseFloat(lengthElement?.value) || calc?.length || 0;
                const width = parseFloat(widthElement?.value) || calc?.width || 0;
                const inchesSettled = parseFloat(inchesElement?.value) || calc?.inchesSettled || 1;
                const sidesSettled = sidesElement?.value || calc?.sidesSettled || '1';
                const travelDistance = parseFloat(travelElement?.value) || calc?.travelDistance || 0;
                
                
                // Calculate using proper business rules (same as business calculation)
                const squareFootage = length * width;
                const voidVolumeCuYd = squareFootage > 0 ? (squareFootage * (inchesSettled / 12)) / 27 : 0;
                const materialWeightLbs = voidVolumeCuYd * 120;
                const materialCostLow = materialWeightLbs * 7;
                const materialCostHigh = materialWeightLbs * 10;
                
                // Complexity factor based on sides settled
                const complexityFactors = { '1': 1.00, '2': 1.10, '3': 1.20, '4': 1.30 };
                const complexityFactor = complexityFactors[sidesSettled] || 1.00;
                
                // Environmental multipliers (using same logic as business calculation)
                const envMultiplier = 1.05; // Average environmental factor
                
                // Equipment costs (same as business calculation)
                const equipmentCost = (travelDistance * 2 * 2.5) + 50;
                
                // Calculate totals using business rules
                const subLow = materialCostLow * complexityFactor * envMultiplier;
                const subHigh = materialCostHigh * complexityFactor * envMultiplier;
                const laborOHLow = (subLow + equipmentCost) * (3.33 - 1);
                const laborOHHigh = (subHigh + equipmentCost) * (5.00 - 1);
                const totalPriceLow = subLow + equipmentCost + laborOHLow;
                const totalPriceHigh = subHigh + equipmentCost + laborOHHigh;
                
                // Create the display values object
                const displayValues = {
                    'material-square-footage': `${squareFootage.toFixed(1)} sq ft`,
                    'material-cubic-yards': `${voidVolumeCuYd.toFixed(4)} cu yd`,
                    'material-weight': `${materialWeightLbs.toFixed(1)} lbs`,
                    'material-cost-low': `$${materialCostLow.toFixed(2)}`,
                    'material-cost-high': `$${materialCostHigh.toFixed(2)}`,
                    'complexity-factor-display': `${complexityFactor.toFixed(1)}x`,
                    'environmental-display': `${envMultiplier.toFixed(2)}x`,
                    'equipment-costs-display': `$${equipmentCost.toFixed(2)}`,
                    'labor-overhead-display': `$${((laborOHLow + laborOHHigh) / 2).toFixed(2)}`,
                    'estimated-price-low': `$${totalPriceLow.toFixed(2)}`,
                    'estimated-price-high': `$${totalPriceHigh.toFixed(2)}`,
                    'price-per-sqft-low': squareFootage > 0 ? `$${(totalPriceLow / squareFootage).toFixed(2)}/sq ft` : '$0.00/sq ft',
                    'price-per-sqft-high': squareFootage > 0 ? `$${(totalPriceHigh / squareFootage).toFixed(2)}/sq ft` : '$0.00/sq ft'
                };
                
                
                // Update each element if it exists with proper error handling
                let updatedElements = 0;
                let missingElements = [];
                
                // Ensure display sections are visible
                const materialDisplay = document.querySelector('.material-calculation-display');
                if (materialDisplay) {
                    if (window.getComputedStyle(materialDisplay).display === 'none') {
                        materialDisplay.style.display = 'block';
                        materialDisplay.classList.add('newly-visible');
                    }
                }
                
                Object.keys(displayValues).forEach(id => {
                    // Try context-aware element selection
                    let element = null;
                    
                    if (isEstimate) {
                        // For estimate context, try estimate-prefixed first
                        element = document.getElementById(`estimate-${id}`);
                        if (!element) {
                            element = document.getElementById(id);
                        }
                    } else {
                        // For invoice context, try original first
                        element = document.getElementById(id);
                        if (!element) {
                            element = document.getElementById(`estimate-${id}`);
                        }
                    }
                    
                    if (element) {
                        const oldValue = element.textContent;
                        element.textContent = displayValues[id];
                        
                        // Ensure parent containers are visible
                        let parent = element.parentElement;
                        while (parent && parent !== document.body) {
                            if (window.getComputedStyle(parent).display === 'none') {
                                parent.style.display = 'block';
                                parent.classList.add('auto-shown');
                            }
                            parent = parent.parentElement;
                        }
                        
                        updatedElements++;
                        
                        // Remove/add error class based on values
                        const hasValidValue = displayValues[id] !== '$0.00' && 
                                            displayValues[id] !== '0.0 sq ft' && 
                                            displayValues[id] !== '0.0000 cu yd' && 
                                            displayValues[id] !== '0.0 lbs';
                        
                        if (hasValidValue) {
                            element.classList.remove('error', 'empty');
                            element.classList.add('calculated', 'has-value');
                            
                            // Add visual feedback only if value actually changed
                            if (oldValue !== displayValues[id]) {
                                element.style.transition = 'background-color 0.3s ease';
                                element.style.backgroundColor = '#90EE90';
                                setTimeout(() => {
                                    element.style.backgroundColor = '';
                                    setTimeout(() => {
                                        element.style.transition = '';
                                    }, 300);
                                }, 800);
                            }
                        } else {
                            element.classList.add('error', 'empty');
                            element.classList.remove('calculated', 'has-value');
                        }
                        
                    } else {
                        missingElements.push(id);
                        // Suppress warnings for missing elements - these are optional display fields
                    }
                });
                
                // Only log if elements were actually updated
                if (updatedElements > 0) {
                    console.log(`Enhanced material display updated: ${updatedElements} elements`);
                }
                
                
                // Force visibility of calculation displays
                if (updatedElements > 0) {
                    const sections = document.querySelectorAll('.material-calculation-display, .calculation-display, .pricing-details');
                    sections.forEach(section => {
                        if (section) {
                            section.style.display = 'block';
                            section.classList.add('visible');
                        }
                    });
                }
                
                
            } catch (error) {
                console.error('[Material Display] Update enhanced material display error:', error);
                console.error('[Material Display] Error stack:', error.stack);
                
                // Fallback: at least try to show some basic information
                try {
                    const squareFootageEl = document.getElementById('material-square-footage');
                    if (squareFootageEl && calc && calc.squareFootage) {
                        squareFootageEl.textContent = `${calc.squareFootage.toFixed(1)} sq ft`;
                    }
                } catch (fallbackError) {
                    console.error('[Material Display] Fallback update also failed:', fallbackError);
                }
            }
        },
        
        // Helper functions for live DOM reading
        numFrom: function(id) {
            const el = document.getElementById(id);
            return el ? parseFloat(el.value) || 0 : 0;
        },
        
        intFromSelector: function(sel) {
            const el = document.querySelector(sel);
            return el ? parseInt(el.value) || 0 : 0;
        },
        
        // === SAFE-HOTFIX: INPUT-SCOPE (BEGIN - Step 2: Scope input lookups to active calc root)
        getCalcInputs: function(rootElement) {
            // Find the calc root based on the clicked button or provided element
            let calcRoot = null;
            
            if (rootElement) {
                // Walk up to find the nearest data-calc-root
                calcRoot = rootElement.closest('[data-calc-root]');
            }
            
            if (!calcRoot) {
                // Fallback to active view
                calcRoot = document.querySelector('#estimate-creation.view.active') || 
                          document.querySelector('#invoice-creation.view.active') ||
                          document;
            }
            
            console.log('[INPUT-SCOPE:ROOT]', { 
                root: calcRoot?.getAttribute?.('data-calc-root') || 'fallback',
                element: calcRoot
            });
            
            // Scoped helper functions
            const numFromScoped = (id) => {
                const el = calcRoot.querySelector(`#${id}`);
                const value = el ? parseFloat(el.value) || 0 : 0;
                console.log(`[INPUT-SCOPE:READ] #${id} = ${value}`);
                return value;
            };
            
            const selectFromScoped = (id) => {
                const el = calcRoot.querySelector(`#${id}`);
                return el?.value || '';
            };
            
            // Read inputs from correct root - using the calc- prefix IDs that match invoice
            return {
                length: numFromScoped('calc-length'),
                width: numFromScoped('calc-width'),
                inchesSettled: numFromScoped('calc-depth'),
                sidesSettled: numFromScoped('calc-sides'),
                soilType: selectFromScoped('calc-soil') || 'mixed'
            };
        },
        // === SAFE-HOTFIX: INPUT-SCOPE (END - Step 2)
        
        bindEvents: function() {
            try {
                // Get context-aware root for event binding
                const context = window.Calculator?.context || 'unknown';
                let root = document;
                if (context === 'estimate') {
                    root = document.querySelector('#estimate-creation.view.active') || document.querySelector('#estimate-creation') || document;
                } else if (context === 'invoice') {
                    root = document.querySelector('#invoice-creation.view.active') || document.querySelector('#invoice-creation') || document;
                }
                
                // Calculate Price button - look for multiple possible IDs
                const calculateBtn = root.querySelector('#calculate-price') || root.querySelector('#calculate-poly') || document.getElementById('calculate-price');
                if (calculateBtn && !calculateBtn.hasAttribute('data-calc-bound')) {
                    calculateBtn.setAttribute('data-calc-bound', 'true');
                    calculateBtn.addEventListener('click', (event) => {
                        console.log('🧮 Calculate Price button clicked');
                        
                        // === SAFE-HOTFIX: INPUT-SCOPE (Step 2 cont: Pass button to getCalcInputs)
                        // Read live DOM values at click time, scoped to the clicked button's root
                        const i = this.getCalcInputs(event.currentTarget);
                        console.log('Live inputs:', i);
                        // === SAFE-HOTFIX: INPUT-SCOPE (END)
                        
                        // Validate inputs
                        if (i.length <= 0 || i.width <= 0) {
                            alert('Please enter valid dimensions (length and width must be greater than 0)');
                            return;
                        }
                        
                        // Call ERPolyEstimator directly with live values
                        if (window.ERPolyEstimator && window.ERPolyEstimator.estimate) {
                            const result = window.ERPolyEstimator.estimate(
                                i.length, 
                                i.width, 
                                i.inchesSettled || 2, 
                                i.sidesSettled || 1, 
                                i.soilType || 'normal'
                            );
                            
                            console.log('Calculation result:', result);
                            
                            // Store result and update display
                            this.currentCalculation = result;
                            this.updateEnhancedMaterialDisplay(result);
                            
                            // === SAFE-HOTFIX: INPUT-SCOPE (Step 2 cont: Scope output display)
                            // Get the calc root for scoped output
                            const calcRoot = event.currentTarget.closest('[data-calc-root]') || document;
                            
                            // Show results div and populate it - scoped to calc root
                            const resultsDiv = calcRoot.querySelector('#calc-results');
                            if (resultsDiv) {
                                resultsDiv.style.display = 'block';
                                
                                // === SAFE-HOTFIX: SHOW USE SELECTED PRICE BUTTON (BEGIN)
                                // Show the Use Selected Price button when results are ready
                                // Note: Button is INSIDE calc-results div, so look for it there first
                                if (context === 'estimate') {
                                    // Try to find button inside resultsDiv first, then globally
                                    const useBtn = resultsDiv.querySelector('#use-selected-price') || document.getElementById('use-selected-price');
                                    console.log('[EST-CALC:BTN_CHECK]', {
                                        buttonExists: !!useBtn,
                                        buttonInsideResults: !!resultsDiv.querySelector('#use-selected-price'),
                                        resultExists: !!result,
                                        priceLow: result?.estimatedPriceLow,
                                        priceValid: result?.estimatedPriceLow > 0
                                    });
                                    if (useBtn && result && result.estimatedPriceLow > 0) {
                                        // Remove any inline display style that might be hiding it
                                        useBtn.style.removeProperty('display');
                                        useBtn.style.display = 'inline-block';
                                        useBtn.style.visibility = 'visible';
                                        console.log('[EST-CALC:USE_BTN_SHOWN] Button made visible after calculation');
                                        
                                        // Double-check visibility
                                        setTimeout(() => {
                                            const isVisible = useBtn.offsetParent !== null;
                                            if (!isVisible) {
                                                console.warn('[EST-CALC:BTN_NOT_VISIBLE] Button set to display but not visible');
                                                // Check parent visibility
                                                const parentVisible = resultsDiv.offsetParent !== null;
                                                console.log('[EST-CALC:PARENT_CHECK]', {
                                                    calcResultsVisible: parentVisible,
                                                    buttonDisplay: useBtn.style.display,
                                                    buttonVisibility: useBtn.style.visibility
                                                });
                                            } else {
                                                console.log('[EST-CALC:BTN_CONFIRMED] Button is visible');
                                            }
                                        }, 100);
                                    } else if (!useBtn) {
                                        console.error('[EST-CALC:NO_BUTTON] use-selected-price button not found!');
                                    }
                                }
                                // === SAFE-HOTFIX: SHOW USE SELECTED PRICE BUTTON (END)
                                
                                // Update foam pounds - scoped
                                const lbsEl = calcRoot.querySelector('#out-lbs');
                                if (lbsEl) lbsEl.textContent = Math.round(result.materialWeight || 0);
                                
                                // Update volume - scoped
                                const ft3El = calcRoot.querySelector('#out-ft3');
                                if (ft3El) ft3El.textContent = Math.round(result.voidVolume || 0);
                                
                                const yd3El = calcRoot.querySelector('#out-yd3');
                                if (yd3El) yd3El.textContent = (result.voidVolumeCuYd || result.voidVolume / 27)?.toFixed(2) || '0';
                                
                                // === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (BEGIN)
                                // Step 2: Write BOTH text and dataset (numbers only, no $)
                                const priceLow = Math.round(result.estimatedPriceLow || 0);
                                const priceMid = Math.round((result.estimatedPriceLow + result.estimatedPriceHigh) / 2 || 0);
                                const priceHigh = Math.round(result.estimatedPriceHigh || 0);
                                
                                // Write text (with $) - scoped to calc root
                                const priceLowEl = calcRoot.querySelector('#out-price-low');
                                if (priceLowEl) priceLowEl.textContent = '$' + priceLow;
                                
                                const priceMidEl = calcRoot.querySelector('#out-price-mid');
                                if (priceMidEl) priceMidEl.textContent = '$' + priceMid;
                                
                                const priceHighEl = calcRoot.querySelector('#out-price-high');
                                if (priceHighEl) priceHighEl.textContent = '$' + priceHigh;
                                
                                // Write dataset (numbers only) for estimate context
                                if (context === 'estimate' && resultsDiv) {
                                    resultsDiv.dataset.priceLow = priceLow;
                                    resultsDiv.dataset.priceMid = priceMid;
                                    resultsDiv.dataset.priceHigh = priceHigh;
                                    
                                    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - CKPT:2
                                    // Extend dataset with dimensions for estimate Use button
                                    resultsDiv.dataset.length = i.length || 0;
                                    resultsDiv.dataset.width = i.width || 0;
                                    resultsDiv.dataset.inches = i.inchesSettled || 1;
                                    resultsDiv.dataset.sides = i.sidesSettled || 1;
                                    resultsDiv.dataset.soil = i.soilType || 'mixed';
                                    resultsDiv.dataset.tier = 'mid'; // Default tier for now
                                    
                                    console.log('[EST-RESULTS:DATASET_EXTENDED]', {
                                        len: resultsDiv.dataset.length,
                                        wid: resultsDiv.dataset.width,
                                        inches: resultsDiv.dataset.inches,
                                        sides: resultsDiv.dataset.sides,
                                        soil: resultsDiv.dataset.soil,
                                        tier: resultsDiv.dataset.tier,
                                        mid: priceMid
                                    });
                                    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END) - CKPT:2
                                    
                                    console.log('[EST-RESULTS:IDS_READY]', {
                                        low: !!priceLowEl,
                                        mid: !!priceMidEl,
                                        high: !!priceHighEl
                                    });
                                    console.log('[EST-RESULTS:DATASET_READY]', { mid: priceMid });
                                    console.log('[EST-RESULTS:SET]', { mid: resultsDiv.dataset.priceMid });
                                    
                                    // Step 5: Show Use Selected Price button
                                    const useBtn = document.getElementById('use-selected-price');
                                    if (useBtn && (useBtn.style.display === 'none' || useBtn.offsetParent === null)) {
                                        useBtn.style.display = 'inline-block';
                                        console.log('[EST-CALC:USE_BTN_SHOWN]');
                                    }
                                }
                                // === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (END)
                            // === SAFE-HOTFIX: INPUT-SCOPE (END)
                                
                                console.log('✅ Results displayed in calc-results div');
                            }
                        } else {
                            // Fallback to existing method with live inputs
                            console.log('Calling calculateMaterialBasedPrice with:', i);
                            const result = this.calculateMaterialBasedPrice(i);
                            console.log('Calculation result:', result);
                            
                            // Store result
                            this.currentCalculation = result;
                            
                            // === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (BEGIN) - Fallback path
                            // Get the calc root for scoped output
                            const calcRootFallback = event.currentTarget.closest('[data-calc-root]') || document;
                            
                            // Get context early for fallback path
                            const context = this.getCurrentContext();
                            console.log('[FALLBACK:CONTEXT]', context);
                            
                            // Show results div and populate it - scoped
                            const resultsDiv = calcRootFallback.querySelector('#calc-results') || document.getElementById('calc-results');
                            console.log('[FALLBACK:RESULTS_DIV]', { found: !!resultsDiv, context });
                            if (resultsDiv && result) {
                                resultsDiv.style.display = 'block';
                                
                                // Update foam pounds - scoped
                                const lbsEl = calcRootFallback.querySelector('#out-lbs');
                                if (lbsEl) lbsEl.textContent = Math.round(result.materialWeight || 0);
                                
                                // Update volume - scoped
                                const ft3El = calcRootFallback.querySelector('#out-ft3');
                                if (ft3El) ft3El.textContent = Math.round(result.voidVolume || 0);
                                
                                const yd3El = calcRootFallback.querySelector('#out-yd3');
                                if (yd3El) yd3El.textContent = (result.voidVolumeCuYd || (result.voidVolume || 0) / 27).toFixed(2);
                                
                                // === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (BEGIN) - Price updates
                                // Calculate prices once
                                const priceLowVal = Math.round(result.estimatedPriceLow || 0);
                                const priceMidVal = Math.round((result.estimatedPriceLow + result.estimatedPriceHigh) / 2 || 0);
                                const priceHighVal = Math.round(result.estimatedPriceHigh || 0);
                                
                                // Update price options - scoped
                                const priceLowEl = calcRootFallback.querySelector('#out-price-low') || document.getElementById('out-price-low');
                                if (priceLowEl) priceLowEl.textContent = '$' + priceLowVal;
                                
                                const priceMidEl = calcRootFallback.querySelector('#out-price-mid') || document.getElementById('out-price-mid');
                                if (priceMidEl) priceMidEl.textContent = '$' + priceMidVal;
                                
                                const priceHighEl = calcRootFallback.querySelector('#out-price-high') || document.getElementById('out-price-high');
                                if (priceHighEl) priceHighEl.textContent = '$' + priceHighVal;
                                
                                // Step 2: Write dataset for estimate context (fallback path)
                                if (context === 'estimate' && resultsDiv) {
                                    resultsDiv.dataset.priceLow = priceLowVal;
                                    resultsDiv.dataset.priceMid = priceMidVal;
                                    resultsDiv.dataset.priceHigh = priceHighVal;
                                    
                                    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - CKPT:2 fallback
                                    // Extend dataset with dimensions for estimate Use button (fallback path)
                                    resultsDiv.dataset.length = i.length || result.length || 0;
                                    resultsDiv.dataset.width = i.width || result.width || 0;
                                    resultsDiv.dataset.inches = i.inchesSettled || result.inchesSettled || 1;
                                    resultsDiv.dataset.sides = i.sidesSettled || result.sidesSettled || 1;
                                    resultsDiv.dataset.soil = i.soilType || result.soilType || 'mixed';
                                    resultsDiv.dataset.tier = 'mid'; // Default tier
                                    
                                    console.log('[EST-RESULTS:DATASET_EXTENDED] (fallback)', {
                                        len: resultsDiv.dataset.length,
                                        wid: resultsDiv.dataset.width,
                                        inches: resultsDiv.dataset.inches,
                                        sides: resultsDiv.dataset.sides,
                                        soil: resultsDiv.dataset.soil,
                                        tier: resultsDiv.dataset.tier,
                                        mid: priceMidVal
                                    });
                                    // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END) - CKPT:2 fallback
                                    
                                    console.log('[EST-RESULTS:IDS_READY]', {
                                        low: !!priceLowEl,
                                        mid: !!priceMidEl,
                                        high: !!priceHighEl
                                    });
                                    console.log('[EST-RESULTS:DATASET_READY]', { mid: priceMidVal });
                                    
                                    try {
                                        console.log('[EST-RESULTS:SET]', { mid: resultsDiv.dataset.priceMid });
                                    } catch (e) {
                                        console.error('[EST-RESULTS:ERROR]', e);
                                    }
                                    
                                    // Step 5: Show Use Selected Price button in fallback path
                                    const useBtn = document.getElementById('use-selected-price');
                                    console.log('[EST-CALC:BTN_SEARCH]', { found: !!useBtn });
                                    
                                    if (useBtn) {
                                        console.log('[EST-CALC:BTN_BEFORE]', {
                                            display: useBtn.style.display,
                                            disabled: useBtn.disabled
                                        });
                                        
                                        useBtn.disabled = false;
                                        useBtn.style.display = 'inline-block';
                                        useBtn.style.visibility = 'visible';
                                        
                                        console.log('[EST-CALC:BTN_AFTER]', {
                                            display: useBtn.style.display,
                                            disabled: useBtn.disabled
                                        });
                                        
                                        console.log('[EST-CALC:USE_BTN_SHOWN] (fallback path)');
                                    } else {
                                        console.error('[EST-CALC:NO_BUTTON] use-selected-price button not found in DOM');
                                    }
                                }
                                // === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (END)
                            // === SAFE-HOTFIX: INPUT-SCOPE (END)
                                
                                console.log('✅ Results displayed in calc-results div from fallback');
                                
                                // === SAFE-HOTFIX: ESTIMATE PRICE CONTRACT (BEGIN)
                                // Emit success for estimate context
                                if (context === 'estimate' && result.estimatedPriceLow > 0) {
                                    const mid = Math.round((result.estimatedPriceLow + result.estimatedPriceHigh) / 2);
                                    console.log('[EST-CALC:CALC_OK]', { mid });
                                    
                                    // Step 5: Show Use Selected Price button
                                    const useBtn = document.getElementById('use-selected-price');
                                    if (useBtn && (useBtn.style.display === 'none' || useBtn.offsetParent === null)) {
                                        useBtn.style.display = 'inline-block';
                                        console.log('[EST-CALC:USE_BTN_SHOWN]');
                                    }
                                    // === SAFE-HOTFIX: ESTIMATE PRICE CONTRACT (END)
                                }
                            }
                        }
                    });
                    console.log('[EST-CALC:BIND_OK]', { context, root: root.id || 'document' });
                }
                
                // Pricing method selector
                const pricingMethodSelector = document.getElementById('pricing-method');
                if (pricingMethodSelector) {
                    pricingMethodSelector.addEventListener('change', () => {
                        this.handlePricingMethodChange();
                    });
                }
                
                // Project type buttons (new visual UI)
                const projectTypeButtons = document.querySelectorAll('.project-type-btn');
                projectTypeButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        // Remove active class from all buttons
                        projectTypeButtons.forEach(b => b.classList.remove('active'));
                        // Add active class to clicked button
                        btn.classList.add('active');
                        
                        // Update hidden input
                        const projectType = btn.dataset.type;
                        document.getElementById('project-type').value = projectType;
                        
                        // Handle project type change
                        this.handleProjectTypeChange();
                    });
                });
                
                // Severity buttons
                const severityButtons = document.querySelectorAll('.severity-btn');
                severityButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        severityButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        document.getElementById('severity').value = btn.dataset.value;
                        this.calculateTotal();
                    });
                });
                
                // Accessibility buttons
                const accessButtons = document.querySelectorAll('.access-btn');
                accessButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        accessButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        document.getElementById('accessibility').value = btn.dataset.value;
                        this.calculateTotal();
                    });
                });
                
                // Square footage input
                const squareFootageInput = document.getElementById('square-footage');
                if (squareFootageInput) {
                    squareFootageInput.addEventListener('input', () => {
                        this.calculateTotal();
                    });
                }
                
                // Custom rate input
                const customRateInput = document.getElementById('custom-rate');
                if (customRateInput) {
                    customRateInput.addEventListener('input', () => {
                        this.calculateTotal();
                    });
                }
                
                // Material-based calculation inputs - bind to both invoice and estimate contexts
                const materialInputs = [
                    'length-ft', 'width-ft', 'inches-settled', 'sides-settled',
                    'soil-type', 'weather-conditions', 'moisture-level', 'travel-distance'
                ];
                
                materialInputs.forEach(inputId => {
                    // Bind to original ID (invoice context)
                    const originalInput = document.getElementById(inputId);
                    if (originalInput) {
                        originalInput.addEventListener('input', () => {
                            this.updateMaterialCalculation();
                        });
                        originalInput.addEventListener('change', () => {
                            this.updateMaterialCalculation();
                        });
                    }
                    
                    // Also bind to estimate-prefixed ID when it becomes available
                    setTimeout(() => {
                        const estimateInput = document.getElementById('estimate-' + inputId);
                        if (estimateInput && !estimateInput.hasAttribute('data-listener-added')) {
                            estimateInput.setAttribute('data-listener-added', 'true');
                            estimateInput.addEventListener('input', () => {
                                this.updateMaterialCalculation();
                            });
                            estimateInput.addEventListener('change', () => {
                                this.updateMaterialCalculation();
                            });
                        }
                    }, 1000);
                });
                
                const travelDistanceInput = document.getElementById('travel-distance');
                if (travelDistanceInput) {
                    travelDistanceInput.addEventListener('input', () => {
                        this.calculateTotal();
                    });
                }
                
                // Calculate button - using event delegation since button may be hidden initially
                document.addEventListener('click', (e) => {
                    if (e.target && (e.target.id === 'calculate-concrete' || e.target.id === 'estimate-calculate-concrete')) {
                        e.preventDefault();
                        this.forceCalculation();
                    }
                });
                
                // Add service button - using event delegation since button may be hidden initially
                document.addEventListener('click', (e) => {
                    if (e.target && (e.target.id === 'add-concrete-service' || e.target.id === 'estimate-add-concrete-service')) {
                        if (e.target.disabled) {
                            alert('Please calculate pricing first before adding service.');
                            return;
                        }
                        ConcreteCalculator.addConcreteService();
                    }
                });

                // Also try direct event listener as backup
                setTimeout(() => {
                    const addServiceBtn = document.getElementById('add-concrete-service') || document.getElementById('estimate-add-concrete-service');
                    if (addServiceBtn && !addServiceBtn.hasAttribute('data-listener-added')) {
                        addServiceBtn.setAttribute('data-listener-added', 'true');
                        addServiceBtn.addEventListener('click', (e) => {
                            if (e.target.disabled) {
                                alert('Please calculate pricing first before adding service.');
                                return;
                            }
                            ConcreteCalculator.addConcreteService();
                        });
                    }
                }, 1000);
                
            } catch (error) {
                console.error('Calculator event binding error:', error);
            }
        },
        
        handleProjectTypeChange: function() {
            try {
                const projectType = document.getElementById('project-type').value;
                const customRateGroup = document.querySelector('.custom-rate');
                
                if (projectType === 'custom') {
                    customRateGroup.style.display = 'block';
                    document.getElementById('custom-rate').required = true;
                } else {
                    customRateGroup.style.display = 'none';
                    document.getElementById('custom-rate').required = false;
                }
                
                // Update calculation display with selected type
                const activeBtn = document.querySelector('.project-type-btn.active');
                if (activeBtn) {
                    const rate = activeBtn.dataset.rate;
                    this.currentCalculation.baseRate = parseFloat(rate);
                }
                
                this.calculateTotal();
                
            } catch (error) {
                console.error('Project type change error:', error);
            }
        },
        
        handlePricingMethodChange: function() {
            try {
                const pricingMethod = document.getElementById('pricing-method').value;
                const traditionalSection = document.querySelector('.traditional-pricing');
                const materialSection = document.querySelector('.material-pricing');
                
                if (pricingMethod === 'material') {
                    if (traditionalSection) traditionalSection.style.display = 'none';
                    if (materialSection) materialSection.style.display = 'block';
                    this.currentCalculation.pricingMethod = 'material';
                } else {
                    if (traditionalSection) traditionalSection.style.display = 'block';
                    if (materialSection) materialSection.style.display = 'none';
                    this.currentCalculation.pricingMethod = 'traditional';
                }
                
                this.calculateTotal();
                
            } catch (error) {
                console.error('Pricing method change error:', error);
            }
        },
        
        calculateMaterialBasedPrice: function(liveInputs) {
            try {
                // Use live inputs if provided, otherwise try to read fresh from DOM
                let length, width, inchesSettled, sidesSettled, soilType;
                
                if (liveInputs) {
                    // Use the live inputs passed in
                    length = liveInputs.length || 0;
                    width = liveInputs.width || 0;
                    inchesSettled = liveInputs.inchesSettled || 1;
                    sidesSettled = liveInputs.sidesSettled || 1;
                    soilType = liveInputs.soilType || 'normal';
                } else {
                    // Read fresh from DOM
                    const freshInputs = this.getCalcInputs();
                    length = freshInputs.length || 0;
                    width = freshInputs.width || 0;
                    inchesSettled = freshInputs.inchesSettled || 1;
                    sidesSettled = freshInputs.sidesSettled || 1;
                    soilType = freshInputs.soilType || 'normal';
                }
                
                // Map soil type for compatibility
                const mappedSoilType = this.mapSoilType(soilType);
                const weather = this.mapWeatherType(this.currentCalculation.weatherConditions || 'normal');
                const moistureLevel = this.currentCalculation.moistureLevel || 'normal';
                const travelDistanceMi = this.currentCalculation.travelDistance || 0;
                
                // Debug logging to track values
                console.log('🔍 Using live values for calculation:', {
                    length, width, inchesSettled, sidesSettled,
                    soilType: mappedSoilType, weather, moistureLevel, travelDistanceMi
                });
                
                
                // Business rule calculations - Using ER Poly Estimator formula
                const squareFootage = length * width;
                
                // Wedge multipliers based on sides settled (from ER formula)
                const wedgeMultipliers = {
                    '1': 0.50,  // 1 side settled
                    '2': 0.25,  // 2 sides/corner settled  
                    '3': 1.00   // 3 entire slab settled
                };
                const wedgeK = wedgeMultipliers[sidesSettled] || 1.00;
                
                // Calculate volume with wedge multiplier
                const voidVolumeCuFt = squareFootage * (inchesSettled / 12) * wedgeK;
                const voidVolumeCuYd = voidVolumeCuFt / 27;
                
                // Foam factors (lb/yd³) - RR201 standard, RR401 for heavy loads
                // === FIX: Get foam type from correct context (estimate vs invoice)
                let foamTypeRadio;
                const context = this.getCurrentContext();
                
                if (context === 'estimate') {
                    // Look specifically in estimate section
                    const estimateSection = document.querySelector('.estimate-concrete-section');
                    foamTypeRadio = estimateSection ? estimateSection.querySelector('input[name="foamType"]:checked') : null;
                } else {
                    // Look in invoice section
                    const invoiceSection = document.querySelector('#concrete-services');
                    foamTypeRadio = invoiceSection ? invoiceSection.querySelector('input[name="foamType"]:checked') : null;
                }
                
                // Fallback to global search if not found
                if (!foamTypeRadio) {
                    foamTypeRadio = document.querySelector('input[name="foamType"]:checked');
                }
                
                const foamType = foamTypeRadio ? foamTypeRadio.value : 'RR201';
                
                // Check if void fill is selected (radio button, not checkbox)
                const applicationTypeRadio = document.querySelector('input[name="applicationType"]:checked');
                const isVoidFill = applicationTypeRadio?.value === 'void' || false;
                
                // Determine foam factor based on selection
                let foamFactorLbs;
                if (isVoidFill) {
                    // Void fill factors
                    foamFactorLbs = (foamType === 'RR401') ? 110 : 70; // RR401 void: 110, RR201 void: 70
                    console.log('[calc-factors] Using VOID fill factor:', { foamType, foamFactorLbs });
                } else {
                    // Lift factors (default)
                    foamFactorLbs = (foamType === 'RR401') ? 120 : 100; // RR401 lift: 120, RR201 lift: 100
                    console.log('[calc-factors] Using LIFT factor:', { foamType, foamFactorLbs });
                }
                
                // Log calculation factors for debugging
                console.log('[calc-factors]', { 
                    wedgeK, 
                    foamLift: (foamType === 'RR401') ? 120 : 100,
                    foamVoid: (foamType === 'RR401') ? 110 : 70,
                    using: isVoidFill ? 'void' : 'lift',
                    selectedFoam: foamType,
                    actualFactor: foamFactorLbs
                });
                
                const materialWeightLbs = voidVolumeCuYd * foamFactorLbs;
                
                // Material cost per pound (industry standard range)
                const materialCostLow = materialWeightLbs * 10;  // $10/lb low
                const materialCostHigh = materialWeightLbs * 15; // $15/lb high
                
                // Verification: 10x20, 1", 1 side, RR401 should = ~463 at mid price
                // Volume: 10*20*(1/12)*0.5 = 8.333ft³ = 0.3086yd³
                // Weight: 0.3086*120 = 37.04lbs
                // Mid: 37.04*12.5 = $463

                // Remove complexity factor - wedge already accounts for difficulty
                const complexityFactor = 1.00; // Wedge handles the complexity
                
                // Environmental multipliers (optional, keeping minimal)
                const envMultiplier = 1.00; // Simplified - price per pound handles variations
                
                // Direct pricing - matching ER formula (pounds * $/lb)
                // No need for complex markups - the $/lb already includes labor and profit
                const totalPriceLow = materialCostLow;
                const totalPriceHigh = materialCostHigh;

                // Price per square foot
                const pricePerSqFtLow = squareFootage > 0 ? totalPriceLow / squareFootage : 0;
                const pricePerSqFtHigh = squareFootage > 0 ? totalPriceHigh / squareFootage : 0;


                // Enhanced suggestion data for price review
                const recommendedPrice = (totalPriceLow + totalPriceHigh) / 2;
                const profitMargin = {
                    low: "N/A",
                    high: "N/A", 
                    average: "N/A"
                };
                
                const costBreakdown = {
                    material: { low: materialCostLow, high: materialCostHigh, average: (materialCostLow + materialCostHigh) / 2 },
                    equipment: 0,
                    labor: { low: 0, high: 0, average: 0 },
                    total: { low: totalPriceLow, high: totalPriceHigh, average: recommendedPrice }
                };
                
                const pricingFactors = {
                    complexity: wedgeK, // Use wedge multiplier instead
                    environmental: envMultiplier,
                    sizeTier: this.determineSizeTier(squareFootage).name,
                    settlement: { depth: inchesSettled, sides: sidesSettled },
                    conditions: { soil: mappedSoilType, weather: "normal", moisture: "normal" }
                };

                const result = {
                    squareFootage,
                    multiplier: wedgeK, // Wedge multiplier from ER formula
                    cubicYards: voidVolumeCuYd,
                    weight: materialWeightLbs,
                    materialCostLow,
                    materialCostHigh,
                    estimatedPriceLow: totalPriceLow,
                    estimatedPriceHigh: totalPriceHigh,
                    recommendedPrice,
                    pricePerSqFtLow,
                    pricePerSqFtHigh,
                    length,
                    width,
                    inchesSettled,
                    sidesSettled,
                    // Enhanced calculation details
                    sizeTier: this.determineSizeTier(squareFootage).name,
                    complexityFactor: wedgeK,
                    environmentalMultiplier: 1.0,
                    equipmentCosts: 0,
                    laborAndOverhead: 0,
                    totalMultiplier: wedgeK,
                    voidVolume: voidVolumeCuFt, // Already in cubic feet
                    voidVolumeCuYd: voidVolumeCuYd, // Also include cubic yards
                    baseMaterialCostLow: materialCostLow,
                    baseMaterialCostHigh: materialCostHigh,
                    // Suggestion engine data
                    profitMargin,
                    costBreakdown,
                    pricingFactors,
                    soilType,
                    weatherConditions: weather,
                    moistureLevel,
                    travelDistance: travelDistanceMi,
                    materialWeight: materialWeightLbs,
                    // === FIX: Add foam type to result for tracking
                    foamType: foamType,
                    foamFactorUsed: foamFactorLbs,
                    applicationType: isVoidFill ? 'void' : 'lift'
                };
                
                // Return the result object
                return result;
                
            } catch (error) {
                console.error('Business rules calculation error:', error);
                return this.getDefaultCalculationResult();
            }
        },

        // Helper functions for business rules
        mapSoilType: function(uiValue) {
            const mapping = {
                'mixed': 'standard',
                'sand': 'standard',
                'clay': 'clay',
                'rock': 'rocky',
                'organic': 'standard'
            };
            return mapping[uiValue] || 'standard';
        },

        mapWeatherType: function(uiValue) {
            const mapping = {
                'normal': 'normal',
                'cold': 'cold',
                'hot': 'hot'
            };
            return mapping[uiValue] || 'normal';
        },

        getCurrentContext: function() {
            
            // Method 1: Check active view classes first (most reliable)
            const activeView = document.querySelector('.view.active');
            if (activeView) {
                if (activeView.id === 'estimate-creation') {
                    return 'estimate';
                }
                if (activeView.id === 'invoice-creation') {
                    return 'invoice';
                }
            }
            
            // Method 2: Check visible sections directly
            const invoiceCreationSection = document.getElementById('invoice-creation');
            const estimateCreationSection = document.getElementById('estimate-creation');
            
            // Check if sections are visible using classList instead of style
            if (estimateCreationSection && estimateCreationSection.classList.contains('active')) {
                return 'estimate';
            }
            
            if (invoiceCreationSection && invoiceCreationSection.classList.contains('active')) {
                return 'invoice';
            }
            
            // Method 3: Check business type radio buttons using correct selectors
            const estimateBusinessRadio = document.querySelector('input[name="estimateBusinessType"]:checked');
            const invoiceBusinessRadio = document.querySelector('input[name="businessType"]:checked');
            
            if (estimateBusinessRadio) {
                return 'estimate';
            }
            
            if (invoiceBusinessRadio) {
                return 'invoice';
            }
            
            // Method 4: Check forms visibility
            const invoiceForm = document.getElementById('invoice-form');
            const estimateForm = document.getElementById('estimate-form');
            
            if (estimateForm && estimateForm.offsetParent !== null) {
                return 'estimate';
            }
            
            if (invoiceForm && invoiceForm.offsetParent !== null) {
                return 'invoice';
            }
            
            // Method 5: Check URL or other indicators
            if (window.location.hash === '#estimate') {
                return 'estimate';
            }
            
            return 'invoice'; // Default to invoice instead of unknown
        },
        
        getContextElement: function(baseId, context) {
            
            // For estimate context, always try estimate-prefixed ID first
            if (context === 'estimate') {
                const estimatePrefixedId = 'estimate-' + baseId;
                const estimateElement = document.getElementById(estimatePrefixedId);
                
                if (estimateElement) {
                    return estimateElement;
                }
                
                // Also check if the original element exists within estimate context
                const originalElement = document.getElementById(baseId);
                if (originalElement) {
                    const estimateServiceContent = document.getElementById('estimate-services-content');
                    const estimateForm = document.getElementById('estimate-form');
                    
                    // Check if element is within estimate context areas
                    if ((estimateServiceContent && estimateServiceContent.contains(originalElement)) ||
                        (estimateForm && estimateForm.contains(originalElement))) {
                        return originalElement;
                    }
                }
                
                return null;
            }
            
            // For invoice context, use original ID
            if (context === 'invoice') {
                const originalElement = document.getElementById(baseId);
                
                if (originalElement) {
                    // Make sure it's not in an estimate context area to avoid conflicts
                    const estimateServiceContent = document.getElementById('estimate-services-content');
                    if (estimateServiceContent && estimateServiceContent.contains(originalElement)) {
                        return null;
                    }
                    
                    return originalElement;
                }
            }
            
            // Fallback: try to find any element with the base ID
            const fallbackElement = document.getElementById(baseId);
            return fallbackElement;
        },
        
        calculateVoidVolume: function(squareFootage, inchesSettled, sidesSettled) {
            try {
                // Get base multiplier from table
                let baseMultiplier = 0;
                
                if (MaterialPricing.multiplierTable[inchesSettled] && 
                    MaterialPricing.multiplierTable[inchesSettled][sidesSettled]) {
                    baseMultiplier = MaterialPricing.multiplierTable[inchesSettled][sidesSettled];
                } else {
                    // Find closest match if exact values don't exist
                    const depths = Object.keys(MaterialPricing.multiplierTable).map(Number).sort((a, b) => a - b);
                    const closestDepth = depths.reduce((prev, curr) => 
                        Math.abs(curr - inchesSettled) < Math.abs(prev - inchesSettled) ? curr : prev
                    );
                    
                    const validSides = Math.min(Math.max(sidesSettled, 1), 3);
                    baseMultiplier = MaterialPricing.multiplierTable[closestDepth][validSides] || 0.0015;
                }
                
                // Enhanced void volume calculation considering settlement pattern
                const settlementFactor = this.calculateSettlementFactor(inchesSettled, sidesSettled);
                const adjustedMultiplier = baseMultiplier * settlementFactor;
                
                // Calculate cubic yards and volume
                const cubicYards = squareFootage * adjustedMultiplier;
                const volume = cubicYards * 27; // Convert to cubic feet
                
                // Determine complexity based on settlement characteristics
                let complexity = 'medium';
                if (inchesSettled >= 4 || sidesSettled >= 3) complexity = 'high';
                if (inchesSettled >= 6 || (inchesSettled >= 3 && sidesSettled >= 3)) complexity = 'very_high';
                if (inchesSettled <= 1 && sidesSettled === 1) complexity = 'low';
                
                return {
                    baseMultiplier,
                    adjustedMultiplier,
                    cubicYards,
                    volume,
                    complexity,
                    settlementFactor
                };
                
            } catch (error) {
                console.error('Void volume calculation error:', error);
                return {
                    baseMultiplier: 0.0015,
                    adjustedMultiplier: 0.0015,
                    cubicYards: 0,
                    volume: 0,
                    complexity: 'medium',
                    settlementFactor: 1.0
                };
            }
        },
        
        calculateSettlementFactor: function(inchesSettled, sidesSettled) {
            // Factor that accounts for non-uniform settlement patterns
            // More sides settled = more complex void pattern = more material needed
            let factor = 1.0;
            
            // Settlement depth factor (more settlement = exponentially more material)
            if (inchesSettled > 3) {
                factor *= 1.0 + ((inchesSettled - 3) * 0.1);
            }
            
            // Multi-side settlement factor
            if (sidesSettled > 1) {
                factor *= 1.0 + ((sidesSettled - 1) * 0.15);
            }
            
            // Extreme cases require additional material
            if (inchesSettled >= 5 && sidesSettled >= 2) {
                factor *= 1.2;
            }
            
            return Math.min(factor, 2.0); // Cap at 2x multiplier
        },
        
        determineSizeTier: function(squareFootage) {
            for (const [tierName, tier] of Object.entries(MaterialPricing.sizeTierMultipliers)) {
                if (squareFootage >= tier.min && squareFootage < tier.max) {
                    return { name: tierName, ...tier };
                }
            }
            return { name: 'medium', ...MaterialPricing.sizeTierMultipliers.medium };
        },
        
        calculateEnvironmentalMultiplier: function() {
            try {
                // Read values from form inputs, default to standard conditions if not found
                const soilType = document.getElementById('soil-type')?.value || 'mixed';
                const weatherConditions = document.getElementById('weather-conditions')?.value || 'normal';
                const moistureLevel = document.getElementById('moisture-level')?.value || 'normal';
                
                // Get multipliers from pricing data
                const soilMultiplier = MaterialPricing.soilTypeMultipliers[soilType] || 1.0;
                const tempMultiplier = MaterialPricing.conditionMultipliers.temperature[weatherConditions] || 1.0;
                const moistureMultiplier = MaterialPricing.conditionMultipliers.moisture[moistureLevel] || 1.0;
                
                return soilMultiplier * tempMultiplier * moistureMultiplier;
            } catch (error) {
                console.error('Environmental multiplier calculation error:', error);
                return 1.0; // Default to no multiplier on error
            }
        },
        
        calculateEquipmentCosts: function(squareFootage) {
            try {
                const baseCost = MaterialPricing.equipmentFactors.mobilization + 
                               MaterialPricing.equipmentFactors.setupTime + 
                               MaterialPricing.equipmentFactors.cleanupTime;
                
                // Add travel costs based on distance
                const travelDistance = parseFloat(document.getElementById('travel-distance')?.value) || 0;
                const travelCost = travelDistance * MaterialPricing.equipmentFactors.travelDistance;
                
                // Scale equipment costs slightly with project size
                const scaleFactor = Math.min(1.0 + (squareFootage / 1000), 1.5);
                
                return (baseCost * scaleFactor) + travelCost;
            } catch (error) {
                console.error('Equipment cost calculation error:', error);
                return MaterialPricing.equipmentFactors.mobilization + 
                       MaterialPricing.equipmentFactors.setupTime + 
                       MaterialPricing.equipmentFactors.cleanupTime;
            }
        },
        
        calculateLaborCosts: function(squareFootage, complexity) {
            // Base labor rate per square foot
            let laborRate = 2.5; // Base rate per sq ft
            
            // Adjust for complexity
            const complexityMultipliers = {
                low: 0.8,
                medium: 1.0,
                high: 1.3,
                very_high: 1.6
            };
            
            laborRate *= complexityMultipliers[complexity] || 1.0;
            
            // Calculate total labor cost
            const laborCost = squareFootage * laborRate;
            
            // Add minimum labor charge
            return Math.max(laborCost, 150);
        },
        
        getDefaultCalculationResult: function() {
            return {
                squareFootage: 0,
                multiplier: 0,
                cubicYards: 0,
                weight: 0,
                materialCostLow: 0,
                materialCostHigh: 0,
                estimatedPriceLow: 0,
                estimatedPriceHigh: 0,
                pricePerSqFtLow: 0,
                pricePerSqFtHigh: 0,
                length: 0,
                width: 0,
                inchesSettled: 1,
                sidesSettled: 1,
                sizeTier: 'medium',
                complexityFactor: 1.0,
                environmentalMultiplier: 1.0,
                equipmentCosts: 0,
                laborAndOverhead: 0,
                totalMultiplier: 1.0,
                voidVolume: 0
            };
        },
        
        calculateTotal: function() {
            try {
                const pricingMethodElement = document.getElementById('pricing-method');
                const pricingMethod = pricingMethodElement ? pricingMethodElement.value : 'traditional';
                
                if (pricingMethod === 'material') {
                    // Material-based calculation
                    const materialCalc = this.calculateMaterialBasedPrice();
                    
                    // Update current calculation with material-based results
                    this.currentCalculation = {
                        ...this.currentCalculation,
                        pricingMethod: 'material',
                        length: materialCalc.length,
                        width: materialCalc.width,
                        squareFootage: materialCalc.squareFootage,
                        inchesSettled: materialCalc.inchesSettled,
                        sidesSettled: materialCalc.sidesSettled,
                        materialCostLow: materialCalc.materialCostLow,
                        materialCostHigh: materialCalc.materialCostHigh,
                        estimatedPriceLow: materialCalc.estimatedPriceLow,
                        estimatedPriceHigh: materialCalc.estimatedPriceHigh,
                        pricePerSqFtLow: materialCalc.pricePerSqFtLow,
                        pricePerSqFtHigh: materialCalc.pricePerSqFtHigh,
                        // Use average for display purposes
                        baseRate: (materialCalc.pricePerSqFtLow + materialCalc.pricePerSqFtHigh) / 2,
                        finalRate: (materialCalc.pricePerSqFtLow + materialCalc.pricePerSqFtHigh) / 2,
                        total: (materialCalc.estimatedPriceLow + materialCalc.estimatedPriceHigh) / 2,
                        multiplier: materialCalc.multiplier,
                        cubicYards: materialCalc.cubicYards,
                        weight: materialCalc.weight
                    };
                    
                } else {
                    // Traditional calculation
                    const projectType = document.getElementById('project-type').value;
                    const squareFootage = parseFloat(document.getElementById('square-footage').value) || 0;
                    const severity = document.getElementById('severity').value;
                    const accessibility = document.getElementById('accessibility').value;
                    const customRate = parseFloat(document.getElementById('custom-rate').value) || 0;
                    
                    // Calculate base rate
                    let baseRate = 0;
                    if (projectType === 'custom') {
                        baseRate = customRate;
                    } else if (ConcreteRates[projectType]) {
                        baseRate = ConcreteRates[projectType];
                    }
                    
                    // Calculate multipliers
                    const severityMultiplier = SeverityMultipliers[severity] || 1.0;
                    const accessibilityMultiplier = AccessibilityMultipliers[accessibility] || 1.0;
                    const totalMultiplier = severityMultiplier * accessibilityMultiplier;
                    
                    // Calculate final rate and total
                    const finalRate = baseRate * totalMultiplier;
                    const total = finalRate * squareFootage;
                    
                    // Update current calculation
                    this.currentCalculation = {
                        ...this.currentCalculation,
                        pricingMethod: 'traditional',
                        projectType,
                        squareFootage,
                        severity,
                        accessibility,
                        customRate,
                        baseRate,
                        finalRate,
                        total,
                        severityMultiplier,
                        accessibilityMultiplier,
                        totalMultiplier
                    };
                }
                
                // Update display
                this.updateCalculationDisplay();
                
            } catch (error) {
                console.error('Calculation error:', error);
            }
        },
        
        updateCalculationDisplay: function() {
            try {
                const calc = this.currentCalculation;
                
                if (calc.pricingMethod === 'material') {
                    // Update material-based display
                    this.updateMaterialDisplay(calc);
                } else {
                    // Update traditional display
                    this.updateTraditionalDisplay(calc);
                }
                
                // Update total display (common for both methods)
                const totalDisplay = document.getElementById('concrete-total');
                if (totalDisplay) {
                    totalDisplay.textContent = this.formatCurrency(calc.total);
                }
                
                // Enable/disable add service button
                const addServiceBtn = document.getElementById('add-concrete-service') || document.getElementById('estimate-add-concrete-service');
                if (addServiceBtn) {
                    addServiceBtn.disabled = calc.total <= 0 || calc.squareFootage <= 0;
                }
                
            } catch (error) {
                console.error('Display update error:', error);
            }
        },
        
        updateTraditionalDisplay: function(calc) {
            try {
                // Update base rate display
                const baseRateDisplay = document.getElementById('base-rate-display');
                if (baseRateDisplay) {
                    baseRateDisplay.textContent = this.formatCurrency(calc.baseRate) + '/sq ft';
                }
                
                // Update multiplier display
                const multiplierDisplay = document.getElementById('multiplier-display');
                if (multiplierDisplay) {
                    const multiplierText = (calc.totalMultiplier || 1).toFixed(2) + 'x';
                    const breakdown = [];
                    
                    if (calc.severityMultiplier && calc.severityMultiplier !== 1.0) {
                        breakdown.push(`Severity: ${calc.severityMultiplier}x`);
                    }
                    if (calc.accessibilityMultiplier && calc.accessibilityMultiplier !== 1.0) {
                        breakdown.push(`Access: ${calc.accessibilityMultiplier}x`);
                    }
                    
                    multiplierDisplay.textContent = multiplierText;
                    if (breakdown.length > 0) {
                        multiplierDisplay.title = breakdown.join(', ');
                    }
                }
                
                // Update final rate display
                const finalRateDisplay = document.getElementById('final-rate-display');
                if (finalRateDisplay) {
                    finalRateDisplay.textContent = this.formatCurrency(calc.finalRate) + '/sq ft';
                }
                
            } catch (error) {
                console.error('Traditional display update error:', error);
            }
        },
        
        updateMaterialDisplay: function(calc) {
            try {
                // Update material-based calculation displays
                const squareFootageDisplay = document.getElementById('material-square-footage');
                if (squareFootageDisplay) {
                    squareFootageDisplay.textContent = calc.squareFootage.toFixed(1) + ' sq ft';
                }
                
                const cubicYardsDisplay = document.getElementById('material-cubic-yards');
                if (cubicYardsDisplay) {
                    cubicYardsDisplay.textContent = calc.cubicYards.toFixed(4) + ' cu yd';
                }
                
                const weightDisplay = document.getElementById('material-weight');
                if (weightDisplay) {
                    weightDisplay.textContent = calc.weight.toFixed(1) + ' lbs';
                }
                
                const materialCostLowDisplay = document.getElementById('material-cost-low');
                if (materialCostLowDisplay) {
                    materialCostLowDisplay.textContent = this.formatCurrency(calc.materialCostLow);
                }
                
                const materialCostHighDisplay = document.getElementById('material-cost-high');
                if (materialCostHighDisplay) {
                    materialCostHighDisplay.textContent = this.formatCurrency(calc.materialCostHigh);
                }
                
                const priceLowDisplay = document.getElementById('estimated-price-low');
                if (priceLowDisplay) {
                    priceLowDisplay.textContent = this.formatCurrency(calc.estimatedPriceLow);
                }
                
                const priceHighDisplay = document.getElementById('estimated-price-high');
                if (priceHighDisplay) {
                    priceHighDisplay.textContent = this.formatCurrency(calc.estimatedPriceHigh);
                }
                
                const pricePerSqFtLowDisplay = document.getElementById('price-per-sqft-low');
                if (pricePerSqFtLowDisplay) {
                    pricePerSqFtLowDisplay.textContent = this.formatCurrency(calc.pricePerSqFtLow) + '/sq ft';
                }
                
                const pricePerSqFtHighDisplay = document.getElementById('price-per-sqft-high');
                if (pricePerSqFtHighDisplay) {
                    pricePerSqFtHighDisplay.textContent = this.formatCurrency(calc.pricePerSqFtHigh) + '/sq ft';
                }
                
                // Update traditional displays with enhanced information
                const baseRateDisplay = document.getElementById('base-rate-display');
                if (baseRateDisplay) {
                    baseRateDisplay.textContent = this.formatCurrency(calc.baseRate) + '/sq ft (avg)';
                    baseRateDisplay.title = `Size Tier: ${calc.sizeTier} | Complexity: ${calc.complexityFactor}x`;
                }
                
                const multiplierDisplay = document.getElementById('multiplier-display');
                if (multiplierDisplay) {
                    multiplierDisplay.textContent = `${calc.totalMultiplier.toFixed(2)}x Enhanced`;
                    multiplierDisplay.title = `Settlement: ${calc.inchesSettled}" | Sides: ${calc.sidesSettled} | Base: ${calc.multiplier.toFixed(4)} | ` +
                                            `Size: ${calc.sizeTier} | Environmental: ${calc.environmentalMultiplier.toFixed(2)}x | ` +
                                            `Equipment: ${this.formatCurrency(calc.equipmentCosts)} | Labor: ${this.formatCurrency(calc.laborAndOverhead)}`;
                }
                
                const finalRateDisplay = document.getElementById('final-rate-display');
                if (finalRateDisplay) {
                    finalRateDisplay.textContent = this.formatCurrency(calc.finalRate) + '/sq ft (avg)';
                    finalRateDisplay.title = `Includes materials, labor, equipment, and overhead`;
                }
                
                // Update enhanced display elements
                const sizeTierDisplay = document.getElementById('size-tier-display');
                if (sizeTierDisplay) {
                    sizeTierDisplay.textContent = calc.sizeTier.charAt(0).toUpperCase() + calc.sizeTier.slice(1);
                }
                
                const complexityFactorDisplay = document.getElementById('complexity-factor-display');
                if (complexityFactorDisplay) {
                    complexityFactorDisplay.textContent = calc.complexityFactor.toFixed(1) + 'x';
                }
                
                const environmentalDisplay = document.getElementById('environmental-display');
                if (environmentalDisplay) {
                    environmentalDisplay.textContent = calc.environmentalMultiplier.toFixed(2) + 'x';
                }
                
                const equipmentCostsDisplay = document.getElementById('equipment-costs-display');
                if (equipmentCostsDisplay) {
                    equipmentCostsDisplay.textContent = this.formatCurrency(calc.equipmentCosts);
                }
                
                const laborOverheadDisplay = document.getElementById('labor-overhead-display');
                if (laborOverheadDisplay) {
                    laborOverheadDisplay.textContent = this.formatCurrency(calc.laborAndOverhead);
                }
                
                // Update the note with more detailed information
                const materialNote = document.querySelector('.material-note');
                if (materialNote) {
                    materialNote.innerHTML = `
                        <i class="fas fa-info-circle"></i>
                        Enhanced material pricing: Polyurethane foam $${MaterialPricing.pricePerPoundLow}-$${MaterialPricing.pricePerPoundHigh}/lb, 
                        ${MaterialPricing.weightPerCubicYard} lbs/cu yd. Includes void volume analysis, environmental factors, 
                        equipment costs (${this.formatCurrency(calc.equipmentCosts)}), and labor overhead 
                        (${this.formatCurrency(calc.laborAndOverhead)}).
                    `;
                }
                
            } catch (error) {
                console.error('Enhanced material display update error:', error);
            }
        },
        
        addConcreteService: function() {
            try {
                
                // Get fresh calculation with enhanced suggestion data
                const calc = this.calculateMaterialBasedPrice();
                
                if (calc.estimatedPriceLow <= 0 || calc.squareFootage <= 0) {
                    alert('Please enter valid dimensions and settlement details to get pricing suggestions.');
                    return;
                }
                
                // Check if we're on estimate page vs invoice page using proper selector
                const isEstimatePage = document.querySelector('input[name="estimateBusinessType"][value="concrete"]')?.checked || false;
                
                
                // Show price review modal for user-controlled pricing
                if (window.showPriceReview) {
                    window.showPriceReview(calc, isEstimatePage);
                } else {
                    alert('Price review interface not available. Please refresh the page and try again.');
                    // Fallback with average price if modal unavailable
                    this.addConcreteServiceWithCustomPrice({
                        ...calc,
                        customPrice: calc.recommendedPrice,
                        priceOverride: false // Mark as fallback, not user override
                    });
                }
                
            } catch (error) {
                console.error('Error in suggestion engine:', error);
                alert('Error generating pricing suggestions. Please try again.');
            }
        },
        
        addConcreteServiceWithCustomPrice: function(serviceData) {
            try {
                
                const customPrice = serviceData.customPrice || serviceData.finalPrice;
                if (!customPrice || customPrice <= 0) {
                    throw new Error('Invalid custom price provided');
                }
                
                // Create service object with custom price
                const service = {
                    type: 'concrete',
                    id: 'concrete_' + Date.now(),
                    description: this.getServiceDescription(serviceData),
                    quantity: serviceData.squareFootage,
                    unit: 'sq ft',
                    rate: customPrice / serviceData.squareFootage,
                    amount: customPrice,
                    customPrice: true, // Flag to indicate custom pricing
                    details: {
                        pricingMethod: 'material',
                        customPricing: {
                            originalLow: serviceData.estimatedPriceLow,
                            originalHigh: serviceData.estimatedPriceHigh,
                            customPrice: customPrice,
                            priceOverride: serviceData.priceOverride || false
                        },
                        dimensions: {
                            length: serviceData.length,
                            width: serviceData.width,
                            squareFootage: serviceData.squareFootage
                        },
                        settlement: {
                            inchesSettled: serviceData.inchesSettled,
                            sidesSettled: serviceData.sidesSettled
                        },
                        environmental: {
                            soilType: serviceData.soilType,
                            weatherConditions: serviceData.weatherConditions,
                            moistureLevel: serviceData.moistureLevel,
                            travelDistance: serviceData.travelDistance
                        },
                        pricing: {
                            estimatedLow: serviceData.estimatedPriceLow,
                            estimatedHigh: serviceData.estimatedPriceHigh,
                            materialWeight: serviceData.materialWeight
                        }
                    }
                };
                
                
                // Add to invoice or estimate
                const isEstimatePage = document.getElementById('estimate-business-concrete')?.checked;
                
                if (isEstimatePage && window.EstimateManager) {
                    window.EstimateManager.addService(service);
                } else if (window.InvoiceManager) {
                    window.InvoiceManager.addService(service);
                } else if (window.App) {
                    window.App.addServiceToList(service);
                } else {
                    this.addServiceToList(service);
                }
                
                
                // Reset calculator
                this.resetCalculator();
                
            } catch (error) {
                console.error('Add service error:', error);
                if (window.App && window.App.showError) {
                    window.App.showError('Failed to add service: ' + error.message);
                } else {
                    alert('Error adding service: ' + error.message);
                }
            }
        },
        
        getServiceDescription: function(calc) {
            try {
                let description = 'Concrete Leveling';
                
                // Add dimensions if available
                if (calc.squareFootage > 0) {
                    description += ` (${calc.squareFootage} sq ft)`;
                }
                
                // Add settlement details if significant
                if (calc.inchesSettled > 1) {
                    description += ` - ${calc.inchesSettled}" settlement`;
                }
                
                if (calc.sidesSettled > 1) {
                    description += `, ${calc.sidesSettled} sides`;
                }
                
                return description;
                
            } catch (error) {
                console.error('Service description error:', error);
                return 'Concrete Leveling Service';
            }
        },
        
        addServiceToList: function(service) {
            try {
                // This is a fallback if InvoiceManager is not available
                const servicesList = document.getElementById('services-list');
                if (!servicesList) return;
                
                // Remove empty message if present
                const emptyMessage = servicesList.querySelector('.empty-services');
                if (emptyMessage) {
                    emptyMessage.remove();
                }
                
                // Create service item
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.innerHTML = `
                    <div class="service-details">
                        <h4>${service.description}</h4>
                        <p>${service.quantity} ${service.unit} × ${this.formatCurrency(service.rate)}</p>
                    </div>
                    <div class="service-actions">
                        <span class="service-amount">${this.formatCurrency(service.amount)}</span>
                        <button class="remove-service" onclick="this.closest('.service-item').remove(); if(window.InvoiceManager) window.InvoiceManager.updateInvoiceTotals(); else if(window.App) window.App.updateInvoiceTotals(); else ConcreteCalculator.updateInvoiceTotals();">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                
                servicesList.appendChild(serviceItem);
                
                // Update totals
                if (window.InvoiceManager) {
                    window.InvoiceManager.updateInvoiceTotals();
                } else if (window.App) {
                    window.App.updateInvoiceTotals();
                } else {
                    this.updateInvoiceTotals();
                }
                
            } catch (error) {
                console.error('Add service to list error:', error);
            }
        },
        
        updateInvoiceTotals: function() {
            try {
                const serviceItems = document.querySelectorAll('.service-item');
                let subtotal = 0;
                
                serviceItems.forEach(item => {
                    const amountText = item.querySelector('.service-amount').textContent;
                    const amount = parseFloat(amountText.replace(/[$,]/g, '')) || 0;
                    subtotal += amount;
                });
                
                const tax = subtotal * 0.0825; // 8.25% tax
                const total = subtotal + tax;
                
                // Update displays
                document.getElementById('invoice-subtotal').textContent = this.formatCurrency(subtotal);
                document.getElementById('invoice-tax').textContent = this.formatCurrency(tax);
                document.getElementById('invoice-grand-total').textContent = this.formatCurrency(total);
                
            } catch (error) {
                console.error('Update totals error:', error);
            }
        },
        
        resetCalculator: function() {
            try {
                // Reset traditional form fields
                const squareFootageInput = document.getElementById('square-footage');
                if (squareFootageInput) squareFootageInput.value = '';
                
                const projectTypeInput = document.getElementById('project-type');
                if (projectTypeInput) projectTypeInput.value = '';
                
                const severityInput = document.getElementById('severity');
                if (severityInput) severityInput.value = 'mild';
                
                const accessibilityInput = document.getElementById('accessibility');
                if (accessibilityInput) accessibilityInput.value = 'easy';
                
                const customRateInput = document.getElementById('custom-rate');
                if (customRateInput) customRateInput.value = '';
                
                // Reset material-based form fields
                const lengthInput = document.getElementById('length-ft');
                if (lengthInput) lengthInput.value = '';
                
                const widthInput = document.getElementById('width-ft');
                if (widthInput) widthInput.value = '';
                
                const inchesSettledInput = document.getElementById('inches-settled');
                if (inchesSettledInput) inchesSettledInput.value = '1';
                
                const sidesSettledInput = document.getElementById('sides-settled');
                if (sidesSettledInput) sidesSettledInput.value = '1';
                
                // Reset pricing method to traditional
                const pricingMethodInput = document.getElementById('pricing-method');
                if (pricingMethodInput) {
                    pricingMethodInput.value = 'traditional';
                    this.handlePricingMethodChange();
                }
                
                // Reset button states
                const projectTypeButtons = document.querySelectorAll('.project-type-btn');
                projectTypeButtons.forEach(btn => btn.classList.remove('active'));
                
                const severityButtons = document.querySelectorAll('.severity-btn');
                severityButtons.forEach(btn => btn.classList.remove('active'));
                const mildSeverityBtn = document.querySelector('.severity-btn[data-value="mild"]');
                if (mildSeverityBtn) mildSeverityBtn.classList.add('active');
                
                const accessButtons = document.querySelectorAll('.access-btn');
                accessButtons.forEach(btn => btn.classList.remove('active'));
                const easyAccessBtn = document.querySelector('.access-btn[data-value="easy"]');
                if (easyAccessBtn) easyAccessBtn.classList.add('active');
                
                // Hide custom rate section
                const customRateGroup = document.querySelector('.custom-rate');
                if (customRateGroup) {
                    customRateGroup.style.display = 'none';
                }
                
                // Reset calculation
                this.currentCalculation = {
                    projectType: '',
                    squareFootage: 0,
                    severity: 'mild',
                    accessibility: 'easy',
                    customRate: 0,
                    baseRate: 0,
                    finalRate: 0,
                    total: 0,
                    pricingMethod: 'traditional',
                    length: 0,
                    width: 0,
                    inchesSettled: 1,
                    sidesSettled: 1,
                    materialCostLow: 0,
                    materialCostHigh: 0,
                    estimatedPriceLow: 0,
                    estimatedPriceHigh: 0,
                    pricePerSqFtLow: 0,
                    pricePerSqFtHigh: 0
                };
                
                // Update display
                this.updateCalculationDisplay();
                
            } catch (error) {
                console.error('Reset calculator error:', error);
            }
        },
        
        formatCurrency: function(amount) {
            try {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(amount || 0);
            } catch (error) {
                return '$' + (amount || 0).toFixed(2);
            }
        },
        
        // Public method to get rate for a specific project type
        getProjectRate: function(projectType) {
            return ConcreteRates[projectType] || 0;
        },
        
        // Public method to calculate total with parameters
        calculateWithParameters: function(projectType, squareFootage, severity = 'mild', accessibility = 'easy', customRate = 0) {
            try {
                let baseRate = projectType === 'custom' ? customRate : (ConcreteRates[projectType] || 0);
                const severityMultiplier = SeverityMultipliers[severity] || 1.0;
                const accessibilityMultiplier = AccessibilityMultipliers[accessibility] || 1.0;
                const finalRate = baseRate * severityMultiplier * accessibilityMultiplier;
                const total = finalRate * squareFootage;
                
                return {
                    baseRate,
                    finalRate,
                    total,
                    multipliers: {
                        severity: severityMultiplier,
                        accessibility: accessibilityMultiplier,
                        total: severityMultiplier * accessibilityMultiplier
                    }
                };
            } catch (error) {
                console.error('Parameter calculation error:', error);
                return { baseRate: 0, finalRate: 0, total: 0, multipliers: { severity: 1, accessibility: 1, total: 1 } };
            }
        },
        
        // Pure function interface for concrete pricing - does not modify calculator state
        calcConcretePrice: function(input, settings = {}) {
            try {
                // Input validation
                const length = parseFloat(input.length) || 0;
                const width = parseFloat(input.width) || 0;
                const inchesSettled = parseFloat(input.inchesSettled) || 1;
                const sidesSettled = parseInt(input.sidesSettled) || 1;
                const soilType = input.soilType || settings.soilType || 'mixed';
                const weatherConditions = input.weatherConditions || settings.weatherConditions || 'normal';
                const moistureLevel = input.moistureLevel || settings.moistureLevel || 'normal';
                const travelDistance = parseFloat(input.travelDistance) || settings.travelDistance || 0;

                // Use global pricing settings or defaults
                const pricePerPoundLow = settings.pricePerPoundLow || MaterialPricing.pricePerPoundLow;
                const pricePerPoundHigh = settings.pricePerPoundHigh || MaterialPricing.pricePerPoundHigh;
                const weightPerCubicYard = settings.weightPerCubicYard || MaterialPricing.weightPerCubicYard;

                // Business rule calculations - exact implementation using material-based pricing
                const squareFootage = length * width;
                const voidVolumeCuYd = squareFootage > 0 ? (squareFootage * (inchesSettled / 12)) / 27 : 0;
                const materialWeightLbs = voidVolumeCuYd * weightPerCubicYard;
                const materialCostLow = materialWeightLbs * pricePerPoundLow;
                const materialCostHigh = materialWeightLbs * pricePerPoundHigh;

                // Complexity factor based on sides settled
                const complexityFactors = { '1': 1.00, '2': 1.10, '3': 1.20, '4': 1.30 };
                const complexityFactor = complexityFactors[sidesSettled] || 1.00;

                // Environmental multipliers using existing business logic
                const soilMult = this.mapSoilType(soilType) === 'clay' ? 1.05 : 
                               this.mapSoilType(soilType) === 'rocky' ? 1.15 : 1.0;
                const weatherMult = this.mapWeatherType(weatherConditions) === 'cold' ? 1.10 : 
                                   this.mapWeatherType(weatherConditions) === 'hot' ? 1.05 : 1.0;
                const moistureMult = moistureLevel === 'wet' ? 1.05 : moistureLevel === 'dry' ? 1.00 : 1.0;
                const envMultiplier = soilMult * weatherMult * moistureMult;

                // Equipment costs
                const equipmentCost = (travelDistance * 2 * 2.5) + 50;

                // Subtotals with environmental and complexity factors
                const subLow = materialCostLow * complexityFactor * envMultiplier;
                const subHigh = materialCostHigh * complexityFactor * envMultiplier;

                // Labor and overhead markup using original rates
                const markupLow = 3.33;
                const markupHigh = 5.00;
                const laborOHLow = (subLow + equipmentCost) * (markupLow - 1);
                const laborOHHigh = (subHigh + equipmentCost) * (markupHigh - 1);

                // Final pricing
                const totalPriceLow = subLow + equipmentCost + laborOHLow;
                const totalPriceHigh = subHigh + equipmentCost + laborOHHigh;
                const midPrice = (totalPriceLow + totalPriceHigh) / 2;

                return {
                    min: totalPriceLow,
                    max: totalPriceHigh,
                    mid: midPrice,
                    recommended: midPrice,
                    // Additional calculation details
                    squareFootage,
                    voidVolumeCuYd,
                    materialWeightLbs,
                    materialCostLow,
                    materialCostHigh,
                    complexityFactor,
                    environmentalMultiplier: envMultiplier,
                    equipmentCost,
                    laborAndOverhead: (laborOHLow + laborOHHigh) / 2,
                    // Input echo for validation
                    input: {
                        length,
                        width,
                        inchesSettled,
                        sidesSettled,
                        soilType,
                        weatherConditions,
                        moistureLevel,
                        travelDistance
                    }
                };
            } catch (error) {
                console.error('Pure calculation function error:', error);
                return {
                    min: 0,
                    max: 0,
                    mid: 0,
                    recommended: 0,
                    error: error.message,
                    squareFootage: 0,
                    voidVolumeCuYd: 0,
                    materialWeightLbs: 0,
                    materialCostLow: 0,
                    materialCostHigh: 0,
                    complexityFactor: 1.0,
                    environmentalMultiplier: 1.0,
                    equipmentCost: 0,
                    laborAndOverhead: 0
                };
            }
        }
    };
    
    // Masonry calculator (simplified pricing)
    const MasonryCalculator = {
        init: function() {
            try {
                this.bindEvents();
            } catch (error) {
                console.error('Masonry calculator initialization error:', error);
            }
        },
        
        bindEvents: function() {
            try {
                // Job price input
                const jobPriceInput = document.getElementById('masonry-job-price');
                
                if (jobPriceInput) {
                    jobPriceInput.addEventListener('input', () => {
                        this.updateAddServiceButton();
                    });
                }
                
                // Service type dropdown
                const serviceTypeSelect = document.getElementById('masonry-service');
                if (serviceTypeSelect) {
                    serviceTypeSelect.addEventListener('change', () => {
                        this.updateAddServiceButton();
                    });
                }
                
                // Store reference to handler for potential removal
                this._masonryClickHandler = (e) => {
                    if (e.target && e.target.id === 'add-masonry-service') {
                        // Check if this button is inside the estimate form
                        const estimateForm = e.target.closest('#estimate-form');
                        const estimateContainer = e.target.closest('.estimate-container');
                        
                        if (estimateForm || estimateContainer) {
                            e.stopPropagation(); // Stop the event here
                            return; // Let the estimate's onclick handler handle it
                        }
                        
                        e.preventDefault();
                        this.addMasonryService();
                    }
                };
                
                // Add service button - using event delegation since button may be hidden initially
                document.addEventListener('click', this._masonryClickHandler);
                
            } catch (error) {
                console.error('Masonry calculator event binding error:', error);
            }
        },
        
        updateAddServiceButton: function() {
            try {
                const jobPrice = parseFloat(document.getElementById('masonry-job-price').value) || 0;
                const serviceType = document.getElementById('masonry-service').value;
                
                // Enable/disable add service button
                const addServiceBtn = document.getElementById('add-masonry-service');
                if (addServiceBtn) {
                    addServiceBtn.disabled = jobPrice <= 0 || !serviceType;
                }
                
            } catch (error) {
                console.error('Update add service button error:', error);
            }
        },
        
        addMasonryService: function() {
            try {
                const serviceType = document.getElementById('masonry-service').value;
                const description = document.getElementById('masonry-description').value;
                const jobPrice = parseFloat(document.getElementById('masonry-job-price').value) || 0;
                
                
                if (jobPrice <= 0 || !serviceType) {
                    alert('Please select a service type and enter a valid job price.');
                    return;
                }
                
                // Create service object with simplified structure
                const service = {
                    type: 'masonry',
                    id: 'masonry_' + Date.now(),
                    description: description || this.getServiceTypeName(serviceType),
                    quantity: 1,
                    unit: 'job',
                    rate: jobPrice,
                    amount: jobPrice,
                    details: {
                        serviceType: serviceType,
                        customDescription: description,
                        jobPricing: true // Flag to indicate this uses job pricing instead of quantity × rate
                    }
                };
                
                // Add to invoice
                if (window.InvoiceManager) {
                    window.InvoiceManager.addService(service);
                } else if (window.App) {
                    window.App.addServiceToList(service);
                } else {
                    ConcreteCalculator.addServiceToList(service);
                }
                
                // Reset form
                this.resetMasonryForm();
                
            } catch (error) {
                console.error('Add masonry service error:', error);
            }
        },
        
        getServiceTypeName: function(serviceType) {
            const serviceNames = {
                'brick-installation': 'Brick Installation',
                'brick-repair': 'Brick Repair',
                'stone-fireplace': 'Stone Fireplace',
                'chimney-repair': 'Chimney Repair',
                'chimney-restoration': 'Chimney Restoration',
                'outdoor-fireplace': 'Outdoor Fireplace',
                'patio-construction': 'Patio Construction',
                'fire-pit': 'Fire Pit Installation',
                'outdoor-kitchen': 'Outdoor Kitchen',
                'veneer-stone': 'Veneer Stone Installation',
                'cultured-stone': 'Cultured Stone Application',
                'custom': 'Custom Masonry Work'
            };
            
            return serviceNames[serviceType] || 'Masonry Service';
        },
        
        resetMasonryForm: function() {
            try {
                document.getElementById('masonry-service').value = '';
                document.getElementById('masonry-description').value = '';
                document.getElementById('masonry-job-price').value = '';
                
                // Disable add service button
                const addServiceBtn = document.getElementById('add-masonry-service');
                if (addServiceBtn) {
                    addServiceBtn.disabled = true;
                }
                
            } catch (error) {
                console.error('Reset masonry form error:', error);
            }
        }
    };
    
    // Don't auto-initialize - wait for explicit context-aware init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Only init if no active views (initial page load)
            if (!document.querySelector('.view.active')) {
                console.log('[CALC:EARLY_INIT_SKIPPED]');
            }
        });
    }
    
    // Export for global access
    window.ConcreteCalculator = ConcreteCalculator;
    window.MasonryCalculator = MasonryCalculator;
    window.Calculator = window.Calculator || ConcreteCalculator; // Expose Calculator for state access
    
    // Global function for button onclick as backup  
    window.addConcreteServiceGlobal = function() {
        
        // Use the same context detection as the calculator
        const context = ConcreteCalculator.getCurrentContext();
        const isEstimateContext = context === 'estimate';
        
        
        if (isEstimateContext) {
            try {
                if (window.EstimateManager && window.EstimateManager.addEstimateService) {
                    window.EstimateManager.addEstimateService();
                } else if (window.InvoiceManager && window.InvoiceManager.addEstimateService) {
                    window.InvoiceManager.addEstimateService();
                } else {
                    console.error('No estimate service handlers available');
                    alert('Estimate service addition not available. Please refresh the page.');
                }
            } catch (error) {
                console.error('Error calling addEstimateService:', error);
                alert('Error adding service to estimate: ' + error.message);
            }
        } else {
            ConcreteCalculator.addConcreteService();
        }
    };
    
})();