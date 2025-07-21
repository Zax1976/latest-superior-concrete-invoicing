/**
 * J. Stark Business Invoicing System - Concrete Leveling Calculator
 * Handles concrete leveling pricing calculations with multipliers
 */

(function() {
    'use strict';
    
    // Concrete leveling pricing data
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
    
    // Precision utility functions
    const PrecisionMath = {
        // Round to specified decimal places to avoid floating point errors
        round: function(value, decimals = 2) {
            const factor = Math.pow(10, decimals);
            return Math.round((value + Number.EPSILON) * factor) / factor;
        },
        
        // Add two numbers with precision
        add: function(a, b, decimals = 2) {
            return this.round((a || 0) + (b || 0), decimals);
        },
        
        // Multiply two numbers with precision
        multiply: function(a, b, decimals = 2) {
            return this.round((a || 0) * (b || 0), decimals);
        },
        
        // Divide two numbers with precision
        divide: function(a, b, decimals = 2) {
            if (b === 0) return 0;
            return this.round((a || 0) / (b || 1), decimals);
        },
        
        // Subtract two numbers with precision
        subtract: function(a, b, decimals = 2) {
            return this.round((a || 0) - (b || 0), decimals);
        },
        
        // Safe parse float with fallback
        parseFloat: function(value, fallback = 0) {
            const parsed = parseFloat(value);
            return isNaN(parsed) || !isFinite(parsed) ? fallback : parsed;
        },
        
        // Format currency with proper precision
        formatCurrency: function(amount) {
            const rounded = this.round(amount || 0, 2);
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(rounded);
        }
    };

    // Calculator object
    const ConcreteCalculator = {
        currentCalculation: {
            projectType: '',
            squareFootage: 0,
            severity: 'mild',
            accessibility: 'easy',
            customRate: 0,
            baseRate: 0,
            finalRate: 0,
            total: 0
        },
        
        init: function() {
            try {
                this.bindEvents();
                console.log('Concrete Calculator initialized');
            } catch (error) {
                console.error('Calculator initialization error:', error);
            }
        },
        
        bindEvents: function() {
            try {
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
                
                // Add service button
                const addServiceBtn = document.getElementById('add-concrete-service');
                if (addServiceBtn) {
                    addServiceBtn.addEventListener('click', () => {
                        this.addConcreteService();
                    });
                }
                
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
        
        calculateTotal: function() {
            try {
                // Get form values with precision-safe parsing
                const projectType = document.getElementById('project-type').value;
                const squareFootage = PrecisionMath.parseFloat(document.getElementById('square-footage').value, 0);
                const severity = document.getElementById('severity').value;
                const accessibility = document.getElementById('accessibility').value;
                const customRate = PrecisionMath.parseFloat(document.getElementById('custom-rate').value, 0);
                
                // Calculate base rate
                let baseRate = 0;
                if (projectType === 'custom') {
                    baseRate = customRate;
                } else if (ConcreteRates[projectType]) {
                    baseRate = ConcreteRates[projectType];
                }
                
                // Calculate multipliers with precision
                const severityMultiplier = SeverityMultipliers[severity] || 1.0;
                const accessibilityMultiplier = AccessibilityMultipliers[accessibility] || 1.0;
                const totalMultiplier = PrecisionMath.multiply(severityMultiplier, accessibilityMultiplier);
                
                // Calculate final rate and total with precision
                const finalRate = PrecisionMath.multiply(baseRate, totalMultiplier);
                const total = PrecisionMath.multiply(finalRate, squareFootage);
                
                // Update current calculation
                this.currentCalculation = {
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
                
                // Update display
                this.updateCalculationDisplay();
                
            } catch (error) {
                console.error('Calculation error:', error);
            }
        },
        
        updateCalculationDisplay: function() {
            try {
                const calc = this.currentCalculation;
                
                // Update base rate display
                const baseRateDisplay = document.getElementById('base-rate-display');
                if (baseRateDisplay) {
                    baseRateDisplay.textContent = this.formatCurrency(calc.baseRate) + '/sq ft';
                }
                
                // Update multiplier display
                const multiplierDisplay = document.getElementById('multiplier-display');
                if (multiplierDisplay) {
                    const multiplierText = calc.totalMultiplier.toFixed(2) + 'x';
                    const breakdown = [];
                    
                    if (calc.severityMultiplier !== 1.0) {
                        breakdown.push(`Severity: ${calc.severityMultiplier}x`);
                    }
                    if (calc.accessibilityMultiplier !== 1.0) {
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
                
                // Update total display
                const totalDisplay = document.getElementById('concrete-total');
                if (totalDisplay) {
                    totalDisplay.textContent = this.formatCurrency(calc.total);
                }
                
                // Enable/disable add service button
                const addServiceBtn = document.getElementById('add-concrete-service');
                if (addServiceBtn) {
                    addServiceBtn.disabled = calc.total <= 0 || calc.squareFootage <= 0;
                }
                
            } catch (error) {
                console.error('Display update error:', error);
            }
        },
        
        addConcreteService: function() {
            try {
                const calc = this.currentCalculation;
                
                if (calc.total <= 0 || calc.squareFootage <= 0) {
                    alert('Please enter valid square footage and select a project type.');
                    return;
                }
                
                // Create service object
                const service = {
                    type: 'concrete',
                    id: 'concrete_' + Date.now(),
                    description: this.getServiceDescription(calc),
                    quantity: calc.squareFootage,
                    unit: 'sq ft',
                    rate: calc.finalRate,
                    amount: calc.total,
                    details: {
                        projectType: calc.projectType,
                        baseRate: calc.baseRate,
                        severity: calc.severity,
                        accessibility: calc.accessibility,
                        multipliers: {
                            severity: calc.severityMultiplier,
                            accessibility: calc.accessibilityMultiplier,
                            total: calc.totalMultiplier
                        }
                    }
                };
                
                // Add to invoice
                if (window.InvoiceManager) {
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
            }
        },
        
        getServiceDescription: function(calc) {
            try {
                let description = '';
                
                // Project type description
                const projectTypes = {
                    driveway: 'Driveway Concrete Leveling',
                    sidewalk: 'Sidewalk Concrete Leveling',
                    patio: 'Patio Concrete Leveling',
                    garage: 'Garage Floor Concrete Leveling',
                    basement: 'Basement Floor Concrete Leveling',
                    steps: 'Steps Concrete Leveling',
                    'pool-deck': 'Pool Deck Concrete Leveling',
                    custom: 'Custom Concrete Leveling'
                };
                
                description = projectTypes[calc.projectType] || 'Concrete Leveling';
                
                // Add severity and accessibility details if not standard
                const details = [];
                if (calc.severity !== 'mild') {
                    details.push(calc.severity.charAt(0).toUpperCase() + calc.severity.slice(1) + ' damage');
                }
                if (calc.accessibility !== 'easy') {
                    details.push(calc.accessibility + ' access');
                }
                
                if (details.length > 0) {
                    description += ` (${details.join(', ')})`;
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
                    const amount = PrecisionMath.parseFloat(amountText.replace(/[$,]/g, ''), 0);
                    subtotal = PrecisionMath.add(subtotal, amount);
                });
                
                const tax = PrecisionMath.multiply(subtotal, 0.0825); // 8.25% tax
                const total = PrecisionMath.add(subtotal, tax);
                
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
                // Reset form fields
                document.getElementById('square-footage').value = '';
                document.getElementById('project-type').value = '';
                document.getElementById('severity').value = 'mild';
                document.getElementById('accessibility').value = 'easy';
                document.getElementById('custom-rate').value = '';
                
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
                    total: 0
                };
                
                // Update display
                this.updateCalculationDisplay();
                
            } catch (error) {
                console.error('Reset calculator error:', error);
            }
        },
        
        formatCurrency: function(amount) {
            try {
                return PrecisionMath.formatCurrency(amount);
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
        }
    };
    
    // Masonry calculator (simpler, custom pricing)
    const MasonryCalculator = {
        init: function() {
            try {
                this.bindEvents();
                console.log('Masonry Calculator initialized');
            } catch (error) {
                console.error('Masonry calculator initialization error:', error);
            }
        },
        
        bindEvents: function() {
            try {
                // Quantity and rate inputs
                const quantityInput = document.getElementById('masonry-quantity');
                const rateInput = document.getElementById('masonry-rate');
                
                if (quantityInput) {
                    quantityInput.addEventListener('input', () => {
                        this.calculateMasonryTotal();
                    });
                }
                
                if (rateInput) {
                    rateInput.addEventListener('input', () => {
                        this.calculateMasonryTotal();
                    });
                }
                
                // Add service button
                const addServiceBtn = document.getElementById('add-masonry-service');
                if (addServiceBtn) {
                    addServiceBtn.addEventListener('click', () => {
                        this.addMasonryService();
                    });
                }
                
            } catch (error) {
                console.error('Masonry calculator event binding error:', error);
            }
        },
        
        calculateMasonryTotal: function() {
            try {
                const quantity = PrecisionMath.parseFloat(document.getElementById('masonry-quantity').value, 0);
                const rate = PrecisionMath.parseFloat(document.getElementById('masonry-rate').value, 0);
                const total = PrecisionMath.multiply(quantity, rate);
                
                document.getElementById('masonry-total').value = PrecisionMath.round(total, 2).toFixed(2);
                
                // Enable/disable add service button
                const addServiceBtn = document.getElementById('add-masonry-service');
                if (addServiceBtn) {
                    addServiceBtn.disabled = total <= 0 || quantity <= 0;
                }
                
            } catch (error) {
                console.error('Masonry calculation error:', error);
            }
        },
        
        addMasonryService: function() {
            try {
                const serviceType = document.getElementById('masonry-service').value;
                const description = document.getElementById('masonry-description').value;
                const quantity = parseFloat(document.getElementById('masonry-quantity').value) || 0;
                const unit = document.getElementById('masonry-unit').value;
                const rate = parseFloat(document.getElementById('masonry-rate').value) || 0;
                const total = quantity * rate;
                
                if (total <= 0 || quantity <= 0 || !serviceType) {
                    alert('Please fill in all required fields with valid values.');
                    return;
                }
                
                // Create service object
                const service = {
                    type: 'masonry',
                    id: 'masonry_' + Date.now(),
                    description: description || this.getServiceTypeName(serviceType),
                    quantity: quantity,
                    unit: unit,
                    rate: rate,
                    amount: total,
                    details: {
                        serviceType: serviceType,
                        customDescription: description
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
                document.getElementById('masonry-quantity').value = '';
                document.getElementById('masonry-unit').value = 'sq ft';
                document.getElementById('masonry-rate').value = '';
                document.getElementById('masonry-total').value = '';
                
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
    
    // Initialize calculators when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ConcreteCalculator.init();
            MasonryCalculator.init();
        });
    } else {
        ConcreteCalculator.init();
        MasonryCalculator.init();
    }
    
    // Export for global access
    window.ConcreteCalculator = ConcreteCalculator;
    window.MasonryCalculator = MasonryCalculator;
    
})();