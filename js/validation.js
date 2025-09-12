/**
 * Validation module for J. Stark Invoicing System
 * Provides input validation and sanitization functions
 */

const Validation = {
    // Email validation
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Phone validation (US format)
    validatePhone(phone) {
        const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
        return phoneRegex.test(phone);
    },

    // Zip code validation
    validateZipCode(zip) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        return zipRegex.test(zip);
    },

    // Positive number validation
    validatePositiveNumber(value) {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0;
    },

    // Required field validation
    validateRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    },

    // String length validation
    validateLength(value, minLength, maxLength) {
        const length = value ? value.toString().length : 0;
        return length >= minLength && length <= maxLength;
    },

    // Date validation
    validateDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && date <= new Date();
    },

    // Currency validation
    validateCurrency(value) {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return false;
        
        // Check for max 2 decimal places
        const decimalPart = value.toString().split('.')[1];
        return !decimalPart || decimalPart.length <= 2;
    },

    // Service type validation
    validateServiceType(type, businessType) {
        const validTypes = {
            concrete: ['driveway', 'sidewalk', 'patio', 'garage', 'pool-deck', 'steps'],
            masonry: ['repair', 'installation', 'restoration', 'cleaning']
        };
        
        return validTypes[businessType] && validTypes[businessType].includes(type);
    },

    // Sanitize input to prevent XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    // Check for malicious patterns
    containsMaliciousPatterns(input) {
        const patterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:text\/html/gi,
            /vbscript:/gi,
            /'.*(?:union|select|insert|delete|drop|update|exec)/gi
        ];
        
        return patterns.some(pattern => pattern.test(input));
    },

    // Validate complete form
    validateForm(formData, rules) {
        const errors = {};
        
        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = rules[field];
            
            // Required validation
            if (fieldRules.required && !this.validateRequired(value)) {
                errors[field] = `${fieldRules.label || field} is required`;
                return;
            }
            
            // Skip other validations if field is empty and not required
            if (!value && !fieldRules.required) return;
            
            // Email validation
            if (fieldRules.type === 'email' && !this.validateEmail(value)) {
                errors[field] = 'Please enter a valid email address';
            }
            
            // Phone validation
            if (fieldRules.type === 'phone' && !this.validatePhone(value)) {
                errors[field] = 'Please enter a valid phone number';
            }
            
            // Number validation
            if (fieldRules.type === 'number') {
                if (!this.validatePositiveNumber(value)) {
                    errors[field] = `${fieldRules.label || field} must be a positive number`;
                } else if (fieldRules.min !== undefined && parseFloat(value) < fieldRules.min) {
                    errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.min}`;
                } else if (fieldRules.max !== undefined && parseFloat(value) > fieldRules.max) {
                    errors[field] = `${fieldRules.label || field} must be at most ${fieldRules.max}`;
                }
            }
            
            // Currency validation
            if (fieldRules.type === 'currency' && !this.validateCurrency(value)) {
                errors[field] = 'Please enter a valid amount';
            }
            
            // Length validation
            if (fieldRules.minLength || fieldRules.maxLength) {
                const minLen = fieldRules.minLength || 0;
                const maxLen = fieldRules.maxLength || Infinity;
                
                if (!this.validateLength(value, minLen, maxLen)) {
                    if (value.length < minLen) {
                        errors[field] = `${fieldRules.label || field} must be at least ${minLen} characters`;
                    } else {
                        errors[field] = `${fieldRules.label || field} must be at most ${maxLen} characters`;
                    }
                }
            }
            
            // Custom validation
            if (fieldRules.custom && typeof fieldRules.custom === 'function') {
                const customError = fieldRules.custom(value, formData);
                if (customError) {
                    errors[field] = customError;
                }
            }
        });
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    // Format phone number
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length !== 10) return phone;
        
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    },

    // Format currency
    formatCurrency(amount) {
        const num = parseFloat(amount);
        if (isNaN(num)) return '$0.00';
        
        return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Display validation errors
    displayErrors(errors, formElement) {
        // Clear existing errors
        formElement.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        formElement.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });
        
        // Display new errors
        Object.keys(errors).forEach(field => {
            const input = formElement.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('error');
                
                const errorElement = formElement.querySelector(`#${field}-error`) ||
                                   input.parentElement.querySelector('.error-message');
                
                if (errorElement) {
                    errorElement.textContent = errors[field];
                    errorElement.style.display = 'block';
                }
            }
        });
    },

    // Clear validation errors
    clearErrors(formElement) {
        formElement.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        formElement.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validation;
} else {
    window.Validation = Validation;
}