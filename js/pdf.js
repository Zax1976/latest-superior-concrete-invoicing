/**
 * J. Stark Business Invoicing System - PDF Generation
 * Handles PDF export functionality using jsPDF and html2canvas
 */

(function() {
    'use strict';
    
    const PDFGenerator = {
        currentInvoice: null,
        
        init: function() {
            try {
                this.checkDependencies();
                console.log('PDF Generator initialized');
            } catch (error) {
                console.error('PDF Generator initialization error:', error);
            }
        },
        
        checkDependencies: function() {
            // Note: In a production environment, you would include jsPDF and html2canvas libraries
            // For now, we'll implement a fallback using the browser's print functionality
            this.usesPrintFallback = true;
            
            if (typeof window.jsPDF !== 'undefined' && typeof html2canvas !== 'undefined') {
                this.usesPrintFallback = false;
                console.log('PDF libraries loaded successfully');
            } else {
                console.log('PDF libraries not found, using print fallback');
            }
        },
        
        generatePDF: function(invoice, options = {}) {
            try {
                this.currentInvoice = invoice;
                
                // Check if jsPDF is available
                if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined') {
                    this.usesPrintFallback = false;
                    return this.generateWithLibraries(invoice, options);
                } else if (this.usesPrintFallback) {
                    // Warn user about limitations
                    if (window.App && window.App.showError) {
                        window.App.showError('PDF generation is temporarily unavailable. Please use "Print" and select "Save as PDF" in the print dialog.');
                    }
                    return this.generateWithPrint(invoice, options);
                } else {
                    return this.generateWithLibraries(invoice, options);
                }
            } catch (error) {
                console.error('Generate PDF error:', error);
                if (window.App && window.App.showError) {
                    window.App.showError('We couldn\'t create the PDF. Please try printing instead.');
                }
                return false;
            }
        },
        
        generateWithPrint: function(invoice, options = {}) {
            try {
                // Create a temporary print-optimized version
                const printWindow = window.open('', '_blank');
                const invoiceHtml = this.generatePrintableInvoice(invoice);
                
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Invoice #${invoice.number || 'DRAFT'}</title>
                        <meta charset="UTF-8">
                        <style>
                            ${this.getPrintStyles()}
                        </style>
                    </head>
                    <body>
                        ${invoiceHtml}
                        <script>
                            window.onload = function() {
                                if (${options.autoDownload || false}) {
                                    window.print();
                                }
                            };
                        </script>
                    </body>
                    </html>
                `);
                
                printWindow.document.close();
                
                if (options.autoDownload) {
                    setTimeout(() => {
                        printWindow.print();
                        if (options.closeAfterPrint) {
                            setTimeout(() => printWindow.close(), 1000);
                        }
                    }, 500);
                }
                
                return true;
            } catch (error) {
                console.error('Generate with print error:', error);
                return false;
            }
        },
        
        generateWithLibraries: function(invoice, options = {}) {
            try {
                // Check for jsPDF availability with correct global reference
                const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
                
                if (!jsPDF) {
                    throw new Error('jsPDF library not available');
                }
                
                // Create new PDF document
                const pdf = new jsPDF('p', 'mm', 'a4');
                
                // Build invoice content
                const invoiceContent = this.createPrintableInvoice(invoice);
                
                // For simple PDF generation without html2canvas
                if (!window.html2canvas) {
                    // Add text-based content
                    this.addTextContent(pdf, invoice);
                    
                    if (options.format === 'base64') {
                        return Promise.resolve(pdf.output('datauristring').split(',')[1]);
                    } else if (options.format === 'blob') {
                        return Promise.resolve(pdf.output('blob'));
                    } else {
                        // Default: download
                        pdf.save(`Invoice-${invoice.number || 'DRAFT'}-${invoice.customerName.replace(/[^a-zA-Z0-9]/g, '')}.pdf`);
                        return Promise.resolve(true);
                    }
                }
                
                // Use html2canvas if available
                const element = document.getElementById('invoice-preview-content');
                if (!element) {
                    // Create temporary element
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = invoiceContent;
                    tempDiv.style.position = 'absolute';
                    tempDiv.style.left = '-9999px';
                    tempDiv.style.width = '800px';
                    document.body.appendChild(tempDiv);
                    
                    return html2canvas(tempDiv, {
                        scale: 2,
                        useCORS: true
                    }).then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        const imgWidth = 190;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        
                        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                        
                        document.body.removeChild(tempDiv);
                        
                        if (options.format === 'base64') {
                            return pdf.output('datauristring').split(',')[1];
                        } else if (options.format === 'blob') {
                            return pdf.output('blob');
                        } else {
                            pdf.save(`Invoice-${invoice.number || 'DRAFT'}-${invoice.customerName.replace(/[^a-zA-Z0-9]/g, '')}.pdf`);
                            return true;
                        }
                    });
                }
                
                return new Promise((resolve, reject) => {
                    pdf.html(element, {
                        callback: function(pdf) {
                            if (options.format === 'base64') {
                                resolve(pdf.output('datauristring').split(',')[1]);
                            } else if (options.format === 'blob') {
                                resolve(pdf.output('blob'));
                            } else {
                                // Default: download
                                pdf.save(`Invoice-${invoice.number || 'DRAFT'}-${invoice.customerName.replace(/[^a-zA-Z0-9]/g, '')}.pdf`);
                                resolve(true);
                            }
                        },
                        x: 10,
                        y: 10,
                        width: 190,
                        windowWidth: 800,
                        margin: [10, 10, 10, 10]
                    });
                });
            } catch (error) {
                console.error('Generate with libraries error:', error);
                // Fallback to print
                return this.generateWithPrint(invoice, { ...options, autoDownload: true });
            }
        },
        
        // Add text-based PDF content
        addTextContent: function(pdf, invoice) {
            const businessInfo = this.getBusinessInfo(invoice.businessType);
            let yPos = 20;
            
            // Header
            pdf.setFontSize(20);
            pdf.setTextColor(220, 20, 60);
            pdf.text(businessInfo.name, 105, yPos, { align: 'center' });
            
            yPos += 10;
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text(businessInfo.address, 105, yPos, { align: 'center' });
            
            yPos += 5;
            pdf.text(`Phone: ${businessInfo.phone} | Email: ${businessInfo.email}`, 105, yPos, { align: 'center' });
            
            // Invoice details
            yPos += 20;
            pdf.setFontSize(16);
            pdf.text(`INVOICE #${invoice.number || 'DRAFT'}`, 20, yPos);
            
            yPos += 10;
            pdf.setFontSize(10);
            pdf.text(`Date: ${this.formatDate(invoice.date)}`, 20, yPos);
            
            yPos += 5;
            pdf.text(`Status: ${(invoice.status || 'draft').toUpperCase()}`, 20, yPos);
            
            // Customer info
            yPos += 15;
            pdf.setFontSize(12);
            pdf.text('Bill To:', 20, yPos);
            
            yPos += 7;
            pdf.setFontSize(10);
            pdf.text(invoice.customerName, 20, yPos);
            
            if (invoice.customerEmail) {
                yPos += 5;
                pdf.text(`Email: ${invoice.customerEmail}`, 20, yPos);
            }
            
            if (invoice.customerPhone) {
                yPos += 5;
                pdf.text(`Phone: ${invoice.customerPhone}`, 20, yPos);
            }
            
            if (invoice.customerAddress) {
                yPos += 5;
                const lines = pdf.splitTextToSize(invoice.customerAddress, 170);
                lines.forEach(line => {
                    pdf.text(line, 20, yPos);
                    yPos += 5;
                });
            }
            
            // Services
            yPos += 10;
            pdf.setFontSize(12);
            pdf.text('Services:', 20, yPos);
            
            yPos += 7;
            pdf.setFontSize(10);
            invoice.services.forEach(service => {
                pdf.text(`${service.description} - ${service.quantity} ${service.unit} x ${this.formatCurrency(service.rate)} = ${this.formatCurrency(service.amount)}`, 20, yPos);
                yPos += 5;
            });
            
            // Totals
            yPos += 10;
            pdf.text(`Subtotal: ${this.formatCurrency(invoice.subtotal)}`, 150, yPos);
            
            yPos += 5;
            pdf.text(`Tax (8.25%): ${this.formatCurrency(invoice.tax)}`, 150, yPos);
            
            yPos += 5;
            pdf.setFontSize(12);
            pdf.text(`Total: ${this.formatCurrency(invoice.total)}`, 150, yPos);
            
            // Footer
            yPos = 260;
            pdf.setFontSize(10);
            pdf.text('Payment is due within 30 days of invoice date.', 105, yPos, { align: 'center' });
            
            yPos += 5;
            pdf.text(`Make checks payable to: ${businessInfo.name}`, 105, yPos, { align: 'center' });
            
            yPos += 5;
            pdf.text('Thank you for your business!', 105, yPos, { align: 'center' });
        },
        
        // New method for generating base64 PDF
        generateBase64: async function(invoice) {
            try {
                this.currentInvoice = invoice;
                
                if (!this.usesPrintFallback && typeof window.jsPDF !== 'undefined') {
                    return await this.generateWithLibraries(invoice, { format: 'base64' });
                } else {
                    // Fallback: create simple base64 content
                    return this.generateSimpleBase64(invoice);
                }
            } catch (error) {
                console.error('Generate base64 PDF error:', error);
                return null;
            }
        },
        
        generateSimpleBase64: function(invoice) {
            try {
                // Create a simple invoice content as base64
                const content = this.generatePlainTextInvoice(invoice);
                return btoa(unescape(encodeURIComponent(content)));
            } catch (error) {
                console.error('Generate simple base64 error:', error);
                return null;
            }
        },
        
        generatePlainTextInvoice: function(invoice) {
            const businessInfo = this.getBusinessInfo(invoice.businessType);
            
            return `
${businessInfo.name}
${businessInfo.address}
Phone: ${businessInfo.phone}
Email: ${businessInfo.email}

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
        
        generateWithLibrariesOld: function(invoice, options = {}) {
            try {
                const element = document.getElementById('invoice-preview-content');
                if (!element) {
                    throw new Error('Invoice preview content not found');
                }
                
                html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = 210;
                    const pageHeight = 295;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    let heightLeft = imgHeight;
                    
                    let position = 0;
                    
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                    
                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }
                    
                    const filename = `Invoice-${invoice.number || 'DRAFT'}-${invoice.customerName.replace(/[^a-zA-Z0-9]/g, '')}.pdf`;
                    
                    if (options.download) {
                        pdf.save(filename);
                    }
                    
                    return pdf;
                });
                
                return true;
            } catch (error) {
                console.error('Generate with libraries error:', error);
                return false;
            }
        },
        
        generatePrintableInvoice: function(invoice) {
            try {
                const businessInfo = this.getBusinessInfo(invoice.businessType);
                
                return `
                    <div class="invoice-document business-${invoice.businessType}">
                        ${this.generateInvoiceHeader(invoice, businessInfo)}
                        ${this.generateCustomerSection(invoice)}
                        ${this.generateServicesTable(invoice)}
                        ${this.generateTotalsSection(invoice)}
                        ${this.generateNotesSection(invoice)}
                        ${this.generateFooterSection(invoice, businessInfo)}
                    </div>
                `;
            } catch (error) {
                console.error('Generate printable invoice error:', error);
                return '<div>Error generating invoice</div>';
            }
        },
        
        getBusinessInfo: function(businessType) {
            const businesses = {
                concrete: {
                    name: 'Superior Concrete Leveling LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com'
                },
                masonry: {
                    name: 'J. Stark Masonry & Construction LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com'
                }
            };
            
            return businesses[businessType] || businesses.concrete;
        },
        
        generateInvoiceHeader: function(invoice, businessInfo) {
            return `
                <div class="invoice-header">
                    <div class="company-details">
                        <img src="https://i.imgur.com/u294xgL.png" alt="Company Logo" class="company-logo">
                        <h2>${businessInfo.name}</h2>
                        <p>${businessInfo.address}</p>
                        <p>Phone: ${businessInfo.phone}</p>
                        <p>Email: ${businessInfo.email}</p>
                    </div>
                    <div class="invoice-meta">
                        <div class="invoice-number">Invoice #${invoice.number || 'DRAFT'}</div>
                        <div class="invoice-date">Date: ${this.formatDate(invoice.date)}</div>
                        <div class="invoice-status">Status: ${(invoice.status || 'draft').toUpperCase()}</div>
                    </div>
                </div>
            `;
        },
        
        generateCustomerSection: function(invoice) {
            return `
                <div class="customer-section">
                    <h3>Bill To:</h3>
                    <p><strong>${invoice.customerName}</strong></p>
                    ${invoice.customerEmail ? `<p>Email: ${invoice.customerEmail}</p>` : ''}
                    ${invoice.customerPhone ? `<p>Phone: ${invoice.customerPhone}</p>` : ''}
                    ${invoice.customerAddress ? `<div class="customer-address">${invoice.customerAddress.replace(/\\n/g, '<br>')}</div>` : ''}
                </div>
            `;
        },
        
        generateServicesTable: function(invoice) {
            if (!invoice.services || invoice.services.length === 0) {
                return '<div class="no-services">No services added</div>';
            }
            
            const servicesRows = invoice.services.map(service => `
                <tr>
                    <td>${service.description}</td>
                    <td class="amount">${service.quantity}</td>
                    <td class="amount">${service.unit}</td>
                    <td class="amount">${this.formatCurrency(service.rate)}</td>
                    <td class="amount">${this.formatCurrency(service.amount)}</td>
                </tr>
            `).join('');
            
            return `
                <table class="invoice-services-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${servicesRows}
                    </tbody>
                </table>
            `;
        },
        
        generateTotalsSection: function(invoice) {
            return `
                <div class="invoice-totals-section">
                    <table class="invoice-totals-table">
                        <tr>
                            <td class="total-label">Subtotal:</td>
                            <td class="total-amount">${this.formatCurrency(invoice.subtotal)}</td>
                        </tr>
                        <tr>
                            <td class="total-label">Tax (8.25%):</td>
                            <td class="total-amount">${this.formatCurrency(invoice.tax)}</td>
                        </tr>
                        <tr class="grand-total">
                            <td class="total-label"><strong>Total:</strong></td>
                            <td class="total-amount"><strong>${this.formatCurrency(invoice.total)}</strong></td>
                        </tr>
                    </table>
                </div>
            `;
        },
        
        generateNotesSection: function(invoice) {
            if (!invoice.notes || !invoice.notes.trim()) {
                return '';
            }
            
            return `
                <div class="invoice-notes">
                    <h4>Notes:</h4>
                    <p>${invoice.notes.replace(/\\n/g, '<br>')}</p>
                </div>
            `;
        },
        
        generateFooterSection: function(invoice, businessInfo) {
            return `
                <div class="invoice-footer">
                    <div class="payment-terms">
                        <h4>Payment Terms</h4>
                        <p>Payment is due within 30 days of invoice date.</p>
                        <p>Make checks payable to: ${businessInfo.name}</p>
                        <p>Mail payments to: ${businessInfo.address}</p>
                        <p>For questions about this invoice, please contact us at ${businessInfo.phone}</p>
                    </div>
                    <p class="thank-you">Thank you for your business!</p>
                </div>
            `;
        },
        
        getPrintStyles: function() {
            return `
                /* Print-specific styles */
                @page {
                    margin: 0.5in;
                    size: letter;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 12pt;
                    line-height: 1.4;
                    color: black;
                    background: white;
                    margin: 0;
                    padding: 0;
                }
                
                .invoice-document {
                    background: white;
                    padding: 0;
                    margin: 0;
                    width: 100%;
                }
                
                .invoice-header {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #DC143C;
                    page-break-inside: avoid;
                }
                
                .company-logo {
                    max-height: 60px;
                    width: auto;
                    margin-bottom: 0.5rem;
                }
                
                .company-details h2 {
                    color: #DC143C;
                    font-size: 18pt;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    margin-top: 0;
                }
                
                .company-details p {
                    margin-bottom: 0.25rem;
                    color: black;
                    font-size: 11pt;
                    margin-top: 0;
                }
                
                .invoice-meta {
                    text-align: right;
                }
                
                .invoice-number {
                    font-size: 18pt;
                    font-weight: bold;
                    color: #DC143C;
                    margin-bottom: 0.5rem;
                }
                
                .invoice-date,
                .invoice-status {
                    font-size: 11pt;
                    color: black;
                    margin-bottom: 0.25rem;
                }
                
                .customer-section {
                    margin-bottom: 2rem;
                    page-break-inside: avoid;
                }
                
                .customer-section h3 {
                    color: #DC143C;
                    font-size: 14pt;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    margin-top: 0;
                }
                
                .customer-section p {
                    margin-bottom: 0.25rem;
                    color: black;
                    font-size: 11pt;
                    margin-top: 0;
                }
                
                .customer-address {
                    margin-bottom: 0.25rem;
                    color: black;
                    font-size: 11pt;
                    white-space: pre-line;
                }
                
                .invoice-services-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 1.5rem;
                    page-break-inside: avoid;
                }
                
                .invoice-services-table th {
                    background-color: #f4f4f4;
                    color: black;
                    font-weight: bold;
                    padding: 0.5rem;
                    border: 1px solid #ccc;
                    font-size: 11pt;
                }
                
                .invoice-services-table td {
                    padding: 0.5rem;
                    border: 1px solid #ccc;
                    color: black;
                    font-size: 11pt;
                    vertical-align: top;
                }
                
                .invoice-services-table .amount {
                    text-align: right;
                }
                
                .invoice-totals-section {
                    margin-bottom: 2rem;
                    page-break-inside: avoid;
                }
                
                .invoice-totals-table {
                    width: 300px;
                    margin-left: auto;
                    border-collapse: collapse;
                }
                
                .invoice-totals-table td {
                    padding: 0.25rem 0.5rem;
                    color: black;
                    font-size: 11pt;
                }
                
                .invoice-totals-table .total-label {
                    text-align: right;
                }
                
                .invoice-totals-table .total-amount {
                    text-align: right;
                    font-weight: bold;
                }
                
                .invoice-totals-table .grand-total td {
                    border-top: 2px solid #DC143C;
                    font-size: 12pt;
                    font-weight: bold;
                    color: #DC143C;
                    padding-top: 0.5rem;
                }
                
                .invoice-notes {
                    margin-bottom: 2rem;
                    page-break-inside: avoid;
                }
                
                .invoice-notes h4 {
                    color: #DC143C;
                    font-size: 12pt;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    margin-top: 0;
                }
                
                .invoice-notes p {
                    color: black;
                    font-size: 11pt;
                    line-height: 1.4;
                    margin: 0;
                }
                
                .invoice-footer {
                    margin-top: 2rem;
                    page-break-inside: avoid;
                }
                
                .payment-terms {
                    background-color: #f9f9f9;
                    padding: 1rem;
                    border: 1px solid #ccc;
                    margin-bottom: 1rem;
                }
                
                .payment-terms h4 {
                    color: #DC143C;
                    font-size: 12pt;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    margin-top: 0;
                }
                
                .payment-terms p {
                    color: black;
                    font-size: 10pt;
                    margin-bottom: 0.25rem;
                    line-height: 1.3;
                    margin-top: 0;
                }
                
                .thank-you {
                    text-align: center;
                    font-size: 12pt;
                    color: #DC143C;
                    font-weight: bold;
                    margin: 0;
                }
                
                .business-masonry .invoice-header,
                .business-masonry .company-details h2,
                .business-masonry .invoice-number,
                .business-masonry .customer-section h3,
                .business-masonry .invoice-notes h4,
                .business-masonry .payment-terms h4,
                .business-masonry .thank-you,
                .business-masonry .invoice-totals-table .grand-total td {
                    color: #8B0000 !important;
                    border-color: #8B0000 !important;
                }
                
                /* Force high quality printing */
                * {
                    color-adjust: exact !important;
                    -webkit-print-color-adjust: exact !important;
                }
                
                /* Page break control */
                h1, h2, h3, h4, h5, h6 {
                    page-break-after: avoid;
                }
                
                p, li {
                    orphans: 2;
                    widows: 2;
                }
                
                .page-break {
                    page-break-before: always;
                }
                
                .no-page-break {
                    page-break-inside: avoid;
                }
            `;
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
        
        // Public methods
        downloadCurrentInvoice: function() {
            try {
                if (!this.currentInvoice && window.InvoiceManager) {
                    this.currentInvoice = window.InvoiceManager.currentInvoice;
                }
                
                if (!this.currentInvoice) {
                    if (window.ErrorHandler && window.ErrorHandler.showUserError) {
                        window.ErrorHandler.showUserError('You need to create or preview an invoice before you can download it as a PDF.');
                    } else {
                        alert('No invoice to download. Please create or preview an invoice first.');
                    }
                    return false;
                }
                
                return this.generatePDF(this.currentInvoice, {
                    download: true,
                    autoDownload: true,
                    closeAfterPrint: false
                });
            } catch (error) {
                console.error('Download current invoice error:', error);
                return false;
            }
        },
        
        printCurrentInvoice: function() {
            try {
                if (!this.currentInvoice && window.InvoiceManager) {
                    this.currentInvoice = window.InvoiceManager.currentInvoice;
                }
                
                if (!this.currentInvoice) {
                    if (window.ErrorHandler && window.ErrorHandler.showUserError) {
                        window.ErrorHandler.showUserError('You need to create or preview an invoice before you can print it.');
                    } else {
                        alert('No invoice to print. Please create or preview an invoice first.');
                    }
                    return false;
                }
                
                return this.generatePDF(this.currentInvoice, {
                    download: false,
                    autoDownload: true,
                    closeAfterPrint: true
                });
            } catch (error) {
                console.error('Print current invoice error:', error);
                return false;
            }
        },
        
        emailInvoice: function(invoice, emailAddress) {
            try {
                // This would integrate with an email service
                // For now, we'll create a mailto link with the invoice details
                const subject = `Invoice #${invoice.number || 'DRAFT'} from ${this.getBusinessInfo(invoice.businessType).name}`;
                const body = `Dear ${invoice.customerName},\\n\\nPlease find attached your invoice.\\n\\nInvoice Details:\\n` +
                           `- Invoice #: ${invoice.number || 'DRAFT'}\\n` +
                           `- Date: ${this.formatDate(invoice.date)}\\n` +
                           `- Amount: ${this.formatCurrency(invoice.total)}\\n\\n` +
                           `Thank you for your business!\\n\\n` +
                           `${this.getBusinessInfo(invoice.businessType).name}\\n` +
                           `${this.getBusinessInfo(invoice.businessType).phone}`;
                
                const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                
                window.location.href = mailtoLink;
                
                return true;
            } catch (error) {
                console.error('Email invoice error:', error);
                return false;
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PDFGenerator.init();
        });
    } else {
        PDFGenerator.init();
    }
    
    // Export for global access
    window.PDFGenerator = PDFGenerator;
    
})();