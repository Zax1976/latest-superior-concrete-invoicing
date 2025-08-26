# Changelog

All notable changes to the J-Stark Business Invoicing System.

## [4.0.0] - 2025-01-26 - Mobile Optimization Release

### Added
- **Mobile Navigation System**
  - Responsive hamburger menu with drawer navigation
  - 5 Quick Actions: Dashboard, Create Invoice, Create Estimate, View Jobs, Settings
  - Touch-optimized interface for phones and tablets
  - Focus trap for accessibility compliance
  - Keyboard navigation support (Tab, Enter, Space, Escape)

- **Business Card Improvements**
  - Full-card clickable areas on mobile
  - Visual selected state with brand color outline
  - Automatic radio button repositioning at runtime
  - ARIA attributes for screen readers

- **Responsive Design**
  - Mobile breakpoint: < 768px (stacked layout, drawer nav)
  - Tablet breakpoint: 768-1024px (optimized spacing)
  - Desktop: > 1024px (unchanged experience)

### Fixed
- **Critical Mobile Issues**
  - Hamburger button now contained within header (no hero bleed)
  - Logo forced visible on all screen sizes
  - Stray radio buttons properly hidden and repositioned
  - Drawer actions now functional with proper event handlers
  - Desktop layout completely preserved

### Changed
- Separated mobile styles into dedicated `css/mobile.css`
- Created standalone `js/mobile-nav.js` module
- Header positioning set to relative for proper containment
- Improved z-index hierarchy for overlays

### Technical Implementation
- Guard clause prevents double initialization: `window.__jsiMobileInit`
- Drawer dimensions: `min(78vw, 340px)` for optimal viewing
- Hamburger position: `absolute` within `relative` header
- Action fallback chain: Function → Button Click → Hash Navigation

## [3.0.0] - 2025-01-20

### Added
- Estimate system with signature capture
- Tabbed View Jobs interface
- Estimate-to-invoice conversion

## [2.0.0] - 2025-08-23

### Added
- Triple-path email navigation system for robust email client launching
- Intelligent fallback detection when no email client configured
- Clear user guidance messages for email issues
- Manifest.json for PWA support

### Fixed
- Email "user gesture required" browser blocking issue
- Duplicate variable declarations causing syntax errors
- Invalid CSS selectors in navigation components
- PDF generation blocking email functionality
- Email state management conflicts
- Button visibility issues in estimate context
- Calculator display not updating in estimate mode

### Changed
- Email launch now happens immediately on click to preserve user gesture
- Improved error messages for better user experience
- Enhanced state management for email operations
- Optimized file structure for production deployment

### Technical
- Wrapped all fixes with SAFE-HOTFIX markers for easy tracking
- Non-blocking PDF generation for email attachments
- Deterministic email state clearing with probe-based detection

## [1.9.0] - Previous Release

### Features
- Concrete and masonry invoice creation
- Estimate management system
- PDF generation and download
- Customer management
- Service history tracking
- 10-year warranty support