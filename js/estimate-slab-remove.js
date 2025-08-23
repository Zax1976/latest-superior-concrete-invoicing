/**
 * === SAFE-HOTFIX: ESTIMATE SLAB REMOVE (BEGIN)
 * Enable removing slab line items in concrete estimate creation only
 */

(function() {
    'use strict';
    
    console.log('[EST-REMOVE:INIT] Loading slab remove functionality for estimates...');
    
    // Only initialize for estimate context
    function initEstimateSlabRemove() {
        // Check if we're in estimate creation view
        const estimateCreation = document.getElementById('estimate-creation');
        if (!estimateCreation) {
            console.log('[EST-REMOVE:SKIP] Not in estimate creation view');
            return;
        }
        
        // Add delegated event listener for remove buttons
        estimateCreation.addEventListener('click', handleRemoveClick, true);
        console.log('[EST-REMOVE:DELEGATED] Event listener attached to estimate-creation');
        
        // Enhance existing slab rows without remove buttons
        enhanceExistingSlabRows();
    }
    
    /**
     * Handle remove button clicks (delegated)
     */
    function handleRemoveClick(e) {
        // Check if clicked element is a remove button
        if (!e.target.matches('.remove-slab-btn') && !e.target.closest('.remove-slab-btn')) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const button = e.target.closest('.remove-slab-btn');
        const serviceId = button.dataset.serviceId;
        
        if (!serviceId) {
            console.log('[EST-REMOVE:ERROR] No service ID found');
            return;
        }
        
        console.log('[EST-REMOVE:CLICK]', { id: serviceId });
        
        // Use EstimateManager's removeService method which handles everything
        if (window.EstimateManager && window.EstimateManager.removeService) {
            // This will handle: removing from model, DOM, updating totals, and showing empty message
            window.EstimateManager.removeService(serviceId);
            
            // Log completion
            const remaining = window.EstimateManager?.currentEstimate?.services?.length || 0;
            const subtotal = window.EstimateManager?.currentEstimate?.subtotal || 0;
            console.log('[EST-REMOVE:DONE]', { remaining, subtotal });
            
            // Check if we need to show placeholder
            if (remaining === 0) {
                console.log('[EST-EMPTY:PLACEHOLDER_SHOWN]');
            }
        } else {
            console.log('[EST-REMOVE:ERROR] EstimateManager.removeService not available');
        }
    }
    
    
    /**
     * Enhance existing slab rows without remove buttons
     */
    function enhanceExistingSlabRows() {
        const list = document.getElementById('estimate-services-list');
        if (!list) return;
        
        const serviceItems = list.querySelectorAll('.service-item');
        let enhancedCount = 0;
        
        serviceItems.forEach(item => {
            // Check if it already has a remove button
            if (item.querySelector('.remove-slab-btn')) {
                return;
            }
            
            // Check if it's a concrete slab
            const serviceType = item.querySelector('.service-type');
            if (!serviceType || !serviceType.textContent.includes('Concrete')) {
                return;
            }
            
            // Add remove button
            const serviceId = item.dataset.serviceId;
            if (serviceId) {
                addRemoveButton(item, serviceId);
                enhancedCount++;
            }
        });
        
        if (enhancedCount > 0) {
            console.log('[EST-REMOVE:ENHANCED]', { count: enhancedCount });
        }
    }
    
    /**
     * Add remove button to a service item
     */
    function addRemoveButton(serviceItem, serviceId) {
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-slab-btn';
        removeBtn.dataset.serviceId = serviceId;
        removeBtn.setAttribute('aria-label', 'Remove slab');
        removeBtn.setAttribute('title', 'Remove slab');
        removeBtn.innerHTML = '×';
        removeBtn.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 18px;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Make service item position relative if not already
        serviceItem.style.position = 'relative';
        
        // Add button to service item
        serviceItem.appendChild(removeBtn);
    }
    
    /**
     * Override slab-manager.js to add remove buttons when adding slabs
     */
    function enhanceSlabManager() {
        // Wait for SlabManager to be available
        if (!window.SlabManager) {
            setTimeout(enhanceSlabManager, 500);
            return;
        }
        
        // Store original onUseSelectedPriceClick
        const originalClick = window.SlabManager.onUseSelectedPriceClick;
        
        if (originalClick && !originalClick._enhanced) {
            // Override the function
            window.SlabManager.onUseSelectedPriceClick = function(evt) {
                // Call original
                const result = originalClick.apply(this, arguments);
                
                // If we're in estimate context, enhance the newly added item
                setTimeout(() => {
                    if (isEstimateContext()) {
                        enhanceLatestSlabRow();
                    }
                }, 100);
                
                return result;
            };
            
            // Mark as enhanced
            window.SlabManager.onUseSelectedPriceClick._enhanced = true;
            console.log('[EST-REMOVE:SLAB_MANAGER_ENHANCED]');
        }
    }
    
    /**
     * Enhance the latest added slab row
     */
    function enhanceLatestSlabRow() {
        const list = document.getElementById('estimate-services-list');
        if (!list) return;
        
        // Get last service item
        const serviceItems = list.querySelectorAll('.service-item');
        const lastItem = serviceItems[serviceItems.length - 1];
        
        if (lastItem && !lastItem.querySelector('.remove-slab-btn')) {
            const serviceId = lastItem.dataset.serviceId;
            if (serviceId) {
                addRemoveButton(lastItem, serviceId);
                console.log('[EST-REMOVE:ADDED_TO_NEW]', { id: serviceId });
            }
        }
    }
    
    /**
     * Check if we're in estimate context
     */
    function isEstimateContext() {
        return !!(document.querySelector('.estimate-concrete-section') ||
                  document.querySelector('input[name="estimateBusinessType"][value="concrete"]:checked') ||
                  (document.getElementById('estimate-creation')?.classList.contains('active')));
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initEstimateSlabRemove();
            enhanceSlabManager();
        });
    } else {
        initEstimateSlabRemove();
        enhanceSlabManager();
    }
    
    // Also initialize when view changes
    if (window.App) {
        const originalShowView = window.App.showView;
        if (originalShowView && !originalShowView._slabRemoveEnhanced) {
            window.App.showView = function(viewId) {
                const result = originalShowView.apply(this, arguments);
                
                if (viewId === 'estimate-creation') {
                    setTimeout(() => {
                        initEstimateSlabRemove();
                        enhanceExistingSlabRows();
                    }, 100);
                }
                
                return result;
            };
            window.App.showView._slabRemoveEnhanced = true;
        }
    }
    
    console.log('[EST-REMOVE:READY] Slab remove functionality initialized');
    
})();

// === SAFE-HOTFIX: ESTIMATE SLAB REMOVE (END)