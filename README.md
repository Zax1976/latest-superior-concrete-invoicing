# J. Stark Business Invoicing System

A comprehensive dual-company invoicing system for **Superior Concrete Leveling LLC** and **J. Stark Masonry & Construction LLC**.

## 🚀 Features

### 🏢 **Dual Business Support**
- **Superior Concrete Leveling LLC** - Concrete lifting/leveling services
- **J. Stark Masonry & Construction LLC** - Masonry and construction services
- Separate branding and invoice templates for each business

### 📊 **Advanced Concrete Pricing Calculator**
- **Automated pricing** based on project type (driveway, sidewalk, patio, garage, basement, steps, pool deck)
- **Smart multipliers** for damage severity (mild, moderate, severe)
- **Accessibility adjustments** (easy, moderate, difficult access)
- **Real-time calculations** with transparent pricing breakdown
- **Custom rates** for special projects

### 🔨 **Flexible Masonry Services**
- Custom pricing for all masonry services
- Service templates for common work types
- Flexible units (sq ft, linear ft, each, hours, days, project)
- Custom descriptions and notes

### 📋 **Professional Invoice Management**
- **Invoice numbering** with automatic incrementing
- **Customer database** with project history
- **Multiple invoice statuses** (draft, sent, paid, overdue)
- **Search and filter** functionality
- **Edit and duplicate** invoices

### 💾 **Data Management**
- **Local storage** with automatic backup
- **Export/import** functionality for data portability
- **Customer tracking** with lifetime value calculations
- **Storage usage** monitoring and optimization

### 🖨️ **Professional Output**
- **PDF generation** with print optimization
- **Print-friendly** layouts with proper page breaks
- **Email integration** with pre-formatted content
- **Professional invoice templates** with company branding

## 📁 Project Structure

```
jstark-invoicing/
├── index.html              # Main application
├── css/
│   ├── styles.css          # Main application styles
│   └── print.css           # Print-specific styles
├── js/
│   ├── app.js              # Main application logic
│   ├── calculator.js       # Concrete & masonry calculators
│   ├── invoice.js          # Invoice management
│   ├── storage.js          # Data persistence
│   └── pdf.js              # PDF generation
└── README.md               # This file
```

## 🎨 Design System

### **Brand Colors**
- **Primary Red**: #DC143C (Crimson)
- **Dark Red**: #8B0000 (Dark Red)
- **Black**: #000000
- **White**: #FFFFFF
- **Gray**: #808080
- **Light Gray**: #f4f4f4

### **Typography**
- **Font Family**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Headings**: Bold weights for hierarchy
- **Body**: Regular weight for readability

## 🏗️ Business Information

### **Superior Concrete Leveling LLC**
- **Services**: Polyurethane concrete lifting/leveling
- **Specialties**: Driveways, sidewalks, patios, garage floors, basement floors, steps, pool decks
- **Pricing**: $5-25/sq ft (average $15/sq ft) with severity and accessibility multipliers

### **J. Stark Masonry & Construction LLC**
- **Services**: Brick masonry, stone fireplaces, chimney services, outdoor living spaces
- **Specialties**: Installation, repair, restoration, veneer stone, cultured stone
- **Pricing**: Custom quotes based on project scope and materials

### **Contact Information**
- **Address**: 4373 N Myers Rd, Geneva, OH 44041
- **Phone**: (440) 415-2534
- **Email**: justinstark64@yahoo.com
- **Owner**: Justin Stark

## 💰 Pricing Structure

### **Concrete Leveling Rates**
| Project Type | Base Rate ($/sq ft) |
|-------------|-------------------|
| Driveway | $15.00 |
| Sidewalk | $12.00 |
| Patio | $14.00 |
| Garage Floor | $16.00 |
| Basement Floor | $18.00 |
| Steps | $20.00 |
| Pool Deck | $17.00 |

### **Multipliers**
| Severity | Multiplier |
|----------|-----------|
| Mild | 1.0x |
| Moderate | 1.3x |
| Severe | 1.6x |

| Accessibility | Multiplier |
|--------------|-----------|
| Easy | 1.0x |
| Moderate | 1.1x |
| Difficult | 1.25x |

### **Tax Rate**
- **Ohio Sales Tax**: 8.25%

## 🚀 Getting Started

### **Installation**
1. **Download** the invoicing system files
2. **Open** `index.html` in a modern web browser
3. **Start creating** invoices immediately - no setup required!

### **First Use**
1. Click **"New Invoice"** from the dashboard
2. Select your business type (Concrete or Masonry)
3. Enter customer information
4. Add services using the built-in calculators
5. Preview and create your invoice
6. Print or download as PDF

## 📖 User Guide

### **Creating a Concrete Leveling Invoice**
1. Select **"Superior Concrete Leveling LLC"**
2. Choose **project type** from dropdown
3. Enter **square footage**
4. Select **damage severity** and **accessibility**
5. Review **calculated pricing** with multipliers
6. Click **"Add Service to Invoice"**
7. Add additional services as needed
8. Complete customer information and preview

### **Creating a Masonry Invoice**
1. Select **"J. Stark Masonry & Construction LLC"**
2. Choose **service type** or select "Custom"
3. Enter **description** of work
4. Specify **quantity** and **unit type**
5. Enter **rate per unit**
6. Review **calculated total**
7. Click **"Add Service to Invoice"**
8. Complete customer information and preview

### **Managing Invoices**
- **View all invoices** in the invoice list
- **Search by customer** name or invoice number
- **Filter by status** (draft, sent, paid, overdue)
- **Edit existing invoices** by clicking the edit button
- **Delete invoices** with confirmation
- **Track payment status** and update as needed

### **Data Management**
- **Automatic saving** to browser local storage
- **Export data** for backup or migration
- **Import data** from previous exports
- **Customer database** automatically populated
- **Invoice numbering** automatically managed

## 🔧 Technical Features

### **Responsive Design**
- **Mobile-first** approach for field use
- **Touch-friendly** interfaces
- **Adaptive layouts** for all screen sizes
- **Print optimization** for professional output

### **Performance**
- **Fast loading** with minimal dependencies
- **Efficient calculations** with real-time updates
- **Optimized storage** with data compression
- **Smooth animations** and transitions

### **Browser Support**
- **Chrome** 70+
- **Firefox** 65+
- **Safari** 12+
- **Edge** 79+
- **Mobile browsers** (iOS Safari, Chrome Mobile)

### **Data Storage**
- **Local storage** for offline functionality
- **Automatic backups** with configurable frequency
- **Data validation** and error handling
- **Storage monitoring** and cleanup

## 🛠️ Customization

### **Adding New Services**
1. **Concrete services**: Modify `ConcreteRates` object in `calculator.js`
2. **Masonry services**: Add options to service dropdown in `index.html`
3. **Custom rates**: Use the custom rate option for special pricing

### **Modifying Tax Rates**
1. Update `taxRate` property in `InvoiceManager` (invoice.js)
2. Modify default settings in `StorageManager` (storage.js)

### **Changing Company Information**
1. Update business info in `getBusinessInfo()` functions
2. Modify default settings in `StorageManager`
3. Update contact information in invoice templates

### **Customizing Appearance**
1. **Colors**: Modify CSS variables in `styles.css`
2. **Fonts**: Update font families in CSS
3. **Layout**: Adjust grid and flexbox properties
4. **Branding**: Replace logo URL in HTML and JavaScript files

## 📊 Reports and Analytics

### **Dashboard Metrics**
- **Total invoices** created
- **Total revenue** across both businesses
- **Pending payments** requiring follow-up
- **Paid invoices** for completed work

### **Customer Insights**
- **Customer database** with contact information
- **Project history** for repeat customers
- **Total spend** per customer
- **Last invoice date** for follow-up timing

### **Business Performance**
- **Revenue by business** type (Concrete vs Masonry)
- **Average invoice** amounts
- **Payment turnaround** times
- **Service popularity** tracking

## 🔒 Security and Privacy

### **Data Protection**
- **Local storage only** - no data sent to external servers
- **No personal information** transmitted over internet
- **Browser-based encryption** for sensitive data
- **Manual backup control** for data portability

### **Access Control**
- **Single-user system** designed for business owner
- **No login required** for immediate productivity
- **Data stays local** to the device
- **Manual sharing** through export functionality

## 🆘 Troubleshooting

### **Common Issues**

**Calculator not updating:**
- Refresh the page and try again
- Check that all required fields are filled
- Verify numeric inputs are valid

**Invoice not saving:**
- Check browser storage availability
- Clear browser cache if storage is full
- Export data as backup before clearing

**Print quality issues:**
- Use "Print to PDF" for best quality
- Ensure browser print settings are optimized
- Check that logo image loads properly

**Data disappeared:**
- Check if data was accidentally cleared
- Look for automatic backups in browser storage
- Restore from manual export if available

### **Browser Storage Limits**
- **Chrome**: ~10MB per domain
- **Firefox**: ~10MB per domain
- **Safari**: ~5-10MB per domain
- **Edge**: ~10MB per domain

Monitor storage usage in the settings panel and export data regularly.

## 🚀 Future Enhancements

### **Planned Features**
- **Multi-user support** with role-based access
- **Cloud synchronization** for data backup
- **Mobile app** for field invoicing
- **Email integration** for automatic sending
- **Payment processing** integration
- **Advanced reporting** and analytics
- **Inventory management** for materials
- **Scheduling integration** with calendar apps

### **Integration Possibilities**
- **QuickBooks** export for accounting
- **Google Calendar** for scheduling
- **Email marketing** platforms
- **CRM systems** for customer management
- **Payment processors** (Square, PayPal, Stripe)

## 📞 Support

For technical support or feature requests:
- **Email**: justinstark64@yahoo.com
- **Phone**: (440) 415-2534

## 📄 License

This invoicing system is proprietary software developed specifically for J. Stark's businesses. All rights reserved.

---

**Built for J. Stark's Business Success** 🏗️⚡