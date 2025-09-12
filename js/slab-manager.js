/**
 * Simplified Slab Manager - PDF-compliant architecture
 * ONE calculator → list flow as specified in requirements
 */

window.SlabManager = (function() {
    'use strict';

    let slabs = [];
    let slabCounter = 0;

    /**
     * Initialize the simplified slab manager
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupSlabManager);
        } else {
            setupSlabManager();
        }
    }

    /**
     * Setup delegated event listener for Use Selected Price
     */
    function setupDelegatedListener() {
        // Remove any existing delegated listener
        document.removeEventListener('click', handleDelegatedClick, true);
        // Add new delegated listener at document level
        document.addEventListener('click', handleDelegatedClick, true);
        console.log('[ADD-SLAB:DELEGATED]');
    }
    
    /**
     * Handle delegated clicks for Use Selected Price
     */
    function handleDelegatedClick(e) {
        if (e.target && (e.target.id === 'use-selected-price' || e.target.closest('#use-selected-price'))) {
            e.preventDefault();
            e.stopPropagation();
            onUseSelectedPriceClick(e);
        }
    }
    
    /**
     * Set up the simplified slab manager functionality
     */
    function setupSlabManager() {
        console.log('🔧 Setting up Simplified Slab Manager...');
        setupDelegatedListener();
        console.log('✅ Simplified Slab Manager initialized');
    }

    /**
     * Detect if we're in estimate context - RELIABLE check
     */
    function isEstimateContext() {
        // === SAFE-HOTFIX: CONTEXT DETECTION FIX (BEGIN)
        // MOST IMPORTANT: Check which view is currently active and visible
        const invoiceView = document.getElementById('invoice-creation');
        const estimateView = document.getElementById('estimate-creation');
        
        // If invoice view is active AND visible, we're in invoice context
        if (invoiceView && invoiceView.classList.contains('active') && 
            invoiceView.style.display !== 'none') {
            return false; // Invoice context
        }
        
        // If estimate view is active AND visible, we're in estimate context
        if (estimateView && estimateView.classList.contains('active') && 
            estimateView.style.display !== 'none') {
            return true; // Estimate context
        }
        
        // Secondary checks as fallback
        // Check if estimate concrete section exists
        if (document.querySelector('.estimate-concrete-section')) {
            return true;
        }
        // Check if estimate business type radio is selected
        if (document.querySelector('input[name="estimateBusinessType"][value="concrete"]:checked')) {
            return true;
        }
        // Check if invoice business type radio is selected
        if (document.querySelector('input[name="businessType"][value="concrete"]:checked')) {
            return false; // Invoice context
        }
        
        // Default to false (invoice) if unclear
        return false;
        // === SAFE-HOTFIX: CONTEXT DETECTION FIX (END)
    }
    
    /**
     * Get current document and manager based on context
     */
    function getCurrentDocAndManager() {
        if (isEstimateContext() && window.EstimateManager) {
            const doc = (window.EstimateManager.currentEstimate ||= { services: [], totals: {subtotal:0,tax:0,total:0} });
            return { mgr: window.EstimateManager, doc, listId: 'estimate-services-list' };
        }
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (BEGIN) - Fix invoice services list ID
        const doc = (window.InvoiceManager.currentInvoice ||= { services: [], totals: {subtotal:0,tax:0,total:0} });
        return { mgr: window.InvoiceManager, doc, listId: 'services-list' }; // Invoice uses 'services-list' not 'invoice-services-list'
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
    }
    
    /**
     * Handle Use Selected Price click with canonical state
     */
    function onUseSelectedPriceClick(evt) {
        // === VERSION 9 FIX: Check if custom price is active ===
        // Check global flag first (set by custom-price-handler.js)
        if (window._customPriceActive) {
            console.log('[SLAB-MANAGER] Custom price handler is active, skipping regular handler');
            return; // EXIT - custom-price-handler.js is handling this
        }
        
        // === VERSION 9.9 FIX: Only skip for ESTIMATES with custom price
        // For estimates, custom-price-handler.js handles custom prices
        // For invoices, we need to continue and handle it here
        const isEstimate = isEstimateContext();
        const context = isEstimate ? 'estimate' : 'invoice';
        
        // Only check for early exit if we're in ESTIMATE context
        if (isEstimate) {
            const estimateSection = document.querySelector('.estimate-concrete-section');
            const customRadio = estimateSection?.querySelector('input[name="priceSelection"][value="custom"]');
            const customInput = estimateSection?.querySelector('#custom-price');
            
            if (customRadio && customRadio.checked) {
                const customValue = customInput ? parseFloat(customInput.value) : 0;
                if (customValue > 0) {
                    console.log('[SLAB-MANAGER] Estimate with custom ($' + customValue + '), letting custom-price-handler handle it');
                    return; // EXIT only for estimates
                }
                // If custom is selected but no value, continue with regular flow
                console.log('[SLAB-MANAGER] Custom selected but no value, continuing with regular price');
            }
        }
        // For invoices, always continue to process (custom handled at lines 184-195)
        // === END VERSION 9 FIX ===
        
        // === VERSION 9.2 FIX: Check if we have calculation data for estimates
        // Note: isEstimate already set above, no need to check again
        const isEstimateCheck = isEstimate;
        if (isEstimateCheck && !window.ConcreteCalculator?.currentCalculation) {
            console.log('[V9.2] No calculation data in estimate mode, using DOM values');
            // Don't block - we'll get dimensions from DOM below
        }
        
        // === SAFE-HOTFIX: CONTEXT DETECTION FIX (BEGIN)
        // Note: context already determined above in V9.9 fix
        console.log('[ADD-SLAB:CLICK]', { detectedContext: context });
        // === SAFE-HOTFIX: CONTEXT DETECTION FIX (END)
        
        // Step 3: Scope lookup to active root based on context
        let root;
        if (isEstimate) {
            root = evt?.target?.closest('[data-calc-root]') || 
                   document.getElementById('estimate-creation') ||
                   document.querySelector('.estimate-concrete-section');
        } else {
            // Invoice context - use invoice-creation as root
            root = document.getElementById('invoice-creation') || document;
            console.log('[INV-CALC:BIND_OK]', { root: '#invoice-creation' });
        }
        
        if (!root && isEstimate) {
            console.log('BLOCKED:3 {reason:"No calc root for estimate Use click"}');
            return;
        }
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
        
        // === VERSION 9.7 FIX: Context-aware radio button selection
        // For estimates, specifically look in estimate section to avoid finding wrong duplicate
        let tier;
        if (isEstimate) {
            const estimateSection = document.querySelector('.estimate-concrete-section');
            tier = estimateSection?.querySelector('input[name="priceSelection"]:checked')?.value ||
                   root.querySelector('input[name="price-tier"]:checked')?.value || 
                   'mid';
        } else {
            tier = root.querySelector('input[name="priceSelection"]:checked')?.value || 
                   root.querySelector('input[name="price-tier"]:checked')?.value || 
                   'mid';
        }
        // === VERSION 9.7 FIX: Allow custom tier
        if (!['low','mid','high','custom'].includes(tier)) tier = 'mid';
        
        // === VERSION 9.7 FIX: Handle custom price selection
        let price = NaN;
        if (tier === 'custom') {
            const customInput = root.querySelector('#custom-price') || document.getElementById('custom-price');
            if (customInput && customInput.value) {
                price = parseFloat(customInput.value);
                console.log('[EST-ADD:CUSTOM_PRICE]', { tier: 'custom', customValue: price });
            } else {
                console.log('[EST-ADD:CUSTOM_ERROR] No custom price entered');
                alert('Please enter a custom price');
                return;
            }
        } else {
            // Primary lookup: text IDs within root
            // === SAFE-HOTFIX: INVOICE CALC PRICE FIX (BEGIN)
            const map = { low:'#out-price-low', mid:'#out-price-mid', high:'#out-price-high' };
            const sel = map[tier];
            // For invoice, always look globally as calculator is in a fixed location
            const el = context === 'invoice' ? document.querySelector(sel) : (root.querySelector(sel) || document.querySelector(sel));
            const text = el?.textContent?.trim();
            const textVal = text ? parseFloat(text.replace(/[^0-9.-]/g,'')) : NaN;
            
            // Log what we found for debugging
            if (context === 'invoice') {
                console.log('[INV-CALC:PRICE_LOOKUP]', { 
                    tier, 
                    selector: sel, 
                    found: !!el,
                    text: text || 'none',
                    parsed: textVal
                });
            }
            // === SAFE-HOTFIX: INVOICE CALC PRICE FIX (END)
            
            // Fallback lookup: dataset from calc-results
            const calcResults = root.querySelector('#calc-results') || document.getElementById('calc-results');
            const ds = calcResults?.dataset;
            const dsKey = 'price' + tier[0].toUpperCase() + tier.slice(1);
            const dsVal = ds ? parseFloat(ds[dsKey]) : NaN;
            
            if (Number.isFinite(textVal) && textVal > 0) {
                price = textVal;
            } else if (Number.isFinite(dsVal) && dsVal > 0) {
                price = dsVal;
            }
        }
        
        if (!Number.isFinite(price) || price <= 0) {
            console.log('[ADD-SLAB:BAD_PRICE]', { 
                tier, 
                text: text || '(none)', 
                dataset: ds ? dsKey + '=' + ds[dsKey] : '(no dataset)', 
                parsedText: textVal,
                parsedDs: dsVal
            });
            console.log(`BLOCKED:2 {reason:"Price not found in ${context} context"}`);
            window.alert?.('Price not available. Please calculate first.');
            return;
        }
        
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (BEGIN) - Log price for correct context
        if (context === 'invoice') {
            console.log('[INV-ADD:PRICE_OK]', { tier, value: price });
        } else {
            console.log('[EST-ADD:PRICE_OK]', { tier, value: price });
        }
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
        
        // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - CKPT:3
        // Get inputs - for estimate, read from dataset first, then fallback to inputs
        const idPrefix = context === 'estimate' ? 'calc-' : 'calc-'; // Both use calc- prefix now
        
        let L, W, H, S;
        
        // === VERSION 9.12 FIX: Prioritize calculation data for BOTH contexts
        const calcData = window.ConcreteCalculator?.currentCalculation;
        if (calcData && (calcData.length > 0 || calcData.width > 0)) {
            L = Number(calcData.length || 0);
            W = Number(calcData.width || 0);
            H = Number(calcData.inchesSettled || 1);
            S = Number(calcData.sidesSettled || 1);
            console.log('[V9.12] Using dimensions from calculation data:', { L, W, H, S, context });
        } else if (context === 'estimate' && ds) {
            // Primary: read dimensions from dataset (set in CKPT:2)
            L = Number(ds.length || 0);
            W = Number(ds.width || 0);
            H = Number(ds.inches || 0);
            S = Number(ds.sides || 1);
            
            console.log('[EST-ADD:DATASET_DIMS]', { L, W, H, S });
            
            // Fallback: if dataset has zeros, try reading from inputs within root
            if (L === 0 || W === 0) {
                const lengthEl = root.querySelector('#calc-length') || document.getElementById('calc-length');
                const widthEl = root.querySelector('#calc-width') || document.getElementById('calc-width');
                const depthEl = root.querySelector('#calc-depth') || document.getElementById('calc-depth');
                const sidesEl = root.querySelector('#calc-sides') || document.getElementById('calc-sides');
                
                L = L || Number(lengthEl?.value || 0);
                W = W || Number(widthEl?.value || 0);
                H = H || Number(depthEl?.value || 1);
                S = S || Number(sidesEl?.value || 1);
                
                console.log('[EST-ADD:FALLBACK_DIMS]', { L, W, H, S });
            }
        } else {
            // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (BEGIN) - Fix invoice input IDs
            // === SAFE-HOTFIX: INVOICE CALC PRICE FIX (BEGIN)
            // Invoice calculator uses calc-* IDs
            // Look for inputs in the invoice creation context
            const invoiceRoot = document.getElementById('invoice-creation');
            const lengthEl = invoiceRoot?.querySelector('#calc-length') || document.getElementById('calc-length');
            const widthEl = invoiceRoot?.querySelector('#calc-width') || document.getElementById('calc-width');
            const depthEl = invoiceRoot?.querySelector('#calc-depth') || document.getElementById('calc-depth');
            const sidesEl = invoiceRoot?.querySelector('#calc-sides') || document.getElementById('calc-sides');
            
            L = Number(lengthEl?.value || 0);
            W = Number(widthEl?.value || 0);
            H = Number(depthEl?.value || 0);
            S = Number(sidesEl?.value || 1);
            
            console.log('[INV-ADD:INPUTS]', { 
                lengthFound: !!lengthEl,
                widthFound: !!widthEl,
                depthFound: !!depthEl,
                sidesFound: !!sidesEl,
                L, W, H, S 
            });
            // === SAFE-HOTFIX: INVOICE CALC PRICE FIX (END)
            // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
        }
        
        // Validate dimensions
        if (L === 0 || W === 0) {
            console.log('[ADD-SLAB:DIM_MISSING]', { L, W, H, S });
            console.log(`BLOCKED:3 {reason:"Dims not found in ${context} root"}`);
            return;
        }
        
        // Log inputs for the appropriate context
        if (context === 'estimate') {
            console.log('[EST-ADD:INPUTS_OK]', { L, W, H, S, tier, price });
        }
        // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END) - CKPT:3
        
        const description = `${L}'×${W}'×${H}" (${S} side${S==1?'':'s'})`;
        
        // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (BEGIN) - CKPT:4
        const { mgr, doc, listId } = getCurrentDocAndManager();
        console.log('[ADD-SLAB:MANAGER]', { hasMgr: !!mgr, hasDoc: !!doc, listId });
        
        // Ensure we're using the correct list for estimate
        const actualListId = context === 'estimate' ? 'estimate-services-list' : listId;
        const list = document.getElementById(actualListId);
        
        if (!list && context === 'estimate') {
            console.log('BLOCKED:4 {reason:"No estimate services list"}');
            return;
        }
        
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (BEGIN) - Add amount property for totals
        // === VERSION 9.13 FIX: Store dimensions and proper quantity/unit
        const squareFootage = L * W;
        const line = { 
            id: `slab_${Date.now()}`, 
            type: 'concrete', 
            description: 'Concrete Leveling',  // Keep generic description
            dimensions: description,  // Store "10x20x1" lift" separately
            unitPrice: price, 
            quantity: squareFootage || 1,  // Use actual square footage
            unit: 'sq ft',
            rate: price / (squareFootage || 1),  // Calculate rate per sq ft
            total: price,
            amount: price,  // InvoiceManager.updateInvoiceTotals looks for 'amount'
            price: price    // Emergency fallback looks for 'price'
        };
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
        
        // Add to document services
        (doc.services ||= []).push(line);
        
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (BEGIN) - Handle invoice service addition
        // Update DOM - create proper service item based on context
        if (list) {
            // Remove empty message if present
            const emptyMsg = list.querySelector('.empty-services');
            if (emptyMsg) {
                emptyMsg.remove();
            }
            
            if (context === 'invoice') {
                // Invoice format - different from estimate
                const serviceRow = document.createElement('tr');
                serviceRow.className = 'service-row';
                serviceRow.dataset.serviceId = line.id;
                // === VERSION 9 FIX: Properly format service description ===
                const fullDescription = `Concrete Leveling ${description}`;
                serviceRow.innerHTML = `
                    <td colspan="2">${fullDescription}</td>
                    <td>1</td>
                    <td>$${price.toFixed(2)}</td>
                    <td>$${price.toFixed(2)}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-danger remove-service" 
                                data-service-id="${line.id}"
                                onclick="SlabManager.removeInvoiceService('${line.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                list.appendChild(serviceRow);
                
                console.log('[INV-ADD:ADDED]', { 
                    context: 'invoice',
                    price, 
                    list: '#' + actualListId,
                    servicesCount: doc.services.length 
                });
            } else {
                // Estimate format
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-item';
                serviceItem.dataset.serviceId = line.id;
                // === SAFE-HOTFIX: ESTIMATE SLAB REMOVE (BEGIN)
                serviceItem.dataset.serviceType = 'concrete-slab';
                serviceItem.style.position = 'relative';
                serviceItem.innerHTML = `
                    <div class="service-details">
                        <span class="service-type">Concrete Leveling</span>
                        <span class="service-description">${description}</span>
                    </div>
                    <div class="service-price">
                        <span class="price-label">Price:</span>
                        <span class="price-value">$${price.toFixed(2)}</span>
                    </div>
                    <button type="button" class="remove-slab-btn" 
                            data-service-id="${line.id}"
                            aria-label="Remove slab"
                            title="Remove slab"
                            style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
                                   background: #dc3545; color: white; border: none; border-radius: 50%;
                                   width: 24px; height: 24px; font-size: 18px; line-height: 1;
                                   cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                `;
                // === SAFE-HOTFIX: ESTIMATE SLAB REMOVE (END)
                list.appendChild(serviceItem);
                
                console.log('[EST-ADD:ADDED]', { 
                    context: 'estimate', 
                    price, 
                    list: '#' + actualListId,
                    servicesCount: doc.services.length 
                });
            }
        }
        
        // Update totals
        if (context === 'estimate' && mgr.updateEstimateTotals) {
            mgr.updateEstimateTotals();
            console.log('[EST-REVIEW:READY]', { rows: doc.services.length });
        } else if (context === 'invoice' && mgr.updateInvoiceTotals) {
            mgr.updateInvoiceTotals();
            // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (BEGIN) - Log actual subtotal
            const actualSubtotal = mgr.currentInvoice?.subtotal || doc.subtotal || 0;
            console.log('[INV-TOTALS:CALC]', { 
                services: doc.services.length, 
                subtotal: actualSubtotal,
                total: mgr.currentInvoice?.total || doc.total || 0
            });
            console.log('[INV-REVIEW:READY]', { rows: doc.services.length });
            // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
        }
        // === SAFE-HOTFIX: INV CALC → REVIEW BRIDGE (END)
        // === SAFE-HOTFIX: ESTIMATE USE-PRICE BRIDGE (END) - CKPT:4
        // === SAFE-HOTFIX: ESTIMATE USE-PRICE CONTRACT (END)
    }
    
    /**
     * Legacy function for compatibility
     */
    function addSlabFromCalculator() {
        console.log('🎯 Adding slab from calculator...');
        
        // Detect context
        const isEstimate = isEstimateContext();
        console.log('📍 Context:', isEstimate ? 'ESTIMATE' : 'INVOICE');
        
        // Get calculator inputs - use standard IDs
        const length = parseFloat(document.getElementById('slab-length')?.value) || 0;
        const width = parseFloat(document.getElementById('slab-width')?.value) || 0;
        const liftHeight = parseFloat(document.getElementById('inches-settled')?.value) || 0;
        const foamType = document.getElementById('foam-type')?.value || 'RR401';
        const location = document.getElementById('location-type')?.value || 'mid';
        
        // Get calculated price
        const priceElement = document.getElementById('out-price-calculated');
        let price = 0;
        
        if (priceElement) {
            price = parseFloat(priceElement.textContent.replace(/[$,]/g, '')) || 0;
        }
        console.log('Calculated price:', price);
        
        console.log('Validation check - Length:', length, 'Width:', width, 'Lift:', liftHeight, 'Price:', price);
        
        // Validate inputs
        if (length <= 0 || width <= 0 || liftHeight <= 0 || price <= 0) {
            alert('Please fill in all dimensions and calculate a price before adding the slab.');
            return;
        }
        
        // Create slab entry
        slabCounter++;
        const slab = {
            id: `slab_${slabCounter}`,
            number: slabCounter,
            length: length,
            width: width,
            liftHeight: liftHeight,
            location: location,
            foamType: foamType,
            price: price,
            description: getSlabDescription(length, width, liftHeight, location)
        };
        
        slabs.push(slab);
        updateSlabList();
        updateTotals();
        updateAddServiceButtonState();
        
        // Create service object
        const service = {
            id: slab.id,
            type: 'concrete',
            description: slab.description,
            quantity: 1,
            price: slab.price,
            amount: slab.price
        };
        
        // BRIDGE: Route to appropriate manager based on context
        const { mgr, doc, listId } = getCurrentDocAndManager();
        
        if (doc && mgr) {
            // Push service to document
            doc.services.push(service);
            
            // Update totals
            if (mgr.updateInvoiceTotals) {
                mgr.updateInvoiceTotals(doc);
            }
            
            // Add to services list
            const servicesList = document.getElementById(listId);
            if (servicesList) {
                const serviceItem = document.createElement('div');
                serviceItem.className = 'service-line-item';
                serviceItem.dataset.serviceId = slab.id;
                serviceItem.innerHTML = `
                    <div class="service-details">
                        <span class="service-description">${slab.description}</span>
                        <span class="service-amount">$${slab.price.toFixed(2)}</span>
                    </div>
                `;
                servicesList.appendChild(serviceItem);
                
                if (isEstimateContext()) {
                    console.log('[EST-BRIDGE:ADDED]', `${slab.description} - $${slab.price}`);
                }
            }
        }
        
        // Add hidden input for FormData
        const hiddenServices = document.getElementById('services-hidden');
        if (hiddenServices) {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'service[]';
            hiddenInput.value = JSON.stringify(service);
            hiddenServices.appendChild(hiddenInput);
        }
        
        console.log('✅ Slab bridged to services:', service);
        
        // Clear calculator for next slab
        clearCalculatorForm();
        
        console.log('✅ Slab added:', slab);
    }

    /**
     * Generate slab description in required format
     */
    function getSlabDescription(length, width, liftHeight, location) {
        // Format description with location type  
        const locationText = location || 'mid';
        return `${length}'×${width}'×${liftHeight}" (${locationText})`;
    }

    /**
     * Update the slab list display
     */
    function updateSlabList() {
        let container = document.getElementById('slab-list-container');
        
        // Create container if it doesn't exist
        if (!container) {
            container = document.createElement('div');
            container.id = 'slab-list-container';
            container.className = 'slab-list-container';
            
            // Insert after calculator results
            const calcResults = document.getElementById('calc-results');
            if (calcResults) {
                calcResults.parentNode.insertBefore(container, calcResults.nextSibling);
            }
        }
        
        if (slabs.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }
        
        let html = `
            <div class="slab-list-header">
                <h5><i class="fas fa-list"></i> Added Slabs</h5>
            </div>
            <div class="slab-list">
        `;
        
        slabs.forEach(slab => {
            html += `
                <div class="slab-list-item" data-slab-id="${slab.id}">
                    <span class="slab-info">
                        <strong>Slab ${slab.number}:</strong> ${slab.description} - $${slab.price.toFixed(2)}
                    </span>
                    <button type="button" class="btn btn-sm btn-outline slab-remove-btn" onclick="SlabManager.removeSlab('${slab.id}')">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        container.style.display = 'block';
    }

    /**
     * Remove a slab from the list
     */
    function removeSlab(slabId) {
        const index = slabs.findIndex(s => s.id === slabId);
        if (index !== -1) {
            slabs.splice(index, 1);
            updateSlabList();
            updateTotals();
            updateAddServiceButtonState();
            console.log('🗑️ Slab removed:', slabId);
        }
    }

    /**
     * Update subtotal display
     */
    function updateTotals() {
        let totalDisplay = document.getElementById('slab-totals-display');
        
        // Create totals display if it doesn't exist
        if (!totalDisplay) {
            totalDisplay = document.createElement('div');
            totalDisplay.id = 'slab-totals-display';
            totalDisplay.className = 'slab-totals-display';
            
            const container = document.getElementById('slab-list-container');
            if (container) {
                container.appendChild(totalDisplay);
            }
        }
        
        const total = slabs.reduce((sum, slab) => sum + slab.price, 0);
        
        if (total > 0) {
            totalDisplay.innerHTML = `
                <div class="total-row">
                    <span class="total-label">Subtotal from all slabs:</span>
                    <span class="total-value" id="slab-total-value">$${total.toFixed(2)}</span>
                </div>
            `;
            totalDisplay.style.display = 'block';
        } else {
            totalDisplay.style.display = 'none';
        }
    }

    /**
     * Update add service button state
     */
    function updateAddServiceButtonState() {
        const addServiceBtn = document.getElementById('add-concrete-service');
        const serviceDesc = document.getElementById('concrete-service-description');
        
        if (addServiceBtn) {
            const hasSlabs = slabs.length > 0;
            const hasDescription = serviceDesc?.value?.trim();
            addServiceBtn.disabled = !hasSlabs || !hasDescription;
            
            if (hasSlabs && hasDescription) {
                addServiceBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Concrete Service';
                addServiceBtn.className = 'btn btn-primary';
            } else {
                addServiceBtn.innerHTML = '<i class="fas fa-plus"></i> Add Concrete Service';
                addServiceBtn.className = 'btn btn-primary';
            }
        }
    }

    // Note: Service addition is now handled by InvoiceManager.addConcreteServiceFromForm()
    // which calls SlabManager.getSlabsData() to get the slab information

    /**
     * Clear calculator form for next entry
     */
    function clearCalculatorForm() {
        // Clear dimension inputs
        const lengthInput = document.getElementById('calc-length');
        const widthInput = document.getElementById('calc-width');
        const depthInput = document.getElementById('calc-depth');
        const sidesSelect = document.getElementById('calc-sides');
        
        if (lengthInput) lengthInput.value = '';
        if (widthInput) widthInput.value = '';
        if (depthInput) depthInput.value = '';
        if (sidesSelect) sidesSelect.value = '1';
        
        // Hide calculator results
        const calcResults = document.getElementById('calc-results');
        if (calcResults) {
            calcResults.style.display = 'none';
        }
        
        // Clear custom price
        const customPrice = document.getElementById('custom-price');
        if (customPrice) customPrice.value = '';
        
        console.log('🧹 Calculator form cleared');
    }

    /**
     * Clear all slabs (for form reset)
     */
    function clearAll() {
        slabs = [];
        slabCounter = 0;
        updateSlabList();
        updateTotals();
        updateAddServiceButtonState();
        clearCalculatorForm();
        console.log('🧹 All slabs cleared');
    }

    /**
     * Get slabs data for export
     */
    function getSlabsData() {
        return slabs.map(slab => ({
            id: slab.id,
            number: slab.number,
            length: slab.length,
            width: slab.width,
            liftHeight: slab.liftHeight,
            sides: slab.sides,
            price: slab.price,
            description: slab.description,
            squareFootage: slab.length * slab.width
        }));
    }
    
    /**
     * Remove invoice service - SAFE-HOTFIX
     */
    function removeInvoiceService(serviceId) {
        console.log('[INV-REMOVE:CLICK]', { serviceId });
        
        // Find and remove the service row
        const row = document.querySelector(`.service-row[data-service-id="${serviceId}"]`);
        if (row) {
            row.remove();
            console.log('[INV-REMOVE:DOM]', { serviceId });
        }
        
        // Update InvoiceManager if available
        if (window.InvoiceManager && window.InvoiceManager.currentInvoice) {
            const services = window.InvoiceManager.currentInvoice.services || [];
            const index = services.findIndex(s => s.id === serviceId);
            if (index !== -1) {
                services.splice(index, 1);
                console.log('[INV-REMOVE:SERVICE]', { 
                    serviceId, 
                    remaining: services.length 
                });
                
                // Update totals
                if (window.InvoiceManager.updateInvoiceTotals) {
                    window.InvoiceManager.updateInvoiceTotals();
                    console.log('[INV-REMOVE:TOTALS_UPDATED]');
                }
            }
        }
        
        // Check if list is empty and add placeholder
        const servicesList = document.getElementById('services-list');
        if (servicesList && servicesList.children.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-services';
            emptyRow.innerHTML = `
                <td colspan="6" class="text-center text-muted">
                    No services added yet. Use the calculator above to add concrete services.
                </td>
            `;
            servicesList.appendChild(emptyRow);
            console.log('[INV-REMOVE:EMPTY_PLACEHOLDER]');
        }
    }

    // Public API
    return {
        init: init,
        setupDelegatedListener: setupDelegatedListener,
        addSlab: addSlabFromCalculator, // Alias for backward compatibility
        addSlabFromCalculator: addSlabFromCalculator,
        removeSlab: removeSlab,
        removeInvoiceService: removeInvoiceService, // Add invoice remove function
        clearAll: clearAll,
        getSlabsData: getSlabsData,
        updateAddServiceButtonState: updateAddServiceButtonState
    };

})();

// Initialize when script loads
window.SlabManager.init();

console.log('✅ Simplified Slab Manager Module Loaded');