/**
 * J. Stark Business Invoicing System - PDF Generation
 * Handles PDF export functionality using jsPDF and html2canvas
 */

(function() {
    'use strict';
    
    console.log('🟢 PDF.JS LOADED - UPDATED VERSION 1754319400');
    
    // Helper function to format customer address
    function formatAddressLines(customer = {}) {
        const lines = [];
        const name = (customer.name || '').trim();
        const street = (customer.street || '').trim();
        const city = (customer.city || '').trim();
        const state = (customer.state || '').trim();
        const zip = (customer.zip || '').trim();
        
        if (name) lines.push(name);
        if (street) lines.push(street);
        
        const cityStateZip = [city, state, zip].filter(Boolean).join(', ');
        if (cityStateZip) lines.push(cityStateZip);
        
        return lines;
    }
    
    const PDFGenerator = {
        currentInvoice: null,
        currentEstimate: null,
        
        init: function() {
            try {
                this.checkDependencies();
                console.log('PDF Generator initialized');
            } catch (error) {
                console.error('PDF Generator initialization error:', error);
            }
        },
        
        drawCustomerSection: function(doc, inv, x = 14, y = 40, lineHeight = 6) {
            // Normalize customer data
            const customer = inv.customer || {};
            customer.name = customer.name || inv.customerName || '';
            customer.street = customer.street || inv.customerStreet || '';
            customer.city = customer.city || inv.customerCity || '';
            customer.state = customer.state || inv.customerState || '';
            customer.zip = customer.zip || inv.customerZip || '';
            
            // Get formatted lines
            const lines = formatAddressLines(customer);
            
            // Draw each line
            doc.setFontSize(10);
            lines.forEach((line, index) => {
                doc.text(line, x, y + (index * lineHeight));
            });
            
            // Return next Y position
            return y + (lines.length * lineHeight);
        },
        
        isConcreteDoc: function(docLike) {
            // Check if document is concrete type
            return docLike && (docLike.businessType === 'concrete' || docLike.type === 'concrete');
        },
        
        getWarrantyText: function() {
            // Returns concise 10-Year warranty text derived from section 10
            return `10-YEAR LIMITED WARRANTY - CONCRETE LIFTING

COVERAGE: For ten (10) years from completion, if a slab lifted by Contractor settles downward by more than 1/2 inch relative to adjacent slabs or edges due solely to loss of support from the injected material, Contractor will re-level the affected slab(s) at no charge. If re-leveling is not feasible, Contractor may refund the portion of the original price attributable to the affected area.

OWNER RESPONSIBILITIES: Maintain proper drainage and water control (extend downspouts 6-10 feet, keep joints and cracks sealed, maintain grading away from slabs). Failure to control water and maintain joints voids coverage for water-related settlement.

EXCLUSIONS: This warranty does not cover:
• Settlement caused by erosion, washout, plumbing leaks, broken/blocked drains
• Movement of soils outside treated area, expansive/organic soils, uncompacted fill
• Freeze-thaw heave, earthquakes, flooding, tree roots, burrowing animals
• Loads beyond typical residential use unless specified in writing
• Cosmetic issues (color match, surface scaling/spalling, crack appearance)
• Restrictions due to attached structures or inadequate access
• Areas where recommended drainage or joint sealing was declined
• Concrete less than 3 years old that continues settling with backfill consolidation

TRANSFER & CLAIMS: Warranty applies to the property listed on estimate and may transfer once to a new owner if Contractor is notified in writing within 30 days of title transfer. To make a claim, notify Contractor in writing within 30 days of discovery; Contractor will inspect and determine appropriate warranty service.

This warranty is subject to the complete Terms & Conditions provided with your estimate.`;
        },
        
        appendConcreteWarrantyPage: function(doc, invOrEst) {
            // Append warranty page for concrete documents only
            if (!this.isConcreteDoc(invOrEst)) return;
            
            // Add new page
            doc.addPage();
            
            // Title
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('10-YEAR LIMITED WARRANTY - CONCRETE LIFTING', 14, 20);
            
            // Body text
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            const warrantyText = this.getWarrantyText();
            const lines = warrantyText.split('\n\n');
            let yPos = 30;
            
            lines.forEach(paragraph => {
                const splitText = doc.splitTextToSize(paragraph, 180);
                splitText.forEach(line => {
                    if (yPos > 270) return; // Stay within page bounds
                    doc.text(line, 14, yPos);
                    yPos += 4.5; // Line height ~1.1
                });
                yPos += 2; // Paragraph spacing
            });
        },
        
        renderWarrantyPreviewBlock: function(docLike) {
            // Return warranty block HTML for concrete documents only
            if (!this.isConcreteDoc(docLike)) return '';
            
            const warrantyText = this.getWarrantyText();
            const htmlText = warrantyText.replace(/\n/g, '<br>');
            
            return `
                <hr class="page-break" />
                <div class="warranty-block">
                    <h3 style="text-align: center; margin: 20px 0;">10-YEAR LIMITED WARRANTY</h3>
                    <div class="warranty-text" style="white-space: pre-wrap; font-size: 10pt; line-height: 1.25;">
                        ${htmlText}
                    </div>
                </div>
            `;
        },
        
        checkDependencies: function() {
            // Enhanced dependency checking with fallback strategy
            this.usesPrintFallback = true;
            this.dependencyStatus = {
                jsPDF: false,
                html2canvas: false,
                printAvailable: false
            };
            
            try {
                // Check for jsPDF (multiple possible locations)
                if (typeof window.jsPDF !== 'undefined') {
                    this.dependencyStatus.jsPDF = true;
                } else if (typeof jsPDF !== 'undefined') {
                    this.dependencyStatus.jsPDF = true;
                    window.jsPDF = jsPDF; // Ensure global access
                }
                
                // Check for html2canvas
                if (typeof window.html2canvas !== 'undefined') {
                    this.dependencyStatus.html2canvas = true;
                } else if (typeof html2canvas !== 'undefined') {
                    this.dependencyStatus.html2canvas = true;
                    window.html2canvas = html2canvas; // Ensure global access
                }
                
                // Check if browser print is available
                if (window.print && typeof window.print === 'function') {
                    this.dependencyStatus.printAvailable = true;
                }
                
                // Determine if we can use PDF libraries
                if (this.dependencyStatus.jsPDF && this.dependencyStatus.html2canvas) {
                    this.usesPrintFallback = false;
                    console.log('✅ PDF libraries loaded successfully - Direct PDF generation available');
                } else {
                    console.log('📋 PDF libraries not found, using browser print fallback');
                    if (!this.dependencyStatus.printAvailable) {
                        console.warn('⚠️ Browser print functionality also unavailable');
                    }
                }
                
                // Log status for debugging
                console.log('PDF Dependencies:', this.dependencyStatus);
                
            } catch (error) {
                console.error('Dependency check failed:', error);
                this.usesPrintFallback = true;
            }
        },
        
        generatePDF: function(invoice, options = {}) {
            try {
                // Validate required data
                if (!invoice) {
                    this.showError('No invoice data provided for PDF generation');
                    return false;
                }
                
                if (!invoice.number && !invoice.id) {
                    this.showError('Invoice must have a number or ID for PDF generation');
                    return false;
                }
                
                this.currentInvoice = invoice;
                
                // Check dependencies again in case they changed
                this.checkDependencies();
                
                if (!this.dependencyStatus.printAvailable && this.usesPrintFallback) {
                    this.showError('PDF generation not available: No print functionality found');
                    return false;
                }
                
                if (this.usesPrintFallback) {
                    return this.generateWithPrint(invoice, options);
                } else {
                    return this.generateWithLibraries(invoice, options);
                }
                
            } catch (error) {
                console.error('Generate PDF error:', error);
                this.showError(`PDF generation failed: ${error.message}`);
                
                // Log error for debugging
                if (window.ErrorLogger) {
                    window.ErrorLogger.logError(error.message, window.ERROR_CATEGORIES.PDF_GENERATION, {
                        invoiceId: invoice?.id,
                        invoiceNumber: invoice?.number,
                        usesPrintFallback: this.usesPrintFallback,
                        dependencyStatus: this.dependencyStatus
                    });
                }
                
                return false;
            }
        },
        
        // === SAFE-HOTFIX:NATIVE-EMAIL-WITH-ATTACH (BEGIN)
        renderToBlob: function(kind, id) {
            // Non-UI PDF generation for email attachment
            try {
                // === SAFE-HOTFIX: PDF_RENDER_FALLBACK (BEGIN)
                // Get the document data with resilient fallback chain
                let document = null;
                let fileName = '';
                
                if (kind === 'invoice') {
                    // === SAFE-HOTFIX: PDF_RENDER_FALLBACK (BEGIN)
                    // Fallback chain for invoices
                    // 1. Check previewedInvoice
                    if (window.InvoiceManager && window.InvoiceManager.previewedInvoice && 
                        window.InvoiceManager.previewedInvoice.id === id) {
                        document = window.InvoiceManager.previewedInvoice;
                        console.log('[PDF:BLOB] using previewedInvoice');
                    }
                    // 2. Check currentInvoice
                    else if (this.currentInvoice && this.currentInvoice.id === id) {
                        document = this.currentInvoice;
                        console.log('[PDF:BLOB] using currentInvoice');
                    }
                    // 3. Try getInvoiceById if available
                    else if (window.InvoiceManager && typeof window.InvoiceManager.getInvoiceById === 'function') {
                        try {
                            document = window.InvoiceManager.getInvoiceById(id);
                            if (document) console.log('[PDF:BLOB] using getInvoiceById');
                        } catch (e) {
                            console.log('[PDF:BLOB] getInvoiceById failed:', e.message);
                        }
                    }
                    // 4. Try getInvoices if available
                    else if (window.InvoiceManager && typeof window.InvoiceManager.getInvoices === 'function') {
                        try {
                            const invoices = window.InvoiceManager.getInvoices();
                            document = invoices.find(inv => inv.id === id);
                            if (document) console.log('[PDF:BLOB] using getInvoices');
                        } catch (e) {
                            console.log('[PDF:BLOB] getInvoices failed:', e.message);
                        }
                    }
                    // 5. Try StorageManager directly
                    else if (window.StorageManager && typeof window.StorageManager.getInvoices === 'function') {
                        try {
                            const invoices = window.StorageManager.getInvoices();
                            document = invoices.find(inv => inv.id === id);
                            if (document) console.log('[PDF:BLOB] using StorageManager');
                        } catch (e) {
                            console.log('[PDF:BLOB] StorageManager failed:', e.message);
                        }
                    }
                    fileName = `Invoice-${document?.number || id}.pdf`;
                    // === SAFE-HOTFIX: PDF_RENDER_FALLBACK (END)
                } else if (kind === 'estimate') {
                    // Fallback chain for estimates
                    // 1. Check previewedEstimate
                    if (window.EstimateManager && window.EstimateManager.previewedEstimate && 
                        window.EstimateManager.previewedEstimate.id === id) {
                        document = window.EstimateManager.previewedEstimate;
                        console.log('[PDF:BLOB] using previewedEstimate');
                    }
                    // 2. Check currentEstimate
                    else if (this.currentEstimate && this.currentEstimate.id === id) {
                        document = this.currentEstimate;
                        console.log('[PDF:BLOB] using currentEstimate');
                    }
                    // 3. Try getEstimateById if available
                    else if (window.EstimateManager && typeof window.EstimateManager.getEstimateById === 'function') {
                        try {
                            document = window.EstimateManager.getEstimateById(id);
                            if (document) console.log('[PDF:BLOB] using getEstimateById');
                        } catch (e) {
                            console.log('[PDF:BLOB] getEstimateById failed:', e.message);
                        }
                    }
                    // 4. Try getEstimates if available
                    else if (window.EstimateManager && typeof window.EstimateManager.getEstimates === 'function') {
                        try {
                            const estimates = window.EstimateManager.getEstimates();
                            document = estimates.find(est => est.id === id);
                            if (document) console.log('[PDF:BLOB] using getEstimates');
                        } catch (e) {
                            console.log('[PDF:BLOB] getEstimates failed:', e.message);
                        }
                    }
                    // 5. Try StorageManager directly
                    else if (window.StorageManager && typeof window.StorageManager.getEstimates === 'function') {
                        try {
                            const estimates = window.StorageManager.getEstimates();
                            document = estimates.find(est => est.id === id);
                            if (document) console.log('[PDF:BLOB] using StorageManager');
                        } catch (e) {
                            console.log('[PDF:BLOB] StorageManager failed:', e.message);
                        }
                    }
                    fileName = `Estimate-${document?.number || id}.pdf`;
                }
                
                if (!document) {
                    console.log('[PDF:BLOB] fallback-not-found', { kind, id });
                    return { ok: false, reason: 'not-found' };
                }
                // === SAFE-HOTFIX: PDF_RENDER_FALLBACK (END)
                
                // === SAFE-HOTFIX:EMAIL-PDF-OPTIONAL (BEGIN)
                // PDF attachment is optional for native email
                // Return null to proceed without attachment rather than fail
                console.log('[PDF:BLOB] attachment-optional', { kind, id });
                return null;
                // === SAFE-HOTFIX:EMAIL-PDF-OPTIONAL (END)
                
                /* DISABLED: HTML generation functions don't exist
                // Generate HTML content
                const htmlContent = kind === 'invoice' ? 
                    this.generateInvoiceHTML(document) : 
                    this.generateEstimateHTML(document);
                
                // Convert HTML to Blob (simple approach - browsers can print HTML to PDF)
                // For now, create an HTML blob that can be shared
                const blob = new Blob([htmlContent], { type: 'text/html' });
                
                console.log('[PDF:BLOB] generated', { 
                    kind, 
                    id, 
                    size: blob.size,
                    fileName 
                });
                
                return { blob, fileName };
                */
                
            } catch (error) {
                console.error('[PDF:BLOB] error', error);
                return null;
            }
        },
        // === SAFE-HOTFIX:NATIVE-EMAIL-WITH-ATTACH (END)
        
        generateEstimatePDF: function(estimate, options = {}) {
            try {
                this.currentEstimate = estimate;
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (BEGIN)
                // Update EstimateManager's previewedEstimate to ensure consistency
                if (window.EstimateManager) {
                    window.EstimateManager.previewedEstimate = estimate;
                }
                // Set global preview state
                window.currentPreview = {
                    type: 'estimate',
                    id: estimate.id
                };
                console.log('[PDF:SOURCE]', { 
                    type: 'estimate',
                    via: 'generateEstimatePDF',
                    id: estimate.id,
                    businessType: estimate.businessType 
                });
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (END)
                
                if (this.usesPrintFallback) {
                    return this.generateEstimateWithPrint(estimate, options);
                } else {
                    return this.generateEstimateWithLibraries(estimate, options);
                }
            } catch (error) {
                console.error('Generate Estimate PDF error:', error);
                return false;
            }
        },
        
        generateWithPrint: function(invoice, options = {}) {
            try {
                // Log PDF generation attempt
                if (window.ErrorLogger) {
                    window.ErrorLogger.logInfo('PDF generation started', window.ERROR_CATEGORIES.PDF_GENERATION, {
                        method: 'print',
                        invoiceId: invoice.id,
                        invoiceNumber: invoice.number
                    });
                }
                
                // Show loading indicator
                this.showPDFLoadingIndicator('Preparing PDF...');
                
                // Detect popup blocker
                const printWindow = this.openPrintWindow();
                
                if (!printWindow || printWindow.closed) {
                    this.hidePDFLoadingIndicator();
                    return this.handlePopupBlocked(invoice, options);
                }
                
                const invoiceHtml = this.generatePrintableInvoice(invoice);
                const warrantyPageHtml = this.generateWarrantyPageIfNeeded(invoice);
                
                // === SAFE-HOTFIX: PDF-MASONRY-3COL (BEGIN)
                if (invoice.businessType === 'masonry') {
                    console.log('[PDF:MASONRY:DONE]');
                }
                // === SAFE-HOTFIX: PDF-MASONRY-3COL (END)
                
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Invoice #${invoice.number || 'DRAFT'}</title>
                        <meta charset="UTF-8">
                        <style>
                            ${this.getPrintStyles()}
                            ${this.getWarrantyPageStyles()}
                        </style>
                    </head>
                    <body>
                        ${invoiceHtml}
                        ${warrantyPageHtml}
                        <script>
                            window.onload = function() {
                                // Notify parent window that PDF is ready
                                if (window.opener && window.opener.PDFGenerator) {
                                    window.opener.PDFGenerator.onPDFReady();
                                }
                                
                                // === SAFE-HOTFIX: PDF DUPLICATE FIX
                                // Track if we've already printed to prevent duplicates
                                if (!window._printCalled && ${options.autoDownload || false}) {
                                    window._printCalled = true;
                                    setTimeout(() => {
                                        console.log('[PDF-FIX] Calling window.print() from popup');
                                        window.print();
                                    }, 1000);
                                }
                                // === SAFE-HOTFIX: PDF DUPLICATE FIX (END)
                            };
                            
                            window.onbeforeprint = function() {
                                if (window.opener && window.opener.PDFGenerator) {
                                    window.opener.PDFGenerator.onPDFPrintStarted();
                                }
                            };
                            
                            window.onafterprint = function() {
                                if (window.opener && window.opener.PDFGenerator) {
                                    window.opener.PDFGenerator.onPDFPrintCompleted();
                                }
                                ${options.closeAfterPrint ? 'setTimeout(() => window.close(), 2000);' : ''}
                            };
                        </script>
                    </body>
                    </html>
                `);
                
                printWindow.document.close();
                
                // Set timeout to detect if window failed to load
                setTimeout(() => {
                    if (printWindow.closed) {
                        this.hidePDFLoadingIndicator();
                        if (window.ErrorLogger) {
                            window.ErrorLogger.logWarning('Print window was closed unexpectedly', window.ERROR_CATEGORIES.PDF_GENERATION);
                        }
                    }
                }, 5000);
                
                // === SAFE-HOTFIX: PDF DUPLICATE FIX - Prevent parent from calling print
                // The popup window already handles printing in its onload
                if (false && options.autoDownload) {
                    setTimeout(() => {
                        try {
                            printWindow.print();
                            if (options.closeAfterPrint) {
                                setTimeout(() => {
                                    if (!printWindow.closed) {
                                        printWindow.close();
                                    }
                                }, 3000);
                            }
                        } catch (printError) {
                            console.error('Print error:', printError);
                            if (window.ErrorLogger) {
                                window.ErrorLogger.logError('Print operation failed', window.ERROR_CATEGORIES.PDF_GENERATION, {
                                    error: printError.message,
                                    stack: printError.stack
                                });
                            }
                            this.showPrintErrorGuidance();
                        }
                    }, 1500);
                }
                
                return true;
            } catch (error) {
                this.hidePDFLoadingIndicator();
                console.error('Generate with print error:', error);
                
                if (window.ErrorLogger) {
                    window.ErrorLogger.logError('PDF generation failed', window.ERROR_CATEGORIES.PDF_GENERATION, {
                        error: error.message,
                        stack: error.stack,
                        invoiceId: invoice.id
                    });
                }
                
                // Enhanced fallback handling
                if (error.message.includes('Popup blocked') || error.message.includes('popup')) {
                    return this.handlePopupBlocked(invoice, options);
                }
                
                // Try alternative methods
                return this.tryAlternativePDFMethods(invoice, options);
            }
        },

        downloadAsHTML: function(invoice) {
            try {
                const invoiceHtml = this.generatePrintableInvoice(invoice);
                const warrantyPageHtml = this.generateWarrantyPageIfNeeded(invoice);
                const fullHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Invoice #${invoice.number || 'DRAFT'}</title>
                        <meta charset="UTF-8">
                        <style>
                            ${this.getPrintStyles()}
                            ${this.getWarrantyPageStyles()}
                        </style>
                    </head>
                    <body>
                        ${invoiceHtml}
                        ${warrantyPageHtml}
                        <div style="text-align: center; margin-top: 20px; no-print;">
                            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                Print Invoice
                            </button>
                        </div>
                    </body>
                    </html>
                `;
                
                // Create a downloadable HTML file
                const blob = new Blob([fullHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Invoice_${invoice.number || 'DRAFT'}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Show success message with instructions
                if (window.App && window.App.showSuccess) {
                    window.App.showSuccess('Invoice downloaded as HTML file. Open it and click Print to create PDF.');
                }
                
                return true;
            } catch (error) {
                console.error('Download as HTML error:', error);
                return false;
            }
        },
        
        generateEstimateWithPrint: function(estimate, options = {}) {
            try {
                // Create a temporary print-optimized version for estimate
                const printWindow = window.open('', '_blank');
                const estimateHtml = this.generatePrintableEstimate(estimate);
                const warrantyPageHtml = this.generateWarrantyPageIfNeeded(estimate);
                
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Work Estimate #${estimate.number || 'DRAFT'}</title>
                        <meta charset="UTF-8">
                        <style>
                            ${this.getPrintStyles()}
                            ${this.getEstimatePrintStyles()}
                            ${this.getWarrantyPageStyles()}
                        </style>
                    </head>
                    <body>
                        ${estimateHtml}
                        ${warrantyPageHtml}
                        <script>
                            window.onload = function() {
                                // === SAFE-HOTFIX: PDF DUPLICATE FIX
                                if (!window._printCalled && ${options.autoDownload || false}) {
                                    window._printCalled = true;
                                    console.log('[PDF-FIX] Calling window.print() from estimate popup');
                                    window.print();
                                }
                                // === SAFE-HOTFIX: PDF DUPLICATE FIX (END)
                            };
                        </script>
                    </body>
                    </html>
                `);
                
                printWindow.document.close();
                
                // === SAFE-HOTFIX: PDF DUPLICATE FIX - Prevent duplicate estimate print
                if (false && options.autoDownload) {
                    setTimeout(() => {
                        printWindow.print();
                        if (options.closeAfterPrint) {
                            setTimeout(() => printWindow.close(), 1000);
                        }
                    }, 500);
                }
                
                return true;
            } catch (error) {
                console.error('Generate estimate with print error:', error);
                return false;
            }
        },
        
        generateWithLibraries: function(invoice, options = {}) {
            try {
                // This would be implemented if jsPDF and html2canvas are available
                const pdf = new jsPDF('p', 'mm', 'a4');
                const element = document.getElementById('invoice-preview-content');
                
                if (!element) {
                    throw new Error('Invoice preview content not found');
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
                                pdf.save(`invoice-${invoice.number || 'draft'}.pdf`);
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
                return Promise.reject(error);
            }
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
            
            // Use structured customer data
            let customer = invoice.customer || {};
            if (!customer.name && invoice.customerName) {
                customer = {
                    name: invoice.customerName,
                    email: invoice.customerEmail,
                    phone: invoice.customerPhone,
                    street: invoice.customerAddress || '',
                    city: '',
                    state: '',
                    zip: '',
                    signature: invoice.signature
                };
            }
            
            // Build structured address
            const addressLines = [];
            if (customer.street && customer.street.trim()) {
                addressLines.push(customer.street.trim());
            }
            
            const cityParts = [];
            if (customer.city && customer.city.trim()) cityParts.push(customer.city.trim());
            if (customer.state && customer.state.trim()) cityParts.push(customer.state.trim());
            if (customer.zip && customer.zip.trim()) cityParts.push(customer.zip.trim());
            
            if (cityParts.length > 0) {
                let cityLine = cityParts[0];
                if (cityParts.length > 1) {
                    if (cityParts.length === 3) {
                        cityLine = `${cityParts[0]}, ${cityParts[1]} ${cityParts[2]}`;
                    } else {
                        cityLine = cityParts.join(' ');
                    }
                }
                addressLines.push(cityLine);
            }
            
            const addressText = addressLines.length > 0 ? addressLines.join('\n') : '— Address not provided —';
            
            return `
${businessInfo.name}
${businessInfo.address}
Phone: ${businessInfo.phone}
Email: ${businessInfo.email}

INVOICE #${invoice.number || 'DRAFT'}
Date: ${this.formatDate(invoice.date)}
Status: ${(invoice.status || 'draft').toUpperCase()}

Bill To:
${customer.name || 'Customer Name Missing'}
${customer.email ? `Email: ${customer.email}` : ''}
${customer.phone ? `Phone: ${customer.phone}` : ''}
Address: ${addressText}
${customer.signature ? 'Customer Signature: [Signature Captured]' : ''}

Services:
${invoice.services.map(service => 
    `${service.description} - ${service.quantity} ${service.unit} x ${this.formatCurrency(service.rate)} = ${this.formatCurrency(service.amount)}`
).join('\n')}

Subtotal: ${this.formatCurrency(invoice.subtotal)}
Total: ${this.formatCurrency(invoice.subtotal)}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Payment Terms:
Full payment required at completion unless alternate terms are agreed in advance.
Make checks payable to: ${businessInfo.name}
Mail payments to: ${businessInfo.address}

${invoice.businessType === 'concrete' ? `
10-Year Limited Warranty for Concrete Leveling:
See Page 2 for complete warranty terms and conditions.
` : ''}
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
            // Build customer object with proper fallbacks
            const customer = invoice.customer || {
                name: invoice.customerName || '',
                email: invoice.customerEmail || '',
                phone: invoice.customerPhone || '',
                street: '',
                city: '',
                state: '',
                zip: ''
            };
            
            // Override with DOM values if available (priority to current form state)
            const streetElement = document.getElementById('customer-street');
            const cityElement = document.getElementById('customer-city');
            const stateElement = document.getElementById('customer-state');
            const zipElement = document.getElementById('customer-zip');
            
            if (streetElement?.value?.trim()) customer.street = streetElement.value.trim();
            if (cityElement?.value?.trim()) customer.city = cityElement.value.trim();
            if (stateElement?.value?.trim()) customer.state = stateElement.value.trim();
            if (zipElement?.value?.trim()) customer.zip = zipElement.value.trim();
            
            // Format address lines using helper
            const addressLines = formatAddressLines(customer);
            const addressHTML = addressLines.map(line => `<p>${line}</p>`).join('');
            
            return `
                <div class="customer-section">
                    <h3>Bill To:</h3>
                    ${addressHTML}
                    ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
                    ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
                    ${customer.signature ? '<div class="customer-signature"><h4>Customer Signature:</h4><img src="' + customer.signature + '" alt="Customer Signature" style="max-width: 200px; height: auto; border: 1px solid #ccc; padding: 5px;"/></div>' : ''}
                </div>
            `;
        },
        
        generateServicesTable: function(invoice) {
            if (!invoice.services || invoice.services.length === 0) {
                return '<div class="no-services">No services added</div>';
            }
            
            // === SAFE-HOTFIX: PDF-MASONRY-3COL (BEGIN)
            // Check if this is a masonry invoice
            const isMasonryInvoice = invoice.businessType === 'masonry';
            if (isMasonryInvoice) {
                console.log('[PDF:MASONRY:START]', { id: invoice.id, number: invoice.number });
            }
            // === SAFE-HOTFIX: PDF-MASONRY-3COL (END)
            
            const servicesRows = invoice.services.map(service => {
                // CRITICAL FIX: Enhanced slab itemization logic
                // Check if this is a concrete service with slab details
                if ((service.type === 'concrete' || service.type === 'concrete_leveling' || service.description?.toLowerCase().includes('concrete')) && service.slabDetails && service.slabDetails.length > 0) {
                    console.log('✅ PDF: Processing concrete service with slab details:', service.slabDetails);
                    
                    // Generate a row for each slab with proper formatting
                    return service.slabDetails.map((slab, index) => {
                        const slabNumber = index + 1;
                        
                        // Handle different possible slab data formats
                        let dimensions = slab.dimensions;
                        if (!dimensions && slab.length && slab.width) {
                            dimensions = `${slab.length}' x ${slab.width}'`;
                        }
                        
                        const liftHeight = slab.liftHeight || slab.depth || 0;
                        const sides = slab.sidesSettled || slab.sides || 1;
                        const sidesText = sides === 1 ? '1 side' : `${sides} sides`;
                        
                        // BUSINESS REQUIREMENT: Format as "Slab 1 (10x15x2): $425.50"
                        const cleanDimensions = dimensions.replace(/'/g, '').replace(/"/g, '').replace(/\s*x\s*/g, 'x');
                        const description = `Slab ${slabNumber} (${cleanDimensions}x${liftHeight})`;
                        const price = slab.price || 0;
                        
                        console.log(`✅ PDF: Slab ${slabNumber} - ${description} - $${price}`);
                        
                        return `
                            <tr>
                                <td>${description}</td>
                                <td class="amount">${this.formatCurrency(price)}</td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    // === VERSION 9.18: Masonry invoices now use 2-column layout (removed Quantity column)
                    // For masonry invoices, generate 2-column rows (same as estimates)
                    if (isMasonryInvoice) {
                        const amount = service.amount || service.price || 0;
                        console.log('[PDF:MASONRY:DATA_TABLE]', { description: service.description, amount });
                        return `
                            <tr>
                                <td>${(service.description || '').replace(/\n/g, '<br>')}</td>
                                <td class="amount">${this.formatCurrency(amount)}</td>
                            </tr>
                        `;
                    }
                    // === VERSION 9.18 END
                    
                    // Standard service row (concrete without slabs, etc.)
                    const serviceAmount = service.amount || service.price || 0;
                    // === VERSION 9.24: Append dimensions to description for PDF display
                    const displayDesc = service.dimensions ? 
                        `${service.description} - ${service.dimensions}` : 
                        service.description;
                    console.log(`✅ PDF: Standard service - ${displayDesc} - $${serviceAmount}`);
                    return `
                        <tr>
                            <td>${(displayDesc || '').replace(/\n/g, '<br>')}</td>
                            <td class="amount">${this.formatCurrency(serviceAmount)}</td>
                        </tr>
                    `;
                }
            }).join('');
            
            // === VERSION 9.18: Masonry invoices now use 2-column layout (removed Quantity column)
            // Different table headers for masonry (2 columns) vs others (2 columns)
            if (isMasonryInvoice) {
                const rowCount = invoice.services.length;
                console.log('[PDF:MASONRY:DOM_TABLE]', { removedCols: ['Job', 'Rate', 'Quantity'], colCount: 2, rows: rowCount });
                return `
                    <table class="invoice-services-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${servicesRows}
                        </tbody>
                    </table>
                `;
            }
            // === SAFE-HOTFIX: PDF-MASONRY-3COL (END)
            
            return `
                <table class="invoice-services-table">
                    <thead>
                        <tr>
                            <th>Description</th>
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
            // === SAFE-HOTFIX: PDF-MASONRY-3COL (BEGIN)
            if (invoice.businessType === 'masonry') {
                const subtotal = invoice.subtotal || 0;
                const total = invoice.total || subtotal; // No tax for masonry
                console.log('[PDF:MASONRY:TOTALS]', { subtotal, total });
            }
            // === SAFE-HOTFIX: PDF-MASONRY-3COL (END)
            
            return `
                <div class="invoice-totals-section">
                    <table class="invoice-totals-table">
                        <tr>
                            <td class="total-label">Subtotal:</td>
                            <td class="total-amount">${this.formatCurrency(invoice.subtotal)}</td>
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
            const warrantySection = this.generateWarrantySection(invoice);
            
            return `
                <div class="invoice-footer">
                    <div class="payment-terms">
                        <h4>Payment Terms</h4>
                        <p>Full payment required at completion unless alternate terms are agreed in advance.</p>
                        <p>Make checks payable to: ${businessInfo.name}</p>
                        <p>Mail payments to: ${businessInfo.address}</p>
                        <p>For questions about this invoice, please contact us at ${businessInfo.phone}</p>
                    </div>
                    ${warrantySection}
                    <p class="thank-you">Thank you for your business!</p>
                </div>
            `;
        },
        
        // Generate warranty page if needed for concrete leveling services
        generateWarrantyPageIfNeeded: function(invoiceOrEstimate) {
            // Use the new warranty block renderer
            return this.renderWarrantyPreviewBlock(invoiceOrEstimate);
        },
        
        // Get warranty page CSS styles
        getWarrantyPageStyles: function() {
            return `
                /* Warranty Page Styles - Inline for PDF - Colorless & Compact */
                .warranty-page {
                    page-break-before: always;
                    background: transparent;
                    padding: 0;
                    margin: 0;
                    width: 100%;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11pt;
                    line-height: 1.4;
                    color: black;
                }
                
                @media print {
                    #warranty-page,
                    .warranty-page {
                        column-count: 2;
                        column-gap: 14pt;
                        font-size: 10.5pt;
                        line-height: 1.25;
                        page-break-before: always;
                        background: transparent !important;
                        color: black !important;
                    }
                    
                    #warranty-page *,
                    .warranty-page * {
                        background: transparent !important;
                        box-shadow: none !important;
                        border: 0 !important;
                        color: black !important;
                    }
                    
                    #warranty-page h1,
                    #warranty-page h2,
                    .warranty-page h1,
                    .warranty-page h2 { 
                        margin: 0 0 6pt 0; 
                        break-after: avoid; 
                        font-size: 12pt !important;
                        color: black !important;
                    }
                    
                    #warranty-page h3,
                    .warranty-page h3 { 
                        margin: 8pt 0 4pt 0; 
                        break-after: avoid; 
                        font-size: 10.5pt !important;
                        color: black !important;
                    }
                    
                    #warranty-page p,
                    #warranty-page li,
                    .warranty-page p,
                    .warranty-page li { 
                        margin: 0 0 4pt 0; 
                        break-inside: avoid; 
                        font-size: 10.5pt !important;
                        line-height: 1.25 !important;
                        color: black !important;
                    }
                    
                    /* Remove all colored styling for warranty elements */
                    .warranty-highlights,
                    .warranty-contact,
                    .warranty-claim-note,
                    .warranty-section,
                    .warranty-header,
                    .warranty-footer {
                        background: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    
                    /* Compact spacing for warranty sections */
                    .warranty-header {
                        margin-bottom: 8pt !important;
                        padding-bottom: 4pt !important;
                        border-bottom: 1px solid black !important;
                    }
                    
                    .warranty-introduction {
                        margin-bottom: 8pt !important;
                    }
                    
                    .warranty-terms {
                        margin-bottom: 8pt !important;
                    }
                    
                    .warranty-contact {
                        margin-bottom: 8pt !important;
                        padding: 6pt !important;
                    }
                    
                    /* Ensure proper column breaks */
                    .warranty-section {
                        break-inside: avoid;
                        margin-bottom: 6pt !important;
                    }
                }
                
                /* Default screen styles - colorless */
                .warranty-header {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #333;
                    page-break-inside: avoid;
                }
                
                .warranty-logo {
                    max-height: 50px;
                    width: auto;
                    margin-bottom: 0.5rem;
                }
                
                .warranty-company-info h1 {
                    color: black;
                    font-size: 16pt;
                    font-weight: bold;
                    margin: 0.5rem 0;
                }
                
                .warranty-company-info p {
                    margin: 0.25rem 0;
                    font-size: 10pt;
                    color: black;
                }
                
                .warranty-document-info {
                    text-align: right;
                }
                
                .warranty-document-info h2 {
                    color: black;
                    font-size: 16pt;
                    font-weight: bold;
                    margin-bottom: 1rem;
                    margin-top: 0;
                }
                
                .warranty-reference,
                .warranty-customer,
                .warranty-date {
                    font-size: 10pt;
                    color: black;
                    margin-bottom: 0.25rem;
                    margin-top: 0;
                }
                
                .warranty-reference {
                    font-weight: bold;
                }
                
                .warranty-content {
                    margin-top: 1rem;
                }
                
                .warranty-introduction {
                    margin-bottom: 2rem;
                    page-break-inside: avoid;
                }
                
                .warranty-introduction h2 {
                    color: black;
                    font-size: 14pt;
                    font-weight: bold;
                    margin-bottom: 1rem;
                    margin-top: 0;
                }
                
                .warranty-intro-text {
                    font-size: 11pt;
                    line-height: 1.5;
                    margin-bottom: 1rem;
                    color: black;
                }
                
                .warranty-highlights {
                    background-color: transparent;
                    padding: 1rem;
                    border: none;
                    margin-bottom: 1rem;
                }
                
                .warranty-highlight {
                    margin-bottom: 0.5rem;
                    font-size: 10pt;
                    color: black;
                }
                
                .warranty-highlight:last-child {
                    margin-bottom: 0;
                }
                
                .warranty-highlight strong {
                    color: black;
                }
                
                .warranty-terms {
                    margin-bottom: 2rem;
                }
                
                .warranty-section {
                    margin-bottom: 1.5rem;
                    page-break-inside: avoid;
                }
                
                .warranty-section h3 {
                    color: black;
                    font-size: 12pt;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    margin-top: 0;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 0.25rem;
                }
                
                .warranty-section p {
                    font-size: 10pt;
                    line-height: 1.4;
                    margin-bottom: 0.5rem;
                    margin-top: 0;
                    text-align: justify;
                    color: black;
                }
                
                .warranty-section p:last-child {
                    margin-bottom: 0;
                }
                
                .warranty-contact {
                    background-color: transparent;
                    padding: 1rem;
                    border: none;
                    margin-bottom: 2rem;
                    page-break-inside: avoid;
                }
                
                .warranty-contact h3 {
                    color: black;
                    font-size: 12pt;
                    font-weight: bold;
                    margin-bottom: 1rem;
                    margin-top: 0;
                    text-align: center;
                }
                
                .warranty-contact-info {
                    text-align: center;
                }
                
                .warranty-contact-info p {
                    margin-bottom: 0.25rem;
                    font-size: 11pt;
                    color: black;
                }
                
                .warranty-contact-info strong {
                    color: black;
                    font-size: 12pt;
                }
                
                .warranty-claim-note {
                    margin-top: 1rem;
                    padding: 0.5rem;
                    background-color: transparent;
                    font-size: 9pt !important;
                    line-height: 1.3;
                }
                
                .warranty-footer {
                    border-top: 1px solid #ddd;
                    padding-top: 1rem;
                    margin-top: 2rem;
                    text-align: center;
                }
                
                .warranty-footer-text {
                    font-size: 10pt;
                    color: #666;
                    margin-bottom: 0.5rem;
                    font-style: italic;
                    line-height: 1.3;
                }
                
                .warranty-generated {
                    font-size: 9pt;
                    color: #999;
                    margin-top: 0.5rem;
                    margin-bottom: 0;
                }
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
                
                .customer-signature {
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                    page-break-inside: avoid;
                }
                
                .customer-signature h4 {
                    color: #333;
                    font-size: 10pt;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    margin-top: 0;
                }
                
                .customer-signature img {
                    display: block;
                    max-width: 200px;
                    max-height: 100px;
                    border: 1px solid #ccc;
                    padding: 5px;
                    background: white;
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
                
                .warranty-section {
                    background-color: #e8f5e8;
                    padding: 1rem;
                    border: 2px solid #28a745;
                    margin: 1rem 0;
                    border-radius: 5px;
                    page-break-inside: avoid;
                }
                
                .warranty-section h4 {
                    color: #28a745;
                    font-size: 12pt;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    margin-top: 0;
                    text-align: center;
                }
                
                .warranty-marketing {
                    color: black;
                    font-size: 10pt;
                    line-height: 1.4;
                    margin: 0;
                    text-align: center;
                    font-style: italic;
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
        
        // Estimate-specific methods
        generatePrintableEstimate: function(estimate) {
            try {
                const businessInfo = this.getBusinessInfo(estimate.businessType);
                
                return `
                    <div class="invoice-document estimate-document business-${estimate.businessType}">
                        ${this.generateEstimateHeader(estimate, businessInfo)}
                        ${this.generateCustomerSectionForEstimate(estimate)}
                        ${this.generateServicesTableForEstimate(estimate)}
                        ${this.generateTotalsSectionForEstimate(estimate)}
                        ${this.generateSignatureSectionForPrint(estimate)}
                        ${this.generateNotesSectionForEstimate(estimate)}
                        ${this.generateFooterSectionForEstimate(estimate, businessInfo)}
                    </div>
                `;
            } catch (error) {
                console.error('Generate printable estimate error:', error);
                return '<div>Error generating estimate</div>';
            }
        },
        
        generateEstimateHeader: function(estimate, businessInfo) {
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
                        <div class="invoice-number">WORK ESTIMATE #${estimate.number || 'DRAFT'}</div>
                        <div class="invoice-date">Date: ${this.formatDate(estimate.date)}</div>
                        <div class="invoice-status">Status: ${(estimate.status || 'draft').toUpperCase()}</div>
                    </div>
                </div>
            `;
        },
        
        generateCustomerSectionForEstimate: function(estimate) {
            // Build customer object with proper fallbacks
            const customer = estimate.customer || {
                name: estimate.customerName || '',
                email: estimate.customerEmail || '',
                phone: estimate.customerPhone || '',
                street: '',
                city: '',
                state: '',
                zip: ''
            };
            
            // Override with DOM values if available (priority to current form state)
            const streetElement = document.getElementById('estimate-customer-street') || document.getElementById('customer-street');
            const cityElement = document.getElementById('estimate-customer-city') || document.getElementById('customer-city');
            const stateElement = document.getElementById('estimate-customer-state') || document.getElementById('customer-state');
            const zipElement = document.getElementById('estimate-customer-zip') || document.getElementById('customer-zip');
            
            if (streetElement?.value?.trim()) customer.street = streetElement.value.trim();
            if (cityElement?.value?.trim()) customer.city = cityElement.value.trim();
            if (stateElement?.value?.trim()) customer.state = stateElement.value.trim();
            if (zipElement?.value?.trim()) customer.zip = zipElement.value.trim();
            
            // Format address lines using helper
            const addressLines = formatAddressLines(customer);
            const addressHTML = addressLines.map(line => `<p>${line}</p>`).join('');
            
            return `
                <div class="customer-section">
                    <h3>Estimate For:</h3>
                    ${addressHTML}
                    ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
                    ${customer.phone ? `<p>Phone: ${customer.phone}</p>` : ''}
                    ${customer.signature ? '<div class="customer-signature"><h4>Customer Signature:</h4><img src="' + customer.signature + '" alt="Customer Signature" style="max-width: 200px; height: auto; border: 1px solid #ccc; padding: 5px;"/></div>' : ''}
                </div>
            `;
        },
        
        generateServicesTableForEstimate: function(estimate) {
            if (!estimate.services || estimate.services.length === 0) {
                return '<div class="no-services">No services added</div>';
            }
            
            const servicesRows = estimate.services.map(service => {
                // CRITICAL FIX: Enhanced slab itemization logic for estimates
                // Check if this is a concrete service with slab details
                if ((service.type === 'concrete' || service.type === 'concrete_leveling' || service.description?.toLowerCase().includes('concrete')) && service.slabDetails && service.slabDetails.length > 0) {
                    console.log('✅ PDF: Processing estimate concrete service with slab details:', service.slabDetails);
                    
                    // Generate a row for each slab with proper formatting
                    return service.slabDetails.map((slab, index) => {
                        const slabNumber = index + 1;
                        
                        // Handle different possible slab data formats
                        let dimensions = slab.dimensions;
                        if (!dimensions && slab.length && slab.width) {
                            dimensions = `${slab.length}' x ${slab.width}'`;
                        }
                        
                        const liftHeight = slab.liftHeight || slab.depth || 0;
                        const sides = slab.sidesSettled || slab.sides || 1;
                        const sidesText = sides === 1 ? '1 side' : `${sides} sides`;
                        
                        // BUSINESS REQUIREMENT: Format as "Slab 1 (10x15x2): $425.50"
                        const cleanDimensions = dimensions.replace(/'/g, '').replace(/"/g, '').replace(/\s*x\s*/g, 'x');
                        const description = `Slab ${slabNumber} (${cleanDimensions}x${liftHeight})`;
                        const price = slab.price || 0;
                        
                        console.log(`✅ PDF: Estimate Slab ${slabNumber} - ${description} - $${price}`);
                        
                        return `
                            <tr>
                                <td>${description}</td>
                                <td class="amount">${this.formatCurrency(price)}</td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    // Standard service row (masonry, concrete without slabs, etc.)
                    const serviceAmount = service.amount || service.price || 0;
                    // === VERSION 9.24: Append dimensions to description for PDF display
                    const displayDesc = service.dimensions ? 
                        `${service.description} - ${service.dimensions}` : 
                        service.description;
                    console.log(`✅ PDF: Estimate standard service - ${displayDesc} - $${serviceAmount}`);
                    return `
                        <tr>
                            <td>${(displayDesc || '').replace(/\n/g, '<br>')}</td>
                            <td class="amount">${this.formatCurrency(serviceAmount)}</td>
                        </tr>
                    `;
                }
            }).join('');
            
            return `
                <table class="invoice-services-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${servicesRows}
                    </tbody>
                </table>
            `;
        },
        
        generateTotalsSectionForEstimate: function(estimate) {
            return `
                <div class="invoice-totals-section">
                    <table class="invoice-totals-table">
                        <tr>
                            <td class="total-label">Subtotal:</td>
                            <td class="total-amount">${this.formatCurrency(estimate.subtotal)}</td>
                        </tr>
                        <tr class="grand-total">
                            <td class="total-label"><strong>Estimated Total:</strong></td>
                            <td class="total-amount"><strong>${this.formatCurrency(estimate.total)}</strong></td>
                        </tr>
                    </table>
                </div>
            `;
        },
        
        generateSignatureSectionForPrint: function(estimate) {
            if (!estimate.signature && !estimate.signatureCustomerName) {
                return '';
            }
            
            return `
                <div class="estimate-signature-section print-signature">
                    <h4>Customer Approval & Signature</h4>
                    <div class="signature-display">
                        ${estimate.signature ? `<div class="signature-image-container"><img src="${estimate.signature}" alt="Customer Signature" class="signature-image"></div>` : ''}
                        <div class="signature-details">
                            ${estimate.signatureCustomerName ? `<p><strong>Signed by:</strong> ${estimate.signatureCustomerName}</p>` : ''}
                            ${estimate.signatureTimestamp ? `<p><strong>Signed on:</strong> ${new Date(estimate.signatureTimestamp).toLocaleString()}</p>` : ''}
                            ${estimate.approval ? '<p class="approval-status"><strong>✓ Customer approved this work estimate</strong></p>' : ''}
                        </div>
                    </div>
                </div>
            `;
        },
        
        generateNotesSectionForEstimate: function(estimate) {
            if (!estimate.notes || !estimate.notes.trim()) {
                return '';
            }
            
            return `
                <div class="invoice-notes">
                    <h4>Terms & Conditions:</h4>
                    <p>${estimate.notes.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        },
        
        generateFooterSectionForEstimate: function(estimate, businessInfo) {
            const warrantySection = this.generateWarrantySection(estimate);
            
            return `
                <div class="invoice-footer estimate-footer">
                    <div class="estimate-terms">
                        <h4>Estimate Terms</h4>
                        <p>This estimate is valid for 30 days from the date issued.</p>
                        <p>Final pricing may vary based on actual site conditions and material costs.</p>
                        <p>Work will begin upon customer approval and signed agreement.</p>
                        <p>For questions about this estimate, please contact us at ${businessInfo.phone}</p>
                    </div>
                    ${warrantySection}
                    <p class="thank-you">Thank you for considering our services!</p>
                </div>
            `;
        },
        
        generateWarrantySection: function(invoiceOrEstimate) {
            // Only show warranty for concrete leveling services
            if (invoiceOrEstimate.businessType !== 'concrete') {
                return '';
            }
            
            // Check if there are any concrete leveling services
            const hasConcreteServices = invoiceOrEstimate.services && 
                invoiceOrEstimate.services.some(service => 
                    service.description.toLowerCase().includes('concrete') ||
                    service.description.toLowerCase().includes('leveling') ||
                    service.description.toLowerCase().includes('lifting')
                );
            
            if (!hasConcreteServices) {
                return '';
            }
            
            return `
                <div class="warranty-section">
                    <h4>10-Year Limited Warranty for Concrete Leveling</h4>
                    <p class="warranty-marketing">
                        <strong>See Page 2: 10-Year Warranty Terms & Conditions</strong><br>
                        Complete warranty details, coverage terms, exclusions, and claim procedures 
                        are provided on the attached warranty page.
                    </p>
                </div>
            `;
        },
        
        getEstimatePrintStyles: function() {
            return `
                /* Estimate-specific print styles */
                .estimate-document .invoice-header {
                    border-bottom-color: #17a2b8;
                }
                
                .estimate-document .company-details h2,
                .estimate-document .invoice-number,
                .estimate-document .customer-section h3,
                .estimate-document .invoice-notes h4,
                .estimate-document .estimate-terms h4,
                .estimate-document .thank-you,
                .estimate-document .invoice-totals-table .grand-total td {
                    color: #17a2b8 !important;
                    border-color: #17a2b8 !important;
                }
                
                .print-signature {
                    margin: 2rem 0;
                    padding: 1rem;
                    border: 2px solid #17a2b8;
                    background-color: #f8f9fa;
                    page-break-inside: avoid;
                }
                
                .print-signature h4 {
                    color: #17a2b8;
                    margin-bottom: 1rem;
                    text-align: center;
                }
                
                .signature-display {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    justify-content: center;
                }
                
                .signature-image-container {
                    border: 1px solid #ccc;
                    padding: 0.5rem;
                    background: white;
                }
                
                .signature-image {
                    max-width: 200px;
                    max-height: 100px;
                    display: block;
                }
                
                .signature-details p {
                    margin-bottom: 0.25rem;
                    font-size: 10pt;
                    color: black;
                }
                
                .approval-status {
                    color: #28a745 !important;
                    font-weight: bold;
                }
                
                .estimate-terms {
                    background-color: #e3f2fd;
                    padding: 1rem;
                    border: 1px solid #17a2b8;
                    margin-bottom: 1rem;
                }
                
                .estimate-terms h4 {
                    color: #17a2b8;
                    margin-bottom: 0.5rem;
                }
                
                .estimate-terms p {
                    color: black;
                    font-size: 10pt;
                    margin-bottom: 0.25rem;
                    line-height: 1.3;
                }
            `;
        },
        
        // Public methods for estimates
        downloadCurrentEstimate: function() {
            try {
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (BEGIN)
                // Try to get estimate from multiple sources
                let estimateToDownload = null;
                let pdfSource = '';
                
                // Check if we're in estimate context first
                if (window.currentPreview && window.currentPreview.type === 'estimate') {
                    // Primary source: EstimateManager.previewedEstimate matching current preview
                    if (window.EstimateManager && window.EstimateManager.previewedEstimate && 
                        window.EstimateManager.previewedEstimate.id === window.currentPreview.id) {
                        estimateToDownload = window.EstimateManager.previewedEstimate;
                        pdfSource = 'EstimateManager.previewedEstimate';
                    }
                    // Secondary: Look up by ID from storage
                    else if (window.currentPreview.id) {
                        const stored = localStorage.getItem('jstark_estimates');
                        if (stored) {
                            const estimates = JSON.parse(stored);
                            estimateToDownload = estimates.find(e => e.id === window.currentPreview.id);
                            if (estimateToDownload) {
                                pdfSource = 'lookupById';
                            }
                        }
                    }
                }
                
                // Fallback to PDFGenerator's current estimate
                if (!estimateToDownload && this.currentEstimate) {
                    estimateToDownload = this.currentEstimate;
                    pdfSource = 'PDFGenerator.currentEstimate';
                }
                
                // Last resort: EstimateManager.currentEstimate
                if (!estimateToDownload && window.EstimateManager && window.EstimateManager.currentEstimate) {
                    estimateToDownload = window.EstimateManager.currentEstimate;
                    pdfSource = 'EstimateManager.currentEstimate';
                }
                
                // DO NOT use InvoiceManager.previewedEstimate for estimates
                // Check for wrong context
                if (estimateToDownload && estimateToDownload.businessType && !estimateToDownload.services) {
                    console.log('[PDF:WARN_WRONG_CONTEXT]', {
                        expected: 'estimate',
                        got: 'invoice'
                    });
                    alert('Please re-open the estimate preview before downloading PDF.');
                    return false;
                }
                
                if (pdfSource) {
                    console.log('[PDF:SOURCE]', {
                        type: 'estimate',
                        via: pdfSource
                    });
                }
                // === SAFE-HOTFIX: ESTIMATE LIST & PDF CORRECTION (END)
                
                if (!estimateToDownload) {
                    console.error('❌ No estimate found for PDF generation');
                    if (window.ErrorHandler && window.ErrorHandler.showUserError) {
                        window.ErrorHandler.showUserError('Please create or preview an estimate first before downloading.');
                    } else {
                        alert('No estimate to download. Please create or preview an estimate first.');
                    }
                    return false;
                }
                
                console.log('✅ Found estimate for PDF generation:', estimateToDownload);
                
                // CRITICAL EMERGENCY FIX: Force customer data capture from ALL possible form sources
                // This ensures PDF has the latest customer data even if estimate wasn't saved
                const currentEstimateCustomerName = document.getElementById('estimate-customer-name')?.value?.trim() || '';
                const currentEstimateCustomerEmail = document.getElementById('estimate-customer-email')?.value?.trim() || '';
                const currentEstimateCustomerPhone = document.getElementById('estimate-customer-phone')?.value?.trim() || '';
                
                // EMERGENCY FIX: Enhanced address capture with multiple fallbacks for estimates
                let currentEstimateAddress = '';
                const estimateAddressSources = [
                    document.getElementById('estimate-customer-address'),
                    document.querySelector('textarea[name="estimateCustomerAddress"]'),
                    document.querySelector('input[name="estimateCustomerAddress"]'),
                    document.querySelector('textarea[name="customerAddress"]'),
                    document.querySelector('textarea[placeholder*="address"]'),
                    document.querySelector('input[placeholder*="address"]')
                ];
                
                for (const source of estimateAddressSources) {
                    if (source && source.value && source.value.trim()) {
                        currentEstimateAddress = source.value.trim();
                        console.log('✅ EMERGENCY FIX: Estimate address captured from:', source.id || source.name || 'fallback selector');
                        break;
                    }
                }
                
                // Capture structured address fields for estimates if available
                const estimateStreetAddress = document.getElementById('estimate-customer-street')?.value?.trim() || '';
                const estimateCityAddress = document.getElementById('estimate-customer-city')?.value?.trim() || '';
                const estimateStateAddress = document.getElementById('estimate-customer-state')?.value?.trim() || '';
                const estimateZipAddress = document.getElementById('estimate-customer-zip')?.value?.trim() || '';
                
                // Capture estimate signature if available
                const currentEstimateSignature = document.getElementById('estimate-signature-data')?.value?.trim() || estimateToDownload.signature || '';
                
                // Update estimate with current form data and structured customer object
                if (currentEstimateCustomerName || currentEstimateCustomerEmail || currentEstimateCustomerPhone || currentEstimateAddress || estimateStreetAddress || currentEstimateSignature) {
                    // Create or update customer object with structured data
                    estimateToDownload.customer = {
                        name: currentEstimateCustomerName || estimateToDownload.customerName || '',
                        email: currentEstimateCustomerEmail || estimateToDownload.customerEmail || '',
                        phone: currentEstimateCustomerPhone || estimateToDownload.customerPhone || '',
                        street: estimateStreetAddress || currentEstimateAddress || estimateToDownload.customerAddress || '',
                        city: estimateCityAddress || '',
                        state: estimateStateAddress || '',
                        zip: estimateZipAddress || '',
                        signature: currentEstimateSignature
                    };
                    
                    // Maintain backward compatibility with legacy fields
                    if (currentEstimateCustomerName) estimateToDownload.customerName = currentEstimateCustomerName;
                    if (currentEstimateCustomerEmail) estimateToDownload.customerEmail = currentEstimateCustomerEmail;
                    if (currentEstimateCustomerPhone) estimateToDownload.customerPhone = currentEstimateCustomerPhone;
                    if (currentEstimateAddress || estimateStreetAddress) {
                        estimateToDownload.customerAddress = currentEstimateAddress || estimateStreetAddress;
                        console.log('✅ EMERGENCY FIX: Estimate updated with address:', estimateToDownload.customerAddress);
                    }
                    if (currentEstimateSignature) {
                        estimateToDownload.signature = currentEstimateSignature;
                        console.log('✅ EMERGENCY FIX: Estimate updated with signature');
                    }
                } else {
                    console.log('🚨 EMERGENCY ALERT: No customer address found in any estimate form fields');
                    console.log('Available estimate address elements:', estimateAddressSources.map(el => el ? (el.id || el.name || 'unnamed') : 'null'));
                }
                
                return this.generateEstimatePDF(estimateToDownload, {
                    download: true,
                    autoDownload: true,
                    closeAfterPrint: false
                });
            } catch (error) {
                console.error('Download current estimate error:', error);
                return false;
            }
        },
        
        printCurrentEstimate: function() {
            try {
                if (!this.currentEstimate && window.EstimateManager) {
                    this.currentEstimate = window.EstimateManager.currentEstimate;
                }
                
                if (!this.currentEstimate) {
                    if (window.ErrorHandler && window.ErrorHandler.showUserError) {
                        window.ErrorHandler.showUserError('Please create or preview an estimate first before printing.');
                    } else {
                        alert('No estimate to print. Please create or preview an estimate first.');
                    }
                    return false;
                }
                
                return this.generateEstimatePDF(this.currentEstimate, {
                    download: false,
                    autoDownload: true,
                    closeAfterPrint: true
                });
            } catch (error) {
                console.error('Print current estimate error:', error);
                return false;
            }
        },
        
        // Enhanced PDF generation helper methods
        openPrintWindow: function() {
            try {
                // Try to open popup with specific features to bypass some blockers
                const features = 'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,menubar=yes,toolbar=yes';
                const printWindow = window.open('', '_blank', features);
                
                // Additional check - some browsers return window object even when blocked
                if (printWindow) {
                    try {
                        printWindow.focus();
                        return printWindow;
                    } catch (e) {
                        // Window was blocked
                        return null;
                    }
                }
                
                return null;
            } catch (error) {
                console.error('Failed to open print window:', error);
                return null;
            }
        },
        
        handlePopupBlocked: function(invoice, options = {}) {
            this.showPopupBlockedGuidance(invoice, options);
            return false;
        },
        
        showPopupBlockedGuidance: function(invoice, options) {
            const modal = document.createElement('div');
            modal.className = 'pdf-blocked-modal';
            modal.innerHTML = `
                <div class="pdf-blocked-overlay"></div>
                <div class="pdf-blocked-content">
                    <div class="pdf-blocked-header">
                        <h3><i class="fas fa-exclamation-triangle"></i> Popup Blocked</h3>
                        <button class="pdf-blocked-close" onclick="this.closest('.pdf-blocked-modal').remove()">×</button>
                    </div>
                    <div class="pdf-blocked-body">
                        <p>Your browser blocked the PDF popup window. Please choose an alternative:</p>
                        <div class="pdf-alternatives">
                            <button class="btn btn-primary pdf-retry-btn" onclick="PDFGenerator.retryPDFGeneration('${invoice.id}', ${JSON.stringify(options)})">
                                <i class="fas fa-redo"></i> Allow Popups & Retry
                            </button>
                            <button class="btn btn-secondary pdf-download-btn" onclick="PDFGenerator.downloadAsHTML(${JSON.stringify(invoice)})">
                                <i class="fas fa-download"></i> Download as HTML
                            </button>
                            <button class="btn btn-info pdf-print-current-btn" onclick="PDFGenerator.printCurrentPage()">
                                <i class="fas fa-print"></i> Print This Page
                            </button>
                        </div>
                        <div class="pdf-instructions">
                            <h4>To enable popups:</h4>
                            <ul>
                                <li><strong>Chrome/Edge:</strong> Click the popup icon in the address bar</li>
                                <li><strong>Firefox:</strong> Click "Options" when popup is blocked notification appears</li>
                                <li><strong>Safari:</strong> Go to Safari > Preferences > Websites > Pop-up Windows</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            
            // Add styles for the modal
            if (!document.getElementById('pdf-blocked-styles')) {
                const styles = document.createElement('style');
                styles.id = 'pdf-blocked-styles';
                styles.textContent = `
                    .pdf-blocked-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 10002;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .pdf-blocked-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.7);
                    }
                    
                    .pdf-blocked-content {
                        position: relative;
                        background: white;
                        border-radius: 8px;
                        max-width: 600px;
                        max-height: 80vh;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    }
                    
                    .pdf-blocked-header {
                        background: #ffc107;
                        color: #212529;
                        padding: 1rem;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-weight: bold;
                    }
                    
                    .pdf-blocked-close {
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                    }
                    
                    .pdf-blocked-body {
                        padding: 1.5rem;
                    }
                    
                    .pdf-alternatives {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                        margin: 1rem 0;
                    }
                    
                    .pdf-alternatives button {
                        justify-content: flex-start;
                        text-align: left;
                    }
                    
                    .pdf-instructions {
                        margin-top: 1.5rem;
                        padding: 1rem;
                        background: #f8f9fa;
                        border-radius: 4px;
                        border-left: 4px solid #007bff;
                    }
                    
                    .pdf-instructions h4 {
                        margin: 0 0 0.5rem 0;
                        color: #007bff;
                    }
                    
                    .pdf-instructions ul {
                        margin: 0;
                        padding-left: 1.5rem;
                    }
                    
                    .pdf-instructions li {
                        margin-bottom: 0.25rem;
                    }
                `;
                document.head.appendChild(styles);
            }
            
            document.body.appendChild(modal);
            
            // Log popup blocked event
            if (window.ErrorLogger) {
                window.ErrorLogger.logWarning('PDF popup blocked by browser', window.ERROR_CATEGORIES.PDF_GENERATION, {
                    userAgent: navigator.userAgent,
                    invoiceId: invoice.id
                });
            }
        },
        
        retryPDFGeneration: function(invoiceId, options) {
            // Close the modal
            const modal = document.querySelector('.pdf-blocked-modal');
            if (modal) modal.remove();
            
            // Find the invoice and retry
            const invoice = window.App?.AppState?.invoices?.find(inv => inv.id === invoiceId) || 
                           window.InvoiceManager?.currentInvoice;
            
            if (invoice) {
                this.generatePDF(invoice, options);
            } else {
                this.showUserError('Invoice not found. Please try generating the PDF again.');
            }
        },
        
        printCurrentPage: function() {
            // Close the modal
            const modal = document.querySelector('.pdf-blocked-modal');
            if (modal) modal.remove();
            
            // Print the current page
            window.print();
        },
        
        tryAlternativePDFMethods: function(invoice, options) {
            // Try multiple fallback methods
            const methods = [
                () => this.downloadAsHTML(invoice),
                () => this.createDataURLDownload(invoice),
                () => this.showManualInstructions(invoice)
            ];
            
            for (const method of methods) {
                try {
                    if (method()) {
                        return true;
                    }
                } catch (error) {
                    console.warn('Alternative PDF method failed:', error);
                }
            }
            
            return false;
        },
        
        createDataURLDownload: function(invoice) {
            try {
                const invoiceHtml = this.generatePrintableInvoice(invoice);
                const fullHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Invoice #${invoice.number || 'DRAFT'}</title>
                        <meta charset="UTF-8">
                        <style>${this.getPrintStyles()}</style>
                    </head>
                    <body>${invoiceHtml}</body>
                    </html>
                `;
                
                const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml);
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `Invoice_${invoice.number || 'DRAFT'}.html`;
                link.click();
                
                this.showUserSuccess('Invoice downloaded as HTML file. Open it in your browser and use Ctrl+P to print as PDF.');
                return true;
            } catch (error) {
                console.error('Data URL download failed:', error);
                return false;
            }
        },
        
        showManualInstructions: function(invoice) {
            const modal = document.createElement('div');
            modal.className = 'pdf-manual-modal';
            modal.innerHTML = `
                <div class="pdf-manual-overlay" onclick="this.remove()"></div>
                <div class="pdf-manual-content">
                    <div class="pdf-manual-header">
                        <h3>Manual PDF Creation</h3>
                        <button onclick="this.closest('.pdf-manual-modal').remove()">×</button>
                    </div>
                    <div class="pdf-manual-body">
                        <p>To create a PDF manually:</p>
                        <ol>
                            <li>Press <kbd>Ctrl+P</kbd> (or <kbd>Cmd+P</kbd> on Mac) while viewing the invoice</li>
                            <li>In the print dialog, select "Save as PDF" as the destination</li>
                            <li>Click "Save" and choose where to save your PDF</li>
                        </ol>
                        <button class="btn btn-primary" onclick="window.print(); this.closest('.pdf-manual-modal').remove();">
                            <i class="fas fa-print"></i> Open Print Dialog
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            return true;
        },
        
        showPDFLoadingIndicator: function(message = 'Generating PDF...') {
            let indicator = document.getElementById('pdf-loading-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'pdf-loading-indicator';
                indicator.className = 'pdf-loading-indicator';
                document.body.appendChild(indicator);
            }
            
            indicator.innerHTML = `
                <div class="pdf-loading-content">
                    <div class="pdf-loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="pdf-loading-message">${message}</div>
                </div>
            `;
            
            // Add loading styles if not present
            if (!document.getElementById('pdf-loading-styles')) {
                const styles = document.createElement('style');
                styles.id = 'pdf-loading-styles';
                styles.textContent = `
                    .pdf-loading-indicator {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: 10003;
                        background: rgba(255,255,255,0.95);
                        padding: 2rem;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        text-align: center;
                        min-width: 200px;
                    }
                    
                    .pdf-loading-spinner {
                        font-size: 2rem;
                        color: #007bff;
                        margin-bottom: 1rem;
                    }
                    
                    .pdf-loading-message {
                        font-weight: 500;
                        color: #333;
                    }
                `;
                document.head.appendChild(styles);
            }
            
            indicator.style.display = 'block';
        },
        
        hidePDFLoadingIndicator: function() {
            const indicator = document.getElementById('pdf-loading-indicator');
            if (indicator) {
                indicator.style.display = 'none';
            }
        },
        
        showPrintErrorGuidance: function() {
            this.showUserError('Print dialog failed to open. Please try using Ctrl+P to print manually, or download the invoice as HTML.');
        },
        
        onPDFReady: function() {
            this.hidePDFLoadingIndicator();
            // Only show notification if not already shown to prevent duplicates
            if (!this._pdfReadyNotificationShown) {
                this._pdfReadyNotificationShown = true;
                this.showUserSuccess('PDF is ready! The print dialog should open automatically.');
                // Reset flag after 3 seconds
                setTimeout(() => {
                    this._pdfReadyNotificationShown = false;
                }, 3000);
            }
        },
        
        onPDFPrintStarted: function() {
            if (window.ErrorLogger) {
                window.ErrorLogger.logInfo('PDF print dialog opened', window.ERROR_CATEGORIES.PDF_GENERATION);
            }
        },
        
        onPDFPrintCompleted: function() {
            // Only show notification if not already shown to prevent duplicates  
            if (!this._pdfCompletedNotificationShown) {
                this._pdfCompletedNotificationShown = true;
                this.showUserSuccess('PDF generation completed successfully!');
                // Reset flag after 3 seconds
                setTimeout(() => {
                    this._pdfCompletedNotificationShown = false;
                }, 3000);
            }
            if (window.ErrorLogger) {
                window.ErrorLogger.logInfo('PDF print completed', window.ERROR_CATEGORIES.PDF_GENERATION);
            }
        },
        
        showUserSuccess: function(message) {
            if (window.App && window.App.showSuccess) {
                window.App.showSuccess(message);
            } else {
                alert(message);
            }
        },
        
        showUserError: function(message) {
            if (window.ErrorLogger) {
                window.ErrorLogger.logError(message, window.ERROR_CATEGORIES.PDF_GENERATION);
            }
            
            if (window.App && window.App.showError) {
                window.App.showError(message);
            } else {
                alert('Error: ' + message);
            }
        },
        
        // Public methods
        downloadCurrentInvoice: function() {
            console.log('🔴 PDF DOWNLOAD STARTED - DEBUG VERSION');
            try {
                // === SAFE-HOTFIX: CONVERT→PREVIEW→PDF ID FIX (BEGIN)
                // Step 1: Check for button-provided invoice ID
                let invoice = null;
                const activeButton = document.activeElement;
                const invoiceId = activeButton?.dataset?.invoiceId || 
                                 activeButton?.getAttribute?.('data-invoice-id') ||
                                 null;
                
                console.log('[PDF:ID_CHECK]', { 
                    buttonId: invoiceId,
                    hasButton: !!activeButton,
                    buttonTag: activeButton?.tagName 
                });
                
                // Step 2: If ID provided, find invoice by ID
                if (invoiceId) {
                    // Try localStorage first
                    const storedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
                    invoice = storedInvoices.find(inv => inv.id === invoiceId);
                    
                    if (invoice) {
                        console.log('[PDF:FOUND_BY_ID]', { id: invoice.id, number: invoice.number });
                    } else {
                        console.warn('[PDF:NOT_FOUND_BY_ID]', { requestedId: invoiceId });
                    }
                }
                
                // Step 3: Fall back to previewedInvoice (NEVER previewedEstimate in invoice context)
                if (!invoice && window.InvoiceManager) {
                    invoice = window.InvoiceManager.previewedInvoice || 
                             window.InvoiceManager.currentInvoice;
                    
                    if (invoice) {
                        console.log('[PDF:USING_PREVIEW]', { 
                            id: invoice.id, 
                            number: invoice.number,
                            source: window.InvoiceManager.previewedInvoice ? 'previewedInvoice' : 'currentInvoice'
                        });
                    }
                }
                // === SAFE-HOTFIX: CONVERT→PREVIEW→PDF ID FIX (END)
                
                if (!invoice) {
                    if (window.ErrorHandler && window.ErrorHandler.showUserError) {
                        window.ErrorHandler.showUserError('Please create or preview an invoice first before downloading.');
                    } else {
                        alert('No invoice to download. Please create or preview an invoice first.');
                    }
                    return false;
                }
                
                // Debug: Log invoice details
                console.log('🟡 UPDATED PDF VERSION - Invoice for PDF generation:', invoice);
                
                // Ensure invoice has services and proper totals
                if (!invoice.services || invoice.services.length === 0) {
                    console.log('PDF generation failed: No services found');
                    if (window.ErrorHandler && window.ErrorHandler.showUserError) {
                        window.ErrorHandler.showUserError('Please add services to the invoice before downloading.');
                    } else {
                        alert('No services found. Please add services to the invoice first.');
                    }
                    return false;
                }
                
                // Ensure totals are calculated
                if (!invoice.total || invoice.total <= 0) {
                    // Force recalculation of totals
                    if (window.InvoiceManager && typeof window.InvoiceManager.updateInvoiceTotals === 'function') {
                        window.InvoiceManager.updateInvoiceTotals();
                        // Get updated invoice
                        const updatedInvoice = window.InvoiceManager.currentInvoice;
                        if (updatedInvoice && updatedInvoice.total > 0) {
                            this.currentInvoice = updatedInvoice;
                            return this.generatePDF(updatedInvoice, {
                                download: true,
                                autoDownload: true,
                                closeAfterPrint: false
                            });
                        }
                    }
                    
                    if (window.ErrorHandler && window.ErrorHandler.showUserError) {
                        window.ErrorHandler.showUserError('Invoice totals are not calculated. Please add services first.');
                    } else {
                        alert('Invoice totals are missing. Please add services to calculate totals.');
                    }
                    return false;
                }
                
                // CRITICAL EMERGENCY FIX: Force customer data capture from ALL possible form sources
                // This ensures PDF has the latest customer data even if invoice wasn't saved
                const currentCustomerName = document.getElementById('customer-name')?.value?.trim() || '';
                const currentCustomerEmail = document.getElementById('customer-email')?.value?.trim() || '';
                const currentCustomerPhone = document.getElementById('customer-phone')?.value?.trim() || '';
                
                // EMERGENCY FIX: Enhanced address capture with multiple fallbacks
                let currentCustomerAddress = '';
                const addressSources = [
                    document.getElementById('customer-address'),
                    document.querySelector('textarea[name="customerAddress"]'),
                    document.querySelector('input[name="customerAddress"]'),
                    document.querySelector('textarea[placeholder*="address"]'),
                    document.querySelector('input[placeholder*="address"]')
                ];
                
                for (const source of addressSources) {
                    if (source && source.value && source.value.trim()) {
                        currentCustomerAddress = source.value.trim();
                        console.log('✅ EMERGENCY FIX: Address captured from:', source.id || source.name || 'fallback selector');
                        break;
                    }
                }
                
                // Capture structured address fields if available
                const streetAddress = document.getElementById('customer-street')?.value?.trim() || '';
                const cityAddress = document.getElementById('customer-city')?.value?.trim() || '';
                const stateAddress = document.getElementById('customer-state')?.value?.trim() || '';
                const zipAddress = document.getElementById('customer-zip')?.value?.trim() || '';
                
                // Capture signature if available
                const currentSignature = document.getElementById('signature-data')?.value?.trim() || invoice.signature || '';
                
                // Update invoice with current form data and structured customer object
                if (currentCustomerName || currentCustomerEmail || currentCustomerPhone || currentCustomerAddress || streetAddress || currentSignature) {
                    // Create or update customer object with structured data
                    invoice.customer = {
                        name: currentCustomerName || invoice.customerName || '',
                        email: currentCustomerEmail || invoice.customerEmail || '',
                        phone: currentCustomerPhone || invoice.customerPhone || '',
                        street: streetAddress || currentCustomerAddress || invoice.customerAddress || '',
                        city: cityAddress || '',
                        state: stateAddress || '',
                        zip: zipAddress || '',
                        signature: currentSignature
                    };
                    
                    // Maintain backward compatibility with legacy fields
                    if (currentCustomerName) invoice.customerName = currentCustomerName;
                    if (currentCustomerEmail) invoice.customerEmail = currentCustomerEmail;
                    if (currentCustomerPhone) invoice.customerPhone = currentCustomerPhone;
                    if (currentCustomerAddress || streetAddress) {
                        invoice.customerAddress = currentCustomerAddress || streetAddress;
                        console.log('✅ EMERGENCY FIX: Invoice updated with address:', invoice.customerAddress);
                    }
                    if (currentSignature) {
                        invoice.signature = currentSignature;
                        console.log('✅ EMERGENCY FIX: Invoice updated with signature');
                    }
                } else {
                    console.log('🚨 EMERGENCY ALERT: No customer address found in any form fields');
                    console.log('Available address elements:', addressSources.map(el => el ? (el.id || el.name || 'unnamed') : 'null'));
                }
                
                this.currentInvoice = invoice;
                return this.generatePDF(invoice, {
                    download: true,
                    autoDownload: true,
                    closeAfterPrint: false
                });
            } catch (error) {
                console.error('Download current invoice error:', error);
                // Show specific error message to user
                if (window.ErrorHandler && window.ErrorHandler.showUserError) {
                    window.ErrorHandler.showUserError('PDF generation failed: ' + error.message);
                } else {
                    alert('PDF generation failed: ' + error.message);
                }
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
                        window.ErrorHandler.showUserError('Please create or preview an invoice first before printing.');
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
    
    // Add additional methods to PDFGenerator
    PDFGenerator.showError = function(message) {
        // Use notification system if available, otherwise fallback to alert
        if (window.NotificationSystem) {
            window.NotificationSystem.showError(message);
        } else {
            alert('PDF Generation Error: ' + message);
        }
        console.error('PDF Generation Error:', message);
    };
    
    PDFGenerator.generateSignatureSection = function(customer) {
        if (!customer.signature) {
            return '';
        }
        
        try {
            // Check if signature is a data URL (base64 image)
            if (typeof customer.signature === 'string' && customer.signature.startsWith('data:image')) {
                return `
                    <div class="signature-section" style="margin-top: 20px; padding: 10px; border: 1px solid #ddd;">
                        <h4 style="margin: 0 0 10px 0;">Customer Signature:</h4>
                        <img src="${customer.signature}" alt="Customer Signature" style="max-width: 300px; max-height: 100px; border: 1px solid #ccc; display: block;">
                    </div>
                `;
            } else {
                return `
                    <div class="signature-section" style="margin-top: 20px; padding: 10px;">
                        <p style="margin: 0;"><strong>Customer Signature:</strong> [Signature Captured Digitally]</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error rendering signature:', error);
            return '<p style="color: #666;"><strong>Customer Signature:</strong> [Error displaying signature]</p>';
        }
    };

    // Export for global access
    window.PDFGenerator = PDFGenerator;
    
    // Test function for structured address rendering (DEV/TESTING ONLY)
    window.testStructuredAddressPDF = function() {
        const sampleInvoice = {
            id: 'test-001',
            number: 'TEST001',
            date: new Date(),
            businessType: 'concrete',
            customer: {
                name: 'John Smith',
                email: 'john@example.com',
                phone: '(555) 123-4567',
                street: '123 Main Street',
                city: 'Cleveland',
                state: 'OH',
                zip: '44101',
                signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            },
            services: [{
                description: 'Concrete Leveling Service',
                amount: 450.00
            }],
            subtotal: 450.00,
            total: 450.00,
            status: 'draft'
        };
        
        // Test with structured address - should show: 
        // 123 Main Street
        // Cleveland, OH 44101
        // + Customer Signature
        console.log('🧪 Testing structured address rendering...');
        console.log('Expected format: Street | City, State ZIP | Signature present');
        
        return PDFGenerator.generatePDF(sampleInvoice, { autoDownload: false });
    };
    
})();