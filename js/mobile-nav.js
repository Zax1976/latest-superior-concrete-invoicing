// J-Stark Mobile Navigation - Production v4
(function() {
  'use strict';

  // Guard against double initialization
  if (window.__jsiMobileInit) return;
  window.__jsiMobileInit = true;

  // Constants
  const MOBILE_BREAKPOINT = 1024;
  
  // State
  let drawerOpen = false;
  let lastFocusedElement = null;
  let drawer = null;
  let backdrop = null;
  let hamburger = null;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    setupHamburgerMenu();
    fixBusinessSelector();
    
    // Re-fix business selector on dynamic changes
    const observer = new MutationObserver(debounce(fixBusinessSelector, 100));
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Handle window resize
    window.addEventListener('resize', debounce(handleResize, 150));
  }

  function setupHamburgerMenu() {
    // Find header container - try multiple selectors
    const headerSelectors = ['.app-header', '.page-header', '.header', 'header', '.topbar'];
    let header = null;
    
    for (const selector of headerSelectors) {
      header = document.querySelector(selector);
      if (header) break;
    }
    
    if (!header) {
      console.warn('Mobile Nav: No header found, cannot position hamburger properly');
      return;
    }

    // Make header relative positioned to contain the hamburger
    const currentPosition = window.getComputedStyle(header).position;
    if (currentPosition === 'static' || !currentPosition) {
      header.style.position = 'relative';
    }

    // Create hamburger button
    hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.setAttribute('aria-label', 'Open navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'mobileDrawer');
    hamburger.innerHTML = `
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>
    `;

    // Insert hamburger inside header
    header.appendChild(hamburger);

    // Create drawer and backdrop
    drawer = createDrawer();
    document.body.appendChild(drawer);

    backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    // Event listeners
    hamburger.addEventListener('click', toggleDrawer);
    backdrop.addEventListener('click', closeDrawer);
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && drawerOpen) {
        closeDrawer();
      }
    });

    // Close on hash change
    window.addEventListener('hashchange', closeDrawer);

    // Hide static header actions on mobile
    hideHeaderActions();
  }

  function createDrawer() {
    const drawerEl = document.createElement('nav');
    drawerEl.id = 'mobileDrawer';
    drawerEl.className = 'mobile-drawer';
    drawerEl.setAttribute('role', 'dialog');
    drawerEl.setAttribute('aria-modal', 'true');
    drawerEl.setAttribute('aria-hidden', 'true');
    drawerEl.setAttribute('aria-label', 'Navigation menu');

    // Drawer header
    const header = document.createElement('div');
    header.className = 'drawer-header';
    header.innerHTML = '<h2 class="drawer-title">Menu</h2>';
    drawerEl.appendChild(header);

    // Quick Actions section - the 5 required actions
    const quickSection = document.createElement('div');
    quickSection.className = 'drawer-section';
    
    const quickTitle = document.createElement('div');
    quickTitle.className = 'drawer-section-title';
    quickTitle.textContent = 'Quick Actions';
    quickSection.appendChild(quickTitle);

    const quickActions = document.createElement('div');
    quickActions.className = 'drawer-actions';

    // Add the 5 required actions in exact order
    const menuItems = [
      { label: 'Back to Dashboard', handler: goToDashboard },
      { label: 'Create New Invoice', handler: createNewInvoice },
      { label: 'Create New Estimate', handler: createNewEstimate },
      { label: 'View Jobs', handler: viewJobs },
      { label: 'Settings', handler: openSettings }
    ];

    menuItems.forEach(item => {
      const button = document.createElement('button');
      button.className = 'drawer-action';
      button.textContent = item.label;
      button.addEventListener('click', function() {
        item.handler();
        closeDrawer();
      });
      quickActions.appendChild(button);
    });

    quickSection.appendChild(quickActions);
    drawerEl.appendChild(quickSection);

    // Mirror sidebar links if sidebar exists
    const sidebarSection = createSidebarMirror();
    if (sidebarSection) {
      drawerEl.appendChild(sidebarSection);
    }

    return drawerEl;
  }

  function createSidebarMirror() {
    // Try to find existing sidebar
    const sidebarSelectors = ['aside.sidebar', '#sidebar', 'nav.sidebar', '.left-nav', '[data-role="sidebar"]'];
    let sidebar = null;
    
    for (const selector of sidebarSelectors) {
      sidebar = document.querySelector(selector);
      if (sidebar && sidebar.children.length > 0) break;
    }
    
    if (!sidebar) return null;

    // Create sidebar section
    const section = document.createElement('div');
    section.className = 'drawer-section';
    
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'drawer-section-title';
    sectionTitle.textContent = 'Navigation';
    section.appendChild(sectionTitle);

    const actions = document.createElement('div');
    actions.className = 'drawer-actions';

    // Find all links and buttons in sidebar
    const items = sidebar.querySelectorAll('a[href], button');
    const seenLabels = new Set();
    const quickLabels = new Set(['dashboard', 'invoice', 'estimate', 'jobs', 'settings']);

    items.forEach(item => {
      const text = (item.textContent || '').trim();
      const lowerText = text.toLowerCase();
      
      // Skip if empty or already seen or is a quick action
      if (!text || seenLabels.has(lowerText)) return;
      
      // Skip if this is one of our quick actions
      const isQuickAction = Array.from(quickLabels).some(label => lowerText.includes(label));
      if (isQuickAction) return;
      
      seenLabels.add(lowerText);

      if (item.tagName === 'A') {
        // Create link
        const link = document.createElement('a');
        link.className = 'drawer-link';
        link.href = item.href;
        link.textContent = text;
        link.addEventListener('click', closeDrawer);
        actions.appendChild(link);
      } else if (item.tagName === 'BUTTON') {
        // Create button that bridges to original
        const button = document.createElement('button');
        button.className = 'drawer-action';
        button.textContent = text;
        button.addEventListener('click', function() {
          item.click();
          closeDrawer();
        });
        actions.appendChild(button);
      }
    });

    // Only return section if we found items
    if (actions.children.length > 0) {
      section.appendChild(actions);
      return section;
    }
    
    return null;
  }

  // Action handlers with proper fallback chains
  function goToDashboard() {
    // Try functions first
    if (typeof window.goToDashboard === 'function') {
      window.goToDashboard();
      return;
    }
    if (typeof window.showDashboard === 'function') {
      window.showDashboard();
      return;
    }
    
    // Try clicking matching button
    const btn = findButtonByText(/dashboard/i);
    if (btn) {
      btn.click();
      return;
    }
    
    // Fallback to hash navigation
    location.hash = '#dashboard';
  }

  function createNewInvoice() {
    // Try functions first
    if (typeof window.createNewInvoice === 'function') {
      window.createNewInvoice();
      return;
    }
    if (typeof window.showCreateInvoiceOptions === 'function') {
      window.showCreateInvoiceOptions();
      return;
    }
    
    // Try clicking matching button
    const btn = findButtonByText(/new invoice|create invoice/i);
    if (btn) {
      btn.click();
      return;
    }
    
    // Fallback to hash navigation
    location.hash = '#create-invoice';
  }

  function createNewEstimate() {
    // Try functions first
    if (typeof window.createNewEstimate === 'function') {
      window.createNewEstimate();
      return;
    }
    if (typeof window.showCreateEstimateOptions === 'function') {
      window.showCreateEstimateOptions();
      return;
    }
    
    // Try clicking matching button
    const btn = findButtonByText(/new estimate|create estimate/i);
    if (btn) {
      btn.click();
      return;
    }
    
    // Fallback to hash navigation
    location.hash = '#create-estimate';
  }

  function viewJobs() {
    // Try functions first
    if (typeof window.showJobs === 'function') {
      window.showJobs();
      return;
    }
    if (typeof window.showAllInvoices === 'function') {
      window.showAllInvoices();
      return;
    }
    
    // Try clicking matching button
    const btn = findButtonByText(/view jobs|jobs/i);
    if (btn) {
      btn.click();
      return;
    }
    
    // Fallback to hash navigation
    location.hash = '#view-jobs';
  }

  function openSettings() {
    // Try functions first
    if (typeof window.openSettings === 'function') {
      window.openSettings();
      return;
    }
    if (typeof window.toggleSettings === 'function') {
      window.toggleSettings();
      return;
    }
    if (typeof window.toggleSettingsDropdown === 'function') {
      window.toggleSettingsDropdown();
      return;
    }
    
    // Try clicking matching button
    const btn = findButtonByText(/settings/i);
    if (btn) {
      btn.click();
      return;
    }
    
    // Fallback to hash navigation
    location.hash = '#settings';
  }

  function findButtonByText(regex) {
    const elements = document.querySelectorAll('button, a');
    for (let el of elements) {
      const text = el.textContent || '';
      if (regex.test(text)) {
        return el;
      }
    }
    return null;
  }

  function toggleDrawer() {
    if (drawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function openDrawer() {
    if (!drawer || !backdrop || !hamburger) return;

    // Store last focused element
    lastFocusedElement = document.activeElement;

    // Open drawer
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('drawer-open');
    
    drawerOpen = true;

    // Focus first interactive element
    setTimeout(() => {
      const firstButton = drawer.querySelector('button, a');
      if (firstButton) firstButton.focus();
    }, 50);

    // Setup focus trap
    setupFocusTrap(drawer);
  }

  function closeDrawer() {
    if (!drawer || !backdrop || !hamburger) return;

    // Close drawer
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('drawer-open');
    
    drawerOpen = false;

    // Restore focus
    if (lastFocusedElement && lastFocusedElement.focus) {
      lastFocusedElement.focus();
    }

    // Remove focus trap
    removeFocusTrap();
  }

  function setupFocusTrap(container) {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleTab(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }

    container._focusTrapHandler = handleTab;
    document.addEventListener('keydown', handleTab);
  }

  function removeFocusTrap() {
    if (drawer && drawer._focusTrapHandler) {
      document.removeEventListener('keydown', drawer._focusTrapHandler);
      delete drawer._focusTrapHandler;
    }
  }

  function hideHeaderActions() {
    // Only hide on mobile
    if (window.innerWidth > MOBILE_BREAKPOINT) return;

    // Find and hide header action containers
    const selectors = ['.header-actions', 'nav.header-actions', '.header-nav'];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.classList.add('hide-on-mobile');
      });
    });
  }

  function fixBusinessSelector() {
    const containers = document.querySelectorAll('.business-choice-row, .business-options, .business-selector');
    
    containers.forEach(container => {
      // Find stray radios as direct children
      const strayRadios = [];
      for (let child of container.children) {
        if (child.tagName === 'INPUT' && child.type === 'radio') {
          strayRadios.push(child);
        }
      }
      
      // Find business cards
      const cards = container.querySelectorAll('.business-card');
      
      // Move stray radios into matching cards by index
      if (strayRadios.length > 0 && cards.length > 0) {
        strayRadios.forEach((radio, index) => {
          if (cards[index]) {
            // Move radio to be first child of card
            cards[index].insertBefore(radio, cards[index].firstChild);
          }
        });
      }
      
      // Setup card interactions
      cards.forEach(card => {
        const radio = card.querySelector('input[type="radio"]');
        if (!radio) return;
        
        // Ensure radio is first child
        if (card.firstChild !== radio) {
          card.insertBefore(radio, card.firstChild);
        }
        
        // Setup accessibility
        card.setAttribute('role', 'radio');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-checked', radio.checked ? 'true' : 'false');
        
        // Update visual state
        if (radio.checked) {
          card.classList.add('selected');
        }
        
        // Handle card click (avoid duplicate handlers)
        if (!card._mobileClickHandler) {
          card._mobileClickHandler = function(e) {
            // Don't trigger if clicking on input or link
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'A') return;
            
            if (!radio.checked) {
              radio.click();
            }
          };
          card.addEventListener('click', card._mobileClickHandler);
        }
        
        // Handle keyboard (avoid duplicate handlers)
        if (!card._mobileKeyHandler) {
          card._mobileKeyHandler = function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!radio.checked) {
                radio.click();
              }
            }
          };
          card.addEventListener('keydown', card._mobileKeyHandler);
        }
        
        // Listen for radio changes (avoid duplicate handlers)
        if (!radio._mobileChangeHandler) {
          radio._mobileChangeHandler = function() {
            // Update all cards in the same group
            const groupName = radio.name;
            if (!groupName) return;
            
            const allRadios = container.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
            
            allRadios.forEach(r => {
              const parentCard = r.closest('.business-card');
              if (parentCard) {
                if (r.checked) {
                  parentCard.classList.add('selected');
                  parentCard.setAttribute('aria-checked', 'true');
                } else {
                  parentCard.classList.remove('selected');
                  parentCard.setAttribute('aria-checked', 'false');
                }
              }
            });
          };
          radio.addEventListener('change', radio._mobileChangeHandler);
        }
      });
    });
  }

  function handleResize() {
    const width = window.innerWidth;
    
    if (width > MOBILE_BREAKPOINT) {
      // Close drawer if open when resizing to desktop
      if (drawerOpen) {
        closeDrawer();
      }
      
      // Remove hide-on-mobile class on desktop
      const hidden = document.querySelectorAll('.hide-on-mobile');
      hidden.forEach(el => el.classList.remove('hide-on-mobile'));
    } else {
      // Reapply mobile hiding
      hideHeaderActions();
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
})();