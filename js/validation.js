/**
 * J. Stark Business Invoicing System - Enhanced Form Validation
 * Comprehensive form validation with real-time feedback and accessibility
 */

(function() {
    'use strict';
    
    const FormValidator = {
        validators: new Map(),
        errorElements: new Map(),
        
        init: function() {
            try {
                this.setupValidators();
                this.bindRealTimeValidation();
                console.log('Form Validator initialized');
            } catch (error) {
                console.error('Form Validator initialization error:', error);
            }
        },
        
        setupValidators: function() {
            // Register built-in validators
            this.registerValidator('required', this.validateRequired);
            this.registerValidator('email', this.validateEmail);
            this.registerValidator('phone', this.validatePhone);
            this.registerValidator('currency', this.validateCurrency);
            this.registerValidator('number', this.validateNumber);
            this.registerValidator('positive', this.validatePositive);
            this.registerValidator('date', this.validateDate);
            this.registerValidator('minLength', this.validateMinLength);
            this.registerValidator('maxLength', this.validateMaxLength);
            this.registerValidator('pattern', this.validatePattern);
            this.registerValidator('businessType', this.validateBusinessType);
            this.registerValidator('services', this.validateServices);
        },
        
        registerValidator: function(name, validatorFn) {
            this.validators.set(name, validatorFn);
        },
        
        validateField: function(field, rules = []) {
            try {
                const errors = [];
                const value = this.getFieldValue(field);
                
                for (const rule of rules) {
                    const validator = this.validators.get(rule.type);
                    if (validator) {
                        const result = validator.call(this, value, rule.params, field);
                        if (result !== true) {
                            errors.push(result);
                        }
                    }
                }
                
                this.showFieldErrors(field, errors);
                return errors.length === 0;
                
            } catch (error) {
                console.error('Field validation error:', error);
                return false;
            }
        },
        
        validateForm: function(formId, validationRules) {
            try {
                const form = document.getElementById(formId);
                if (!form) return false;
                
                let isValid = true;
                const allErrors = [];
                
                // Clear previous errors
                this.clearFormErrors(form);
                
                // Validate each field
                for (const [fieldName, rules] of Object.entries(validationRules)) {
                    const field = this.getField(form, fieldName);
                    if (field) {
                        const fieldValid = this.validateField(field, rules);
                        if (!fieldValid) {
                            isValid = false;
                        }
                    }
                }
                
                // Custom form-level validations
                const customErrors = this.validateCustomRules(form, validationRules);
                if (customErrors.length > 0) {
                    isValid = false;
                    allErrors.push(...customErrors);
                }
                
                // Show form-level errors if any
                if (allErrors.length > 0) {
                    this.showFormErrors(form, allErrors);
                }
                
                return isValid;
                
            } catch (error) {
                console.error('Form validation error:', error);
                return false;
            }
        },
        
        getField: function(form, fieldName) {
            // Handle different field types
            let field = form.querySelector(`#${fieldName}`);
            if (!field) {
                field = form.querySelector(`[name="${fieldName}"]`);
            }
            if (!field) {
                field = form.querySelector(`[data-field="${fieldName}"]`);
            }
            return field;
        },
        
        getFieldValue: function(field) {
            if (!field) return '';
            
            switch (field.type) {
                case 'radio':
                    const checked = document.querySelector(`input[name="${field.name}"]:checked`);
                    return checked ? checked.value : '';
                case 'checkbox':
                    return field.checked;
                case 'select-multiple':
                    return Array.from(field.selectedOptions).map(option => option.value);
                default:
                    return field.value || '';
            }
        },
        
        // Built-in validators
        validateRequired: function(value, params, field) {
            if (!value || (typeof value === 'string' && !value.trim())) {
                const fieldLabel = this.getFieldLabel(field);
                const friendlyMessages = {
                    'customer name': 'Please enter the customer\'s name to create the invoice',
                    'invoice date': 'Please select a date for this invoice',
                    'email': 'Please provide an email address to send the invoice',
                    'phone': 'Please enter a contact phone number',
                    'square footage': 'Please enter the area size in square feet',
                    'services': 'Please add at least one service to the invoice'
                };
                const key = fieldLabel.toLowerCase();
                return params?.message || friendlyMessages[key] || `Please enter ${fieldLabel.toLowerCase()}`;
            }
            return true;
        },
        
        validateEmail: function(value, params, field) {
            if (!value) return true; // Empty is ok unless required
            
            if (window.SecurityUtils && !window.SecurityUtils.validateEmail(value)) {
                return params?.message || 'Please enter a valid email address (example: john@company.com)';
            }
            
            // Fallback validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return params?.message || 'Please enter a valid email address (example: john@company.com)';
            }
            
            return true;
        },
        
        validatePhone: function(value, params, field) {
            if (!value) return true; // Empty is ok unless required
            
            if (window.SecurityUtils && !window.SecurityUtils.validatePhone(value)) {
                return params?.message || 'Please enter a valid phone number';
            }
            
            // Fallback validation
            const cleanPhone = value.replace(/\D/g, '');
            if (cleanPhone.length < 10 || cleanPhone.length > 15) {
                return params?.message || 'Please enter a valid phone number (example: 555-123-4567)';
            }
            
            return true;
        },
        
        validateCurrency: function(value, params, field) {
            if (!value) return true; // Empty is ok unless required
            
            if (window.SecurityUtils && !window.SecurityUtils.validateCurrency(value)) {
                return params?.message || 'Please enter a valid amount';
            }
            
            // Fallback validation
            const numValue = parseFloat(value.toString().replace(/[,$]/g, ''));
            if (isNaN(numValue) || numValue < 0) {
                return params?.message || 'Please enter a valid dollar amount (numbers only, no negative values)';
            }
            
            return true;
        },
        
        validateNumber: function(value, params, field) {
            if (!value) return true; // Empty is ok unless required
            
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                return params?.message || 'Please enter numbers only (no letters or special characters)';
            }
            
            if (params?.min !== undefined && numValue < params.min) {
                return params?.message || `Value must be at least ${params.min}`;
            }
            
            if (params?.max !== undefined && numValue > params.max) {
                return params?.message || `Value must be no more than ${params.max}`;
            }
            
            return true;
        },
        
        validatePositive: function(value, params, field) {
            if (!value) return true; // Empty is ok unless required
            
            const numValue = parseFloat(value);
            if (isNaN(numValue) || numValue <= 0) {
                return params?.message || 'This value must be greater than zero';
            }
            
            return true;
        },
        
        validateDate: function(value, params, field) {
            if (!value) return true; // Empty is ok unless required
            
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                return params?.message || 'Please select a valid date from the calendar';
            }
            
            if (params?.minDate) {
                const minDate = new Date(params.minDate);
                if (date < minDate) {
                    return params?.message || `Date must be after ${params.minDate}`;
                }
            }
            
            if (params?.maxDate) {
                const maxDate = new Date(params.maxDate);
                if (date > maxDate) {
                    return params?.message || `Date must be before ${params.maxDate}`;
                }
            }
            
            return true;
        },
        
        validateMinLength: function(value, params, field) {
            if (!value) return true; // Empty is ok unless required
            
            const minLength = params?.length || params || 0;
            if (value.length < minLength) {
                return params?.message || `Must be at least ${minLength} characters`;
            }
            
            return true;
        },
        
        validateMaxLength: function(value, params, field) {
            if (!value) return true; // Empty is ok unless required
            
            const maxLength = params?.length || params || 255;
            if (value.length > maxLength) {
                return params?.message || `Must be no more than ${maxLength} characters`;
            }
            
            return true;
        },
        
        validatePattern: function(value, params, field) {
            if (!value) return true; // Empty is ok unless required
            
            const pattern = new RegExp(params?.pattern || params);
            if (!pattern.test(value)) {
                return params?.message || 'Invalid format';
            }
            
            return true;
        },
        
        validateBusinessType: function(value, params, field) {
            const checked = document.querySelector('input[name="businessType"]:checked');
            if (!checked) {
                return 'Please select a business type';
            }
            return true;
        },
        
        validateServices: function(value, params, field) {
            if (window.InvoiceManager && window.InvoiceManager.currentInvoice) {
                const services = window.InvoiceManager.currentInvoice.services || [];
                if (services.length === 0) {
                    return 'At least one service must be added to the invoice';
                }
            }
            return true;
        },
        
        validateCustomRules: function(form, validationRules) {
            const errors = [];
            
            // Custom business logic validations
            try {
                // Check if invoice total is reasonable
                if (window.InvoiceManager && window.InvoiceManager.currentInvoice) {
                    const total = window.InvoiceManager.currentInvoice.total || 0;
                    if (total > 50000) {
                        errors.push('Invoice total seems unusually high. Please verify the amounts.');
                    }
                }
                
                // Validate service details
                const serviceRows = form.querySelectorAll('.service-row');
                serviceRows.forEach((row, index) => {
                    const description = row.querySelector('.service-description')?.value;
                    const quantity = row.querySelector('.service-quantity')?.value;
                    const rate = row.querySelector('.service-rate')?.value;
                    
                    if (description && (!quantity || !rate)) {
                        errors.push(`Service ${index + 1}: Quantity and rate are required when description is provided`);
                    }
                });
                
            } catch (error) {
                console.error('Custom validation error:', error);
            }
            
            return errors;
        },
        
        showFieldErrors: function(field, errors) {
            try {
                if (!field) return;
                
                // Clear previous errors
                this.clearFieldErrors(field);
                
                if (errors.length > 0) {
                    // Add error styling
                    field.classList.add('field-error');
                    field.setAttribute('aria-invalid', 'true');
                    
                    // Create error element
                    const errorElement = document.createElement('div');
                    errorElement.className = 'field-error-message';
                    errorElement.setAttribute('role', 'alert');
                    errorElement.textContent = errors[0]; // Show first error
                    
                    // Insert error message after field
                    field.parentNode.insertBefore(errorElement, field.nextSibling);
                    
                    // Store reference for cleanup
                    this.errorElements.set(field, errorElement);
                    
                } else {
                    // Remove error styling
                    field.classList.remove('field-error');
                    field.removeAttribute('aria-invalid');
                }
                
            } catch (error) {
                console.error('Show field errors error:', error);
            }
        },
        
        clearFieldErrors: function(field) {
            try {
                if (!field) return;
                
                field.classList.remove('field-error');
                field.removeAttribute('aria-invalid');
                
                const errorElement = this.errorElements.get(field);
                if (errorElement && errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                    this.errorElements.delete(field);
                }
                
            } catch (error) {
                console.error('Clear field errors error:', error);
            }
        },
        
        clearFormErrors: function(form) {
            try {
                // Clear all field errors
                const fields = form.querySelectorAll('.field-error');
                fields.forEach(field => this.clearFieldErrors(field));
                
                // Clear form-level errors
                const formErrors = form.querySelectorAll('.form-error-message');
                formErrors.forEach(error => error.remove());
                
            } catch (error) {
                console.error('Clear form errors error:', error);
            }
        },
        
        showFormErrors: function(form, errors) {
            try {
                if (errors.length === 0) return;
                
                // Create form error container
                const errorContainer = document.createElement('div');
                errorContainer.className = 'form-error-message';
                errorContainer.setAttribute('role', 'alert');
                
                const errorList = document.createElement('ul');
                errors.forEach(error => {
                    const errorItem = document.createElement('li');
                    errorItem.textContent = error;
                    errorList.appendChild(errorItem);
                });
                
                errorContainer.appendChild(errorList);
                
                // Insert at top of form
                form.insertBefore(errorContainer, form.firstChild);
                
                // Scroll to errors
                errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
            } catch (error) {
                console.error('Show form errors error:', error);
            }
        },
        
        getFieldLabel: function(field) {
            try {
                // Try to find associated label
                let label = document.querySelector(`label[for="${field.id}"]`);
                if (label) return label.textContent.trim();
                
                // Try parent label
                label = field.closest('label');
                if (label) return label.textContent.trim();
                
                // Try data attribute
                if (field.dataset.label) return field.dataset.label;
                
                // Try placeholder
                if (field.placeholder) return field.placeholder;
                
                // Fallback to field name/id
                return field.name || field.id || 'Field';
                
            } catch (error) {
                return 'Field';
            }
        },
        
        bindRealTimeValidation: function() {
            try {
                // Bind to common form events
                document.addEventListener('blur', (e) => {
                    const field = e.target;
                    if (field.dataset.validate) {
                        const rules = this.parseValidationRules(field.dataset.validate);
                        this.validateField(field, rules);
                    }
                }, true);
                
                document.addEventListener('input', (e) => {
                    const field = e.target;
                    if (field.classList.contains('field-error') && field.dataset.validate) {
                        // Clear errors on input for immediate feedback
                        this.clearFieldErrors(field);
                    }
                }, true);
                
                document.addEventListener('change', (e) => {
                    const field = e.target;
                    if (field.dataset.validate) {
                        const rules = this.parseValidationRules(field.dataset.validate);
                        this.validateField(field, rules);
                    }
                }, true);
                
            } catch (error) {
                console.error('Bind real-time validation error:', error);
            }
        },
        
        parseValidationRules: function(rulesString) {
            try {
                return JSON.parse(rulesString);
            } catch (error) {
                console.error('Parse validation rules error:', error);
                return [];
            }
        },
        
        // Public API for invoice form
        validateInvoiceForm: function() {
            const rules = {
                'customer-name': [
                    { type: 'required' },
                    { type: 'minLength', params: 2 },
                    { type: 'maxLength', params: 100 }
                ],
                'customer-email': [
                    { type: 'email' },
                    { type: 'maxLength', params: 254 }
                ],
                'customer-phone': [
                    { type: 'phone' }
                ],
                'customer-address': [
                    { type: 'maxLength', params: 500 }
                ],
                'invoice-date': [
                    { type: 'required' },
                    { type: 'date' }
                ],
                'invoice-notes': [
                    { type: 'maxLength', params: 1000 }
                ],
                'businessType': [
                    { type: 'businessType' }
                ],
                'services': [
                    { type: 'services' }
                ]
            };
            
            return this.validateForm('invoice-form', rules);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            FormValidator.init();
        });
    } else {
        FormValidator.init();
    }
    
    // Export for global access
    window.FormValidator = FormValidator;
    
})();