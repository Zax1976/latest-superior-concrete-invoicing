/**
 * Business Type Handler - STRICT SEPARATION
 * Ensures concrete and masonry modules never cross-contaminate
 * Completely isolates calculator/slab logic from masonry flows
 */

(function() {
    'use strict';

    let activeModules = {
        concrete: false,
        masonry: false
    };

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupBusinessTypeHandling);
        } else {
            setupBusinessTypeHandling();
        }
    }

    /**
     * Set up business type change handling with strict separation
     */
    function setupBusinessTypeHandling() {
        // Handle invoice form business type changes
        const businessTypeRadios = document.querySelectorAll('input[name="businessType"]');
        businessTypeRadios.forEach(radio => {
            radio.addEventListener('change', handleInvoiceBusinessTypeChange);
        });

        // Handle estimate form business type changes
        const estimateBusinessTypeRadios = document.querySelectorAll('input[name="estimateBusinessType"]');
        estimateBusinessTypeRadios.forEach(radio => {
            radio.addEventListener('change', handleEstimateBusinessTypeChange);
        });

        // Set initial state
        handleInvoiceBusinessTypeChange();
        handleEstimateBusinessTypeChange();

        console.log('✅ Business type handler initialized with strict separation');
    }

    /**
     * Destroy concrete modules to prevent contamination
     */
    function destroyConcreteModules() {
        if (activeModules.concrete) {
            try {
                // Remove concrete event listeners - comprehensive cleanup
                const concreteSelectors = [
                    '#concrete-services input',
                    '#concrete-services button', 
                    '#concrete-services select',
                    '#concrete-services textarea',
                    '.calculator-section input',
                    '.calculator-section button',
                    '.calculator-section select',
                    '.slab-entry input',
                    '.slab-entry button'
                ];
                
                concreteSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        // Remove all event listeners by cloning
                        const newEl = el.cloneNode(true);
                        if (el.parentNode) {
                            el.parentNode.replaceChild(newEl, el);
                        }
                    });
                });
                
                // Clear calculator state if it exists
                if (window.ConcreteCalculator) {
                    if (typeof window.ConcreteCalculator.reset === 'function') {
                        window.ConcreteCalculator.reset();
                    }
                    // Clear any cached calculator data
                    if (window.ConcreteCalculator.currentCalculation) {
                        window.ConcreteCalculator.currentCalculation = null;
                    }
                }
                
                // Clear slab manager state
                if (window.SlabManager) {
                    if (typeof window.SlabManager.reset === 'function') {
                        window.SlabManager.reset();
                    }
                    if (typeof window.SlabManager.clearAll === 'function') {
                        window.SlabManager.clearAll();
                    }
                }
                
                // Clear any dynamic calculator results
                const calcResults = document.getElementById('calc-results');
                if (calcResults) {
                    calcResults.style.display = 'none';
                }
                
                // Reset calculator inputs
                const calcInputs = ['calc-length', 'calc-width', 'calc-depth', 'calc-price-low', 'calc-price-high'];
                calcInputs.forEach(inputId => {
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.value = '';
                    }
                });
                
                activeModules.concrete = false;
                console.log('🧹 Concrete modules destroyed completely');
                
            } catch (error) {
                console.error('Error destroying concrete modules:', error);
                activeModules.concrete = false;
            }
        }
    }

    /**
     * Destroy masonry modules to prevent contamination
     */
    function destroyMasonryModules() {
        if (activeModules.masonry) {
            try {
                // Remove masonry event listeners - comprehensive cleanup
                const masonrySelectors = [
                    '#masonry-services input',
                    '#masonry-services button',
                    '#masonry-services select',
                    '#masonry-services textarea',
                    '#estimate-masonry-service',
                    '#estimate-masonry-description',
                    '#estimate-masonry-price',
                    '#add-estimate-masonry-service'
                ];
                
                masonrySelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        // Remove all event listeners by cloning
                        const newEl = el.cloneNode(true);
                        if (el.parentNode) {
                            el.parentNode.replaceChild(newEl, el);
                        }
                    });
                });
                
                // Clear masonry form fields
                const masonryFields = [
                    'masonry-service',
                    'masonry-description', 
                    'masonry-job-price',
                    'estimate-masonry-service',
                    'estimate-masonry-description',
                    'estimate-masonry-price'
                ];
                
                masonryFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.value = '';
                    }
                });
                
                activeModules.masonry = false;
                console.log('🧹 Masonry modules destroyed completely');
                
            } catch (error) {
                console.error('Error destroying masonry modules:', error);
                activeModules.masonry = false;
            }
        }
    }

    /**
     * Initialize concrete modules ONLY
     */
    function initializeConcreteModules(context) {
        // Initialize calculator if available with proper context
        if (window.ConcreteCalculator && typeof window.ConcreteCalculator.init === 'function') {
            // Determine context from active view if not provided
            if (!context) {
                if (document.querySelector('#estimate-creation.view.active')) {
                    context = 'estimate';
                } else if (document.querySelector('#invoice-creation.view.active')) {
                    context = 'invoice';
                }
            }
            window.ConcreteCalculator.init({ context: context || 'invoice' });
        }
        
        // Setup delegated listener for Use Selected Price button
        setTimeout(() => {
            if (window.SlabManager && typeof window.SlabManager.setupDelegatedListener === 'function') {
                window.SlabManager.setupDelegatedListener();
            }
        }, 100);
        
        activeModules.concrete = true;
        console.log('🏗️ Concrete modules initialized');
    }

    /**
     * Initialize masonry modules ONLY
     */
    function initializeMasonryModules() {
        if (!activeModules.masonry) {
            // === SAFE-HOTFIX: MASONRY BUTTON FIX (BEGIN) - Remove conflicting binding
            // SimpleServiceManager already handles the button binding
            // No need to add another listener here that conflicts
            console.log('🏠 [BTH] Masonry modules initialized (delegating to SSM)');
            // === SAFE-HOTFIX: MASONRY BUTTON FIX (END)
            
            activeModules.masonry = true;
        }
    }

    /**
     * Handle invoice business type change with strict separation
     */
    function handleInvoiceBusinessTypeChange() {
        const selectedType = document.querySelector('input[name="businessType"]:checked')?.value;
        const concreteServices = document.getElementById('concrete-services');
        const masonryServices = document.getElementById('masonry-services');

        if (concreteServices && masonryServices) {
            if (selectedType === 'concrete') {
                // DESTROY masonry first to prevent contamination
                destroyMasonryModules();
                
                // Show concrete, hide masonry
                concreteServices.style.display = 'block';
                masonryServices.style.display = 'none';
                
                // Initialize ONLY concrete modules
                initializeConcreteModules();
                
            } else if (selectedType === 'masonry') {
                // DESTROY concrete first to prevent contamination
                destroyConcreteModules();
                
                // Show masonry, hide concrete
                concreteServices.style.display = 'none';
                masonryServices.style.display = 'block';
                
                // === SAFE-HOTFIX: MASONRY DESC LENGTH (BEGIN) - Configure on business type change
                // Configure masonry description field when switching to masonry
                if (window.InvoiceManager && window.InvoiceManager.configureMasonryDescriptionField) {
                    setTimeout(() => {
                        window.InvoiceManager.configureMasonryDescriptionField();
                    }, 100);
                }
                // === SAFE-HOTFIX: MASONRY DESC LENGTH (END)
                
                // === SAFE-HOTFIX: MASONRY BUTTON TIMING (BEGIN) - Re-bind button after business type change
                // Re-initialize masonry button binding after DOM changes
                if (window.SimpleServiceManager && window.SimpleServiceManager.reinitMasonryButton) {
                    setTimeout(() => {
                        window.SimpleServiceManager.reinitMasonryButton();
                        console.log('[BTH] Re-initialized masonry button after business type change');
                    }, 150);
                }
                // === SAFE-HOTFIX: MASONRY BUTTON TIMING (END)
                
                // Initialize ONLY masonry modules
                initializeMasonryModules();
                
            } else {
                // No business type selected - destroy both
                destroyConcreteModules();
                destroyMasonryModules();
                concreteServices.style.display = 'none';
                masonryServices.style.display = 'none';
            }
        }

        console.log(`Invoice business type: ${selectedType || 'none'} - Modules isolated`);
    }

    /**
     * Add masonry service with proper validation
     */
    function addMasonryService() {
        try {
            const serviceType = document.getElementById('masonry-service')?.value?.trim();
            const description = document.getElementById('masonry-description')?.value?.trim();
            const priceInput = document.getElementById('masonry-job-price');
            const priceValue = priceInput?.value?.trim();
            const price = parseFloat(priceValue || '0');

            // Enhanced validation
            if (!serviceType) {
                showError('Please select a service type', 'masonry-service');
                return;
            }
            if (!description || description.length < 5) {
                showError('Please enter a detailed description (at least 5 characters)', 'masonry-description');
                return;
            }
            if (!priceValue || isNaN(price) || price <= 0) {
                showError('Please enter a valid price greater than $0.00', 'masonry-job-price');
                priceInput?.focus();
                return;
            }
            if (price > 50000) {
                if (!confirm(`The price $${price.toFixed(2)} is quite high. Are you sure this is correct?`)) {
                    priceInput?.focus();
                    return;
                }
            }

            // Add service to invoice - ensure InvoiceManager is available
            if (window.JStarkInvoicing && window.JStarkInvoicing.InvoiceManager) {
                const serviceData = {
                    type: 'masonry',
                    serviceType: serviceType,
                    description: description,
                    price: price,
                    quantity: 1,
                    timestamp: new Date().toISOString()
                };
                
                // Safe dependency check before calling InvoiceManager methods
                if (window.JStarkInvoicing && window.JStarkInvoicing.InvoiceManager && typeof window.JStarkInvoicing.InvoiceManager.addService === 'function') {
                    window.JStarkInvoicing.InvoiceManager.addService(serviceData);
                } else if (window.InvoiceManager && typeof window.InvoiceManager.addService === 'function') {
                    window.InvoiceManager.addService(serviceData);
                } else {
                    console.warn('InvoiceManager not available for service addition');
                    ErrorHandler.showUserError('System error: Cannot add service - InvoiceManager not available');
                    return;
                }
                
                // Clear form on success
                clearMasonryForm();
                
                // Show success feedback
                if (window.NotificationSystem) {
                    window.NotificationSystem.showSuccess(`Masonry service added: $${price.toFixed(2)}`);
                }
                
                console.log(`✅ Masonry service added successfully: $${price.toFixed(2)}`);
                
            } else {
                showError('Invoice system not available. Please refresh the page and try again.');
                console.error('JStarkInvoicing.InvoiceManager not found');
            }
            
        } catch (error) {
            console.error('Error adding masonry service:', error);
            showError('Failed to add service. Please try again.');
        }
    }
    
    /**
     * Clear masonry form fields
     */
    function clearMasonryForm() {
        const fields = ['masonry-service', 'masonry-description', 'masonry-job-price'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                // Remove any error styling
                field.classList.remove('error');
            }
        });
    }
    
    /**
     * Show error message with field highlighting
     */
    function showError(message, fieldId) {
        // Use notification system if available
        if (window.NotificationSystem) {
            window.NotificationSystem.showError(message);
        } else {
            alert(message);
        }
        
        // Highlight field if provided
        if (fieldId) {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('error');
                field.focus();
                // Remove error styling after user starts typing
                field.addEventListener('input', function() {
                    this.classList.remove('error');
                }, { once: true });
            }
        }
    }

    /**
     * Handle estimate business type change  
     */
    function handleEstimateBusinessTypeChange() {
        const selectedType = document.querySelector('input[name="estimateBusinessType"]:checked')?.value;
        const servicesContent = document.getElementById('estimate-services-content');

        if (servicesContent && selectedType) {
            console.log('[BusinessTypeHandler] Estimate business type changed to:', selectedType);
            
            if (selectedType === 'concrete') {
                // === SAFE-HOTFIX: ESTIMATE CALC NORMALIZE (BEGIN)
                // CRITICAL FIX: Call InvoiceManager to handle concrete calculator setup
                console.log('[BusinessTypeHandler] Delegating to InvoiceManager for concrete calculator');
                
                // Check if InvoiceManager is available
                const tryInvokeManager = () => {
                    if (window.InvoiceManager && typeof window.InvoiceManager.handleEstimateBusinessTypeChange === 'function') {
                        window.InvoiceManager.handleEstimateBusinessTypeChange('concrete');
                        return true;
                    } else if (window.JStarkInvoicing && window.JStarkInvoicing.InvoiceManager && 
                              typeof window.JStarkInvoicing.InvoiceManager.handleEstimateBusinessTypeChange === 'function') {
                        window.JStarkInvoicing.InvoiceManager.handleEstimateBusinessTypeChange('concrete');
                        return true;
                    }
                    return false;
                };
                
                // Try immediately
                if (!tryInvokeManager()) {
                    // Silent retry with short delays
                    let retries = 0;
                    const maxRetries = 5;
                    const retryInterval = setInterval(() => {
                        retries++;
                        if (tryInvokeManager() || retries >= maxRetries) {
                            clearInterval(retryInterval);
                            if (retries >= maxRetries) {
                                // Silently give up after max retries, no error log
                            }
                        }
                    }, 100); // Try every 100ms up to 500ms total
                }
                // === SAFE-HOTFIX: ESTIMATE CALC NORMALIZE (END)
                
                // Original fallback code remains but won't execute due to return
                if (false) {
                    // Fallback: Create simple form as before
                    servicesContent.innerHTML = `
                        <div class="estimate-concrete-services">
                            <h4><i class="fas fa-road"></i> Concrete Leveling Services</h4>
                            <p class="service-instructions">
                                <i class="fas fa-info-circle"></i>
                                Add concrete leveling services for this estimate. Calculator suggestions are available.
                            </p>
                            
                            <!-- Service Description -->
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="estimate-concrete-service-description">
                                        Service Description:
                                    </label>
                                    <input type="text" id="estimate-concrete-service-description" 
                                           placeholder="e.g., Driveway concrete leveling" class="form-control">
                                </div>
                            </div>

                            <!-- Estimate Slabs Container -->
                            <div id="estimate-slabs-container" class="slabs-container">
                            <!-- Estimate slab entries will be added dynamically -->
                        </div>

                        <!-- Add Estimate Slab Button -->
                        <div class="form-row">
                            <button type="button" id="add-estimate-slab-btn" class="btn btn-secondary">
                                <i class="fas fa-plus"></i> Add Slab
                            </button>
                        </div>

                        <!-- Estimate Total Display -->
                        <div class="slab-totals-display" id="estimate-slab-totals-display" style="display: none;">
                            <div class="total-row">
                                <span class="total-label">Total from all slabs:</span>
                                <span class="total-value" id="estimate-slab-total-value">$0.00</span>
                            </div>
                        </div>

                        <!-- Add Estimate Service Button -->
                        <div class="form-row">
                            <button type="button" id="add-estimate-concrete-service" class="btn btn-primary" disabled>
                                <i class="fas fa-plus"></i> Add to Estimate
                            </button>
                        </div>
                    </div>
                `;

                    // Initialize estimate slab functionality
                    initializeEstimateSlabs();
                }
                
                // Return early for concrete - handled by InvoiceManager or fallback
                return;

            } else if (selectedType === 'masonry') {
                // Create masonry estimate services content
                servicesContent.innerHTML = `
                    <div class="estimate-masonry-services">
                        <h4><i class="fas fa-home"></i> Masonry Services</h4>
                        <p class="service-instructions">
                            <i class="fas fa-info-circle"></i>
                            Add masonry services for this estimate.
                        </p>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="estimate-masonry-service">Service Type:</label>
                                <select id="estimate-masonry-service" class="form-control">
                                    <option value="">Select service...</option>
                                    <option value="brick-installation">Brick Installation</option>
                                    <option value="brick-repair">Brick Repair</option>
                                    <option value="stone-fireplace">Stone Fireplace</option>
                                    <option value="chimney-repair">Chimney Repair</option>
                                    <option value="chimney-restoration">Chimney Restoration</option>
                                    <option value="outdoor-fireplace">Outdoor Fireplace</option>
                                    <option value="patio-construction">Patio Construction</option>
                                    <option value="fire-pit">Fire Pit Installation</option>
                                    <option value="outdoor-kitchen">Outdoor Kitchen</option>
                                    <option value="veneer-stone">Veneer Stone Installation</option>
                                    <option value="cultured-stone">Cultured Stone Application</option>
                                    <option value="custom">Custom Masonry Work</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="estimate-masonry-description">Description:</label>
                                <textarea id="estimate-masonry-description" rows="3" 
                                          placeholder="Describe the masonry work..." class="form-control"></textarea>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="estimate-masonry-price">Estimated Price:</label>
                                <div class="input-with-currency">
                                    <span class="currency-symbol">$</span>
                                    <input type="number" id="estimate-masonry-price" 
                                           min="0.01" step="0.01" placeholder="0.00" class="form-control">
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <button type="button" id="add-estimate-masonry-service" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Add to Estimate
                            </button>
                        </div>
                    </div>
                `;
            }
        }

        console.log(`Estimate business type changed to: ${selectedType || 'none'}`);
    }

    /**
     * Initialize estimate slab functionality (simplified version of main slab manager)
     */
    function initializeEstimateSlabs() {
        // This would be a simplified version for estimates
        // For now, we'll just add a basic implementation
        const addSlabBtn = document.getElementById('add-estimate-slab-btn');
        if (addSlabBtn) {
            // Basic functionality - for full implementation, we'd need to extend SlabManager
            // or create a separate EstimateSlabManager
            console.log('Estimate slab functionality ready');
        }
    }

    // Initialize when script loads
    init();

    console.log('✅ Business Type Handler Loaded');

})();