/**
 * J. Stark Business Invoicing System - Data Storage
 * Handles local storage, data persistence, and backup/restore
 */

(function() {
    'use strict';
    
    const StorageManager = {
        // Storage keys
        keys: {
            invoices: 'jstark_invoices',
            customers: 'jstark_customers',
            settings: 'jstark_settings',
            nextInvoiceNumber: 'jstark_next_invoice_number',
            backups: 'jstark_backups',
            customerDefaults: 'jstark_customer_defaults',
            frequentServices: 'jstark_frequent_services',
            lastUsedValues: 'jstark_last_used_values'
        },
        
        // Default settings
        defaultSettings: {
            taxRate: 0.0825,
            companyInfo: {
                concrete: {
                    name: 'Superior Concrete Leveling LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com',
                    website: 'superiorconcrete.com'
                },
                masonry: {
                    name: 'J. Stark Masonry & Construction LLC',
                    address: '4373 N Myers Rd, Geneva, OH 44041',
                    phone: '(440) 415-2534',
                    email: 'justinstark64@yahoo.com',
                    website: 'jstarkmasonry.com'
                }
            },
            autoBackup: true,
            backupFrequency: 'daily', // daily, weekly, monthly
            maxBackups: 10
        },
        
        init: function() {
            try {
                this.checkStorageSupport();
                this.initializeSettings();
                this.setupAutoBackup();
                
                // Run data migration if needed
                this.migrate();
                
                console.log('Storage Manager initialized');
            } catch (error) {
                console.error('Storage Manager initialization error:', error);
            }
        },
        
        checkStorageSupport: function() {
            try {
                if (typeof(Storage) === "undefined") {
                    throw new Error('Local storage not supported');
                }
                
                // Test storage availability
                const testKey = 'jstark_test';
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
                
                return true;
            } catch (error) {
                console.error('Storage support check failed:', error);
                alert('Local storage is not available. Data will not be saved between sessions.');
                return false;
            }
        },
        
        initializeSettings: function() {
            try {
                const existingSettings = this.loadSettings();
                if (!existingSettings) {
                    this.saveSettings(this.defaultSettings);
                }
            } catch (error) {
                console.error('Settings initialization error:', error);
            }
        },
        
        // Invoice management with quota handling
        saveInvoice: function(invoice) {
            try {
                const invoices = this.loadInvoices();
                const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
                
                if (existingIndex >= 0) {
                    invoices[existingIndex] = invoice;
                } else {
                    invoices.push(invoice);
                }
                
                const success = this.saveInvoicesWithQuotaCheck(invoices);
                if (success) {
                    this.updateCustomerFromInvoice(invoice);
                }
                
                return success;
            } catch (error) {
                console.error('Save invoice error:', error);
                if (window.ErrorHandler) {
                    window.ErrorHandler.log(error, 'Storage', 'error');
                }
                return false;
            }
        },
        
        loadInvoices: function() {
            try {
                const data = localStorage.getItem(this.keys.invoices);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('Load invoices error:', error);
                return [];
            }
        },
        
        saveInvoices: function(invoices) {
            try {
                localStorage.setItem(this.keys.invoices, JSON.stringify(invoices));
                return true;
            } catch (error) {
                console.error('Save invoices error:', error);
                return false;
            }
        },
        
        saveInvoicesWithQuotaCheck: function(invoices) {
            try {
                const dataString = JSON.stringify(invoices);
                const dataSize = new Blob([dataString]).size;
                
                // Check available storage before saving
                if (!this.checkStorageSpace(dataSize)) {
                    if (window.ErrorHandler) {
                        window.ErrorHandler.showUserError('You\'re out of storage space. Please export your invoices to CSV or delete old ones to continue.');
                    }
                    return false;
                }
                
                localStorage.setItem(this.keys.invoices, dataString);
                return true;
            } catch (error) {
                if (error.name === 'QuotaExceededError' || error.code === 22) {
                    return this.handleStorageQuotaExceeded();
                } else {
                    console.error('Save invoices with quota check error:', error);
                    if (window.ErrorHandler) {
                        window.ErrorHandler.log(error, 'Storage Quota', 'error');
                    }
                    return false;
                }
            }
        },
        
        checkStorageSpace: function(requiredBytes) {
            try {
                // Estimate current usage
                let currentUsage = 0;
                for (const key in this.keys) {
                    const data = localStorage.getItem(this.keys[key]);
                    if (data) {
                        currentUsage += new Blob([data]).size;
                    }
                }
                
                // Typical localStorage limit is 5-10MB
                const estimatedLimit = 5 * 1024 * 1024; // 5MB
                const availableSpace = estimatedLimit - currentUsage;
                
                return availableSpace > requiredBytes + (100 * 1024); // Leave 100KB buffer
            } catch (error) {
                console.error('Check storage space error:', error);
                return true; // Assume space is available if we can't check
            }
        },
        
        handleStorageQuotaExceeded: function() {
            try {
                if (window.ErrorHandler) {
                    window.ErrorHandler.showUserError('Storage is full. We\'re trying to free up some space...');
                }
                
                // Attempt to free up space by removing non-essential data
                this.cleanupNonEssentialData();
                
                // Try one more time
                const invoices = this.loadInvoices();
                try {
                    localStorage.setItem(this.keys.invoices, JSON.stringify(invoices));
                    if (window.ErrorHandler) {
                        window.ErrorHandler.showSuccess('Storage cleaned up successfully.');
                    }
                    return true;
                } catch (retryError) {
                    if (window.ErrorHandler) {
                        window.ErrorHandler.showUserError('Still not enough space. Please export your data to CSV, then refresh the page.');
                    }
                    return false;
                }
            } catch (error) {
                console.error('Handle storage quota exceeded error:', error);
                return false;
            }
        },
        
        cleanupNonEssentialData: function() {
            try {
                // Remove old backups beyond the limit
                const backups = this.loadBackups();
                if (backups.length > 3) {
                    const essentialBackups = backups.slice(-3); // Keep only last 3 backups
                    this.saveBackups(essentialBackups);
                }
                
                // Remove old frequent services data
                localStorage.removeItem(this.keys.frequentServices);
                
                // Remove old last used values
                localStorage.removeItem(this.keys.lastUsedValues);
                
                // Remove old customer defaults for inactive customers
                const customerDefaults = this.loadCustomerDefaults();
                const customers = this.loadCustomers();
                const activeCustomerNames = customers.map(c => c.name.toLowerCase());
                
                const cleanedDefaults = {};
                for (const [customerId, defaults] of Object.entries(customerDefaults)) {
                    if (activeCustomerNames.includes(customerId.toLowerCase())) {
                        cleanedDefaults[customerId] = defaults;
                    }
                }
                localStorage.setItem(this.keys.customerDefaults, JSON.stringify(cleanedDefaults));
                
                console.log('Non-essential data cleaned up');
                return true;
            } catch (error) {
                console.error('Cleanup non-essential data error:', error);
                return false;
            }
        },
        
        deleteInvoice: function(invoiceId) {
            try {
                const invoices = this.loadInvoices();
                const filteredInvoices = invoices.filter(inv => inv.id !== invoiceId);
                this.saveInvoices(filteredInvoices);
                return true;
            } catch (error) {
                console.error('Delete invoice error:', error);
                return false;
            }
        },
        
        getInvoiceById: function(invoiceId) {
            try {
                const invoices = this.loadInvoices();
                return invoices.find(inv => inv.id === invoiceId) || null;
            } catch (error) {
                console.error('Get invoice by ID error:', error);
                return null;
            }
        },
        
        // Customer management
        updateCustomerFromInvoice: function(invoice) {
            try {
                if (!invoice.customerName) return;
                
                const customers = this.loadCustomers();
                const existingIndex = customers.findIndex(customer => 
                    customer.name.toLowerCase() === invoice.customerName.toLowerCase()
                );
                
                const customerData = {
                    name: invoice.customerName,
                    email: invoice.customerEmail || '',
                    phone: invoice.customerPhone || '',
                    address: invoice.customerAddress || '',
                    lastInvoiceDate: invoice.date,
                    totalInvoices: 1,
                    totalAmount: invoice.total || 0
                };
                
                if (existingIndex >= 0) {
                    // Update existing customer
                    const existing = customers[existingIndex];
                    customerData.totalInvoices = (existing.totalInvoices || 0) + 1;
                    customerData.totalAmount = (existing.totalAmount || 0) + (invoice.total || 0);
                    customerData.firstInvoiceDate = existing.firstInvoiceDate || invoice.date;
                    
                    customers[existingIndex] = { ...existing, ...customerData };
                } else {
                    // Add new customer
                    customerData.firstInvoiceDate = invoice.date;
                    customers.push(customerData);
                }
                
                this.saveCustomers(customers);
            } catch (error) {
                console.error('Update customer error:', error);
            }
        },
        
        loadCustomers: function() {
            try {
                const data = localStorage.getItem(this.keys.customers);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('Load customers error:', error);
                return [];
            }
        },
        
        saveCustomers: function(customers) {
            try {
                localStorage.setItem(this.keys.customers, JSON.stringify(customers));
                return true;
            } catch (error) {
                console.error('Save customers error:', error);
                return false;
            }
        },
        
        searchCustomers: function(query) {
            try {
                const customers = this.loadCustomers();
                const lowerQuery = query.toLowerCase();
                
                return customers.filter(customer => 
                    customer.name.toLowerCase().includes(lowerQuery) ||
                    customer.email.toLowerCase().includes(lowerQuery) ||
                    customer.phone.includes(query)
                );
            } catch (error) {
                console.error('Search customers error:', error);
                return [];
            }
        },
        
        // Smart Defaults Management
        saveCustomerDefaults: function(customerId, defaults) {
            try {
                const allDefaults = this.loadCustomerDefaults();
                allDefaults[customerId] = {
                    ...allDefaults[customerId],
                    ...defaults,
                    lastUpdated: new Date().toISOString()
                };
                localStorage.setItem(this.keys.customerDefaults, JSON.stringify(allDefaults));
                return true;
            } catch (error) {
                console.error('Save customer defaults error:', error);
                return false;
            }
        },
        
        loadCustomerDefaults: function(customerId = null) {
            try {
                const data = localStorage.getItem(this.keys.customerDefaults);
                const allDefaults = data ? JSON.parse(data) : {};
                return customerId ? allDefaults[customerId] || {} : allDefaults;
            } catch (error) {
                console.error('Load customer defaults error:', error);
                return customerId ? {} : {};
            }
        },
        
        // Frequent Services Management
        trackServiceUsage: function(service) {
            try {
                const frequentServices = this.loadFrequentServices();
                const serviceKey = `${service.type}_${service.description}`;
                
                if (!frequentServices[serviceKey]) {
                    frequentServices[serviceKey] = {
                        ...service,
                        count: 0,
                        lastUsed: null
                    };
                }
                
                frequentServices[serviceKey].count++;
                frequentServices[serviceKey].lastUsed = new Date().toISOString();
                
                localStorage.setItem(this.keys.frequentServices, JSON.stringify(frequentServices));
                return true;
            } catch (error) {
                console.error('Track service usage error:', error);
                return false;
            }
        },
        
        loadFrequentServices: function(limit = 5) {
            try {
                const data = localStorage.getItem(this.keys.frequentServices);
                const services = data ? JSON.parse(data) : {};
                
                // Sort by usage count and return top services
                const sorted = Object.values(services)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, limit);
                
                return sorted;
            } catch (error) {
                console.error('Load frequent services error:', error);
                return [];
            }
        },
        
        // Last Used Values
        saveLastUsedValues: function(values) {
            try {
                const lastUsed = this.loadLastUsedValues();
                const updated = {
                    ...lastUsed,
                    ...values,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem(this.keys.lastUsedValues, JSON.stringify(updated));
                return true;
            } catch (error) {
                console.error('Save last used values error:', error);
                return false;
            }
        },
        
        loadLastUsedValues: function() {
            try {
                const data = localStorage.getItem(this.keys.lastUsedValues);
                return data ? JSON.parse(data) : {};
            } catch (error) {
                console.error('Load last used values error:', error);
                return {};
            }
        },
        
        // Settings management
        loadSettings: function() {
            try {
                const data = localStorage.getItem(this.keys.settings);
                return data ? { ...this.defaultSettings, ...JSON.parse(data) } : null;
            } catch (error) {
                console.error('Load settings error:', error);
                return this.defaultSettings;
            }
        },
        
        saveSettings: function(settings) {
            try {
                localStorage.setItem(this.keys.settings, JSON.stringify(settings));
                return true;
            } catch (error) {
                console.error('Save settings error:', error);
                return false;
            }
        },
        
        updateSetting: function(key, value) {
            try {
                const settings = this.loadSettings();
                settings[key] = value;
                return this.saveSettings(settings);
            } catch (error) {
                console.error('Update setting error:', error);
                return false;
            }
        },
        
        // Invoice numbering
        getNextInvoiceNumber: function() {
            try {
                const current = localStorage.getItem(this.keys.nextInvoiceNumber);
                return current ? parseInt(current) : 1;
            } catch (error) {
                console.error('Get next invoice number error:', error);
                return 1;
            }
        },
        
        incrementInvoiceNumber: function() {
            try {
                const current = this.getNextInvoiceNumber();
                const next = current + 1;
                localStorage.setItem(this.keys.nextInvoiceNumber, next.toString());
                return next;
            } catch (error) {
                console.error('Increment invoice number error:', error);
                return 1;
            }
        },
        
        setInvoiceNumber: function(number) {
            try {
                localStorage.setItem(this.keys.nextInvoiceNumber, number.toString());
                return true;
            } catch (error) {
                console.error('Set invoice number error:', error);
                return false;
            }
        },
        
        // Backup and restore
        createBackup: function() {
            try {
                const backupData = {
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    data: {
                        invoices: this.loadInvoices(),
                        customers: this.loadCustomers(),
                        settings: this.loadSettings(),
                        nextInvoiceNumber: this.getNextInvoiceNumber()
                    }
                };
                
                const backups = this.loadBackups();
                backups.push(backupData);
                
                // Limit number of backups
                const settings = this.loadSettings();
                const maxBackups = settings.maxBackups || 10;
                
                if (backups.length > maxBackups) {
                    backups.splice(0, backups.length - maxBackups);
                }
                
                this.saveBackups(backups);
                console.log('Backup created successfully');
                
                return backupData;
            } catch (error) {
                console.error('Create backup error:', error);
                return null;
            }
        },
        
        loadBackups: function() {
            try {
                const data = localStorage.getItem(this.keys.backups);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                console.error('Load backups error:', error);
                return [];
            }
        },
        
        saveBackups: function(backups) {
            try {
                localStorage.setItem(this.keys.backups, JSON.stringify(backups));
                return true;
            } catch (error) {
                console.error('Save backups error:', error);
                return false;
            }
        },
        
        restoreFromBackup: function(backup) {
            try {
                if (!backup || !backup.data) {
                    throw new Error('Invalid backup data');
                }
                
                const data = backup.data;
                
                // Restore data
                if (data.invoices) this.saveInvoices(data.invoices);
                if (data.customers) this.saveCustomers(data.customers);
                if (data.settings) this.saveSettings(data.settings);
                if (data.nextInvoiceNumber) this.setInvoiceNumber(data.nextInvoiceNumber);
                
                console.log('Data restored from backup successfully');
                return true;
            } catch (error) {
                console.error('Restore backup error:', error);
                return false;
            }
        },
        
        exportData: function() {
            try {
                const exportData = {
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    application: 'J. Stark Invoicing System',
                    data: {
                        invoices: this.loadInvoices(),
                        customers: this.loadCustomers(),
                        settings: this.loadSettings(),
                        nextInvoiceNumber: this.getNextInvoiceNumber()
                    }
                };
                
                return JSON.stringify(exportData, null, 2);
            } catch (error) {
                console.error('Export data error:', error);
                return null;
            }
        },
        
        importData: function(jsonData) {
            try {
                const importData = JSON.parse(jsonData);
                
                if (!importData.data) {
                    throw new Error('Invalid import data format');
                }
                
                // Confirm with user
                if (!confirm('This will replace all existing data. Are you sure you want to continue?')) {
                    return false;
                }
                
                return this.restoreFromBackup(importData);
            } catch (error) {
                console.error('Import data error:', error);
                alert('We couldn\'t import this file. Please make sure it\'s a valid backup file from J. Stark Invoicing.');
                return false;
            }
        },
        
        downloadBackup: function() {
            try {
                const exportData = this.exportData();
                if (!exportData) {
                    throw new Error('Failed to create export data');
                }
                
                const blob = new Blob([exportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `jstark-invoicing-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                
                console.log('Backup file downloaded');
                return true;
            } catch (error) {
                console.error('Download backup error:', error);
                return false;
            }
        },
        
        // Auto backup functionality
        setupAutoBackup: function() {
            try {
                const settings = this.loadSettings();
                if (!settings.autoBackup) return;
                
                const lastBackup = localStorage.getItem('jstark_last_backup');
                const now = new Date();
                
                let shouldBackup = false;
                
                if (!lastBackup) {
                    shouldBackup = true;
                } else {
                    const lastBackupDate = new Date(lastBackup);
                    const timeDiff = now - lastBackupDate;
                    
                    switch (settings.backupFrequency) {
                        case 'daily':
                            shouldBackup = timeDiff > 24 * 60 * 60 * 1000; // 24 hours
                            break;
                        case 'weekly':
                            shouldBackup = timeDiff > 7 * 24 * 60 * 60 * 1000; // 7 days
                            break;
                        case 'monthly':
                            shouldBackup = timeDiff > 30 * 24 * 60 * 60 * 1000; // 30 days
                            break;
                    }
                }
                
                if (shouldBackup) {
                    this.createBackup();
                    localStorage.setItem('jstark_last_backup', now.toISOString());
                }
            } catch (error) {
                console.error('Auto backup setup error:', error);
            }
        },
        
        // Storage usage statistics
        getStorageUsage: function() {
            try {
                let totalSize = 0;
                const usage = {};
                
                for (const key in this.keys) {
                    const data = localStorage.getItem(this.keys[key]);
                    const size = data ? new Blob([data]).size : 0;
                    usage[key] = {
                        size: size,
                        sizeFormatted: this.formatBytes(size)
                    };
                    totalSize += size;
                }
                
                return {
                    total: totalSize,
                    totalFormatted: this.formatBytes(totalSize),
                    breakdown: usage,
                    available: this.getAvailableStorage()
                };
            } catch (error) {
                console.error('Get storage usage error:', error);
                return null;
            }
        },
        
        getAvailableStorage: function() {
            try {
                // This is an estimate as there's no direct way to get localStorage quota
                const testData = new Array(1024 * 1024).join('a'); // 1MB of data
                let available = 0;
                
                try {
                    for (let i = 0; i < 10; i++) { // Test up to 10MB
                        localStorage.setItem('test_storage_' + i, testData);
                        available += testData.length;
                    }
                } catch (e) {
                    // Storage full
                } finally {
                    // Clean up test data
                    for (let i = 0; i < 10; i++) {
                        localStorage.removeItem('test_storage_' + i);
                    }
                }
                
                return available;
            } catch (error) {
                console.error('Get available storage error:', error);
                return 0;
            }
        },
        
        formatBytes: function(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        // Clear all data
        clearAllData: function() {
            try {
                if (!confirm('This will permanently delete all invoices, customers, and settings. This action cannot be undone. Are you sure?')) {
                    return false;
                }
                
                for (const key in this.keys) {
                    localStorage.removeItem(this.keys[key]);
                }
                
                localStorage.removeItem('jstark_last_backup');
                
                // Reinitialize settings
                this.initializeSettings();
                
                console.log('All data cleared successfully');
                return true;
            } catch (error) {
                console.error('Clear all data error:', error);
                return false;
            }
        },
        
        // Data Migration System
        migrate: function() {
            try {
                const currentVersion = this.getCurrentDataVersion();
                const targetVersion = '1.6.3';
                
                if (currentVersion === targetVersion) {
                    console.log('Data is up to date');
                    return true;
                }
                
                console.log(`Migrating data from ${currentVersion} to ${targetVersion}`);
                
                // Run migrations in sequence
                const migrations = this.getMigrationsToRun(currentVersion, targetVersion);
                
                for (const migration of migrations) {
                    try {
                        console.log(`Running migration: ${migration.version}`);
                        migration.migrate();
                        this.setDataVersion(migration.version);
                        console.log(`Migration ${migration.version} completed`);
                    } catch (migrationError) {
                        console.error(`Migration ${migration.version} failed:`, migrationError);
                        throw new Error(`Migration failed at version ${migration.version}: ${migrationError.message}`);
                    }
                }
                
                console.log('All migrations completed successfully');
                return true;
                
            } catch (error) {
                console.error('Data migration error:', error);
                if (window.ErrorHandler) {
                    window.ErrorHandler.log(error, 'Data Migration', 'critical');
                    window.ErrorHandler.showUserError('We couldn\'t update your data to the latest version. Please refresh the page and try again.');
                }
                return false;
            }
        },
        
        getCurrentDataVersion: function() {
            try {
                return localStorage.getItem('jstark_data_version') || '1.0.0';
            } catch (error) {
                console.error('Get current data version error:', error);
                return '1.0.0';
            }
        },
        
        setDataVersion: function(version) {
            try {
                localStorage.setItem('jstark_data_version', version);
                return true;
            } catch (error) {
                console.error('Set data version error:', error);
                return false;
            }
        },
        
        getMigrationsToRun: function(currentVersion, targetVersion) {
            const migrations = [
                {
                    version: '1.5.0',
                    migrate: () => this.migrate_v1_5_0()
                },
                {
                    version: '1.6.0',
                    migrate: () => this.migrate_v1_6_0()
                },
                {
                    version: '1.6.1',
                    migrate: () => this.migrate_v1_6_1()
                },
                {
                    version: '1.6.2',
                    migrate: () => this.migrate_v1_6_2()
                },
                {
                    version: '1.6.3',
                    migrate: () => this.migrate_v1_6_3()
                }
            ];
            
            // Filter migrations that need to run
            return migrations.filter(migration => {
                return this.compareVersions(migration.version, currentVersion) > 0 &&
                       this.compareVersions(migration.version, targetVersion) <= 0;
            });
        },
        
        compareVersions: function(a, b) {
            const aParts = a.split('.').map(Number);
            const bParts = b.split('.').map(Number);
            
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                const aPart = aParts[i] || 0;
                const bPart = bParts[i] || 0;
                
                if (aPart > bPart) return 1;
                if (aPart < bPart) return -1;
            }
            return 0;
        },
        
        // Migration functions
        migrate_v1_5_0: function() {
            // Added email functionality - ensure email service settings exist
            const settings = this.loadSettings();
            if (!settings.emailService) {
                settings.emailService = {
                    configured: false,
                    serviceId: '',
                    templateId: '',
                    publicKey: ''
                };
                this.saveSettings(settings);
            }
        },
        
        migrate_v1_6_0: function() {
            // Enhanced error handling - migrate old error logs
            try {
                const oldErrors = localStorage.getItem('jstark_errors');
                if (oldErrors) {
                    const errors = JSON.parse(oldErrors);
                    // Convert old format to new format
                    const newErrors = errors.map(error => ({
                        message: error.message || error,
                        context: 'Legacy',
                        severity: 'error',
                        timestamp: error.timestamp || new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    }));
                    localStorage.setItem('jstark_critical_errors', JSON.stringify(newErrors.slice(0, 5)));
                    localStorage.removeItem('jstark_errors');
                }
            } catch (error) {
                console.warn('Error migrating error logs:', error);
            }
        },
        
        migrate_v1_6_1: function() {
            // Mobile improvements - clean up old mobile cache data
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('jstark_mobile_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        },
        
        migrate_v1_6_2: function() {
            // Enhanced security and validation - sanitize existing data
            try {
                // Sanitize existing invoices
                const invoices = this.loadInvoices();
                if (invoices.length > 0 && window.SecurityUtils) {
                    const sanitizedInvoices = invoices.map(invoice => 
                        window.SecurityUtils.sanitizeInvoiceData(invoice)
                    ).filter(invoice => invoice !== null);
                    
                    if (sanitizedInvoices.length !== invoices.length) {
                        console.warn(`Removed ${invoices.length - sanitizedInvoices.length} corrupted invoices during migration`);
                    }
                    
                    this.saveInvoices(sanitizedInvoices);
                }
                
                // Sanitize existing customers
                const customers = this.loadCustomers();
                if (customers.length > 0 && window.SecurityUtils) {
                    const sanitizedCustomers = customers.map(customer => 
                        window.SecurityUtils.sanitizeCustomerData(customer)
                    ).filter(customer => customer !== null);
                    
                    if (sanitizedCustomers.length !== customers.length) {
                        console.warn(`Removed ${customers.length - sanitizedCustomers.length} corrupted customers during migration`);
                    }
                    
                    this.saveCustomers(sanitizedCustomers);
                }
                
                // Initialize security logging
                if (window.SecurityUtils) {
                    window.SecurityUtils.logSecurityEvent('data_migration_completed', {
                        version: '1.6.2',
                        invoicesProcessed: invoices.length,
                        customersProcessed: customers.length
                    });
                }
                
            } catch (error) {
                console.error('Data sanitization during migration failed:', error);
                throw error;
            }
        },
        
        migrate_v1_6_3: function() {
            // Enhanced validation and performance - clear old validation caches
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('jstark_validation_') || key.startsWith('jstark_old_'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Log performance improvements
            if (window.SecurityUtils) {
                window.SecurityUtils.logSecurityEvent('performance_migration_completed', {
                    version: '1.6.3',
                    features: ['enhanced_validation', 'calculator_precision', 'scroll_throttling', 'data_migration']
                });
            }
        },
        
        // Backup before migration
        createMigrationBackup: function() {
            try {
                const backup = this.createBackup();
                if (backup) {
                    // Store migration-specific backup
                    const migrationBackups = JSON.parse(localStorage.getItem('jstark_migration_backups') || '[]');
                    migrationBackups.push({
                        ...backup,
                        type: 'pre-migration',
                        fromVersion: this.getCurrentDataVersion()
                    });
                    
                    // Keep only last 3 migration backups
                    if (migrationBackups.length > 3) {
                        migrationBackups.splice(0, migrationBackups.length - 3);
                    }
                    
                    localStorage.setItem('jstark_migration_backups', JSON.stringify(migrationBackups));
                    console.log('Migration backup created');
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Create migration backup error:', error);
                return false;
            }
        },
        
        // Recovery from failed migration
        rollbackMigration: function() {
            try {
                const migrationBackups = JSON.parse(localStorage.getItem('jstark_migration_backups') || '[]');
                if (migrationBackups.length === 0) {
                    throw new Error('No migration backup available for rollback');
                }
                
                // Get most recent backup
                const latestBackup = migrationBackups[migrationBackups.length - 1];
                
                // Restore from backup
                const success = this.restoreFromBackup(latestBackup);
                if (success) {
                    console.log('Migration rollback completed successfully');
                    if (window.ErrorHandler) {
                        window.ErrorHandler.showSuccess('Data restored from backup after migration failure');
                    }
                    return true;
                }
                
                throw new Error('Failed to restore from backup');
                
            } catch (error) {
                console.error('Migration rollback error:', error);
                if (window.ErrorHandler) {
                    window.ErrorHandler.log(error, 'Migration Rollback', 'critical');
                }
                return false;
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            StorageManager.init();
        });
    } else {
        StorageManager.init();
    }
    
    // Export for global access
    window.StorageManager = StorageManager;
    
})();