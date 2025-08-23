/**
 * J. Stark Business Invoicing System - Comprehensive Error Logging
 * Centralized error tracking with localStorage rotation and reporting
 */

(function() {
    'use strict';
    
    // Error Logger configuration
    const ERROR_LOG_CONFIG = {
        maxLogEntries: 1000,
        maxLogSizeBytes: 1024 * 1024, // 1MB
        retentionDays: 30,
        storageKey: 'jstark_error_logs',
        reportingEndpoint: null // Could be configured for remote reporting
    };
    
    // Error severity levels
    const ERROR_LEVELS = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    };
    
    // Error categories
    const ERROR_CATEGORIES = {
        VALIDATION: 'validation',
        CALCULATION: 'calculation',
        STORAGE: 'storage',
        PDF_GENERATION: 'pdf_generation',
        EMAIL: 'email',
        NETWORK: 'network',
        UI: 'ui',
        UNKNOWN: 'unknown'
    };
    
    const ErrorLogger = {
        logs: [],
        isInitialized: false,
        
        init: function() {
            try {
                this.loadExistingLogs();
                this.setupGlobalErrorHandlers();
                this.cleanupOldLogs();
                this.isInitialized = true;
                console.log('Error Logger initialized successfully');
                
                // Log successful initialization
                this.log({
                    message: 'Error logging system initialized',
                    level: ERROR_LEVELS.LOW,
                    category: ERROR_CATEGORIES.UI,
                    context: { timestamp: new Date().toISOString() }
                });
                
            } catch (error) {
                console.error('Failed to initialize Error Logger:', error);
            }
        },
        
        setupGlobalErrorHandlers: function() {
            // Global JavaScript error handler
            window.addEventListener('error', (event) => {
                this.log({
                    message: event.message || 'JavaScript Error',
                    level: ERROR_LEVELS.HIGH,
                    category: ERROR_CATEGORIES.UI,
                    context: {
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        stack: event.error?.stack,
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    }
                });
            });
            
            // Unhandled promise rejection handler - LOG ONLY, no user notifications
            window.addEventListener('unhandledrejection', (event) => {
                // Silently log but don't create user-facing notifications to avoid conflicts
                const logEntry = this.createLogEntry({
                    message: 'Unhandled Promise Rejection: ' + (event.reason?.message || event.reason),
                    level: ERROR_LEVELS.MEDIUM, // Downgraded from HIGH to MEDIUM to avoid notifications
                    category: ERROR_CATEGORIES.UNKNOWN,
                    context: {
                        reason: event.reason,
                        stack: event.reason?.stack,
                        userAgent: navigator.userAgent,
                        url: window.location.href,
                        silentLogging: true // Flag to indicate this shouldn't show notifications
                    }
                });
                this.logs.push(logEntry);
                this.saveLogs();
                // Don't call this.log() to avoid triggering handleCriticalError
            });
            
            // Console error override for additional logging - DISABLED to prevent notification conflicts
            // NOTE: Disabled to prevent automatic error notifications that conflict with NotificationSystem
            /*
            const originalConsoleError = console.error;
            console.error = (...args) => {
                // Call original console.error
                originalConsoleError.apply(console, args);
                
                // Log to our system
                this.log({
                    message: args.join(' '),
                    level: ERROR_LEVELS.MEDIUM,
                    category: ERROR_CATEGORIES.UNKNOWN,
                    context: {
                        consoleArgs: args,
                        stack: new Error().stack,
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    }
                });
            };
            */
        },
        
        log: function(errorData) {
            if (!this.isInitialized) {
                console.warn('Error Logger not initialized');
                return;
            }
            
            try {
                const logEntry = this.createLogEntry(errorData);
                this.logs.push(logEntry);
                
                // Rotate logs if needed
                this.rotateLogs();
                
                // Save to localStorage
                this.saveLogs();
                
                // Handle critical errors
                if (errorData.level === ERROR_LEVELS.CRITICAL) {
                    this.handleCriticalError(logEntry);
                }
                
                return logEntry.id;
                
            } catch (error) {
                console.error('Failed to log error:', error);
            }
        },
        
        createLogEntry: function(errorData) {
            const entry = {
                id: this.generateLogId(),
                timestamp: new Date().toISOString(),
                message: window.safeText ? window.safeText(errorData.message || 'Unknown error') : String(errorData.message || 'Unknown error'),
                level: errorData.level || ERROR_LEVELS.MEDIUM,
                category: errorData.category || ERROR_CATEGORIES.UNKNOWN,
                context: {
                    ...errorData.context,
                    sessionId: this.getSessionId(),
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    appVersion: this.getAppVersion(),
                    browserInfo: this.getBrowserInfo(),
                    memoryUsage: this.getMemoryUsage()
                },
                userFriendlyMessage: this.getUserFriendlyMessage(errorData),
                resolved: false
            };
            
            return entry;
        },
        
        generateLogId: function() {
            return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        getSessionId: function() {
            let sessionId = sessionStorage.getItem('jstark_session_id');
            if (!sessionId) {
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('jstark_session_id', sessionId);
            }
            return sessionId;
        },
        
        getAppVersion: function() {
            return document.querySelector('meta[name="version"]')?.content || '1.0.0';
        },
        
        getBrowserInfo: function() {
            const ua = navigator.userAgent;
            let browser = 'Unknown';
            let version = 'Unknown';
            
            if (ua.includes('Chrome')) {
                browser = 'Chrome';
                version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
            } else if (ua.includes('Firefox')) {
                browser = 'Firefox';
                version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
            } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
                browser = 'Safari';
                version = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
            } else if (ua.includes('Edge')) {
                browser = 'Edge';
                version = ua.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
            }
            
            return { browser, version };
        },
        
        getMemoryUsage: function() {
            if (performance.memory) {
                return {
                    usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
                    totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
                    jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
                };
            }
            return null;
        },
        
        getUserFriendlyMessage: function(errorData) {
            const categoryMessages = {
                [ERROR_CATEGORIES.VALIDATION]: 'Please check your input and try again.',
                [ERROR_CATEGORIES.CALCULATION]: 'There was an issue with the calculation. Please verify your numbers.',
                [ERROR_CATEGORIES.STORAGE]: 'Unable to save your data. Please try again.',
                [ERROR_CATEGORIES.PDF_GENERATION]: 'Unable to generate PDF. Please try a different method.',
                [ERROR_CATEGORIES.EMAIL]: 'Email could not be sent. Please check your settings.',
                [ERROR_CATEGORIES.NETWORK]: 'Connection issue. Please check your internet connection.',
                [ERROR_CATEGORIES.UI]: 'Something went wrong. Please refresh the page and try again.',
                [ERROR_CATEGORIES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
            };
            
            return errorData.userFriendlyMessage || 
                   categoryMessages[errorData.category] || 
                   categoryMessages[ERROR_CATEGORIES.UNKNOWN];
        },
        
        rotateLogs: function() {
            // Remove entries exceeding max count
            if (this.logs.length > ERROR_LOG_CONFIG.maxLogEntries) {
                this.logs = this.logs.slice(-ERROR_LOG_CONFIG.maxLogEntries);
            }
            
            // Check storage size and remove oldest if needed
            const storageSize = JSON.stringify(this.logs).length;
            if (storageSize > ERROR_LOG_CONFIG.maxLogSizeBytes) {
                const removeCount = Math.floor(this.logs.length * 0.2); // Remove 20%
                this.logs = this.logs.slice(removeCount);
            }
        },
        
        cleanupOldLogs: function() {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - ERROR_LOG_CONFIG.retentionDays);
            
            this.logs = this.logs.filter(log => {
                return new Date(log.timestamp) > cutoffDate;
            });
        },
        
        loadExistingLogs: function() {
            try {
                const stored = localStorage.getItem(ERROR_LOG_CONFIG.storageKey);
                if (stored) {
                    this.logs = JSON.parse(stored);
                }
            } catch (error) {
                console.warn('Failed to load existing error logs:', error);
                this.logs = [];
            }
        },
        
        saveLogs: function() {
            try {
                localStorage.setItem(ERROR_LOG_CONFIG.storageKey, JSON.stringify(this.logs));
            } catch (error) {
                console.error('Failed to save error logs:', error);
                // If storage is full, remove oldest entries and try again
                if (error.name === 'QuotaExceededError') {
                    this.logs = this.logs.slice(-Math.floor(ERROR_LOG_CONFIG.maxLogEntries / 2));
                    try {
                        localStorage.setItem(ERROR_LOG_CONFIG.storageKey, JSON.stringify(this.logs));
                    } catch (retryError) {
                        console.error('Failed to save logs after cleanup:', retryError);
                    }
                }
            }
        },
        
        handleCriticalError: function(logEntry) {
            // Route through NotificationSystem to avoid conflicts
            if (window.NotificationSystem) {
                window.NotificationSystem.showError(logEntry.userFriendlyMessage, {
                    duration: 8000,
                    closable: true
                });
            } else {
                // Fallback to custom notification only if NotificationSystem unavailable
                this.showCriticalErrorNotification(logEntry);
            }
            
            // Try to report to remote endpoint if configured
            if (ERROR_LOG_CONFIG.reportingEndpoint) {
                this.reportError(logEntry);
            }
        },
        
        showCriticalErrorNotification: function(logEntry) {
            // Create critical error notification
            const notification = document.createElement('div');
            notification.className = 'critical-error-notification';
            notification.innerHTML = `
                <div class="critical-error-content">
                    <div class="critical-error-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Critical Error</span>
                        <button class="critical-error-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="critical-error-body">
                        <p>${logEntry.userFriendlyMessage}</p>
                        <div class="critical-error-actions">
                            <button class="btn btn-sm btn-secondary" onclick="ErrorLogger.showErrorReport('${logEntry.id}')">
                                View Details
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="location.reload()">
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add styles if not already present
            if (!document.getElementById('error-logger-styles')) {
                const styles = document.createElement('style');
                styles.id = 'error-logger-styles';
                styles.textContent = `
                    .critical-error-notification {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 10000;
                        max-width: 400px;
                        background: #fff;
                        border: 2px solid #dc3545;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        animation: slideInRight 0.3s ease;
                    }
                    
                    .critical-error-header {
                        background: #dc3545;
                        color: white;
                        padding: 0.75rem 1rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        font-weight: bold;
                    }
                    
                    .critical-error-close {
                        margin-left: auto;
                        background: none;
                        border: none;
                        color: white;
                        font-size: 1.5rem;
                        cursor: pointer;
                        padding: 0;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .critical-error-body {
                        padding: 1rem;
                    }
                    
                    .critical-error-actions {
                        margin-top: 1rem;
                        display: flex;
                        gap: 0.5rem;
                    }
                    
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(styles);
            }
            
            document.body.appendChild(notification);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 10000);
        },
        
        reportError: function(logEntry) {
            if (!ERROR_LOG_CONFIG.reportingEndpoint) return;
            
            try {
                fetch(ERROR_LOG_CONFIG.reportingEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(logEntry)
                }).catch(error => {
                    console.warn('Failed to report error to remote endpoint:', error);
                });
            } catch (error) {
                console.warn('Failed to report error:', error);
            }
        },
        
        // Public API methods
        logError: function(message, category = ERROR_CATEGORIES.UNKNOWN, context = {}) {
            return this.log({
                message,
                level: ERROR_LEVELS.HIGH,
                category,
                context
            });
        },
        
        logWarning: function(message, category = ERROR_CATEGORIES.UNKNOWN, context = {}) {
            return this.log({
                message,
                level: ERROR_LEVELS.MEDIUM,
                category,
                context
            });
        },
        
        logInfo: function(message, category = ERROR_CATEGORIES.UNKNOWN, context = {}) {
            return this.log({
                message,
                level: ERROR_LEVELS.LOW,
                category,
                context
            });
        },
        
        logCritical: function(message, category = ERROR_CATEGORIES.UNKNOWN, context = {}) {
            return this.log({
                message,
                level: ERROR_LEVELS.CRITICAL,
                category,
                context
            });
        },
        
        getLogs: function(filters = {}) {
            let filteredLogs = [...this.logs];
            
            if (filters.level) {
                filteredLogs = filteredLogs.filter(log => log.level === filters.level);
            }
            
            if (filters.category) {
                filteredLogs = filteredLogs.filter(log => log.category === filters.category);
            }
            
            if (filters.since) {
                const sinceDate = new Date(filters.since);
                filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= sinceDate);
            }
            
            return filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        },
        
        getLogById: function(id) {
            return this.logs.find(log => log.id === id);
        },
        
        clearLogs: function() {
            this.logs = [];
            this.saveLogs();
        },
        
        exportLogs: function() {
            const logData = {
                exportDate: new Date().toISOString(),
                logs: this.logs,
                summary: this.getLogSummary()
            };
            
            const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `jstark-error-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        
        getLogSummary: function() {
            const summary = {
                total: this.logs.length,
                byLevel: {},
                byCategory: {},
                recentErrors: 0,
                criticalErrors: 0
            };
            
            const last24Hours = new Date();
            last24Hours.setHours(last24Hours.getHours() - 24);
            
            this.logs.forEach(log => {
                // Count by level
                summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1;
                
                // Count by category
                summary.byCategory[log.category] = (summary.byCategory[log.category] || 0) + 1;
                
                // Count recent errors
                if (new Date(log.timestamp) > last24Hours) {
                    summary.recentErrors++;
                }
                
                // Count critical errors
                if (log.level === ERROR_LEVELS.CRITICAL) {
                    summary.criticalErrors++;
                }
            });
            
            return summary;
        },
        
        showErrorReport: function(logId) {
            const log = this.getLogById(logId);
            if (!log) return;
            
            const modal = document.createElement('div');
            modal.className = 'error-report-modal';
            modal.innerHTML = `
                <div class="error-report-overlay" onclick="this.parentElement.remove()"></div>
                <div class="error-report-content">
                    <div class="error-report-header">
                        <h3>Error Report</h3>
                        <button onclick="this.closest('.error-report-modal').remove()">×</button>
                    </div>
                    <div class="error-report-body">
                        <div class="error-report-section">
                            <strong>Error ID:</strong> ${log.id}
                        </div>
                        <div class="error-report-section">
                            <strong>Timestamp:</strong> ${new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div class="error-report-section">
                            <strong>Level:</strong> <span class="error-level error-level-${log.level}">${log.level.toUpperCase()}</span>
                        </div>
                        <div class="error-report-section">
                            <strong>Category:</strong> ${log.category}
                        </div>
                        <div class="error-report-section">
                            <strong>Message:</strong> ${window.safeText ? window.safeText(log.message) : String(log.message)}
                        </div>
                        <div class="error-report-section">
                            <strong>User-Friendly Message:</strong> ${window.safeText ? window.safeText(log.userFriendlyMessage) : String(log.userFriendlyMessage)}
                        </div>
                        <div class="error-report-section">
                            <strong>Context:</strong>
                            <pre class="error-context">${JSON.stringify(log.context, null, 2)}</pre>
                        </div>
                    </div>
                    <div class="error-report-footer">
                        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(log)}, null, 2))">Copy Details</button>
                        <button class="btn btn-primary" onclick="this.closest('.error-report-modal').remove()">Close</button>
                    </div>
                </div>
            `;
            
            // Add modal styles
            if (!document.getElementById('error-report-styles')) {
                const styles = document.createElement('style');
                styles.id = 'error-report-styles';
                styles.textContent = `
                    .error-report-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 10001;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .error-report-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.5);
                    }
                    
                    .error-report-content {
                        position: relative;
                        background: white;
                        border-radius: 8px;
                        max-width: 800px;
                        max-height: 80vh;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .error-report-header {
                        padding: 1rem;
                        border-bottom: 1px solid #ddd;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .error-report-body {
                        padding: 1rem;
                        overflow-y: auto;
                        flex: 1;
                    }
                    
                    .error-report-section {
                        margin-bottom: 1rem;
                    }
                    
                    .error-context {
                        background: #f8f9fa;
                        padding: 0.5rem;
                        border-radius: 4px;
                        font-size: 0.875rem;
                        max-height: 200px;
                        overflow-y: auto;
                    }
                    
                    .error-level {
                        padding: 0.25rem 0.5rem;
                        border-radius: 4px;
                        font-size: 0.75rem;
                        font-weight: bold;
                    }
                    
                    .error-level-low { background: #d4edda; color: #155724; }
                    .error-level-medium { background: #fff3cd; color: #856404; }
                    .error-level-high { background: #f8d7da; color: #721c24; }
                    .error-level-critical { background: #721c24; color: white; }
                    
                    .error-report-footer {
                        padding: 1rem;
                        border-top: 1px solid #ddd;
                        display: flex;
                        gap: 0.5rem;
                        justify-content: flex-end;
                    }
                `;
                document.head.appendChild(styles);
            }
            
            document.body.appendChild(modal);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ErrorLogger.init();
        });
    } else {
        ErrorLogger.init();
    }
    
    // Export for global access
    window.ErrorLogger = ErrorLogger;
    window.ERROR_LEVELS = ERROR_LEVELS;
    window.ERROR_CATEGORIES = ERROR_CATEGORIES;
    
})();