# Deployment Guide - J-Stark Invoicing v4.0

## 🚀 Quick Deploy

### Option 1: GitHub Pages (Recommended)
1. Fork or upload this repository to GitHub
2. Go to Settings → Pages
3. Source: Deploy from branch
4. Branch: main → / (root)
5. Save and wait for deployment
6. Access at: `https://[username].github.io/[repository-name]/`

### Option 2: Static Web Server
1. Upload all files to your web server
2. Ensure `index.html` is in the root directory
3. No server-side configuration needed
4. Access via your domain

### Option 3: Local Testing
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Then open http://localhost:8000
```

## File Structure
```
/
├── index.html          # Main application
├── manifest.json       # PWA manifest
├── package.json        # NPM scripts (optional)
├── README.md          # Documentation
├── CHANGELOG.md       # Version history
├── DEPLOYMENT.md      # This file
├── .gitignore         # Git ignore rules
├── css/               # Stylesheets
│   ├── styles.css     # Core styles
│   ├── mobile.css     # Mobile-specific (v4.0)
│   ├── print.css      # Print layouts
│   └── ...
├── js/                # JavaScript modules
│   ├── app.js         # Main application
│   ├── invoice.js     # Invoice management
│   ├── mobile-nav.js  # Mobile navigation (v4.0)
│   ├── calculator.js  # Concrete calculator
│   ├── pdf.js         # PDF generation
│   ├── email.js       # Email integration
│   └── ...
└── src/               # Core libraries
    └── lib/
        └── erPolyEstimator.js
```

## Post-Deployment Checklist

### Core Functionality
- [ ] Test invoice creation (concrete and masonry)
- [ ] Test estimate creation
- [ ] Test PDF generation
- [ ] Test email functionality
- [ ] Test data persistence (local storage)
- [ ] Verify print layouts

### Mobile Testing (v4.0)
- [ ] Hamburger menu appears on mobile (< 1024px)
- [ ] Logo remains visible in header
- [ ] Drawer opens/closes properly
- [ ] All 5 drawer actions work
- [ ] Business cards stack vertically on mobile
- [ ] Radio buttons properly hidden
- [ ] Cards are fully clickable
- [ ] Desktop layout unchanged (> 1024px)

## Browser Requirements
- Modern browser with JavaScript enabled
- Local storage support
- PDF viewer for downloads

## Troubleshooting

### Email not opening?
- Check default email client settings
- See README.md for configuration steps

### PDFs not generating?
- Check browser console for errors
- Ensure JavaScript is enabled

### Data not saving?
- Check local storage is enabled
- Check browser privacy settings

## Security Notes
- All data stored locally
- No external API calls
- No authentication required
- Consider HTTPS for production