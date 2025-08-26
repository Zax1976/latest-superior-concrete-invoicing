/**
 * === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (BEGIN)
 * Patch to add estimate methods to StorageManager if they're missing
 * This file should load after storage.js
 */

(function() {
    'use strict';
    
    console.log('Storage Estimates Patch loading...');
    
    // Wait for StorageManager to be available
    function patchStorageManager() {
        if (!window.StorageManager) {
            console.warn('StorageManager not found, creating minimal version');
            window.StorageManager = {
                keys: {
                    estimates: 'jstark_estimates',
                    nextEstimateNumber: 'jstark_next_estimate_number'
                }
            };
        }
        
        // Add estimate methods if they don't exist
        if (typeof window.StorageManager.getEstimates !== 'function') {
            console.log('Adding getEstimates method to StorageManager');
            window.StorageManager.getEstimates = function() {
                try {
                    const data = localStorage.getItem(this.keys.estimates || 'jstark_estimates');
                    return data ? JSON.parse(data) : [];
                } catch (error) {
                    console.error('Load estimates error:', error);
                    return [];
                }
            };
        }
        
        if (typeof window.StorageManager.saveEstimates !== 'function') {
            console.log('Adding saveEstimates method to StorageManager');
            window.StorageManager.saveEstimates = function(estimates) {
                try {
                    localStorage.setItem(this.keys.estimates || 'jstark_estimates', JSON.stringify(estimates));
                    return true;
                } catch (error) {
                    console.error('Save estimates error:', error);
                    return false;
                }
            };
        }
        
        if (typeof window.StorageManager.getEstimate !== 'function') {
            console.log('Adding getEstimate method to StorageManager');
            window.StorageManager.getEstimate = function(estimateId) {
                try {
                    const estimates = this.getEstimates();
                    return estimates.find(est => est.id === estimateId);
                } catch (error) {
                    console.error('Get estimate error:', error);
                    return null;
                }
            };
        }
        
        if (typeof window.StorageManager.getNextEstimateNumber !== 'function') {
            console.log('Adding getNextEstimateNumber method to StorageManager');
            window.StorageManager.getNextEstimateNumber = function() {
                try {
                    const num = localStorage.getItem(this.keys.nextEstimateNumber || 'jstark_next_estimate_number');
                    return num ? parseInt(num) : 1;
                } catch (error) {
                    console.error('Get next estimate number error:', error);
                    return 1;
                }
            };
        }
        
        if (typeof window.StorageManager.saveNextEstimateNumber !== 'function') {
            console.log('Adding saveNextEstimateNumber method to StorageManager');
            window.StorageManager.saveNextEstimateNumber = function(number) {
                try {
                    localStorage.setItem(this.keys.nextEstimateNumber || 'jstark_next_estimate_number', String(number));
                    return true;
                } catch (error) {
                    console.error('Save next estimate number error:', error);
                    return false;
                }
            };
        }
        
        console.log('✅ Storage Estimates Patch applied successfully');
    }
    
    // Apply patch immediately
    patchStorageManager();
    
    // Also apply on DOMContentLoaded to be sure
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', patchStorageManager);
    }
    
})();

// === SAFE-HOTFIX: ESTIMATE SAVE→LIST→PREVIEW→PDF (END)