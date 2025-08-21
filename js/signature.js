/**
 * Clean Signature Capture Module
 * Handles digital signature canvas without patches or fixes
 */

window.Signature = (function() {
    'use strict';
    
    let canvas = null;
    let ctx = null;
    let isDrawing = false;
    let hasSignature = false;

    function init(canvasId) {
        try {
            canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error('Signature canvas not found:', canvasId);
                return false;
            }

            // Validate canvas element
            if (canvas.tagName.toLowerCase() !== 'canvas') {
                console.error('Element is not a canvas:', canvasId);
                return false;
            }

            ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('Failed to get canvas 2d context');
                return false;
            }

            setupCanvas();
            bindEvents();
            
            console.log('✅ Signature system initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Signature initialization error:', error);
            return false;
        }
    }

    function setupCanvas() {
        // Set canvas size
        canvas.width = 600;
        canvas.height = 200;
        
        // Configure drawing context
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Canvas styles
        canvas.style.border = '1px solid #ccc';
        canvas.style.backgroundColor = 'white';
        canvas.style.cursor = 'crosshair';
        canvas.style.touchAction = 'none';
    }

    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        if (e.touches && e.touches[0]) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        e.preventDefault();
        isDrawing = true;
        
        const coords = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        
        const coords = getCoords(e);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        
        hasSignature = true;
    }

    function stopDrawing(e) {
        if (!isDrawing) return;
        e.preventDefault();
        isDrawing = false;
    }

    function bindEvents() {
        // Mouse events
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        
        // Touch events
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing, { passive: false });
        canvas.addEventListener('touchcancel', stopDrawing, { passive: false });
    }

    function clear() {
        if (!ctx || !canvas) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        hasSignature = false;
    }

    function toDataURL() {
        try {
            if (!hasSignature || !canvas || !ctx) {
                console.warn('No signature to export or canvas not initialized');
                return null;
            }
            
            // Validate that there's actually content
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasContent = imageData.data.some((pixel, index) => {
                // Check if any pixel is not white (RGB: 255,255,255) or transparent (A: 0)
                // Skip alpha channel for RGB comparison
                if ((index + 1) % 4 === 0) return false; // Skip alpha channel
                return pixel < 255; // Any non-white pixel indicates content
            });
            
            if (!hasContent) {
                console.warn('Canvas appears to be empty despite hasSignature flag');
                return null;
            }
            
            const dataURL = canvas.toDataURL('image/png');
            console.log('Signature exported successfully');
            return dataURL;
            
        } catch (error) {
            console.error('Error exporting signature:', error);
            return null;
        }
    }

    function isEmpty() {
        if (!canvas || !ctx) {
            return true; // Consider empty if not initialized
        }
        
        // Double-check by examining canvas content
        try {
            if (!hasSignature) return true;
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasContent = imageData.data.some((pixel, index) => {
                // Check if any pixel is not white (RGB: 255,255,255)
                if ((index + 1) % 4 === 0) return false; // Skip alpha channel
                return pixel < 255; // Any non-white pixel indicates content
            });
            
            return !hasContent;
            
        } catch (error) {
            console.error('Error checking signature content:', error);
            return true; // Consider empty on error for safety
        }
    }

    function isInitialized() {
        return canvas !== null && ctx !== null;
    }

    function getCanvasInfo() {
        if (!canvas) return null;
        
        return {
            width: canvas.width,
            height: canvas.height,
            hasSignature: hasSignature,
            isEmpty: isEmpty(),
            isInitialized: isInitialized()
        };
    }

    // Public API
    return {
        init,
        clear,
        toDataURL,
        isEmpty,
        isInitialized,
        getCanvasInfo
    };
})();