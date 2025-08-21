# J-Stark Invoicing System - GitHub Pages Release

## What's Included

This `/release` directory contains **only the runtime essentials** needed to run the J-Stark Invoicing System on GitHub Pages:

- **Core Application**: HTML, JavaScript, and CSS files
- **Business Logic**: Invoice/estimate creation, PDF generation, calculators
- **Critical Fixes**: All hotfixes and patches for stable operation
- **Styles**: All stylesheets including print media

## What's Excluded

- Test files and test HTML pages
- Development/diagnostic tools
- Archives (ZIP files)
- Screenshots and images (logo loaded from CDN)
- Service worker (disabled to prevent 404s)
- PWA manifest files
- Node modules and build artifacts
- Documentation files (except this README)

## Key Changes for GitHub Pages

1. **Service Worker Disabled**: Commented out in index.html to prevent 404 errors
2. **Relative Paths**: All asset paths are relative (./js/, ./css/)
3. **No Jekyll**: `.nojekyll` file included to prevent Jekyll processing

## Deployment Commands

Run these commands from the project root to deploy:

```bash
# Create a new branch for the release
git checkout -b release/prepare

# Stage the release directory (dry run first)
git add -n release

# Review what will be added
git status

# If everything looks good, add for real
git add release

# Commit the release
git commit -m "Package release for GitHub Pages deployment"

# Push to GitHub
git push origin release/prepare
```

## GitHub Pages Configuration

After pushing:

1. Go to Settings → Pages in your GitHub repository
2. Select source: "Deploy from a branch"
3. Choose branch: `release/prepare`
4. Choose folder: `/release`
5. Click Save

Your app will be available at: `https://[username].github.io/[repo-name]/`

## Local Testing

To test the release locally before pushing:

```bash
cd release
python -m http.server 8000
# Open http://localhost:8000
```

## Verification Checklist

Before pushing, verify:

- [ ] Service worker is disabled (check console for no SW errors)
- [ ] All paths are relative (no 404s for assets)
- [ ] PDF generation works for both concrete and masonry
- [ ] No tax appears in any invoice
- [ ] Customer details display correctly
- [ ] Estimate to invoice conversion works
- [ ] Navigation between views works smoothly

## Support

This is a packaged release for GitHub Pages deployment. The source code remains in the parent directory with all development files intact.