# J. Stark Business Invoicing System - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Creating Your First Invoice](#creating-your-first-invoice)
3. [Managing Invoices](#managing-invoices)
4. [Using the Calculator](#using-the-calculator)
5. [Email & PDF Features](#email--pdf-features)
6. [Data Management](#data-management)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Troubleshooting](#troubleshooting)
9. [Updates & Version History](#updates--version-history)

---

## Getting Started

### Overview
The J. Stark Business Invoicing System is a powerful yet easy-to-use web application designed for **Superior Concrete Leveling LLC** and **J. Stark Masonry & Construction LLC**. It works offline, saves data locally, and can be installed on your device like a native app.

### Installation
1. **Desktop**: Visit the application URL in Chrome, Edge, or Firefox
2. **Mobile**: Open in Chrome/Safari and tap "Add to Home Screen"
3. **Offline Access**: Once loaded, the app works without internet

### First Time Setup
1. **Email Configuration** (Optional):
   - Click the "Settings" button
   - Enter your EmailJS credentials
   - Test the configuration
   - Save your settings

---

## Creating Your First Invoice

### Step 1: Choose Your Business
1. Click **"Create New Invoice"** from the dashboard
2. Select your business type:
   - 🛠️ **Concrete Leveling** - For driveway, sidewalk, and patio work
   - 🏠 **Masonry Work** - For brick, stone, and chimney projects

### Step 2: Enter Customer Information
- **Customer Name** (Required) - Full name of the customer
- **Email** - For sending invoices electronically
- **Phone** - Customer contact number
- **Address** - Service location or billing address

💡 **Tip**: The system remembers customers and offers auto-complete suggestions!

### Step 3: Add Services

#### For Concrete Leveling:
1. **Select Project Type** (click the visual buttons):
   - Driveway ($15/sq ft)
   - Sidewalk ($12/sq ft)
   - Patio ($14/sq ft)
   - Garage Floor ($16/sq ft)
   - Basement ($18/sq ft)
   - Steps ($20/sq ft)
   - Pool Deck ($17/sq ft)
   - Custom (set your own rate)

2. **Enter Square Footage** - Measure length × width

3. **Select Damage Severity**:
   - **Mild** - Minor settling, small cracks (normal pricing)
   - **Moderate** - Noticeable damage (+30%)
   - **Severe** - Major settling, structural issues (+60%)

4. **Select Site Accessibility**:
   - **Easy** - Clear access, vehicles can reach (normal pricing)
   - **Moderate** - Some obstacles (+10%)
   - **Difficult** - Major obstacles, hand-carry equipment (+25%)

5. Click **"Add Service to Invoice"**

#### For Masonry Work:
1. Select service type from dropdown
2. Enter description (optional)
3. Specify quantity and unit type
4. Enter rate per unit
5. Click **"Add Service to Invoice"**

### Step 4: Review and Finalize
- Add notes or special instructions
- Select invoice status (Draft, Sent, Paid, Overdue)
- Review the total with automatic tax calculation (8.25%)
- Click **"Create Invoice"** to save

---

## Managing Invoices

### Viewing All Invoices
1. Click **"View All Invoices"** from the dashboard
2. Use the search bar to find specific invoices
3. Filter by status using the dropdown
4. Click on any invoice to view details

### Invoice Actions
- **👁️ View** - See full invoice details
- **✏️ Edit** - Modify invoice information
- **📧 Email** - Send to customer
- **🖨️ Print** - Print or save as PDF
- **🗑️ Delete** - Remove invoice (with confirmation)

### Updating Invoice Status
1. Open the invoice
2. Click the status dropdown
3. Select new status
4. Changes save automatically

### Search Features
- Search by invoice number
- Search by customer name
- Filter by business type
- Filter by status

---

## Using the Calculator

### Quick Calculations
The concrete calculator provides instant pricing based on:
- Project type and base rate
- Square footage
- Damage severity multiplier
- Accessibility multiplier

### Understanding Multipliers
- **Base Rate**: Varies by project type
- **Severity Multiplier**: 1.0x (mild), 1.3x (moderate), 1.6x (severe)
- **Accessibility Multiplier**: 1.0x (easy), 1.1x (moderate), 1.25x (difficult)
- **Final Rate** = Base Rate × Severity × Accessibility

### Tips for Accurate Estimates
1. Measure accurately - include all affected areas
2. Assess damage honestly - under-quoting costs you money
3. Consider access challenges - equipment transport affects pricing
4. Add multiple services for complex jobs

---

## Email & PDF Features

### Sending Invoices by Email
1. Open the invoice you want to send
2. Click the **📧 Email** button
3. Review recipient information
4. Customize the email message (optional)
5. Choose attachment method:
   - **With PDF** - Attaches invoice as PDF
   - **Link Only** - Sends a viewable link
   - **Plain Text** - Simple text version
6. Click **"Send Invoice"**

### PDF Generation
- **Download PDF**: Creates a professional PDF file
- **Print**: Opens print dialog (can save as PDF)
- **Fallback Options**: If PDF generation fails, use print dialog

### Email Troubleshooting
- **Free Plan Limits**: EmailJS free plan has monthly limits
- **Attachment Issues**: Large invoices may need link-only option
- **Test First**: Always test email configuration before sending to customers

---

## Data Management

### Export Features
Access from the dashboard "Data Management Tools" section:

1. **Export Invoices to CSV**
   - Downloads all invoices in spreadsheet format
   - Open in Excel or Google Sheets
   - Perfect for accounting and reporting

2. **Export Customers to CSV**
   - Downloads customer database
   - Includes contact info and invoice history
   - Great for marketing and follow-ups

3. **Download Backup**
   - Complete system backup in JSON format
   - Includes all invoices, customers, and settings
   - Use for transferring to new devices

### Import & Restore
1. Click "Settings" → "Import Data"
2. Select your backup file
3. Confirm replacement of existing data
4. System restores all information

### Storage Management
- **Auto-save**: Invoices save as you type
- **Draft Recovery**: Unsaved work can be restored
- **Storage Warnings**: Alerts when running low on space
- **Cleanup**: Export old invoices to free space

---

## Keyboard Shortcuts

Press **F1** or **Ctrl+?** to see all shortcuts anytime!

### Navigation
- **Alt + N** - New Invoice
- **Alt + D** - Dashboard
- **Alt + L** - View Invoice List
- **Tab** - Next Field

### Invoice Actions
- **Ctrl + S** - Save Draft
- **Ctrl + P** - Print/Preview
- **Ctrl + E** - Email Invoice
- **Ctrl + D** - Download PDF

### Calculator
- **Alt + C** - Focus Calculator
- **Enter** - Add Service
- **1-8** - Select Project Type

### General
- **F1** or **Ctrl + ?** - Show Keyboard Shortcuts
- **Esc** - Close Dialog / Go to Dashboard
- **Ctrl + F** - Search Invoices

---

## Troubleshooting

### Common Issues & Solutions

#### "Storage space full" Error
1. Export invoices to CSV
2. Delete old/draft invoices
3. Download backup for safekeeping
4. Clear browser cache if needed

#### Email Not Sending
1. Check EmailJS configuration
2. Verify monthly limit not exceeded
3. Try link-only option for large invoices
4. Test with your own email first

#### PDF Generation Failed
1. Use Print → Save as PDF instead
2. Clear cache and reload
3. Try different browser
4. Check for popup blockers

#### Offline Not Working
1. Load app while online first
2. Don't clear browser data
3. Add to home screen for best results
4. Check service worker status

#### Data Not Saving
1. Check browser storage settings
2. Don't use incognito/private mode
3. Enable cookies and local storage
4. Export backup regularly

### Cache & Update Issues
If you see old content or features not working:
1. Click **"Clear Cache & Reload"** button on dashboard
2. Hard refresh: Ctrl+Shift+R (PC) or Cmd+Shift+R (Mac)
3. Clear browser cache for this site only

---

## Updates & Version History

### Current Version: 1.6.3

### Recent Improvements
- **Enhanced Search** - Find invoices and customers quickly
- **Smart Draft Recovery** - Never lose work, with intelligent restore prompts
- **Comprehensive Tooltips** - Helpful hints throughout the interface
- **Keyboard Shortcuts** - Work faster with keyboard commands
- **CSV Export** - Export data for reporting and analysis
- **Improved Error Messages** - Clearer, friendlier error notifications
- **Calculator Precision** - Fixed floating-point calculation issues
- **Security Enhancements** - XSS protection and input sanitization

### Feature Highlights
- ✅ **Offline-First** - Works without internet
- ✅ **Auto-Save** - Never lose your work
- ✅ **Multi-Business** - Switch between concrete and masonry
- ✅ **Smart Calculator** - Instant pricing with multipliers
- ✅ **Email Integration** - Send professional invoices
- ✅ **PDF Generation** - Download or print invoices
- ✅ **Data Export** - CSV and backup options
- ✅ **Mobile Friendly** - Works on all devices
- ✅ **Secure** - Data stays on your device
- ✅ **Fast** - Instant loading and searching

### Browser Support
- ✅ Chrome (Recommended)
- ✅ Edge
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (Not Supported)

### Getting Help
- **In-App Help**: Press F1 for keyboard shortcuts
- **Tooltips**: Hover over buttons and fields
- **Error Messages**: Follow on-screen instructions
- **Report Issues**: Contact support with error details

---

## Best Practices

### For Accurate Invoicing
1. **Measure Twice** - Accurate square footage prevents disputes
2. **Document Everything** - Use notes field for special conditions
3. **Status Updates** - Keep invoice status current
4. **Regular Backups** - Export monthly for safety

### For Efficiency
1. **Use Shortcuts** - Learn keyboard commands
2. **Templates** - Save frequent services
3. **Auto-Complete** - Let the system help with customer info
4. **Bulk Operations** - Export for mass updates

### For Customer Satisfaction
1. **Prompt Delivery** - Email invoices immediately
2. **Clear Descriptions** - Detail all work performed
3. **Professional Look** - Use proper business selection
4. **Accurate Pricing** - Use calculator for consistency

---

## Contact & Support

For technical support or feature requests:
- **Business**: J. Stark Masonry & Construction LLC
- **Location**: 4373 N Myers Rd, Geneva, OH 44041
- **Phone**: (440) 415-2534

---

*Thank you for using the J. Stark Business Invoicing System!*