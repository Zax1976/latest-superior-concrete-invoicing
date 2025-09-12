/**
 * Simple Service Manager - Manual Pricing System
 * Handles adding concrete and masonry services with user-defined prices
 */

(function() {
    'use strict';
    
    console.log('🎯 Simple Service Manager loaded');
    
    // Simple Service Manager
    window.SimpleServiceManager = {
        
        // Initialize service buttons
        init: function() {
            this.setupConcreteServiceButton();
            this.setupMasonryServiceButton();
            console.log('✅ Simple Service Manager initialized');
        },
        
        // Setup concrete service button
        setupConcreteServiceButton: function() {
            const button = document.getElementById('add-concrete-service');
            const estimateButton = document.getElementById('add-estimate-concrete-service');
            
            if (button) {
                button.addEventListener('click', this.handleAddConcreteService.bind(this));
                console.log('✅ Concrete service button configured');
            }
            
            if (estimateButton) {
                estimateButton.addEventListener('click', this.handleAddEstimateConcreteService.bind(this));
                console.log('✅ Estimate concrete service button configured');
            }
        },
        
        // Setup masonry service button
        setupMasonryServiceButton: function() {
            // === SAFE-HOTFIX: MASONRY BUTTON TIMING (BEGIN) - Use event delegation for reliability
            // Remove any existing delegated handlers first
            if (this.masonryDelegateHandler) {
                document.removeEventListener('click', this.masonryDelegateHandler);
            }
            
            // Create delegated handler for masonry buttons
            this.masonryDelegateHandler = (e) => {
                if (e.target.id === 'add-masonry-service' || e.target.closest('#add-masonry-service')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[SSM:DELEGATE] Masonry button clicked');
                    this.handleAddMasonryService();
                } else if (e.target.id === 'add-estimate-masonry-service' || e.target.closest('#add-estimate-masonry-service')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[SSM:DELEGATE] Estimate masonry button clicked');
                    this.handleAddEstimateMasonryService();
                }
            };
            
            // Add delegated listener to document
            document.addEventListener('click', this.masonryDelegateHandler);
            console.log('✅ [SSM] Masonry button delegation configured');
            // === SAFE-HOTFIX: MASONRY BUTTON TIMING (END)
        },
        
        // Handle adding concrete service
        handleAddConcreteService: function() {
            console.log('🎯 Adding concrete service');
            
            const description = document.getElementById('concrete-service-description')?.value?.trim();
            const price = parseFloat(document.getElementById('concrete-service-price')?.value);
            
            // Validate inputs
            if (!description) {
                this.showError('Please enter a service description');
                return;
            }
            
            if (!price || price <= 0) {
                this.showError('Please enter a valid price');
                return;
            }
            
            // Create service object
            const service = {
                type: 'concrete_leveling',
                description: description,
                price: price,
                quantity: 1
            };
            
            // Add to current invoice or estimate
            if (this.isEstimatePage()) {
                window.InvoiceManager.addEstimateService(service);
                this.showSuccess('Concrete service added to estimate');
            } else {
                window.InvoiceManager.addService(service);
                this.showSuccess('Concrete service added to invoice');
            }
            
            // Clear form
            this.clearConcreteForm();
        },
        
        // Handle adding estimate concrete service
        handleAddEstimateConcreteService: function() {
            console.log('🎯 Adding concrete service to estimate');
            
            const description = document.getElementById('estimate-concrete-service-description')?.value?.trim();
            const price = parseFloat(document.getElementById('estimate-concrete-service-price')?.value);
            
            // Validate inputs
            if (!description) {
                this.showError('Please enter a service description');
                return;
            }
            
            if (!price || price <= 0) {
                this.showError('Please enter a valid price');
                return;
            }
            
            // Create service object
            const service = {
                type: 'concrete_leveling',
                description: description,
                price: price,
                quantity: 1
            };
            
            // Add to estimate
            window.InvoiceManager.addEstimateService(service);
            this.showSuccess('Concrete service added to estimate');
            
            // Clear form
            this.clearEstimateConcreteForm();
        },
        
        // Handle adding masonry service
        handleAddMasonryService: function() {
            console.log('🎯 [SSM] Handling masonry service addition');
            
            // === SAFE-HOTFIX: MASONRY BUTTON DIRECT (BEGIN) - Direct implementation
            // Get form values directly
            const serviceType = document.getElementById('masonry-service')?.value;
            const description = document.getElementById('masonry-description')?.value?.trim();
            const priceInput = document.getElementById('masonry-job-price');
            const priceStr = priceInput?.value?.trim();
            
            console.log('[SSM:VALUES]', { serviceType, descLen: description?.length, priceStr });
            
            // Try InvoiceManager first if available
            if (window.InvoiceManager && typeof window.InvoiceManager.addMasonryServiceFromForm === 'function') {
                console.log('🎯 [SSM] Using InvoiceManager.addMasonryServiceFromForm');
                window.InvoiceManager.addMasonryServiceFromForm();
                return;
            }
            
            // === SAFE-HOTFIX: SIMPLE_SERVICE_SYNTAX (BEGIN)
            // Otherwise handle directly
            console.log('[SERVICE:FIX] syntax corrected @206');
            console.log('🎯 [SSM] Handling directly');
            
            // Variables already declared above, just reassign
            const currentPrice = parseFloat(document.getElementById('masonry-job-price')?.value);
            
            // Validate inputs
            if (!serviceType) {
                this.showError('Please select a service type');
                return;
            }
            
            if (!description) {
                this.showError('Please enter a service description');
                return;
            }
            
            if (!currentPrice || currentPrice <= 0) {
                this.showError('Please enter a valid price');
                return;
            }
            
            // Create service object with amount property for totals calculation
            const service = {
                type: 'masonry_' + serviceType.replace(/-/g, '_'),
                description: description,
                price: currentPrice,
                quantity: 1,
                amount: currentPrice  // Critical for invoice totals
            };
            
            // Add to current invoice or estimate
            if (this.isEstimatePage()) {
                window.InvoiceManager.addEstimateService(service);
                this.showSuccess('Masonry service added to estimate');
            } else {
                window.InvoiceManager.addService(service);
                this.showSuccess('Masonry service added to invoice');
            }
            
            // Clear form
            this.clearMasonryForm();
            // === SAFE-HOTFIX: SIMPLE_SERVICE_SYNTAX (END)
            // === SAFE-HOTFIX: MASONRY BUTTON FIX (END)
        },
        
        // Handle adding estimate masonry service
        handleAddEstimateMasonryService: function() {
            // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (BEGIN)
            // Delegate to EstimateManager for proper handling
            console.log('🎯 [SSM] Delegating to EstimateManager.addMasonryEstimateService');
            
            if (window.EstimateManager && typeof window.EstimateManager.addMasonryEstimateService === 'function') {
                window.EstimateManager.addMasonryEstimateService();
                return;
            }
            
            // Fallback implementation if EstimateManager method not available
            console.log('🎯 [SSM] Fallback - Adding masonry service to estimate directly');
            
            const serviceType = document.getElementById('estimate-masonry-service')?.value;
            const description = document.getElementById('estimate-masonry-description')?.value?.trim();
            const price = parseFloat(document.getElementById('estimate-masonry-rate')?.value); // Fixed ID to match HTML
            // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (END)
            
            // Validate inputs
            if (!serviceType) {
                this.showError('Please select a service type');
                return;
            }
            
            if (!description) {
                this.showError('Please enter a service description');
                return;
            }
            
            if (!price || price <= 0) {
                this.showError('Please enter a valid price');
                return;
            }
            
            // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (BEGIN)
            // Create service object with proper structure
            const service = {
                id: 'svc_' + Date.now(),
                type: 'masonry',
                description: description,
                price: price,
                amount: price,
                quantity: 1
            };
            
            // Add to estimate using EstimateManager
            if (window.EstimateManager) {
                window.EstimateManager.addService(service);
            } else if (window.InvoiceManager) {
                window.InvoiceManager.addEstimateService(service);
            }
            this.showSuccess('Masonry service added to estimate');
            // === SAFE-HOTFIX: MASONRY ESTIMATE REVIEW & SUBMIT (END)
            
            // Clear form
            this.clearEstimateMasonryForm();
        },
        
        // Check if we're on estimate page
        isEstimatePage: function() {
            const estimateSection = document.getElementById('estimate-creation');
            return estimateSection && estimateSection.style.display !== 'none';
        },
        
        // Clear concrete form
        clearConcreteForm: function() {
            const description = document.getElementById('concrete-service-description');
            const price = document.getElementById('concrete-service-price');
            
            if (description) description.value = '';
            if (price) price.value = '';
        },
        
        // Clear estimate concrete form
        clearEstimateConcreteForm: function() {
            const description = document.getElementById('estimate-concrete-service-description');
            const price = document.getElementById('estimate-concrete-service-price');
            
            if (description) description.value = '';
            if (price) price.value = '';
        },
        
        // Clear masonry form
        clearMasonryForm: function() {
            const serviceType = document.getElementById('masonry-service');
            const description = document.getElementById('masonry-description');
            const price = document.getElementById('masonry-job-price');
            
            if (serviceType) serviceType.value = '';
            if (description) description.value = '';
            if (price) price.value = '';
        },
        
        // Clear estimate masonry form
        clearEstimateMasonryForm: function() {
            const serviceType = document.getElementById('estimate-masonry-service');
            const description = document.getElementById('estimate-masonry-description');
            const price = document.getElementById('estimate-masonry-job-price');
            
            if (serviceType) serviceType.value = '';
            if (description) description.value = '';
            if (price) price.value = '';
        },
        
        // Show success message
        showSuccess: function(message) {
            if (window.NotificationSystem && window.NotificationSystem.showSuccess) {
                window.NotificationSystem.showSuccess(message);
            } else {
                alert(message); // Fallback
            }
        },
        
        // Show error message
        showError: function(message) {
            if (window.NotificationSystem && window.NotificationSystem.showError) {
                window.NotificationSystem.showError(message);
            } else {
                alert('Error: ' + message); // Fallback
            }
        }
    };
    
    // === SAFE-HOTFIX: MASONRY BUTTON TIMING (BEGIN) - Reinit on business type change
    // Method to re-bind buttons when business type changes
    window.SimpleServiceManager.reinitMasonryButton = function() {
        console.log('[SSM:REINIT] Re-binding masonry button');
        this.setupMasonryServiceButton();
    };
    // === SAFE-HOTFIX: MASONRY BUTTON TIMING (END)
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.SimpleServiceManager.init();
        });
    } else {
        window.SimpleServiceManager.init();
    }
    
})();