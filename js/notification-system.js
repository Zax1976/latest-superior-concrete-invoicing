/**
 * J. Stark Business Invoicing System - Enhanced Notification System
 * Toast notifications, progress indicators, and user-friendly error messages
 */

(function() {
    'use strict';
    
    console.log('🟢 NOTIFICATION-SYSTEM.JS LOADED - UPDATED VERSION 1754330000');
    
    // Notification types and configurations
    const NOTIFICATION_TYPES = {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
        LOADING: 'loading'
    };
    
    const NOTIFICATION_CONFIG = {
        maxNotifications: 5,
        defaultDuration: 5000,
        durations: {
            success: 4000,
            error: 8000,
            warning: 6000,
            info: 5000,
            loading: 0 // Persistent until dismissed
        },
        positions: {
            TOP_RIGHT: 'top-right',
            TOP_LEFT: 'top-left',  
            BOTTOM_RIGHT: 'bottom-right',
            BOTTOM_LEFT: 'bottom-left',
            TOP_CENTER: 'top-center',
            BOTTOM_CENTER: 'bottom-center'
        },
        defaultPosition: 'top-right'
    };
    
    // User-friendly error message mapping
    const ERROR_MESSAGES = {
        // Network errors
        'Failed to fetch': 'Connection problem. Please check your internet connection and try again.',
        'NetworkError': 'Network connection failed. Please check your internet and try again.',
        'net::ERR_INTERNET_DISCONNECTED': 'No internet connection. Please check your network settings.',
        
        // Storage errors
        'QuotaExceededError': 'Storage space is full. Please clear some data and try again.',
        'SecurityError': 'Access denied. Please check your browser security settings.',
        
        // Form errors
        'ValidationError': 'Please check your input and correct any errors.',
        'TypeError': 'Invalid data format. Please check your entries.',
        
        // PDF errors
        'Popup blocked': 'Popup was blocked by your browser. Please allow popups for this site.',
        'Print failed': 'Unable to print. Please try using Ctrl+P or check your printer settings.',
        
        // === SAFE-HOTFIX:NATIVE-EMAIL-FINAL (BEGIN)
        // Email errors - removed EmailJS reference
        'Email': 'Opening your email app...',
        'SMTP': 'Email could not be sent. Please check the recipient address.',
        // === SAFE-HOTFIX:NATIVE-EMAIL-FINAL (END)
        
        // Generic patterns
        'timeout': 'The operation took too long. Please try again.',
        'permission': 'Permission denied. Please check your browser settings.',
        'not found': 'The requested item could not be found.',
        'server error': 'Server is temporarily unavailable. Please try again later.'
    };
    
    // Safe text helper function to prevent DOM element coercion
    function safeText(val) {
        if (!val && val !== 0) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'number') return String(val);
        if (typeof val === 'boolean') return String(val);
        
        // Check for DOM elements more thoroughly
        if (val && (val.nodeType || val instanceof Element || val instanceof HTMLElement || val instanceof Node)) {
            console.warn('DOM element passed to notification:', val, 'Stack:', new Error().stack);
            if (window.ErrorLogger) {
                window.ErrorLogger.logError('DOM element passed to notification system', window.ERROR_CATEGORIES.UI, {
                    element: val.tagName || 'unknown',
                    className: val.className || '',
                    id: val.id || ''
                });
            }
            return val.textContent ? val.textContent.trim() : val.innerText ? val.innerText.trim() : '[DOM Element]';
        }
        
        // Check for jQuery objects
        if (val && val.jquery) {
            console.warn('jQuery object passed to notification:', val, 'Stack:', new Error().stack);
            return val.text() || '[jQuery Object]';
        }
        
        if (typeof val === 'object') {
            console.warn('Object passed to notification:', val, 'Stack:', new Error().stack);
            if (window.ErrorLogger) {
                window.ErrorLogger.logError('Object passed to notification system', window.ERROR_CATEGORIES.UI, {
                    type: typeof val,
                    constructor: val.constructor ? val.constructor.name : 'unknown'
                });
            }
            try {
                return JSON.stringify(val);
            } catch (e) {
                return '[Object]';
            }
        }
        
        return String(val);
    }

    const NotificationSystem = {
        container: null,
        notifications: new Map(),
        notificationCount: 0,
        recentMessages: new Map(), // Track recent messages to prevent spam
        
        init: function() {
            try {
                this.createContainer();
                this.setupStyles();
                this.setupGlobalErrorHandler();
                console.log('Notification System initialized successfully');
                
                if (window.ErrorLogger) {
                    window.ErrorLogger.logInfo('Notification system initialized', window.ERROR_CATEGORIES.UI);
                }
                
            } catch (error) {
                console.error('Failed to initialize Notification System:', error);
            }
        },
        
        createContainer: function() {
            if (this.container) return;
            
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = `notification-container ${NOTIFICATION_CONFIG.defaultPosition}`;
            document.body.appendChild(this.container);
        },
        
        setupStyles: function() {
            if (document.getElementById('notification-system-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'notification-system-styles';
            styles.textContent = `
                .notification-container {
                    position: fixed;
                    z-index: 10000;
                    max-width: 400px;
                    pointer-events: none;
                }
                
                .notification-container.top-right {
                    top: 20px;
                    right: 20px;
                }
                
                .notification-container.top-left {
                    top: 20px;
                    left: 20px;
                }
                
                .notification-container.bottom-right {
                    bottom: 20px;
                    right: 20px;
                }
                
                .notification-container.bottom-left {
                    bottom: 20px;
                    left: 20px;
                }
                
                .notification-container.top-center {
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                
                .notification-container.bottom-center {
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                
                .toast-notification {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    margin-bottom: 10px;
                    overflow: hidden;
                    transform: translateX(100%);
                    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    pointer-events: auto;
                    max-width: 400px;
                    word-wrap: break-word;
                }
                
                .toast-notification.show {
                    transform: translateX(0);
                }
                
                .toast-notification.hide {
                    transform: translateX(100%);
                    opacity: 0;
                }
                
                .toast-notification.success {
                    border-left: 4px solid #28a745;
                }
                
                .toast-notification.error {
                    border-left: 4px solid #dc3545;
                }
                
                .toast-notification.warning {
                    border-left: 4px solid #ffc107;
                }
                
                .toast-notification.info {
                    border-left: 4px solid #17a2b8;
                }
                
                .toast-notification.loading {
                    border-left: 4px solid #007bff;
                }
                
                .toast-header {
                    display: flex;
                    align-items: center;
                    padding: 12px 16px 8px 16px;
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                
                .toast-icon {
                    margin-right: 8px;
                    font-size: 1.1rem;
                }
                
                .toast-icon.success { color: #28a745; }
                .toast-icon.error { color: #dc3545; }
                .toast-icon.warning { color: #ffc107; }
                .toast-icon.info { color: #17a2b8; }
                .toast-icon.loading { color: #007bff; }
                
                .toast-title {
                    flex: 1;
                    margin: 0;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    color: #6c757d;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 8px;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                
                .toast-close:hover {
                    background-color: rgba(0,0,0,0.1);
                }
                
                .toast-body {
                    padding: 0 16px 12px 16px;
                    color: #495057;
                    font-size: 0.875rem;
                    line-height: 1.4;
                }
                
                .toast-actions {
                    padding: 8px 16px 12px 16px;
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }
                
                .toast-action-btn {
                    padding: 4px 12px;
                    border: 1px solid #dee2e6;
                    background: white;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .toast-action-btn:hover {
                    background: #f8f9fa;
                }
                
                .toast-action-btn.primary {
                    background: #007bff;
                    color: white;
                    border-color: #007bff;
                }
                
                .toast-action-btn.primary:hover {
                    background: #0069d9;
                }
                
                .toast-progress {
                    height: 3px;
                    background: rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .toast-progress-bar {
                    height: 100%;
                    background: currentColor;
                    transition: width 0.1s linear;
                }
                
                .toast-progress-bar.success { background: #28a745; }
                .toast-progress-bar.error { background: #dc3545; }
                .toast-progress-bar.warning { background: #ffc107; }
                .toast-progress-bar.info { background: #17a2b8; }
                .toast-progress-bar.loading { background: #007bff; }
                
                .loading-spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .toast-details {
                    padding: 8px 16px;
                    background: #f8f9fa;
                    border-top: 1px solid #dee2e6;
                    font-size: 0.75rem;
                    color: #6c757d;
                }
                
                .toast-details-toggle {
                    background: none;
                    border: none;
                    color: #007bff;
                    font-size: 0.75rem;
                    cursor: pointer;
                    padding: 0;
                    text-decoration: underline;
                }
                
                .toast-details-content {
                    margin-top: 8px;
                    font-family: monospace;
                    white-space: pre-wrap;
                    max-height: 100px;
                    overflow-y: auto;
                }
                
                /* Mobile responsiveness */
                @media (max-width: 480px) {
                    .notification-container {
                        left: 10px !important;
                        right: 10px !important;
                        max-width: none;
                        transform: none;
                    }
                    
                    .toast-notification {
                        max-width: none;
                    }
                }
                
                /* Reduce motion for accessibility */
                @media (prefers-reduced-motion: reduce) {
                    .toast-notification {
                        transition: opacity 0.3s;
                    }
                    
                    .toast-notification.show {
                        transform: none;
                    }
                    
                    .toast-notification.hide {
                        transform: none;
                    }
                }
            `;
            document.head.appendChild(styles);
        },
        
        setupGlobalErrorHandler: function() {
            // Override the existing ErrorHandler if it exists
            if (window.ErrorHandler) {
                const originalShowUserError = window.ErrorHandler.showUserError;
                window.ErrorHandler.showUserError = (message) => {
                    this.showError(message);
                };
            }
            
            // Enhance the App notification methods
            if (window.App) {
                window.App.showSuccess = (message, options) => {
                    this.showSuccess(message, options);
                };
                
                window.App.showError = (message, options) => {
                    this.showError(message, options);
                };
                
                window.App.showWarning = (message, options) => {
                    this.showWarning(message, options);
                };
                
                window.App.showInfo = (message, options) => {
                    this.showInfo(message, options);
                };
            }
        },
        
        show: function(type, message, options = {}) {
            try {
                // Use safeText to handle any type of input safely
                message = safeText(message);
                
                // Rate limiting: prevent duplicate messages within 2 seconds
                const messageKey = `${type}_${message}`;
                const now = Date.now();
                if (this.recentMessages.has(messageKey)) {
                    const lastShown = this.recentMessages.get(messageKey);
                    if (now - lastShown < 2000) {
                        console.log('Rate limited duplicate notification:', message);
                        return null; // Skip duplicate
                    }
                }
                this.recentMessages.set(messageKey, now);
                
                // Clean up old entries every 100 notifications
                if (this.recentMessages.size > 100) {
                    const cutoff = now - 5000; // 5 seconds
                    for (const [key, time] of this.recentMessages.entries()) {
                        if (time < cutoff) {
                            this.recentMessages.delete(key);
                        }
                    }
                }
                
                const id = this.generateId();
                const notification = this.createNotification(id, type, message, options);
                
                // Add to container
                this.container.appendChild(notification);
                
                // Animate in
                requestAnimationFrame(() => {
                    notification.classList.add('show');
                });
                
                // Store notification
                this.notifications.set(id, {
                    element: notification,
                    type: type,
                    message: message,
                    options: options,
                    timestamp: Date.now()
                });
                
                // Setup auto-dismiss
                if (options.duration !== 0) {
                    const duration = options.duration || NOTIFICATION_CONFIG.durations[type] || NOTIFICATION_CONFIG.defaultDuration;
                    
                    if (duration > 0) {
                        setTimeout(() => {
                            this.dismiss(id);
                        }, duration);
                        
                        // Show progress bar if enabled
                        if (options.showProgress !== false) {
                            this._animateProgressBar(notification, duration);
                        }
                    }
                }
                
                // Limit number of notifications
                this.limitNotifications();
                
                return id;
                
            } catch (error) {
                console.error('Failed to show notification:', error);
                // Fallback to alert
                alert(`${type.toUpperCase()}: ${message}`);
                return null;
            }
        },
        
        createNotification: function(id, type, message, options) {
            const notification = document.createElement('div');
            notification.className = `toast-notification ${type}`;
            notification.setAttribute('data-notification-id', id);
            
            const title = safeText(options.title || this.getDefaultTitle(type));
            const icon = this.getIcon(type);
            const showClose = options.closable !== false;
            
            // Ensure message is safe text
            const safeMessage = safeText(message);
            
            let content = `
                <div class="toast-header">
                    <span class="toast-icon ${type}">${icon}</span>
                    <span class="toast-title">${title}</span>
                    ${showClose ? '<button class="toast-close" onclick="NotificationSystem.dismiss(\'' + id + '\')">&times;</button>' : ''}
                </div>
                <div class="toast-body">${safeMessage}</div>
            `;
            
            // Add actions if provided
            if (options.actions && options.actions.length > 0) {
                content += '<div class="toast-actions">';
                options.actions.forEach(action => {
                    const btnClass = action.primary ? 'toast-action-btn primary' : 'toast-action-btn';
                    content += `<button class="${btnClass}" onclick="${action.callback}; NotificationSystem.dismiss('${id}');">${action.text}</button>`;
                });
                content += '</div>';
            }
            
            // Add progress bar - Fixed to prevent conflicts
            if (options.showProgress === true && type !== NOTIFICATION_TYPES.LOADING) {
                content += `<div class="toast-progress"><div class="toast-progress-bar ${type}" style="width: 100%"></div></div>`;
            }
            
            // Add details section if provided
            if (options.details) {
                const safeDetails = safeText(options.details);
                content += `
                    <div class="toast-details">
                        <button class="toast-details-toggle" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                            Show Details
                        </button>
                        <div class="toast-details-content" style="display: none;">${safeDetails}</div>
                    </div>
                `;
            }
            
            notification.innerHTML = content;
            return notification;
        },
        
        getDefaultTitle: function(type) {
            const titles = {
                success: 'Success',
                error: 'Error',
                warning: 'Warning',
                info: 'Information',
                loading: 'Loading...'
            };
            return titles[type] || 'Notification';
        },
        
        getIcon: function(type) {
            const icons = {
                success: '<i class="fas fa-check-circle"></i>',
                error: '<i class="fas fa-exclamation-circle"></i>',
                warning: '<i class="fas fa-exclamation-triangle"></i>',
                info: '<i class="fas fa-info-circle"></i>',
                loading: '<div class="loading-spinner"></div>'
            };
            return icons[type] || '<i class="fas fa-bell"></i>';
        },
        
        _animateProgressBar: function(notification, duration) {
            const progressBar = notification.querySelector('.toast-progress-bar');
            if (!progressBar) return;
            
            let startTime = Date.now();
            
            const updateProgress = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.max(0, 100 - (elapsed / duration) * 100);
                
                if (progressBar && progress > 0) {
                    progressBar.style.width = progress + '%';
                    requestAnimationFrame(updateProgress);
                }
            };
            
            requestAnimationFrame(updateProgress);
        },
        
        limitNotifications: function() {
            if (this.notifications.size > NOTIFICATION_CONFIG.maxNotifications) {
                // Remove oldest notifications
                const sortedNotifications = Array.from(this.notifications.entries())
                    .sort((a, b) => a[1].timestamp - b[1].timestamp);
                
                const toRemove = sortedNotifications.slice(0, this.notifications.size - NOTIFICATION_CONFIG.maxNotifications);
                toRemove.forEach(([id]) => {
                    this.dismiss(id);
                });
            }
        },
        
        dismiss: function(id) {
            const notification = this.notifications.get(id);
            if (!notification) return;
            
            const element = notification.element;
            element.classList.add('hide');
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                this.notifications.delete(id);
            }, 300);
        },
        
        dismissAll: function() {
            Array.from(this.notifications.keys()).forEach(id => {
                this.dismiss(id);
            });
        },
        
        dismissByMessage: function(targetMessage) {
            // Dismiss any existing notifications with the same message to prevent duplicates
            for (const [id, notification] of this.notifications.entries()) {
                const messageElement = notification.element.querySelector('.toast-body');
                if (messageElement && messageElement.textContent.trim() === targetMessage.trim()) {
                    this.dismiss(id);
                }
            }
        },
        
        generateId: function() {
            return 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        // Public API methods
        showSuccess: function(message, options = {}) {
            // Track success time to prevent error popups right after success
            this._lastSuccessTime = Date.now();
            
            // Prevent duplicate success notifications with the same message
            this.dismissByMessage(message);
            return this.show(NOTIFICATION_TYPES.SUCCESS, message, options);
        },
        
        showError: function(message, options = {}) {
            // === SAFE-HOTFIX:PAGES-FIRST-PAINT (BEGIN)
            // Suppress transient first-paint errors on GitHub Pages
            if (window.location.hostname.endsWith('github.io') && 
                sessionStorage.getItem('PAGES_FIRST_PAINT_OK') !== '1') {
                const msg = String(message).toLowerCase();
                if (msg.includes('listener indicated') || msg.includes('message channel') ||
                    msg.includes('sw.js') || msg.includes('service worker') ||
                    msg.includes('cannot read properties of null') || 
                    msg.includes('reading \'checked\'') ||
                    msg.includes('something went wrong')) {
                    console.warn('[PAGES:SUPPRESS] showError first-paint transient:', message);
                    return null; // Don't show notification
                }
            }
            // === SAFE-HOTFIX:PAGES-FIRST-PAINT (END)
            
            // Transform technical errors into user-friendly messages
            const friendlyMessage = this.makeErrorUserFriendly(message);
            
            const errorOptions = {
                ...options,
                title: options.title || 'Something went wrong',
                details: options.showTechnicalDetails ? message : undefined,
                actions: options.actions || (options.retry ? [{
                    text: 'Try Again',
                    primary: true,
                    callback: options.retry
                }] : undefined)
            };
            
            return this.show(NOTIFICATION_TYPES.ERROR, friendlyMessage, errorOptions);
        },
        
        showWarning: function(message, options = {}) {
            return this.show(NOTIFICATION_TYPES.WARNING, message, options);
        },
        
        showInfo: function(message, options = {}) {
            return this.show(NOTIFICATION_TYPES.INFO, message, options);
        },
        
        showLoading: function(message, options = {}) {
            const loadingOptions = {
                ...options,
                duration: 0, // Loading notifications persist
                closable: options.closable !== false,
                showProgress: false
            };
            
            return this.show(NOTIFICATION_TYPES.LOADING, message, loadingOptions);
        },
        
        updateLoadingMessage: function(id, message) {
            const notification = this.notifications.get(id);
            if (notification) {
                const bodyElement = notification.element.querySelector('.toast-body');
                if (bodyElement) {
                    bodyElement.textContent = message;
                }
            }
        },
        
        makeErrorUserFriendly: function(technicalMessage) {
            if (!technicalMessage) return 'An unexpected error occurred. Please try again.';
            
            const message = technicalMessage.toLowerCase();
            
            // Check for exact matches first
            for (const [pattern, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
                if (message.includes(pattern.toLowerCase())) {
                    return friendlyMessage;
                }
            }
            
            // Check for common error patterns
            if (message.includes('network') || message.includes('fetch')) {
                return 'Connection problem. Please check your internet connection and try again.';
            }
            
            if (message.includes('permission') || message.includes('denied')) {
                return 'Permission denied. Please check your browser settings and try again.';
            }
            
            if (message.includes('not found') || message.includes('404')) {
                return 'The requested item could not be found. Please refresh the page and try again.';
            }
            
            if (message.includes('timeout')) {
                return 'The operation took too long. Please check your connection and try again.';
            }
            
            if (message.includes('storage') || message.includes('quota')) {
                return 'Storage space is full. Please clear some browser data and try again.';
            }
            
            // Return a generic friendly message for unknown errors
            return 'Something unexpected happened. Please try again, and contact support if the problem persists.';
        },
        
        // Progress notification methods
        showProgress: function(message, options = {}) {
            const progressOptions = {
                ...options,
                duration: options.duration || 5000, // Auto-dismiss after 5 seconds instead of staying forever
                showProgress: true,
                closable: true // Make progress notifications closable to prevent stuck notifications
            };
            
            return this.show(NOTIFICATION_TYPES.INFO, message, progressOptions);
        },
        
        updateProgress: function(id, percentage, message) {
            const notification = this.notifications.get(id);
            if (!notification) return;
            
            const element = notification.element;
            const progressBar = element.querySelector('.toast-progress-bar');
            const bodyElement = element.querySelector('.toast-body');
            
            if (progressBar) {
                progressBar.style.width = Math.min(100, Math.max(0, percentage)) + '%';
            }
            
            if (message && bodyElement) {
                bodyElement.textContent = message;
            }
        },
        
        // Batch operations
        showBatch: function(notifications) {
            const ids = [];
            notifications.forEach((notification, index) => {
                setTimeout(() => {
                    const id = this.show(notification.type, notification.message, notification.options);
                    ids.push(id);
                }, index * 100); // Stagger notifications
            });
            return ids;
        },
        
        // Utility methods
        count: function() {
            return this.notifications.size;
        },
        
        clear: function() {
            this.dismissAll();
        },
        
        setPosition: function(position) {
            if (this.container && NOTIFICATION_CONFIG.positions[position]) {
                this.container.className = `notification-container ${position}`;
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            NotificationSystem.init();
        });
    } else {
        NotificationSystem.init();
    }
    
    // Export for global access
    window.NotificationSystem = NotificationSystem;
    window.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
    window.safeText = safeText;
    
    // === SAFE-HOTFIX:PAGES-FIRST-PAINT (BEGIN)
    // Detect GitHub Pages environment
    const isGitHubPages = window.location.hostname.endsWith('github.io');
    console.log('[PAGES:ENV]', { pages: isGitHubPages, hostname: window.location.hostname });
    
    // Track first-paint success for transient error suppression
    const FIRST_PAINT_KEY = 'PAGES_FIRST_PAINT_OK';
    const hasHadSuccessfulPaint = sessionStorage.getItem(FIRST_PAINT_KEY) === '1';
    
    // Classify transient errors that should be suppressed on first paint
    function isTransientFirstPaintError(message) {
        if (!message) return false;
        const msg = String(message).toLowerCase();
        return (
            msg.includes('listener indicated') ||
            msg.includes('message channel') ||
            msg.includes('sw.js') ||
            msg.includes('service worker') ||
            msg.includes('cannot read properties of null') ||
            msg.includes('reading \'checked\'') ||
            msg === 'something went wrong' ||
            msg.includes('something went wrong')
        );
    }
    // === SAFE-HOTFIX:PAGES-FIRST-PAINT (END)
    
    // Override common notification methods to catch old calls
    const originalAlert = window.alert;
    window.alert = function(message) {
        // === SAFE-HOTFIX:PAGES-FIRST-PAINT (BEGIN)
        // Suppress transient first-paint errors on GitHub Pages
        if (isGitHubPages && !hasHadSuccessfulPaint && isTransientFirstPaintError(message)) {
            console.warn('[PAGES:SUPPRESS] first-paint transient error:', message);
            // Mark that we've seen a transient error but don't show alert
            return;
        }
        // === SAFE-HOTFIX:PAGES-FIRST-PAINT (END)
        
        console.warn('Alert called with:', message, 'Type:', typeof message, 'Stack:', new Error().stack);
        return originalAlert.call(this, safeText(message));
    };
    
    // Catch any potential direct calls to show methods when App becomes available
    setTimeout(() => {
        if (window.App && window.App.showInfo) {
            const originalAppShowInfo = window.App.showInfo;
            window.App.showInfo = function(message, options) {
                console.warn('App.showInfo called with:', message, 'Type:', typeof message, 'Stack:', new Error().stack);
                return originalAppShowInfo.call(this, safeText(message), options);
            };
        }
    }, 1000);
    
})();