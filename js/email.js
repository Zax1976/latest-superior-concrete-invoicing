/**
 * J. Stark Business Invoicing System - Email Service
 * Handles email functionality for sending invoices to clients
 */

(function() {
    'use strict';
    
    const EmailService = {
        // EmailJS configuration (to be set up by user)
        config: {
            serviceId: '', // To be configured
            templateId: '', // To be configured
            publicKey: '', // To be configured
            initialized: false
        },
        
        // Email templates
        templates: {
            invoice: {
                subject: 'Invoice #{invoice_number} from {business_name}',
                message: `Dear {customer_name},

Please find attached your invoice #{invoice_number} dated {invoice_date}.

Invoice Summary:
- Amount Due: {invoice_amount}
- Due Date: {due_date}

Payment can be made by check payable to {business_name} and mailed to:
{business_address}

If you have any questions about this invoice, please contact us at {business_phone}.

Thank you for your business!

Best regards,
{business_name}`
            },
            estimate: {
                subject: 'Work Estimate #{estimate_number} from {business_name}',
                message: `Dear {customer_name},

Thank you for your interest in our services. Please find attached your work estimate #{estimate_number} dated {estimate_date}.

Estimate Summary:
- Estimated Total: {estimate_amount}
- Valid Until: {valid_until}

This estimate includes all materials and labor as described. Final pricing may vary based on actual site conditions.

To approve this estimate and schedule the work, please:
1. Review the attached estimate carefully
2. Sign and return if you approve
3. Contact us at {business_phone} to schedule

We look forward to working with you!

Best regards,
{business_name}`
            },
            estimate_approved: {
                subject: 'Thank You - Estimate #{estimate_number} Approved',
                message: `Dear {customer_name},

Thank you for approving estimate #{estimate_number}! We received your signed approval on {approval_date}.

Next Steps:
- We will contact you within 1-2 business days to schedule the work
- Work will be completed as outlined in the estimate
- Final invoice will be provided upon completion

Project Details:
- Estimated Total: {estimate_amount}
- Estimated Timeline: {timeline}

If you have any questions, please contact us at {business_phone}.

Thank you for choosing our services!

Best regards,
{business_name}`
            },
            reminder: {
                subject: 'Payment Reminder - Invoice #{invoice_number}',
                message: `Dear {customer_name},

This is a friendly reminder that invoice #{invoice_number} for {invoice_amount} is due.

If you have already sent payment, please disregard this message. If you have any questions or need to discuss payment arrangements, please contact us at {business_phone}.

Thank you for your business!

Best regards,
{business_name}`
            }
        },
        
        init: function() {
            try {
                // Check if EmailJS is loaded
                if (typeof emailjs !== 'undefined') {
                    console.log('EmailJS library loaded');
                    this.checkConfiguration();
                } else {
                    console.warn('EmailJS library not loaded. Email functionality will be limited.');
                }
                
                this.loadSettings();
                console.log('Email Service initialized');
            } catch (error) {
                console.error('Email Service initialization error:', error);
            }
        },
        
        checkConfiguration: function() {
            const settings = this.loadSettings();
            if (settings.emailjs && settings.emailjs.serviceId && settings.emailjs.templateId && settings.emailjs.publicKey) {
                this.config = {
                    ...this.config,
                    ...settings.emailjs,
                    initialized: true
                };
                
                // Initialize EmailJS
                emailjs.init(this.config.publicKey);
                console.log('EmailJS configured successfully');
            } else {
                console.warn('EmailJS not configured. Please set up email credentials in settings.');
            }
        },
        
        loadSettings: function() {
            try {
                const stored = localStorage.getItem('jstark_email_settings');
                return stored ? JSON.parse(stored) : {};
            } catch (error) {
                console.error('Error loading email settings:', error);
                return {};
            }
        },
        
        saveSettings: function(settings) {
            try {
                localStorage.setItem('jstark_email_settings', JSON.stringify(settings));
                return true;
            } catch (error) {
                console.error('Error saving email settings:', error);
                return false;
            }
        },
        
        configureEmailJS: function(serviceId, templateId, publicKey) {
            try {
                this.config = {
                    serviceId: serviceId,
                    templateId: templateId,
                    publicKey: publicKey,
                    initialized: true
                };
                
                // Save to localStorage
                const settings = this.loadSettings();
                settings.emailjs = this.config;
                this.saveSettings(settings);
                
                // Initialize EmailJS
                if (typeof emailjs !== 'undefined') {
                    emailjs.init(publicKey);
                    console.log('EmailJS configured and initialized');
                    return true;
                }
                
                return false;
            } catch (error) {
                console.error('EmailJS configuration error:', error);
                return false;
            }
        },
        
        isConfigured: function() {
            return this.config.initialized && 
                   this.config.serviceId && 
                   this.config.templateId && 
                   this.config.publicKey;
        },
        
        sendInvoice: async function(invoice, options = {}) {
            try {
                if (!this.isConfigured()) {
                    throw new Error('Email service not configured. Please set up EmailJS credentials.');
                }
                
                if (!invoice.customerEmail) {
                    throw new Error('Customer email address is required');
                }
                
                // Check network status
                if (window.NetworkManager && !window.NetworkManager.isOnline) {
                    return this.handleOfflineEmail(invoice, options, 'invoice');
                }
                
                // Show sending notification
                let sendingNotificationId = null;
                if (window.NotificationSystem && options.showProgress !== false) {
                    sendingNotificationId = window.NotificationSystem.showLoading(`Sending invoice to ${invoice.customerEmail}...`, {
                        closable: false
                    });
                }
                
                try {
                    // Generate PDF as base64
                    const pdfBase64 = await this.generatePDFBase64(invoice);
                    if (!pdfBase64) {
                        throw new Error('Failed to generate PDF attachment');
                    }
                    
                    // Prepare email parameters
                    const params = this.prepareEmailParams(invoice, pdfBase64, options);
                    
                    // Send email via EmailJS with network retry
                    const response = await this.sendEmailWithRetry(params, {
                        maxRetries: 3,
                        retryDelay: 2000,
                        showRetryNotification: true
                    });
                    
                    // Dismiss loading notification
                    if (sendingNotificationId && window.NotificationSystem) {
                        window.NotificationSystem.dismiss(sendingNotificationId);
                    }
                    
                    // Track email send
                    this.trackEmailSend(invoice, params.to_email, 'sent');
                    
                    console.log('Invoice email sent successfully:', response);
                    
                    // Show success notification
                    if (window.NotificationSystem) {
                        window.NotificationSystem.showSuccess(`Invoice sent to ${invoice.customerEmail}`, {
                            title: 'Email Sent',
                            duration: 5000
                        });
                    }
                    
                    return {
                        success: true,
                        response: response,
                        emailId: response.text || Date.now().toString()
                    };
                    
                } catch (networkError) {
                    // Dismiss loading notification
                    if (sendingNotificationId && window.NotificationSystem) {
                        window.NotificationSystem.dismiss(sendingNotificationId);
                    }
                    
                    // Handle network-specific errors
                    if (this.isNetworkError(networkError)) {
                        return this.handleNetworkError(invoice, options, networkError, 'invoice');
                    } else {
                        throw networkError; // Re-throw non-network errors
                    }
                }
                
            } catch (error) {
                console.error('Send invoice email error:', error);
                
                // Track failed send
                if (invoice) {
                    this.trackEmailSend(invoice, invoice.customerEmail, 'failed', error.message);
                }
                
                // Show user-friendly error
                if (window.NotificationSystem) {
                    window.NotificationSystem.showError(
                        this.getUserFriendlyErrorMessage(error), 
                        {
                            title: 'Email Failed',
                            duration: 8000,
                            actions: [{
                                text: 'Retry',
                                primary: true,
                                callback: `EmailService.sendInvoice(${JSON.stringify(invoice)}, ${JSON.stringify(options)})`
                            }]
                        }
                    );
                }
                
                return {
                    success: false,
                    error: error.message || 'Failed to send email'
                };
            }
        },
        
        generatePDFBase64: async function(invoice) {
            try {
                if (window.PDFGenerator && window.PDFGenerator.generateBase64) {
                    // Use the enhanced PDF generator with base64 support
                    return await window.PDFGenerator.generateBase64(invoice);
                } else if (window.PDFGenerator) {
                    // Try to use existing PDF generator
                    const pdfBlob = await this.generatePDFBlob(invoice);
                    if (pdfBlob) {
                        return await this.blobToBase64(pdfBlob);
                    }
                }
                
                // Fallback: create simple PDF content
                return this.createSimplePDF(invoice);
                
            } catch (error) {
                console.error('PDF generation error:', error);
                return null;
            }
        },
        
        generatePDFBlob: function(invoice) {
            return new Promise((resolve, reject) => {
                try {
                    // Create a temporary element for PDF generation
                    const element = this.createPrintableInvoice(invoice);
                    
                    // If jsPDF is available, use it
                    if (typeof window.jsPDF !== 'undefined') {
                        const pdf = new window.jsPDF('p', 'mm', 'a4');
                        
                        // Add invoice content to PDF
                        pdf.html(element, {
                            callback: function(pdf) {
                                const blob = pdf.output('blob');
                                resolve(blob);
                            },
                            x: 10,
                            y: 10,
                            width: 190,
                            windowWidth: 800
                        });
                    } else {
                        // Fallback: create a simple text-based PDF
                        reject(new Error('PDF library not available'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        blobToBase64: function(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        },
        
        createSimplePDF: function(invoice) {
            // Create a simple base64 PDF as fallback
            const content = this.generatePlainTextInvoice(invoice);
            return btoa(content); // Simple base64 encoding
        },
        
        createPrintableInvoice: function(invoice) {
            const businessInfo = this.getBusinessInfo(invoice.businessType);
            
            const element = document.createElement('div');
            element.innerHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #DC143C; margin: 0;">${businessInfo.name}</h1>
                        <p style="margin: 5px 0;">${businessInfo.address}</p>
                        <p style="margin: 5px 0;">Phone: ${businessInfo.phone} | Email: ${businessInfo.email}</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333;">INVOICE #${invoice.number || 'DRAFT'}</h2>
                        <p><strong>Date:</strong> ${this.formatDate(invoice.date)}</p>
                        <p><strong>Status:</strong> ${(invoice.status || 'draft').toUpperCase()}</p>
                    </div>
                    
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #333;">Bill To:</h3>
                        <p><strong>${invoice.customerName}</strong></p>
                        ${invoice.customerEmail ? `<p>Email: ${invoice.customerEmail}</p>` : ''}
                        ${invoice.customerPhone ? `<p>Phone: ${invoice.customerPhone}</p>` : ''}
                        ${invoice.customerAddress ? `<p>Address: ${invoice.customerAddress}</p>` : ''}
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
                                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Quantity</th>
                                <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Unit</th>
                                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Rate</th>
                                <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.services.map(service => `
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 12px;">${service.description}</td>
                                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${service.quantity}</td>
                                    <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${service.unit}</td>
                                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${this.formatCurrency(service.rate)}</td>
                                    <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${this.formatCurrency(service.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="text-align: right; margin-bottom: 30px;">
                        <p><strong>Subtotal: ${this.formatCurrency(invoice.subtotal)}</strong></p>
                        <p style="font-size: 18px; color: #DC143C;"><strong>Total: ${this.formatCurrency(invoice.total)}</strong></p>
                    </div>
                    
                    ${invoice.notes ? `
                        <div style="margin-bottom: 30px;">
                            <h4>Notes:</h4>
                            <p>${invoice.notes.replace(/\n/g, '<br>')}</p>
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                        <h4>Payment Terms</h4>
                        <p>Payment is due within 30 days of invoice date.</p>
                        <p>Make checks payable to: ${businessInfo.name}</p>
                        <p>Mail payments to: ${businessInfo.address}</p>
                        <p>For questions about this invoice, please contact us at ${businessInfo.phone}</p>
                        <p style="margin-top: 20px;"><em>Thank you for your business!</em></p>
                    </div>
                </div>
            `;
            
            return element;
        },
        
        generatePlainTextInvoice: function(invoice) {
            const businessInfo = this.getBusinessInfo(invoice.businessType);
            
            return `
${businessInfo.name}
${businessInfo.address}
Phone: ${businessInfo.phone} | Email: ${businessInfo.email}

INVOICE #${invoice.number || 'DRAFT'}
Date: ${this.formatDate(invoice.date)}
Status: ${(invoice.status || 'draft').toUpperCase()}

Bill To:
${invoice.customerName}
${invoice.customerEmail ? `Email: ${invoice.customerEmail}` : ''}
${invoice.customerPhone ? `Phone: ${invoice.customerPhone}` : ''}
${invoice.customerAddress ? `Address: ${invoice.customerAddress}` : ''}

Services:
${invoice.services.map(service => 
    `${service.description} - ${service.quantity} ${service.unit} x ${this.formatCurrency(service.rate)} = ${this.formatCurrency(service.amount)}`
).join('\n')}

Subtotal: ${this.formatCurrency(invoice.subtotal)}
Total: ${this.formatCurrency(invoice.total)}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Payment Terms:
Payment is due within 30 days of invoice date.
Make checks payable to: ${businessInfo.name}
Mail payments to: ${businessInfo.address}

Thank you for your business!
            `.trim();
        },
        
        prepareEmailParams: function(invoice, pdfBase64, options = {}) {
            const businessInfo = this.getBusinessInfo(invoice.businessType);
            const template = options.template || 'invoice';
            const templateData = this.templates[template];
            
            // Calculate due date (30 days from invoice date)
            const dueDate = new Date(invoice.date);
            dueDate.setDate(dueDate.getDate() + 30);
            
            const params = {
                to_email: invoice.customerEmail,
                to_name: invoice.customerName,
                from_name: businessInfo.name,
                invoice_number: invoice.number || 'DRAFT',
                invoice_date: this.formatDate(invoice.date),
                invoice_amount: this.formatCurrency(invoice.total),
                due_date: this.formatDate(dueDate.toISOString().split('T')[0]),
                customer_name: invoice.customerName,
                business_name: businessInfo.name,
                business_address: businessInfo.address,
                business_phone: businessInfo.phone,
                business_email: businessInfo.email,
                attachment: pdfBase64,
                subject: this.processTemplate(templateData.subject, {
                    invoice_number: invoice.number || 'DRAFT',
                    business_name: businessInfo.name
                }),
                message: options.message || this.processTemplate(templateData.message, {
                    customer_name: invoice.customerName,
                    invoice_number: invoice.number || 'DRAFT',
                    invoice_date: this.formatDate(invoice.date),
                    invoice_amount: this.formatCurrency(invoice.total),
                    due_date: this.formatDate(dueDate.toISOString().split('T')[0]),
                    business_name: businessInfo.name,
                    business_address: businessInfo.address,
                    business_phone: businessInfo.phone
                })
            };
            
            return params;
        },
        
        processTemplate: function(template, variables) {
            let result = template;
            for (const [key, value] of Object.entries(variables)) {
                result = result.replace(new RegExp(`{${key}}`, 'g'), value);
            }
            return result;
        },
        
        getBusinessInfo: function(businessType) {
            const businesses = {
                concrete: {
                    name: 'Superior Concrete Leveling LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com',
                    website: 'superiorconcrete.com'
                },
                masonry: {
                    name: 'J. Stark Masonry & Construction LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com',
                    website: 'jstarkmasonry.com'
                }
            };
            
            return businesses[businessType] || businesses.concrete;
        },
        
        trackEmailSend: function(invoice, email, status, error = null) {
            try {
                const history = this.getEmailHistory();
                const record = {
                    id: Date.now().toString(),
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.number,
                    recipientEmail: email,
                    recipientName: invoice.customerName,
                    businessType: invoice.businessType,
                    status: status, // 'sent', 'failed'
                    timestamp: new Date().toISOString(),
                    error: error
                };
                
                history.push(record);
                
                // Keep only last 100 records
                if (history.length > 100) {
                    history.splice(0, history.length - 100);
                }
                
                localStorage.setItem('jstark_email_history', JSON.stringify(history));
                
                // Update invoice with email status
                this.updateInvoiceEmailStatus(invoice.id, status, record.timestamp);
                
            } catch (error) {
                console.error('Error tracking email send:', error);
            }
        },
        
        getEmailHistory: function() {
            try {
                const stored = localStorage.getItem('jstark_email_history');
                return stored ? JSON.parse(stored) : [];
            } catch (error) {
                console.error('Error loading email history:', error);
                return [];
            }
        },
        
        updateInvoiceEmailStatus: function(invoiceId, status, timestamp) {
            try {
                if (window.StorageManager) {
                    const invoices = window.StorageManager.loadInvoices();
                    const invoice = invoices.find(inv => inv.id === invoiceId);
                    
                    if (invoice) {
                        invoice.emailStatus = status;
                        invoice.lastEmailSent = timestamp;
                        
                        if (status === 'sent' && invoice.status === 'draft') {
                            invoice.status = 'sent';
                        }
                        
                        window.StorageManager.saveInvoices(invoices);
                    }
                }
            } catch (error) {
                console.error('Error updating invoice email status:', error);
            }
        },
        
        formatCurrency: function(amount) {
            try {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(amount || 0);
            } catch (error) {
                return '$' + (amount || 0).toFixed(2);
            }
        },
        
        formatDate: function(date) {
            try {
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                return date;
            }
        },
        
        // Estimate-specific email methods
        prepareEstimateEmailParams: function(estimate, pdfBase64, options = {}) {
            const businessInfo = this.getBusinessInfo(estimate.businessType);
            const template = options.template || 'estimate';
            const templateData = this.templates[template];
            
            // Calculate valid until date (30 days from estimate date)
            const validUntil = new Date(estimate.date);
            validUntil.setDate(validUntil.getDate() + 30);
            
            const params = {
                to_email: estimate.customerEmail,
                to_name: estimate.customerName,
                from_name: businessInfo.name,
                estimate_number: estimate.number || 'DRAFT',
                estimate_date: this.formatDate(estimate.date),
                estimate_amount: this.formatCurrency(estimate.total),
                valid_until: this.formatDate(validUntil.toISOString().split('T')[0]),
                customer_name: estimate.customerName,
                business_name: businessInfo.name,
                business_address: businessInfo.address,
                business_phone: businessInfo.phone,
                business_email: businessInfo.email,
                attachment: pdfBase64,
                timeline: options.timeline || '1-2 weeks (weather permitting)',
                approval_date: estimate.signatureTimestamp ? this.formatDate(estimate.signatureTimestamp) : '',
                subject: this.processTemplate(templateData.subject, {
                    estimate_number: estimate.number || 'DRAFT',
                    business_name: businessInfo.name
                }),
                message: options.message || this.processTemplate(templateData.message, {
                    customer_name: estimate.customerName,
                    estimate_number: estimate.number || 'DRAFT',
                    estimate_date: this.formatDate(estimate.date),
                    estimate_amount: this.formatCurrency(estimate.total),
                    valid_until: this.formatDate(validUntil.toISOString().split('T')[0]),
                    business_name: businessInfo.name,
                    business_address: businessInfo.address,
                    business_phone: businessInfo.phone,
                    timeline: options.timeline || '1-2 weeks (weather permitting)',
                    approval_date: estimate.signatureTimestamp ? this.formatDate(estimate.signatureTimestamp) : ''
                })
            };
            
            return params;
        },
        
        sendEstimate: async function(estimate, options = {}) {
            try {
                if (!this.isConfigured()) {
                    throw new Error('Email service not configured');
                }
                
                if (!estimate.customerEmail) {
                    throw new Error('Customer email address is required');
                }
                
                // Check network status
                if (window.NetworkManager && !window.NetworkManager.isOnline) {
                    return this.handleOfflineEmail(estimate, options, 'estimate');
                }
                
                // Show sending notification
                let sendingNotificationId = null;
                if (window.NotificationSystem && options.showProgress !== false) {
                    sendingNotificationId = window.NotificationSystem.showLoading(`Sending estimate to ${estimate.customerEmail}...`, {
                        closable: false
                    });
                }
                
                try {
                    // Generate PDF if requested
                    let pdfBase64 = null;
                    if (options.includePDF !== false) {
                        if (window.PDFGenerator) {
                            pdfBase64 = await window.PDFGenerator.generateEstimateBase64(estimate);
                        } else {
                            pdfBase64 = this.createSimpleEstimatePDF(estimate);
                        }
                    }
                    
                    // Prepare email parameters
                    const emailParams = this.prepareEstimateEmailParams(estimate, pdfBase64, options);
                    
                    // Send email with retry
                    const response = await this.sendEmailWithRetry(emailParams, {
                        maxRetries: 3,
                        retryDelay: 2000,
                        showRetryNotification: true
                    });
                    
                    // Dismiss loading notification
                    if (sendingNotificationId && window.NotificationSystem) {
                        window.NotificationSystem.dismiss(sendingNotificationId);
                    }
                    
                    // Track email send
                    this.trackEstimateEmailSend(estimate, estimate.customerEmail, 'sent');
                    
                    // Show success notification
                    if (window.NotificationSystem) {
                        window.NotificationSystem.showSuccess(`Estimate sent to ${estimate.customerEmail}`, {
                            title: 'Email Sent',
                            duration: 5000
                        });
                    }
                    
                    return {
                        success: true,
                        response: response
                    };
                    
                } catch (networkError) {
                    // Dismiss loading notification
                    if (sendingNotificationId && window.NotificationSystem) {
                        window.NotificationSystem.dismiss(sendingNotificationId);
                    }
                    
                    // Handle network-specific errors
                    if (this.isNetworkError(networkError)) {
                        return this.handleNetworkError(estimate, options, networkError, 'estimate');
                    } else {
                        throw networkError; // Re-throw non-network errors
                    }
                }
                
            } catch (error) {
                console.error('Send estimate error:', error);
                
                // Track failed send
                this.trackEstimateEmailSend(estimate, estimate.customerEmail, 'failed', error.message);
                
                // Show user-friendly error
                if (window.NotificationSystem) {
                    window.NotificationSystem.showError(
                        this.getUserFriendlyErrorMessage(error), 
                        {
                            title: 'Email Failed',
                            duration: 8000,
                            actions: [{
                                text: 'Retry',
                                primary: true,
                                callback: `EmailService.sendEstimate(${JSON.stringify(estimate)}, ${JSON.stringify(options)})`
                            }]
                        }
                    );
                }
                
                return {
                    success: false,
                    error: error.message || 'Failed to send estimate'
                };
            }
        },
        
        createSimpleEstimatePDF: function(estimate) {
            // Create a simple base64 PDF as fallback
            const content = this.generatePlainTextEstimate(estimate);
            return btoa(content); // Simple base64 encoding
        },
        
        generatePlainTextEstimate: function(estimate) {
            const businessInfo = this.getBusinessInfo(estimate.businessType);
            
            return `
${businessInfo.name}
${businessInfo.address}
Phone: ${businessInfo.phone} | Email: ${businessInfo.email}

WORK ESTIMATE #${estimate.number || 'DRAFT'}
Date: ${this.formatDate(estimate.date)}
Status: ${(estimate.status || 'draft').toUpperCase()}

Estimate For:
${estimate.customerName}
${estimate.customerEmail ? `Email: ${estimate.customerEmail}` : ''}
${estimate.customerPhone ? `Phone: ${estimate.customerPhone}` : ''}
${estimate.customerAddress ? `Address: ${estimate.customerAddress}` : ''}

Services:
${estimate.services.map(service => {
    if (service.details && service.details.jobPricing) {
        return `${service.description} - 1 job x ${this.formatCurrency(service.amount)} = ${this.formatCurrency(service.amount)}`;
    } else {
        return `${service.description} - ${service.quantity} ${service.unit} x ${this.formatCurrency(service.rate)} = ${this.formatCurrency(service.amount)}`;
    }
}).join('\n')}

Subtotal: ${this.formatCurrency(estimate.subtotal)}
Estimated Total: ${this.formatCurrency(estimate.total)}

${estimate.notes ? `Terms & Conditions: ${estimate.notes}` : ''}

${estimate.signature && estimate.signatureCustomerName ? `\nCUSTOMER APPROVAL:\nSigned by: ${estimate.signatureCustomerName}\nSigned on: ${new Date(estimate.signatureTimestamp).toLocaleString()}\nStatus: APPROVED` : '\nCUSTOMER APPROVAL: PENDING'}

Estimate Terms:
This estimate is valid for 30 days from the date issued.
Final pricing may vary based on actual site conditions and material costs.
Work will begin upon customer approval and signed agreement.

Thank you for considering our services!
            `.trim();
        },
        
        trackEstimateEmailSend: function(estimate, email, status, error = null) {
            try {
                const history = this.getEmailHistory();
                const record = {
                    id: Date.now().toString(),
                    type: 'estimate',
                    estimateId: estimate.id,
                    estimateNumber: estimate.number,
                    recipientEmail: email,
                    recipientName: estimate.customerName,
                    businessType: estimate.businessType,
                    status: status, // 'sent', 'failed'
                    timestamp: new Date().toISOString(),
                    error: error
                };
                
                history.push(record);
                
                // Keep only last 100 records
                if (history.length > 100) {
                    history.splice(0, history.length - 100);
                }
                
                localStorage.setItem('jstark_email_history', JSON.stringify(history));
                
                // Update estimate with email status
                this.updateEstimateEmailStatus(estimate.id, status, record.timestamp);
                
            } catch (error) {
                console.error('Error tracking estimate email send:', error);
            }
        },
        
        updateEstimateEmailStatus: function(estimateId, status, timestamp) {
            try {
                if (window.App && window.App.AppState) {
                    const estimate = window.App.AppState.estimates.find(est => est.id === estimateId);
                    
                    if (estimate) {
                        estimate.emailStatus = status;
                        estimate.lastEmailSent = timestamp;
                        
                        if (status === 'sent' && estimate.status === 'draft') {
                            estimate.status = 'sent';
                        }
                        
                        window.App.saveData();
                    }
                }
            } catch (error) {
                console.error('Error updating estimate email status:', error);
            }
        },
        
        // Utility functions for email dialog
        showEmailDialog: function(invoice, type = 'invoice') {
            if (!this.isConfigured()) {
                if (window.App) {
                    window.App.showError('Email service not configured. Please set up EmailJS credentials in settings.');
                } else {
                    alert('Email service not configured. Please set up EmailJS credentials in settings.');
                }
                return;
            }
            
            const customerEmail = type === 'estimate' ? invoice.customerEmail : invoice.customerEmail;
            if (!customerEmail) {
                if (window.App) {
                    window.App.showError(`Customer email address is required to send ${type}.`);
                } else {
                    alert(`Customer email address is required to send ${type}.`);
                }
                return;
            }
            
            // Show email dialog
            this.createEmailDialog(invoice, type);
        },
        
        createEmailDialog: function(invoice, type = 'invoice') {
            // Create modal dialog for email sending
            const isEstimate = type === 'estimate';
            const businessInfo = this.getBusinessInfo(invoice.businessType);
            const templateKey = isEstimate ? 'estimate' : 'invoice';
            const documentType = isEstimate ? 'Estimate' : 'Invoice';
            const documentNumber = isEstimate ? `Estimate #${invoice.number || 'DRAFT'}` : `Invoice #${invoice.number || 'DRAFT'}`;
            
            const dialog = document.createElement('div');
            dialog.className = 'email-dialog-overlay';
            dialog.innerHTML = `
                <div class="email-dialog">
                    <div class="email-dialog-header">
                        <h3>Send ${documentType} via Email</h3>
                        <button class="close-dialog" onclick="this.closest('.email-dialog-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="email-dialog-content">
                        <div class="email-form">
                            <div class="form-group">
                                <label for="email-to">To:</label>
                                <input type="email" id="email-to" value="${invoice.customerEmail}" required>
                            </div>
                            <div class="form-group">
                                <label for="email-subject">Subject:</label>
                                <input type="text" id="email-subject" value="${documentNumber} from ${businessInfo.name}" required>
                            </div>
                            <div class="form-group">
                                <label for="email-message">Message:</label>
                                <textarea id="email-message" rows="8">${this.processTemplate(this.templates[templateKey].message, {
                                    customer_name: invoice.customerName,
                                    [isEstimate ? 'estimate_number' : 'invoice_number']: invoice.number || 'DRAFT',
                                    [isEstimate ? 'estimate_date' : 'invoice_date']: this.formatDate(invoice.date),
                                    [isEstimate ? 'estimate_amount' : 'invoice_amount']: this.formatCurrency(invoice.total),
                                    business_name: businessInfo.name,
                                    business_address: businessInfo.address,
                                    business_phone: businessInfo.phone,
                                    ...(isEstimate && {
                                        valid_until: this.formatDate(new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                                    }),
                                    ...(!isEstimate && {
                                        due_date: this.formatDate(new Date(new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                                    })
                                })}</textarea>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="email-pdf-attachment" checked>
                                    Include PDF attachment
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="email-dialog-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.email-dialog-overlay').remove()">Cancel</button>
                        <button class="btn btn-primary" onclick="EmailService.sendFromDialog('${invoice.id}', '${type}')">
                            <i class="fas fa-paper-plane"></i> Send ${documentType}
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            // Focus the email field
            setTimeout(() => {
                document.getElementById('email-to').focus();
            }, 100);
        },
        
        sendFromDialog: async function(invoiceId) {
            try {
                // Get invoice data
                const invoice = window.StorageManager ? 
                    window.StorageManager.getInvoiceById(invoiceId) : 
                    null;
                
                if (!invoice) {
                    throw new Error('Invoice not found');
                }
                
                // Get form data
                const toEmail = document.getElementById('email-to').value;
                const subject = document.getElementById('email-subject').value;
                const message = document.getElementById('email-message').value;
                const includePDF = document.getElementById('email-pdf-attachment').checked;
                
                if (!toEmail || !subject) {
                    throw new Error('Email address and subject are required');
                }
                
                // Show loading
                const sendButton = event.target;
                const originalText = sendButton.innerHTML;
                sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                sendButton.disabled = true;
                
                // Send email
                const result = await this.sendInvoice(invoice, {
                    message: message,
                    includePDF: includePDF
                });
                
                if (result.success) {
                    // Close dialog
                    document.querySelector('.email-dialog-overlay').remove();
                    
                    // Show success message
                    if (window.App) {
                        window.App.showSuccess('Invoice sent successfully!');
                    } else {
                        alert('Invoice sent successfully!');
                    }
                    
                    // Update UI
                    if (window.App && window.App.updateDashboard) {
                        window.App.updateDashboard();
                    }
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                console.error('Send from dialog error:', error);
                
                // Restore button
                const sendButton = event.target;
                sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Send Invoice';
                sendButton.disabled = false;
                
                // Show error
                if (window.App) {
                    window.App.showError('Failed to send email: ' + error.message);
                } else {
                    alert('Failed to send email: ' + error.message);
                }
            }
        },
        
        // Settings dialog
        showSettingsDialog: function() {
            const settings = this.loadSettings();
            const emailConfig = settings.emailjs || {};
            
            const dialog = document.createElement('div');
            dialog.className = 'email-dialog-overlay';
            dialog.innerHTML = `
                <div class="email-dialog">
                    <div class="email-dialog-header">
                        <h3>Email Settings</h3>
                        <button class="close-dialog" onclick="this.closest('.email-dialog-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="email-dialog-content">
                        <div class="email-form">
                            <div class="form-group">
                                <label for="emailjs-service-id">EmailJS Service ID:</label>
                                <input type="text" id="emailjs-service-id" value="${emailConfig.serviceId || ''}" 
                                       placeholder="service_xxxxxxx" required>
                                <small style="color: #666; font-size: 0.85em;">Your EmailJS service ID from the EmailJS dashboard</small>
                            </div>
                            <div class="form-group">
                                <label for="emailjs-template-id">EmailJS Template ID:</label>
                                <input type="text" id="emailjs-template-id" value="${emailConfig.templateId || ''}" 
                                       placeholder="template_xxxxxxx" required>
                                <small style="color: #666; font-size: 0.85em;">Your EmailJS template ID for invoice emails</small>
                            </div>
                            <div class="form-group">
                                <label for="emailjs-public-key">EmailJS Public Key:</label>
                                <input type="text" id="emailjs-public-key" value="${emailConfig.publicKey || ''}" 
                                       placeholder="Your public key" required>
                                <small style="color: #666; font-size: 0.85em;">Your EmailJS public key (not the private key)</small>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="emailjs-test-mode" ${emailConfig.testMode ? 'checked' : ''}>
                                    Test mode (emails won't be sent)
                                </label>
                            </div>
                            <div class="setup-instructions" style="background: #f9f9f9; padding: 1rem; border-radius: 4px; margin-top: 1rem;">
                                <h4 style="margin-top: 0; color: #333;">Setup Instructions:</h4>
                                <ol style="margin-bottom: 0; padding-left: 1.5rem;">
                                    <li>Create a free account at <a href="https://www.emailjs.com" target="_blank" style="color: #DC143C;">EmailJS.com</a></li>
                                    <li>Add your email service (Gmail, Outlook, etc.)</li>
                                    <li>Create an email template with variables: to_email, to_name, from_name, invoice_number, invoice_date, invoice_amount, message, attachment</li>
                                    <li>Copy your Service ID, Template ID, and Public Key here</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    <div class="email-dialog-actions">
                        <button class="btn btn-secondary" onclick="EmailService.testEmailConfig()">Test Configuration</button>
                        <button class="btn btn-secondary" onclick="this.closest('.email-dialog-overlay').remove()">Cancel</button>
                        <button class="btn btn-primary" onclick="EmailService.saveEmailConfig()">Save Settings</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            // Focus the first input
            setTimeout(() => {
                document.getElementById('emailjs-service-id').focus();
            }, 100);
        },
        
        saveEmailConfig: function() {
            try {
                const serviceId = document.getElementById('emailjs-service-id').value.trim();
                const templateId = document.getElementById('emailjs-template-id').value.trim();
                const publicKey = document.getElementById('emailjs-public-key').value.trim();
                const testMode = document.getElementById('emailjs-test-mode').checked;
                
                if (!serviceId || !templateId || !publicKey) {
                    throw new Error('All fields are required');
                }
                
                // Save configuration
                const success = this.configureEmailJS(serviceId, templateId, publicKey);
                if (success) {
                    // Save additional settings
                    const settings = this.loadSettings();
                    settings.emailjs.testMode = testMode;
                    this.saveSettings(settings);
                    
                    // Close dialog
                    document.querySelector('.email-dialog-overlay').remove();
                    
                    // Show success message
                    if (window.App) {
                        window.App.showSuccess('Email settings saved successfully!');
                    } else {
                        alert('Email settings saved successfully!');
                    }
                } else {
                    throw new Error('Failed to configure EmailJS');
                }
                
            } catch (error) {
                console.error('Save email config error:', error);
                if (window.App) {
                    window.App.showError('Failed to save settings: ' + error.message);
                } else {
                    alert('Failed to save settings: ' + error.message);
                }
            }
        },
        
        testEmailConfig: function() {
            try {
                const serviceId = document.getElementById('emailjs-service-id').value.trim();
                const templateId = document.getElementById('emailjs-template-id').value.trim();
                const publicKey = document.getElementById('emailjs-public-key').value.trim();
                
                if (!serviceId || !templateId || !publicKey) {
                    throw new Error('Please fill in all fields before testing');
                }
                
                // Show test in progress
                if (window.App) {
                    window.App.showSuccess('Testing email configuration...');
                } else {
                    alert('Testing email configuration...');
                }
                
                // Initialize EmailJS with test credentials
                emailjs.init(publicKey);
                
                // Send test email
                const testParams = {
                    to_email: 'test@example.com',
                    to_name: 'Test Customer',
                    from_name: 'J. Stark Business',
                    invoice_number: 'TEST-001',
                    invoice_date: this.formatDate(new Date().toISOString().split('T')[0]),
                    invoice_amount: this.formatCurrency(100),
                    message: 'This is a test email from your invoicing system.',
                    attachment: 'VGVzdCBhdHRhY2htZW50IGNvbnRlbnQ=' // Base64 for "Test attachment content"
                };
                
                emailjs.send(serviceId, templateId, testParams)
                    .then((response) => {
                        console.log('Test email sent successfully:', response);
                        if (window.App) {
                            window.App.showSuccess('Test email sent successfully! Check your email.');
                        } else {
                            alert('Test email sent successfully! Check your email.');
                        }
                    })
                    .catch((error) => {
                        console.error('Test email failed:', error);
                        if (window.App) {
                            window.App.showError('Test email failed: ' + (error.text || error.message));
                        } else {
                            alert('Test email failed: ' + (error.text || error.message));
                        }
                    });
                
            } catch (error) {
                console.error('Test email config error:', error);
                if (window.App) {
                    window.App.showError('Failed to test configuration: ' + error.message);
                } else {
                    alert('Failed to test configuration: ' + error.message);
                }
            }
        },
        
        // Network error handling methods
        sendEmailWithRetry: async function(params, retryOptions = {}) {
            const config = {
                maxRetries: 3,
                retryDelay: 2000,
                showRetryNotification: false,
                ...retryOptions
            };
            
            let lastError = null;
            
            for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
                try {
                    console.log(`📧 Email attempt ${attempt}/${config.maxRetries}`);
                    
                    // Use NetworkManager's fetch with retry if available
                    if (window.NetworkManager && window.NetworkManager.fetchWithRetry) {
                        // For EmailJS, we need to use their send method, but we can wrap it
                        const response = await this.sendWithTimeout(params, 30000); // 30 second timeout
                        return response;
                    } else {
                        // Fallback to direct EmailJS call
                        const response = await emailjs.send(
                            this.config.serviceId,
                            this.config.templateId,
                            params
                        );
                        return response;
                    }
                    
                } catch (error) {
                    lastError = error;
                    console.log(`❌ Email attempt ${attempt} failed:`, error.message);
                    
                    // Don't retry on non-network errors
                    if (!this.isNetworkError(error) || attempt === config.maxRetries) {
                        break;
                    }
                    
                    // Show retry notification
                    if (config.showRetryNotification && window.NotificationSystem) {
                        window.NotificationSystem.showInfo(`Email failed, retrying... (${attempt}/${config.maxRetries})`, {
                            duration: config.retryDelay
                        });
                    }
                    
                    // Wait before retry with exponential backoff
                    const delay = config.retryDelay * Math.pow(2, attempt - 1);
                    await this.delay(delay);
                }
            }
            
            throw lastError;
        },
        
        sendWithTimeout: function(params, timeout = 30000) {
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Email sending timeout'));
                }, timeout);
                
                emailjs.send(this.config.serviceId, this.config.templateId, params)
                    .then(response => {
                        clearTimeout(timeoutId);
                        resolve(response);
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
            });
        },
        
        isNetworkError: function(error) {
            const networkErrorPatterns = [
                'network',
                'fetch',
                'timeout',
                'connection',
                'offline',
                'unreachable',
                'service unavailable',
                'gateway timeout',
                'bad gateway'
            ];
            
            const errorMessage = (error.message || error.text || '').toLowerCase();
            return networkErrorPatterns.some(pattern => errorMessage.includes(pattern));
        },
        
        handleOfflineEmail: function(invoice, options, type = 'invoice') {
            console.log('📴 Handling offline email for:', type, invoice.customerEmail);
            
            // Queue the email operation
            if (window.QueueManager) {
                const emailOperation = () => {
                    if (type === 'invoice') {
                        return this.sendInvoice(invoice, { ...options, showProgress: false });
                    } else {
                        return this.sendEstimate(invoice, { ...options, showProgress: false });
                    }
                };
                
                const operationId = window.QueueManager.queueEmail(emailOperation, {
                    description: `Send ${type} to ${invoice.customerEmail}`,
                    data: { invoiceId: invoice.id, customerEmail: invoice.customerEmail, type: type },
                    maxRetries: 5
                });
                
                if (window.NotificationSystem) {
                    window.NotificationSystem.showWarning(`No internet connection. ${type} will be sent automatically when connection returns.`, {
                        title: 'Queued for Later',
                        duration: 8000,
                        actions: [{
                            text: 'View Queue',
                            callback: 'QueueManager.showProcessingReport()'
                        }]
                    });
                }
                
                return {
                    success: true,
                    queued: true,
                    operationId: operationId,
                    message: `${type} queued for sending when connection returns`
                };
            } else {
                // Fallback: store in localStorage for manual retry
                this.storeFailedEmail(invoice, options, type);
                
                if (window.NotificationSystem) {
                    window.NotificationSystem.showError(`No internet connection. Please try sending the ${type} again when connection returns.`, {
                        title: 'Offline',
                        duration: 10000
                    });
                }
                
                return {
                    success: false,
                    offline: true,
                    error: 'No internet connection'
                };
            }
        },
        
        handleNetworkError: function(invoice, options, error, type = 'invoice') {
            console.log('🌐 Handling network error for email:', error.message);
            
            // Track the error
            if (window.ErrorLogger) {
                window.ErrorLogger.logError('Email network error', window.ERROR_CATEGORIES.NETWORK, {
                    type: type,
                    customerEmail: invoice.customerEmail,
                    error: error.message,
                    invoiceId: invoice.id
                });
            }
            
            // Queue for retry if queue manager is available
            if (window.QueueManager) {
                const emailOperation = () => {
                    if (type === 'invoice') {
                        return this.sendInvoice(invoice, { ...options, showProgress: false });
                    } else {
                        return this.sendEstimate(invoice, { ...options, showProgress: false });
                    }
                };
                
                const operationId = window.QueueManager.queueEmail(emailOperation, {
                    description: `Retry ${type} to ${invoice.customerEmail}`,
                    data: { invoiceId: invoice.id, customerEmail: invoice.customerEmail, type: type },
                    priority: window.PRIORITY ? window.PRIORITY.HIGH : 'high'
                });
                
                if (window.NotificationSystem) {
                    window.NotificationSystem.showWarning(`Network error sending ${type}. Will retry automatically.`, {
                        title: 'Send Failed',
                        duration: 8000,
                        actions: [
                            {
                                text: 'Retry Now',
                                primary: true,
                                callback: `EmailService.${type === 'invoice' ? 'sendInvoice' : 'sendEstimate'}(${JSON.stringify(invoice)}, ${JSON.stringify(options)})`
                            },
                            {
                                text: 'View Queue',
                                callback: 'QueueManager.showProcessingReport()'
                            }
                        ]
                    });
                }
                
                return {
                    success: false,
                    queued: true,
                    operationId: operationId,
                    error: error.message
                };
            } else {
                // No queue manager, just show error with retry option
                if (window.NotificationSystem) {
                    window.NotificationSystem.showError(this.getUserFriendlyErrorMessage(error), {
                        title: 'Network Error',
                        duration: 10000,
                        actions: [{
                            text: 'Retry',
                            primary: true,
                            callback: `EmailService.${type === 'invoice' ? 'sendInvoice' : 'sendEstimate'}(${JSON.stringify(invoice)}, ${JSON.stringify(options)})`
                        }]
                    });
                }
                
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        getUserFriendlyErrorMessage: function(error) {
            const errorMessage = (error.message || error.text || '').toLowerCase();
            
            // Network-related errors
            if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                return 'Unable to connect to email service. Please check your internet connection.';
            }
            
            if (errorMessage.includes('timeout')) {
                return 'Email sending timed out. Your internet connection may be slow.';
            }
            
            if (errorMessage.includes('service unavailable') || errorMessage.includes('server error')) {
                return 'Email service is temporarily unavailable. Please try again in a few minutes.';
            }
            
            // EmailJS-specific errors
            if (errorMessage.includes('invalid_user_id') || errorMessage.includes('invalid_service_id')) {
                return 'Email configuration error. Please check your EmailJS settings.';
            }
            
            if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
                return 'Email sending limit reached. Please try again later or upgrade your plan.';
            }
            
            if (errorMessage.includes('blocked') || errorMessage.includes('spam')) {
                return 'Email was blocked. Please check the recipient address and try again.';
            }
            
            // Generic fallback
            return 'Failed to send email. Please check your connection and try again.';
        },
        
        storeFailedEmail: function(invoice, options, type) {
            try {
                const failedEmails = JSON.parse(localStorage.getItem('jstark_failed_emails') || '[]');
                
                failedEmails.push({
                    id: Date.now().toString(),
                    invoice: invoice,
                    options: options,
                    type: type,
                    timestamp: new Date().toISOString(),
                    customerEmail: invoice.customerEmail
                });
                
                // Keep only last 50 failed emails
                if (failedEmails.length > 50) {
                    failedEmails.splice(0, failedEmails.length - 50);
                }
                
                localStorage.setItem('jstark_failed_emails', JSON.stringify(failedEmails));
                
            } catch (error) {
                console.error('Error storing failed email:', error);
            }
        },
        
        getFailedEmails: function() {
            try {
                return JSON.parse(localStorage.getItem('jstark_failed_emails') || '[]');
            } catch (error) {
                console.error('Error loading failed emails:', error);
                return [];
            }
        },
        
        retryFailedEmails: function() {
            const failedEmails = this.getFailedEmails();
            
            if (failedEmails.length === 0) {
                if (window.NotificationSystem) {
                    window.NotificationSystem.showInfo('No failed emails to retry.', {
                        title: 'Email Retry'
                    });
                }
                return;
            }
            
            if (window.NotificationSystem) {
                window.NotificationSystem.showInfo(`Retrying ${failedEmails.length} failed emails...`, {
                    title: 'Email Retry'
                });
            }
            
            // Process each failed email
            failedEmails.forEach(async (failedEmail, index) => {
                try {
                    await this.delay(index * 1000); // Stagger retries
                    
                    if (failedEmail.type === 'invoice') {
                        await this.sendInvoice(failedEmail.invoice, failedEmail.options);
                    } else {
                        await this.sendEstimate(failedEmail.invoice, failedEmail.options);
                    }
                    
                    // Remove from failed list if successful
                    this.removeFailedEmail(failedEmail.id);
                    
                } catch (error) {
                    console.error('Retry failed for email:', failedEmail.id, error);
                }
            });
        },
        
        removeFailedEmail: function(failedEmailId) {
            try {
                const failedEmails = this.getFailedEmails();
                const filtered = failedEmails.filter(email => email.id !== failedEmailId);
                localStorage.setItem('jstark_failed_emails', JSON.stringify(filtered));
            } catch (error) {
                console.error('Error removing failed email:', error);
            }
        },
        
        delay: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            EmailService.init();
        });
    } else {
        EmailService.init();
    }
    
    // Export for global access
    window.EmailService = EmailService;
    
})();