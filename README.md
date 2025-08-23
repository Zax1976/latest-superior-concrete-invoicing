# J-Stark Invoicing System - Production Release

## Version 2.0.0 - Email System Enhancement Release
**Release Date:** August 23, 2025

### 🚀 Major Improvements

#### Email System Overhaul
- **Triple-path email launch mechanism** - Ensures emails open reliably across all platforms
- **Intelligent fallback detection** - Automatically detects when no email client is configured
- **Immediate gesture preservation** - Fixes "user gesture required" browser blocking
- **Clear user guidance** - Informative messages when email client unavailable

#### Bug Fixes
- Fixed duplicate variable declarations in service manager
- Fixed invalid CSS selectors in navigation components
- Fixed PDF generation blocking email functionality
- Enhanced state management for email operations

### 📦 What's Included

#### Core Application Files
- `index.html` - Main application entry point
- `manifest.json` - Web app manifest
- `/css/` - All stylesheets including print styles
- `/js/` - JavaScript modules for all functionality
- `/src/lib/` - Core calculation libraries

#### Features
- ✅ Concrete invoice creation with advanced calculator
- ✅ Masonry invoice creation with service management
- ✅ Estimate creation and management
- ✅ PDF generation and download
- ✅ Email integration with native client support
- ✅ Customer management
- ✅ Service history tracking
- ✅ 10-year warranty support
- ✅ Print-optimized layouts

### 🔧 Installation

1. **Download the release package**
2. **Extract to your web server directory**
3. **No database required** - Uses browser local storage
4. **No configuration needed** - Works out of the box

### 📱 Browser Compatibility

- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

### 🎯 Quick Start

1. Open `index.html` in a web browser
2. Click "New Invoice" or "New Estimate"
3. Fill in customer details
4. Add services (concrete or masonry)
5. Preview and email or download PDF

### 📧 Email Configuration

For email functionality to work:
- **Windows:** Set default email client in Settings → Apps → Default apps → Email
- **macOS:** Mail → Preferences → General → Default email reader
- **Alternative:** Use Gmail/Outlook with browser extensions

### 🐛 Known Issues

- Email requires a configured default email client
- PDF attachment in emails requires manual attachment
- Some features may require HTTPS in production

### 📝 Support

For issues or questions, please contact:
- **Business:** J. Stark Masonry & Construction LLC / Superior Concrete Leveling LLC
- **Phone:** (440) 415-2534

### 🔒 Security Notes

- All data stored locally in browser
- No external API dependencies
- No tracking or analytics
- GDPR compliant

### 📄 License

Proprietary software for J. Stark business operations.

---

**Note:** This is a production-ready release. All test files and development artifacts have been removed.