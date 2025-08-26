/**
 * J. Stark Business Invoicing System - Input Validation
 * Comprehensive input validation with XSS prevention and user feedback
 */

(function() {
    'use strict';
    
    // Validation rules configuration
    const VALIDATION_RULES = {
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        phone: {
            pattern: /^[\d\s\-\(\)\+\.]{10,}$/,
            message: 'Please enter a valid phone number (at least 10 digits)'
        },
        currency: {
            pattern: /^\d+(\.\d{1,2})?$/,
            message: 'Please enter a valid amount (e.g., 123.45)'
        },
        positiveNumber: {
            pattern: /^\d*\.?\d+$/,
            message: 'Please enter a positive number'
        },
        name: {
            pattern: /^[a-zA-Z\s\.\-']{2,}$/,
            message: 'Please enter a valid name (at least 2 characters, letters only)'
        },
        invoiceNumber: {
            pattern: /^[a-zA-Z0-9\-_#]{1,20}$/,
            message: 'Invoice number can contain letters, numbers, hyphens, and underscores (max 20 characters)'
        }
    };
    
    // XSS prevention patterns
    const XSS_PATTERNS = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<[^>]*\s(on\w+|href|src)\s*=\s*["\']?javascript:/gi,
        /<[^>]*\s(on\w+)\s*=\s*["\']?[^"\']*["\']?/gi
    ];
    
    const InputValidator = {
        isInitialized: false,
        validationErrors: new Map(),
        
        init: function() {
            try {
                this.setupValidationStyles();
                this.attachValidationEvents();
                this.isInitialized = true;
                console.log('Input Validator initialized successfully');
                
                if (window.ErrorLogger) {
                    window.ErrorLogger.logInfo('Input validation system initialized', window.ERROR_CATEGORIES.VALIDATION);
                }
                
            } catch (error) {
                console.error('Failed to initialize Input Validator:', error);
                if (window.ErrorLogger) {
                    window.ErrorLogger.logError('Input validator initialization failed', window.ERROR_CATEGORIES.VALIDATION, {
                        error: error.message,
                        stack: error.stack
                    });
                }
            }
        },
        
        setupValidationStyles: function() {
            if (document.getElementById('input-validation-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'input-validation-styles';
            styles.textContent = `
                /* Input validation styles */
                .form-group {
                    position: relative;
                }
                
                .input-error {
                    border: 2px solid #dc3545 !important;
                    background-color: #fff5f5 !important;
                    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
                }
                
                .input-success {
                    border: 2px solid #28a745 !important;
                    background-color: #f8fff8 !important;
                    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25) !important;
                }
                
                .input-warning {
                    border: 2px solid #ffc107 !important;
                    background-color: #fffdf5 !important;
                    box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25) !important;
                }
                
                .validation-message {
                    position: absolute;
                    bottom: -1.5rem;
                    left: 0;
                    font-size: 0.875rem;
                    font-weight: 500;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    pointer-events: none;
                }
                
                .validation-message.error {
                    color: #dc3545;
                }
                
                .validation-message.success {
                    color: #28a745;
                }
                
                .validation-message.warning {
                    color: #856404;
                }
                
                .validation-tooltip {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    background: #212529;
                    color: white;
                    padding: 0.5rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    white-space: nowrap;
                    z-index: 1000;
                    margin-top: 0.25rem;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.2s, visibility 0.2s;
                }
                
                .validation-tooltip:before {
                    content: '';
                    position: absolute;
                    top: -4px;
                    left: 1rem;
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-bottom: 4px solid #212529;
                }
                
                .form-group:hover .validation-tooltip {
                    opacity: 1;
                    visibility: visible;
                }
                
                .real-time-validation {
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                
                .validation-strength-meter {
                    width: 100%;
                    height: 4px;
                    background: #e9ecef;
                    border-radius: 2px;
                    overflow: hidden;
                    margin-top: 0.25rem;
                }
                
                .validation-strength-fill {
                    height: 100%;
                    transition: width 0.3s ease, background-color 0.3s ease;
                    border-radius: 2px;
                }
                
                .strength-weak { background-color: #dc3545; }
                .strength-fair { background-color: #ffc107; }
                .strength-good { background-color: #17a2b8; }
                .strength-strong { background-color: #28a745; }
                
                .input-counter {
                    position: absolute;
                    bottom: -1.25rem;
                    right: 0;
                    font-size: 0.75rem;
                    color: #6c757d;
                }
                
                .input-counter.warning {
                    color: #856404;
                }
                
                .input-counter.error {
                    color: #dc3545;
                }
                
                .form-group.has-validation {
                    margin-bottom: 2rem;
                }
                
                .validation-summary {
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    border-radius: 4px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    color: #721c24;
                }
                
                .validation-summary h4 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1rem;
                }
                
                .validation-summary ul {
                    margin: 0;
                    padding-left: 1.5rem;
                }
                
                .validation-summary li {
                    margin-bottom: 0.25rem;
                }
            `;
            document.head.appendChild(styles);
        },
        
        attachValidationEvents: function() {
            // Attach validation to all form inputs
            document.addEventListener('input', (e) => {
                if (this.isValidatableInput(e.target)) {
                    this.validateInput(e.target);
                }
            });
            
            document.addEventListener('blur', (e) => {
                if (this.isValidatableInput(e.target)) {
                    this.validateInput(e.target, true);
                }
            });
            
            // Form submission validation
            document.addEventListener('submit', (e) => {
                if (e.target.tagName === 'FORM') {
                    this.validateForm(e.target, e);
                }
            });
        },
        
        isValidatableInput: function(element) {
            return element && (
                element.tagName === 'INPUT' || 
                element.tagName === 'TEXTAREA' || 
                element.tagName === 'SELECT'
            ) && !element.disabled && element.type !== 'hidden';
        },
        
        validateInput: function(input, showAllErrors = false) {
            if (!input || !this.isValidatableInput(input)) return true;
            
            try {
                const value = input.value.trim();
                const inputType = this.getInputValidationType(input);
                const isRequired = input.hasAttribute('required');
                const errors = [];
                const warnings = [];
                
                // Clear previous validation state
                this.clearValidationState(input);
                
                // Check for required field
                if (isRequired && !value) {
                    errors.push('This field is required');
                }
                
                // Skip other validation if empty and not required
                if (!value && !isRequired) {
                    this.setValidationState(input, 'neutral');
                    return true;
                }
                
                // XSS validation
                if (value && this.containsXSS(value)) {
                    errors.push('Invalid characters detected. Please remove any script tags or JavaScript code.');
                    if (window.ErrorLogger) {
                        window.ErrorLogger.logWarning('XSS attempt detected in input', window.ERROR_CATEGORIES.VALIDATION, {
                            inputId: input.id,
                            inputName: input.name,
                            value: this.sanitizeForLogging(value)
                        });
                    }
                }
                
                // Type-specific validation
                if (value && inputType && VALIDATION_RULES[inputType]) {
                    const rule = VALIDATION_RULES[inputType];
                    if (!rule.pattern.test(value)) {
                        errors.push(rule.message);
                    }
                }
                
                // Length validation
                const minLength = input.getAttribute('minlength');
                const maxLength = input.getAttribute('maxlength');
                
                if (minLength && value.length < parseInt(minLength)) {
                    errors.push(`Minimum ${minLength} characters required`);
                }
                
                if (maxLength && value.length > parseInt(maxLength)) {
                    errors.push(`Maximum ${maxLength} characters allowed`);
                }
                
                // Number range validation
                if (input.type === 'number' || inputType === 'currency' || inputType === 'positiveNumber') {
                    const min = input.getAttribute('min');
                    const max = input.getAttribute('max');
                    const numValue = parseFloat(value);
                    
                    if (!isNaN(numValue)) {
                        if (min && numValue < parseFloat(min)) {
                            errors.push(`Minimum value is ${min}`);
                        }
                        if (max && numValue > parseFloat(max)) {
                            errors.push(`Maximum value is ${max}`);
                        }
                    }
                }
                
                // Email specific validation
                if (inputType === 'email' && value) {
                    const emailWarnings = this.validateEmailStrength(value);
                    warnings.push(...emailWarnings);
                }
                
                // Show validation results
                if (errors.length > 0) {
                    this.setValidationState(input, 'error', errors[0]);
                    this.validationErrors.set(input.id || input.name, errors);
                    return false;
                } else if (warnings.length > 0 && showAllErrors) {
                    this.setValidationState(input, 'warning', warnings[0]);
                    return true;
                } else {
                    this.setValidationState(input, 'success');
                    this.validationErrors.delete(input.id || input.name);
                    return true;
                }
                
            } catch (error) {
                console.error('Input validation error:', error);
                if (window.ErrorLogger) {
                    window.ErrorLogger.logError('Input validation failed', window.ERROR_CATEGORIES.VALIDATION, {
                        inputId: input.id,
                        error: error.message
                    });
                }
                return false;
            }
        },
        
        getInputValidationType: function(input) {
            // Check for data-validate attribute first
            const dataValidate = input.getAttribute('data-validate');
            if (dataValidate && VALIDATION_RULES[dataValidate]) {
                return dataValidate;
            }
            
            // Infer from input type or id/name
            const type = input.type;
            const id = input.id;
            const name = input.name;
            
            if (type === 'email' || id.includes('email') || name.includes('email')) {
                return 'email';
            }
            
            if (type === 'tel' || id.includes('phone') || name.includes('phone')) {
                return 'phone';
            }
            
            if (id.includes('price') || id.includes('cost') || id.includes('amount') || name.includes('price')) {
                return 'currency';
            }
            
            if (type === 'number' || id.includes('quantity') || id.includes('rate')) {
                return 'positiveNumber';
            }
            
            if (id.includes('name') || name.includes('name')) {
                return 'name';
            }
            
            if (id.includes('invoice') && (id.includes('number') || name.includes('number'))) {
                return 'invoiceNumber';
            }
            
            return null;
        },
        
        containsXSS: function(value) {
            return XSS_PATTERNS.some(pattern => pattern.test(value));
        },
        
        sanitizeInput: function(value) {
            if (typeof value !== 'string') return value;
            
            // Remove dangerous patterns
            let sanitized = value;
            XSS_PATTERNS.forEach(pattern => {
                sanitized = sanitized.replace(pattern, '');
            });
            
            // Encode HTML entities
            return sanitized
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        },
        
        sanitizeForLogging: function(value) {
            // Similar to sanitizeInput but keeps some readability for logging
            return value ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : '';
        },
        
        validateEmailStrength: function(email) {
            const warnings = [];
            
            // Check for common typos
            const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
            const domain = email.split('@')[1];
            
            if (domain) {
                const possibleTypos = commonDomains.filter(d => 
                    this.levenshteinDistance(domain, d) === 1
                );
                
                if (possibleTypos.length > 0) {
                    warnings.push(`Did you mean ${possibleTypos[0]}?`);
                }
            }
            
            return warnings;
        },
        
        levenshteinDistance: function(str1, str2) {
            const matrix = [];
            
            for (let i = 0; i <= str2.length; i++) {
                matrix[i] = [i];
            }
            
            for (let j = 0; j <= str1.length; j++) {
                matrix[0][j] = j;
            }
            
            for (let i = 1; i <= str2.length; i++) {
                for (let j = 1; j <= str1.length; j++) {
                    if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            
            return matrix[str2.length][str1.length];
        },
        
        setValidationState: function(input, state, message = '') {
            if (!input) return;
            
            const formGroup = input.closest('.form-group');
            if (!formGroup) return;
            
            // Clear existing validation classes
            input.classList.remove('input-error', 'input-success', 'input-warning');
            
            // Clear existing validation messages
            const existingMessage = formGroup.querySelector('.validation-message');
            if (existingMessage) {
                existingMessage.remove();
            }
            
            // Set new state
            if (state === 'error') {
                input.classList.add('input-error');
                this.showValidationMessage(formGroup, message, 'error');
            } else if (state === 'success') {
                input.classList.add('input-success');
            } else if (state === 'warning') {
                input.classList.add('input-warning');
                this.showValidationMessage(formGroup, message, 'warning');
            }
            
            // Add has-validation class for spacing
            if (state !== 'neutral') {
                formGroup.classList.add('has-validation');
            } else {
                formGroup.classList.remove('has-validation');
            }
        },
        
        showValidationMessage: function(formGroup, message, type) {
            if (!message) return;
            
            const messageElement = document.createElement('div');
            messageElement.className = `validation-message ${type}`;
            
            const icon = type === 'error' ? 'fas fa-exclamation-circle' :
                        type === 'warning' ? 'fas fa-exclamation-triangle' :
                        'fas fa-check-circle';
            
            messageElement.innerHTML = `
                <i class="${icon}"></i>
                <span>${message}</span>
            `;
            
            formGroup.appendChild(messageElement);
        },
        
        clearValidationState: function(input) {
            if (!input) return;
            
            const formGroup = input.closest('.form-group');
            if (!formGroup) return;
            
            input.classList.remove('input-error', 'input-success', 'input-warning');
            
            const existingMessage = formGroup.querySelector('.validation-message');
            if (existingMessage) {
                existingMessage.remove();
            }
        },
        
        validateForm: function(form, event) {
            if (!form) return true;
            
            try {
                let isValid = true;
                const errors = [];
                
                // Validate all inputs in the form
                const inputs = form.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    if (this.isValidatableInput(input)) {
                        const inputValid = this.validateInput(input, true);
                        if (!inputValid) {
                            isValid = false;
                            const inputErrors = this.validationErrors.get(input.id || input.name);
                            if (inputErrors) {
                                const label = this.getInputLabel(input);
                                errors.push(`${label}: ${inputErrors[0]}`);
                            }
                        }
                    }
                });
                
                // Show validation summary if there are errors
                if (!isValid) {
                    this.showValidationSummary(form, errors);
                    
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    
                    // Focus on first invalid input
                    const firstInvalidInput = form.querySelector('.input-error');
                    if (firstInvalidInput) {
                        firstInvalidInput.focus();
                        firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    
                    if (window.ErrorLogger) {
                        window.ErrorLogger.logWarning('Form validation failed', window.ERROR_CATEGORIES.VALIDATION, {
                            formId: form.id,
                            errorCount: errors.length,
                            errors: errors
                        });
                    }
                }
                
                return isValid;
                
            } catch (error) {
                console.error('Form validation error:', error);
                if (window.ErrorLogger) {
                    window.ErrorLogger.logError('Form validation exception', window.ERROR_CATEGORIES.VALIDATION, {
                        formId: form.id,
                        error: error.message
                    });
                }
                return false;
            }
        },
        
        getInputLabel: function(input) {
            // Try to find associated label
            const label = document.querySelector(`label[for="${input.id}"]`) ||
                         input.closest('.form-group')?.querySelector('label');
            
            if (label) {
                return label.textContent.replace(':', '').trim();
            }
            
            return input.name || input.id || 'Field';
        },
        
        showValidationSummary: function(form, errors) {
            // Remove existing summary
            const existingSummary = form.querySelector('.validation-summary');
            if (existingSummary) {
                existingSummary.remove();
            }
            
            if (errors.length === 0) return;
            
            const summary = document.createElement('div');
            summary.className = 'validation-summary';
            summary.innerHTML = `
                <h4><i class="fas fa-exclamation-triangle"></i> Please fix the following errors:</h4>
                <ul>
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
            
            // Insert at the beginning of the form
            form.insertBefore(summary, form.firstChild);
            
            // Scroll to summary
            summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        
        // Public API methods
        validateField: function(fieldId) {
            const field = document.getElementById(fieldId);
            return field ? this.validateInput(field, true) : false;
        },
        
        clearFieldValidation: function(fieldId) {
            const field = document.getElementById(fieldId);
            if (field) {
                this.clearValidationState(field);
                this.validationErrors.delete(fieldId);
            }
        },
        
        addCustomRule: function(name, pattern, message) {
            VALIDATION_RULES[name] = { pattern, message };
        },
        
        sanitizeFormData: function(formData) {
            const sanitized = {};
            
            if (formData instanceof FormData) {
                for (let [key, value] of formData.entries()) {
                    sanitized[key] = this.sanitizeInput(value);
                }
            } else {
                for (let key in formData) {
                    if (formData.hasOwnProperty(key)) {
                        sanitized[key] = this.sanitizeInput(formData[key]);
                    }
                }
            }
            
            return sanitized;
        },
        
        getValidationErrors: function() {
            const errors = {};
            for (let [key, value] of this.validationErrors.entries()) {
                errors[key] = value;
            }
            return errors;
        },
        
        hasValidationErrors: function() {
            return this.validationErrors.size > 0;
        },
        
        clearAllValidation: function() {
            this.validationErrors.clear();
            
            // Clear all visual validation states
            document.querySelectorAll('.input-error, .input-success, .input-warning').forEach(input => {
                this.clearValidationState(input);
            });
            
            // Remove validation summaries
            document.querySelectorAll('.validation-summary').forEach(summary => {
                summary.remove();
            });
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            InputValidator.init();
        });
    } else {
        InputValidator.init();
    }
    
    // Export for global access
    window.InputValidator = InputValidator;
    
})();