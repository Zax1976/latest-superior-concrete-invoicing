/**
 * J. Stark Business Invoicing System - UI Enhancements
 * Handles new simplified UI components and interactions
 */

// Global functions for dropdown management
window.toggleNewJobDropdown = function() {
    const dropdown = document.getElementById('new-job-dropdown');
    if (!dropdown) {
        console.error('New job dropdown not found');
        return;
    }
    
    const isVisible = dropdown.classList.contains('show');
    
    // Hide all dropdowns first
    hideAllDropdowns();
    
    // Toggle this dropdown
    if (!isVisible) {
        dropdown.classList.add('show');
        dropdown.style.display = 'block';
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'translateY(0)';
        
        console.log('✅ New job dropdown opened');
    }
};

window.toggleSettingsDropdown = function() {
    const dropdown = document.getElementById('settings-dropdown');
    if (!dropdown) {
        console.error('Settings dropdown not found');
        return;
    }
    
    const isVisible = dropdown.classList.contains('show');
    
    // Hide all dropdowns first
    hideAllDropdowns();
    
    // Toggle this dropdown
    if (!isVisible) {
        dropdown.classList.add('show');
        dropdown.style.display = 'block';
        dropdown.style.opacity = '1';
        dropdown.style.transform = 'translateY(0)';
        
        console.log('✅ Settings dropdown opened');
    }
};

function hideAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
        dropdown.style.display = 'none';
        dropdown.style.opacity = '0';
        dropdown.style.transform = 'translateY(-10px)';
    });
}

// Global functions for dashboard actions
window.showCreateInvoiceOptions = function() {
    // For better UX, show dropdown but also provide a shortcut for most common case
    // Check if user has a preferred business type from recent activity
    const recentInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const hasConcreteInvoices = recentInvoices.some(inv => inv.businessType === 'concrete');
    const hasMasonryInvoices = recentInvoices.some(inv => inv.businessType === 'masonry');
    
    // If only one type has been used, or concrete is more common, go directly there
    if (hasConcreteInvoices && !hasMasonryInvoices) {
        createNewInvoice('concrete');
    } else if (hasMasonryInvoices && !hasConcreteInvoices) {
        createNewInvoice('masonry');
    } else {
        // Show dropdown for choice
        toggleNewJobDropdown();
    }
};

window.showCreateEstimateOptions = function() {
    // Show dropdown or navigate directly to estimate creation
    toggleNewJobDropdown();
};

// Advanced options toggle for calculator
function initializeAdvancedOptions() {
    const toggleBtn = document.getElementById('toggle-advanced-options');
    const advancedSection = document.getElementById('advanced-options');
    const chevron = toggleBtn?.querySelector('.fa-chevron-down');
    
    if (toggleBtn && advancedSection) {
        toggleBtn.addEventListener('click', function() {
            const isVisible = advancedSection.style.display !== 'none';
            
            if (isVisible) {
                advancedSection.style.display = 'none';
                chevron?.classList.remove('fa-chevron-up');
                chevron?.classList.add('fa-chevron-down');
                toggleBtn.querySelector('span').textContent = 'Advanced Options';
            } else {
                advancedSection.style.display = 'block';
                chevron?.classList.remove('fa-chevron-down');
                chevron?.classList.add('fa-chevron-up');
                toggleBtn.querySelector('span').textContent = 'Hide Advanced Options';
            }
        });
    }
}

// Calculate concrete pricing - wrapper function for UI integration
function calculateConcrete() {
    console.log('🔥 calculateConcrete() called');
    
    try {
        // Use ConcreteCalculator to get calculation result
        if (window.ConcreteCalculator) {
            // Force update calculation first
            window.ConcreteCalculator.updateMaterialCalculation();
            
            // Get the current calculation result
            const calculation = window.ConcreteCalculator.currentCalculation;
            
            console.log('💡 Calculation result:', calculation);
            
            // Additional debugging to track where values might be lost
            console.log('🔍 Detailed calculation check:', {
                hasCalculation: !!calculation,
                squareFootage: calculation?.squareFootage,
                length: calculation?.length,
                width: calculation?.width,
                estimatedPriceLow: calculation?.estimatedPriceLow,
                estimatedPriceHigh: calculation?.estimatedPriceHigh
            });
            
            // Validate that we have meaningful data
            if (!calculation || calculation.squareFootage <= 0) {
                console.warn('⚠️ No valid calculation data');
                return null;
            }
            
            // Return calculation data in expected format
            const result = {
                ...calculation,
                // Ensure required fields are present
                estimatedPriceLow: calculation.estimatedPriceLow || 0,
                estimatedPriceHigh: calculation.estimatedPriceHigh || 0,
                squareFootage: calculation.squareFootage || 0,
                length: calculation.length || 0,
                width: calculation.width || 0,
                inchesSettled: calculation.inchesSettled || 1,
                sidesSettled: calculation.sidesSettled || 1
            };
            
            console.log('✅ Returning result:', result);
            return result;
        } else {
            console.error('❌ ConcreteCalculator not available');
            return null;
        }
    } catch (error) {
        console.error('❌ Error in calculateConcrete:', error);
        return null;
    }
}

// Initialize calculate and set price buttons for both invoice and estimate contexts
function initializeCalculateAndSetPrice() {
    // Handle invoice calculate button
    const calcBtn = document.getElementById('calculate-set-price');
    
    if (calcBtn) {
        calcBtn.addEventListener('click', function() {
            console.log('🔥 Invoice Calculate & Set Price button clicked');
            handleCalculateAndSetPrice(false); // false = invoice context
        });
    }
    
    // Handle estimate calculate button (needs event delegation since it's dynamically added)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'estimate-calculate-set-price') {
            console.log('🔥 Estimate Calculate & Set Price button clicked');
            e.preventDefault();
            handleCalculateAndSetPrice(true); // true = estimate context
        }
    });
}

// Common handler for both invoice and estimate calculate buttons
function handleCalculateAndSetPrice(isEstimateContext) {
    console.log(`🔥 handleCalculateAndSetPrice called - context: ${isEstimateContext ? 'estimate' : 'invoice'}`);
    
    try {
        // First run the calculation and get the result
        let calculationResult = null;
        if (typeof calculateConcrete === 'function') {
            calculationResult = calculateConcrete();
            console.log('✅ Calculation completed:', calculationResult);
        }
        
        // Validate calculation result
        if (!calculationResult || calculationResult.squareFootage <= 0) {
            console.warn('⚠️ No valid calculation data');
            if (window.NotificationSystem) {
                window.NotificationSystem.showError('Please enter valid dimensions and settlement details to calculate pricing.');
            } else {
                alert('Please enter valid dimensions and settlement details to calculate pricing.');
            }
            return;
        }
        
        // Then open price review modal with calculation data
        if (window.PriceReviewManager && calculationResult) {
            console.log('🎯 Opening price review modal with data');
            window.PriceReviewManager.showPriceReview(calculationResult, isEstimateContext);
        } else if (typeof window.showPriceReview === 'function' && calculationResult) {
            window.showPriceReview(calculationResult, isEstimateContext);
        } else {
            console.warn('⚠️ Price review function not available - using fallback');
            // Fallback: show basic success message and add service directly
            if (window.ConcreteCalculator && window.ConcreteCalculator.addConcreteServiceWithCustomPrice) {
                const avgPrice = (calculationResult.estimatedPriceLow + calculationResult.estimatedPriceHigh) / 2;
                calculationResult.customPrice = avgPrice;
                calculationResult.finalPrice = avgPrice;
                window.ConcreteCalculator.addConcreteServiceWithCustomPrice(calculationResult);
            } else {
                alert('Price review not available. Please try again.');
            }
        }
    } catch (error) {
        console.error('❌ Error in handleCalculateAndSetPrice:', error);
        if (window.NotificationSystem) {
            window.NotificationSystem.showError('Error calculating price. Please try again.');
        } else {
            alert('Error calculating price. Please try again.');
        }
    }
}

// Update dashboard stats to match new layout
function updateDashboardStats() {
    // Update stat card IDs and calculations
    const statsUpdates = [
        {
            newId: 'total-jobs',
            calculate: () => {
                const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
                const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
                return invoices.length + estimates.length;
            }
        },
        {
            newId: 'pending-payment',
            calculate: () => {
                const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
                return invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length;
            }
        },
        {
            newId: 'active-estimates',
            calculate: () => {
                const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
                return estimates.filter(est => est.status === 'sent' || est.status === 'draft').length;
            }
        }
    ];
    
    statsUpdates.forEach(update => {
        const element = document.getElementById(update.newId);
        if (element) {
            element.textContent = update.calculate();
        }
    });
}

// Click outside to close dropdowns
document.addEventListener('click', function(event) {
    const isDropdownClick = event.target.closest('.dropdown');
    if (!isDropdownClick) {
        hideAllDropdowns();
    }
});

// Keyboard escape to close dropdowns
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hideAllDropdowns();
    }
});

// Initialize business card clickability
function initializeBusinessCardInteractivity() {
    // Handle business card clicks to trigger radio buttons
    const businessCards = document.querySelectorAll('.business-card');
    businessCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Find the associated radio button
            const radioButton = card.parentElement.querySelector('input[type="radio"]');
            if (radioButton) {
                radioButton.checked = true;
                radioButton.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ Business card clicked, radio button activated:', radioButton.id);
            }
        });
    });
}

// Initialize visibility helpers for business type radio buttons  
function ensureBusinessTypeVisibility() {
    const businessSelectors = document.querySelectorAll('.business-selector');
    businessSelectors.forEach(selector => {
        // Ensure the selector is visible
        selector.style.display = 'grid';
        selector.style.visibility = 'visible';
        selector.style.opacity = '1';
        
        // Ensure business options are clickable
        const businessOptions = selector.querySelectorAll('.business-option');
        businessOptions.forEach(option => {
            option.style.display = 'block';
            option.style.visibility = 'visible';
            option.style.opacity = '1';
            option.style.pointerEvents = 'auto';
            
            // Ensure business cards are visible and clickable
            const businessCard = option.querySelector('.business-card');
            if (businessCard) {
                businessCard.style.display = 'flex';
                businessCard.style.visibility = 'visible';
                businessCard.style.opacity = '1';
                businessCard.style.pointerEvents = 'auto';
            }
        });
    });
}

// Fix form control focusability issues
function fixFormControlFocusability() {
    // List of problematic form fields mentioned in the issue
    const problematicFields = [
        'masonry-service',
        'masonry-description', 
        'masonry-job-price'
    ];
    
    problematicFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Ensure the field is focusable and visible
            field.style.visibility = 'visible';
            field.style.opacity = '1';
            field.style.pointerEvents = 'auto';
            field.tabIndex = field.tabIndex || 0; // Ensure it's in tab order
            
            // Remove any aria-hidden attributes that might interfere
            field.removeAttribute('aria-hidden');
            
            // Ensure parent containers are visible
            let parent = field.parentElement;
            while (parent && parent !== document.body) {
                if (parent.style.display === 'none') {
                    console.warn(`Parent container hidden for field ${fieldId}:`, parent);
                }
                parent = parent.parentElement;
            }
            
            console.log(`✅ Fixed focusability for field: ${fieldId}`);
        } else {
            console.warn(`⚠️ Form field not found: ${fieldId}`);
        }
    });
    
    // Also ensure masonry service section is properly visible when selected
    const masonrySection = document.getElementById('masonry-services');
    if (masonrySection) {
        masonrySection.style.visibility = 'visible';
        masonrySection.style.opacity = '1';
    }
}

// Initialize all UI enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdvancedOptions();
    initializeCalculateAndSetPrice();
    updateDashboardStats();
    initializeBusinessCardInteractivity();
    ensureBusinessTypeVisibility();
    fixFormControlFocusability();
    
    // Set default values for environmental factors
    const soilType = document.getElementById('soil-type');
    const weatherConditions = document.getElementById('weather-conditions');
    const moistureLevel = document.getElementById('moisture-level');
    const travelDistance = document.getElementById('travel-distance');
    
    if (soilType) soilType.value = 'mixed';
    if (weatherConditions) weatherConditions.value = 'normal';
    if (moistureLevel) moistureLevel.value = 'normal';
    if (travelDistance) travelDistance.value = '0';
    
    console.log('🎯 All UI enhancements initialized successfully');
});

// Export functions for global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleNewJobDropdown,
        toggleSettingsDropdown,
        showCreateInvoiceOptions,
        showCreateEstimateOptions,
        hideAllDropdowns,
        updateDashboardStats
    };
}