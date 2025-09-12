# Deployment Guide

## Quick Deploy

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
├── README.md          # Documentation
├── css/               # Stylesheets
│   ├── styles.css
│   ├── print.css
│   └── ...
├── js/                # JavaScript modules
│   ├── app.js
│   ├── invoice.js
│   ├── calculator.js
│   ├── email.js
│   └── ...
└── src/               # Core libraries
    └── lib/
        └── erPolyEstimator.js
```

## Post-Deployment Checklist

- [ ] Test invoice creation (concrete and masonry)
- [ ] Test estimate creation
- [ ] Test PDF generation
- [ ] Test email functionality
- [ ] Test data persistence (local storage)
- [ ] Test on mobile devices
- [ ] Verify print layouts

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