# Changelog

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