/**
 * @typedef {Object} EstimateParams
 * @property {number} L_ft - Length in feet
 * @property {number} W_ft - Width in feet
 * @property {number} depth_in - Depth in inches
 * @property {1|2|3} sides - Number of sides (1=one side, 2=two sides/corner, 3=entire slab)
 * @property {'RR201'|'RR401'} foam - Foam type
 * @property {boolean} voidFill - Whether this is void fill
 * @property {number} priceLow - Low price per pound
 * @property {number} priceHigh - High price per pound
 * @property {Object} [wedge] - Wedge multipliers
 * @property {number} [wedge.k1=0.5] - One side multiplier
 * @property {number} [wedge.k2=0.25] - Two sides multiplier
 * @property {number} [wedge.k3=1.0] - Entire slab multiplier
 * @property {Object} [factors] - Foam factors
 * @property {Object} [factors.RR201]
 * @property {number} [factors.RR201.lift=100] - RR201 lift factor
 * @property {number} [factors.RR201.void=70] - RR201 void factor
 * @property {Object} [factors.RR401]
 * @property {number} [factors.RR401.lift=120] - RR401 lift factor
 * @property {number} [factors.RR401.void=110] - RR401 void factor
 */

/**
 * @typedef {Object} EstimateResult
 * @property {number} ft3 - Volume in cubic feet
 * @property {number} yd3 - Volume in cubic yards
 * @property {number} pounds - Total pounds
 * @property {number} priceLowTotal - Low price total
 * @property {number} priceMidTotal - Mid price total
 * @property {number} priceHighTotal - High price total
 */

/**
 * Estimate polyurethane foam requirements using ER method
 * @param {EstimateParams} params
 * @returns {EstimateResult}
 */
export function estimatePoly(params) {
    // Destructure with defaults
    const {
        L_ft,
        W_ft,
        depth_in,
        sides,
        foam,
        voidFill = false,
        priceLow,
        priceHigh,
        wedge = { k1: 0.5, k2: 0.25, k3: 1.0 },
        factors = {
            RR201: { lift: 100, void: 70 },
            RR401: { lift: 120, void: 110 }
        }
    } = params;

    // Validation
    if (L_ft < 0 || W_ft < 0 || depth_in < 0) {
        throw new Error('Dimensions must be non-negative');
    }
    if (![1, 2, 3].includes(sides)) {
        throw new Error('Sides must be 1, 2, or 3');
    }
    if (!['RR201', 'RR401'].includes(foam)) {
        throw new Error('Foam must be RR201 or RR401');
    }
    if (priceLow < 0 || priceHigh < 0) {
        throw new Error('Prices must be non-negative');
    }
    if (priceLow > priceHigh) {
        throw new Error('Low price cannot exceed high price');
    }

    // Get wedge multiplier based on sides
    const k_sides = sides === 1 ? wedge.k1 : sides === 2 ? wedge.k2 : wedge.k3;

    // Calculate volumes
    const volume_ft3 = L_ft * W_ft * (depth_in / 12) * k_sides;
    const volume_yd3 = volume_ft3 / 27;

    // Get foam factor
    const foamFactors = factors[foam];
    const foamFactor = voidFill ? foamFactors.void : foamFactors.lift;

    // Calculate pounds
    const pounds = volume_yd3 * foamFactor;

    // Calculate prices
    const priceLowTotal = pounds * priceLow;
    const priceHighTotal = pounds * priceHigh;
    const priceMidTotal = (priceLowTotal + priceHighTotal) / 2;

    // Round to 2 decimals for display
    return {
        ft3: Math.round(volume_ft3 * 10000) / 10000,
        yd3: Math.round(volume_yd3 * 10000) / 10000,
        pounds: Math.round(pounds * 10000) / 10000,
        priceLowTotal: Math.round(priceLowTotal * 100) / 100,
        priceMidTotal: Math.round(priceMidTotal * 100) / 100,
        priceHighTotal: Math.round(priceHighTotal * 100) / 100
    };
}

/**
 * Load Pro settings from localStorage
 * @returns {Object} Settings object
 */
export function loadProSettings() {
    const defaultSettings = {
        visible: false,
        wedge: { k1: 0.5, k2: 0.25, k3: 1.0 },
        factors: {
            RR201: { lift: 100, void: 70 },
            RR401: { lift: 120, void: 110 }
        }
    };

    try {
        // Load visibility
        const visible = localStorage.getItem('er_poly_pro_visible_v1') === '1';
        
        // Load settings
        const settingsStr = localStorage.getItem('er_poly_settings_v1');
        if (settingsStr) {
            const settings = JSON.parse(settingsStr);
            return { ...defaultSettings, ...settings, visible };
        }
        
        return { ...defaultSettings, visible };
    } catch (e) {
        console.error('Error loading Pro settings:', e);
        return defaultSettings;
    }
}

/**
 * Save Pro settings to localStorage
 * @param {Object} settings - Settings to save
 */
export function saveProSettings(settings) {
    try {
        // Save visibility separately
        localStorage.setItem('er_poly_pro_visible_v1', settings.visible ? '1' : '0');
        
        // Save other settings
        const { visible, ...otherSettings } = settings;
        localStorage.setItem('er_poly_settings_v1', JSON.stringify(otherSettings));
    } catch (e) {
        console.error('Error saving Pro settings:', e);
    }
}

/**
 * Reset Pro settings to defaults
 * @returns {Object} Default settings
 */
export function resetProSettings() {
    const defaults = {
        visible: false,
        wedge: { k1: 0.5, k2: 0.25, k3: 1.0 },
        factors: {
            RR201: { lift: 100, void: 70 },
            RR401: { lift: 120, void: 110 }
        }
    };
    
    saveProSettings(defaults);
    return defaults;
}

// Export to window for non-module scripts
if (typeof window !== 'undefined') {
    window.estimatePoly = estimatePoly;
    window.loadProSettings = loadProSettings;
    window.saveProSettings = saveProSettings;
    window.resetProSettings = resetProSettings;
}