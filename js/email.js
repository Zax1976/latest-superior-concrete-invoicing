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
                
                // Check if user wants to include attachment or use alternative method
                const sendMethod = options.method || 'with_attachment';
                
                if (sendMethod === 'with_attachment') {
                    return await this.sendWithAttachment(invoice, options);
                } else if (sendMethod === 'link_only') {
                    return await this.sendWithLink(invoice, options);
                } else {
                    return await this.sendPlainText(invoice, options);
                }
                
            } catch (error) {
                console.error('Send invoice email error:', error);
                
                // Track failed send
                if (invoice) {
                    this.trackEmailSend(invoice, invoice.customerEmail, 'failed', error.message);
                }
                
                return {
                    success: false,
                    error: error.message || 'Failed to send email'
                };
            }
        },
        
        sendWithAttachment: async function(invoice, options = {}) {
            try {
                // Generate PDF as base64
                const pdfBase64 = await this.generatePDFBase64(invoice);
                if (!pdfBase64) {
                    throw new Error('Failed to generate PDF attachment');
                }
                
                // Prepare email parameters with attachment
                const params = this.prepareEmailParams(invoice, pdfBase64, options);
                
                // Send email via EmailJS
                const response = await emailjs.send(
                    this.config.serviceId,
                    this.config.templateId,
                    params
                );
                
                // Track email send
                this.trackEmailSend(invoice, params.to_email, 'sent');
                
                console.log('Invoice email sent successfully with attachment:', response);
                return {
                    success: true,
                    response: response,
                    emailId: response.text || Date.now().toString(),
                    method: 'attachment'
                };
                
            } catch (error) {
                // If attachment fails (common with free EmailJS), try alternative method
                if (error.message.includes('attachment') || error.message.includes('size') || error.message.includes('quota')) {
                    console.log('Attachment failed, trying link method...');
                    return await this.sendWithLink(invoice, { ...options, fallback: true });
                }
                throw error;
            }
        },
        
        sendWithLink: async function(invoice, options = {}) {
            try {
                // Create a shareable invoice link (using localStorage + URL)
                const shareId = this.createShareableInvoice(invoice);
                const shareUrl = `${window.location.origin}${window.location.pathname}#share=${shareId}`;
                
                // Prepare email parameters with link
                const params = this.prepareEmailParamsWithLink(invoice, shareUrl, options);
                
                // Send email via EmailJS
                const response = await emailjs.send(
                    this.config.serviceId,
                    this.config.templateId,
                    params
                );
                
                // Track email send
                this.trackEmailSend(invoice, params.to_email, 'sent');
                
                const successMessage = options.fallback ? 
                    'Invoice email sent with view link (attachment too large for free plan)' :
                    'Invoice email sent with view link';
                
                console.log(successMessage, response);
                return {
                    success: true,
                    response: response,
                    emailId: response.text || Date.now().toString(),
                    method: 'link',
                    shareUrl: shareUrl
                };
                
            } catch (error) {
                console.log('Link method failed, trying plain text...');
                return await this.sendPlainText(invoice, { ...options, fallback: true });
            }
        },
        
        sendPlainText: async function(invoice, options = {}) {
            try {
                // Prepare email parameters with plain text invoice
                const params = this.prepareEmailParamsPlainText(invoice, options);
                
                // Send email via EmailJS
                const response = await emailjs.send(
                    this.config.serviceId,
                    this.config.templateId,
                    params
                );
                
                // Track email send
                this.trackEmailSend(invoice, params.to_email, 'sent');
                
                const successMessage = options.fallback ? 
                    'Invoice email sent as plain text (fallback method)' :
                    'Invoice email sent as plain text';
                
                console.log(successMessage, response);
                return {
                    success: true,
                    response: response,
                    emailId: response.text || Date.now().toString(),
                    method: 'plain_text'
                };
                
            } catch (error) {
                throw error;
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
                        <p><strong>Tax (8.25%): ${this.formatCurrency(invoice.tax)}</strong></p>
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
Tax (8.25%): ${this.formatCurrency(invoice.tax)}
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
        
        // Utility functions for email dialog
        showEmailDialog: function(invoice) {
            if (!this.isConfigured()) {
                if (window.App) {
                    window.App.showError('Email hasn\'t been set up yet. Click the Settings button to configure email.');
                } else {
                    alert('Email service not configured. Please set up EmailJS credentials in settings.');
                }
                return;
            }
            
            if (!invoice.customerEmail) {
                if (window.App) {
                    window.App.showError('Please add the customer\'s email address before sending the invoice.');
                } else {
                    alert('Customer email address is required to send invoice.');
                }
                return;
            }
            
            // Show email dialog (to be implemented in UI phase)
            this.createEmailDialog(invoice);
        },
        
        createEmailDialog: function(invoice) {
            // Create modal dialog for email sending
            const dialog = document.createElement('div');
            dialog.className = 'email-dialog-overlay';
            dialog.innerHTML = `
                <div class="email-dialog">
                    <div class="email-dialog-header">
                        <h3>Send Invoice via Email</h3>
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
                                <input type="text" id="email-subject" value="Invoice #${invoice.number || 'DRAFT'} from ${this.getBusinessInfo(invoice.businessType).name}" required>
                            </div>
                            <div class="form-group">
                                <label for="email-message">Message:</label>
                                <textarea id="email-message" rows="8">${this.templates.invoice.message}</textarea>
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
                        <button class="btn btn-primary" onclick="EmailService.sendFromDialog('${invoice.id}')">
                            <i class="fas fa-paper-plane"></i> Send Invoice
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
                    window.App.showError('We couldn\'t send the email. Please check your connection and try again.');
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
                    window.App.showError('We couldn\'t save your settings. Please check your information and try again.');
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
                            window.App.showError('The test email didn\'t go through. Please check your settings and try again.');
                        } else {
                            alert('Test email failed: ' + (error.text || error.message));
                        }
                    });
                
            } catch (error) {
                console.error('Test email config error:', error);
                if (window.App) {
                    window.App.showError('We couldn\'t test your email settings. Please verify your information is correct.');
                } else {
                    alert('Failed to test configuration: ' + error.message);
                }
            }
        },
        
        // Additional helper functions for alternative email methods
        createShareableInvoice: function(invoice) {
            try {
                // Generate a unique share ID
                const shareId = window.SecurityUtils ? 
                    window.SecurityUtils.generateSecureId(16) : 
                    Date.now().toString(36) + Math.random().toString(36).substr(2);
                
                // Store invoice data temporarily for sharing
                const shareData = {
                    invoice: invoice,
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                };
                
                localStorage.setItem(`jstark_share_${shareId}`, JSON.stringify(shareData));
                
                // Clean up old shares
                this.cleanupExpiredShares();
                
                return shareId;
            } catch (error) {
                console.error('Create shareable invoice error:', error);
                return null;
            }
        },
        
        cleanupExpiredShares: function() {
            try {
                const now = new Date();
                const keysToRemove = [];
                
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('jstark_share_')) {
                        try {
                            const shareData = JSON.parse(localStorage.getItem(key));
                            if (shareData.expiresAt && new Date(shareData.expiresAt) < now) {
                                keysToRemove.push(key);
                            }
                        } catch (e) {
                            keysToRemove.push(key); // Remove invalid entries
                        }
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
            } catch (error) {
                console.error('Cleanup expired shares error:', error);
            }
        },
        
        prepareEmailParamsWithLink: function(invoice, shareUrl, options = {}) {
            const businessInfo = this.getBusinessInfo(invoice.businessType);
            const template = options.template || 'invoice_link';
            
            // Calculate due date (30 days from invoice date)
            const dueDate = new Date(invoice.date);
            dueDate.setDate(dueDate.getDate() + 30);
            
            const linkMessage = options.fallback ? 
                `Due to email size limitations, your invoice is available via this secure link: ${shareUrl}\n\nThis link will expire in 7 days for security.` :
                `You can view and download your invoice using this secure link: ${shareUrl}`;
            
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
                invoice_link: shareUrl,
                subject: `Invoice #${invoice.number || 'DRAFT'} from ${businessInfo.name}`,
                message: options.message || `Dear ${invoice.customerName},\n\nPlease find your invoice details below:\n\nInvoice #: ${invoice.number || 'DRAFT'}\nDate: ${this.formatDate(invoice.date)}\nAmount: ${this.formatCurrency(invoice.total)}\nDue Date: ${this.formatDate(dueDate.toISOString().split('T')[0])}\n\n${linkMessage}\n\nThank you for your business!\n\n${businessInfo.name}\n${businessInfo.phone}`
            };
            
            return params;
        },
        
        prepareEmailParamsPlainText: function(invoice, options = {}) {
            const businessInfo = this.getBusinessInfo(invoice.businessType);
            const plainTextInvoice = this.generatePlainTextInvoice(invoice);
            
            // Calculate due date (30 days from invoice date)
            const dueDate = new Date(invoice.date);
            dueDate.setDate(dueDate.getDate() + 30);
            
            const plainTextMessage = options.fallback ? 
                `Your invoice is included below in plain text format:\n\n${plainTextInvoice}` :
                `Please find your invoice details below:\n\n${plainTextInvoice}`;
            
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
                subject: `Invoice #${invoice.number || 'DRAFT'} from ${businessInfo.name}`,
                message: options.message || plainTextMessage
            };
            
            return params;
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