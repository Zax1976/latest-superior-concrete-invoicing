/**
 * J. Stark Business Invoicing System - Security Utilities
 * Handles XSS protection, input sanitization, and security validation
 */

(function() {
    'use strict';
    
    const SecurityUtils = {
        // XSS Protection
        sanitizeHTML: function(str) {
            if (!str || typeof str !== 'string') return '';
            
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        
        sanitizeInput: function(input) {
            if (!input || typeof input !== 'string') return '';
            
            return input
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;')
                .replace(/&/g, '&amp;');
        },
        
        sanitizeForAttribute: function(str) {
            if (!str || typeof str !== 'string') return '';
            
            return str
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        },
        
        sanitizeCSS: function(css) {
            if (!css || typeof css !== 'string') return '';
            
            // Remove potentially dangerous CSS
            return css
                .replace(/javascript:/gi, '')
                .replace(/expression\s*\(/gi, '')
                .replace(/@import/gi, '')
                .replace(/behavior\s*:/gi, '')
                .replace(/binding\s*:/gi, '');
        },
        
        // Input Validation
        validateEmail: function(email) {
            if (!email || typeof email !== 'string') return false;
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email) && email.length <= 254;
        },
        
        validatePhone: function(phone) {
            if (!phone || typeof phone !== 'string') return false;
            
            // Remove all non-digits for validation
            const cleanPhone = phone.replace(/\D/g, '');
            return cleanPhone.length >= 10 && cleanPhone.length <= 15;
        },
        
        validateInvoiceNumber: function(number) {
            if (!number) return false;
            
            // Allow alphanumeric with some special characters
            const validPattern = /^[a-zA-Z0-9\-_#]+$/;
            return validPattern.test(number) && number.length <= 50;
        },
        
        validateCurrency: function(amount) {
            if (typeof amount === 'number') {
                return !isNaN(amount) && isFinite(amount) && amount >= 0;
            }
            
            if (typeof amount === 'string') {
                const numAmount = parseFloat(amount.replace(/[,$]/g, ''));
                return !isNaN(numAmount) && isFinite(numAmount) && numAmount >= 0;
            }
            
            return false;
        },
        
        validateQuantity: function(quantity) {
            if (typeof quantity === 'number') {
                return !isNaN(quantity) && isFinite(quantity) && quantity > 0;
            }
            
            if (typeof quantity === 'string') {
                const numQuantity = parseFloat(quantity);
                return !isNaN(numQuantity) && isFinite(numQuantity) && numQuantity > 0;
            }
            
            return false;
        },
        
        // Safe DOM manipulation
        safeCreateElement: function(tagName, attributes = {}, textContent = '') {
            const element = document.createElement(tagName);
            
            // Sanitize text content
            if (textContent) {
                element.textContent = textContent;
            }
            
            // Set attributes safely
            for (const [key, value] of Object.entries(attributes)) {
                if (this.isValidAttribute(key)) {
                    element.setAttribute(key, this.sanitizeForAttribute(value));
                }
            }
            
            return element;
        },
        
        isValidAttribute: function(attributeName) {
            // Whitelist of allowed attributes
            const allowedAttributes = [
                'id', 'class', 'title', 'alt', 'src', 'href', 'type', 'value',
                'placeholder', 'name', 'data-*', 'aria-*', 'role', 'tabindex',
                'disabled', 'readonly', 'required', 'min', 'max', 'step'
            ];
            
            return allowedAttributes.some(allowed => {
                if (allowed.endsWith('*')) {
                    return attributeName.startsWith(allowed.slice(0, -1));
                }
                return attributeName === allowed;
            });
        },
        
        safeInnerHTML: function(element, htmlContent) {
            // Use a more secure method to set innerHTML
            const tempDiv = document.createElement('div');
            tempDiv.textContent = htmlContent;
            element.innerHTML = tempDiv.innerHTML;
        },
        
        // Data sanitization for storage
        sanitizeInvoiceData: function(invoice) {
            if (!invoice || typeof invoice !== 'object') return null;
            
            const sanitized = {};
            
            // Sanitize string fields
            const stringFields = [
                'customerName', 'customerEmail', 'customerPhone', 'customerAddress',
                'businessType', 'notes', 'status', 'number'
            ];
            
            stringFields.forEach(field => {
                if (invoice[field]) {
                    sanitized[field] = this.sanitizeInput(invoice[field]);
                }
            });
            
            // Validate and sanitize numeric fields
            const numericFields = ['subtotal', 'tax', 'total'];
            numericFields.forEach(field => {
                if (invoice[field] !== undefined) {
                    const num = parseFloat(invoice[field]);
                    sanitized[field] = isNaN(num) ? 0 : Math.max(0, num);
                }
            });
            
            // Sanitize date
            if (invoice.date) {
                const date = new Date(invoice.date);
                sanitized.date = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
            }
            
            // Sanitize services array
            if (Array.isArray(invoice.services)) {
                sanitized.services = invoice.services.map(service => this.sanitizeServiceData(service));
            }
            
            // Copy other safe fields
            const safeFields = ['id', 'createdAt', 'updatedAt'];
            safeFields.forEach(field => {
                if (invoice[field]) {
                    sanitized[field] = invoice[field];
                }
            });
            
            return sanitized;
        },
        
        sanitizeServiceData: function(service) {
            if (!service || typeof service !== 'object') return null;
            
            const sanitized = {
                description: this.sanitizeInput(service.description || ''),
                unit: this.sanitizeInput(service.unit || 'each'),
                quantity: this.validateQuantity(service.quantity) ? parseFloat(service.quantity) : 1,
                rate: this.validateCurrency(service.rate) ? parseFloat(service.rate) : 0
            };
            
            // Calculate amount
            sanitized.amount = sanitized.quantity * sanitized.rate;
            
            return sanitized;
        },
        
        sanitizeCustomerData: function(customer) {
            if (!customer || typeof customer !== 'object') return null;
            
            return {
                name: this.sanitizeInput(customer.name || ''),
                email: this.validateEmail(customer.email) ? customer.email : '',
                phone: this.sanitizeInput(customer.phone || ''),
                address: this.sanitizeInput(customer.address || ''),
                lastInvoiceDate: customer.lastInvoiceDate || new Date().toISOString(),
                totalInvoices: Math.max(0, parseInt(customer.totalInvoices) || 0),
                totalAmount: Math.max(0, parseFloat(customer.totalAmount) || 0),
                firstInvoiceDate: customer.firstInvoiceDate || new Date().toISOString()
            };
        },
        
        // Content Security Policy helpers
        generateNonce: function() {
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        },
        
        // Safe URL validation
        isValidURL: function(url) {
            if (!url || typeof url !== 'string') return false;
            
            try {
                const urlObj = new URL(url);
                return ['http:', 'https:', 'mailto:'].includes(urlObj.protocol);
            } catch (error) {
                return false;
            }
        },
        
        // File upload security
        validateFileName: function(fileName) {
            if (!fileName || typeof fileName !== 'string') return false;
            
            // Check for dangerous file extensions
            const dangerousExtensions = [
                '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
                '.js', '.jar', '.vbs', '.sh', '.php', '.asp'
            ];
            
            const lowerFileName = fileName.toLowerCase();
            return !dangerousExtensions.some(ext => lowerFileName.endsWith(ext));
        },
        
        validateFileSize: function(size, maxSize = 5 * 1024 * 1024) { // 5MB default
            return typeof size === 'number' && size > 0 && size <= maxSize;
        },
        
        // Rate limiting helpers
        createRateLimiter: function(maxAttempts = 5, windowMs = 60000) {
            const attempts = new Map();
            
            return function(identifier) {
                const now = Date.now();
                const windowStart = now - windowMs;
                
                // Clean old attempts
                for (const [key, timestamps] of attempts.entries()) {
                    attempts.set(key, timestamps.filter(time => time > windowStart));
                    if (attempts.get(key).length === 0) {
                        attempts.delete(key);
                    }
                }
                
                // Check current attempts
                const userAttempts = attempts.get(identifier) || [];
                if (userAttempts.length >= maxAttempts) {
                    return false; // Rate limited
                }
                
                // Record this attempt
                userAttempts.push(now);
                attempts.set(identifier, userAttempts);
                
                return true; // Allow
            };
        },
        
        // Security event logging
        logSecurityEvent: function(event, details = {}) {
            const securityLog = {
                timestamp: new Date().toISOString(),
                event: event,
                details: details,
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            console.warn('Security Event:', securityLog);
            
            // Store in localStorage for review (limit to 50 events)
            try {
                const existingLogs = JSON.parse(localStorage.getItem('jstark_security_logs') || '[]');
                existingLogs.unshift(securityLog);
                if (existingLogs.length > 50) {
                    existingLogs.splice(50);
                }
                localStorage.setItem('jstark_security_logs', JSON.stringify(existingLogs));
            } catch (error) {
                console.error('Failed to store security log:', error);
            }
        },
        
        // Secure random ID generation
        generateSecureId: function(length = 16) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            
            return Array.from(array, byte => chars[byte % chars.length]).join('');
        }
    };
    
    // Initialize security logging
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            SecurityUtils.logSecurityEvent('app_loaded');
        });
    } else {
        SecurityUtils.logSecurityEvent('app_loaded');
    }
    
    // Export for global access
    window.SecurityUtils = SecurityUtils;
    
})();