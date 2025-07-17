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
        
        // Invoice management
        saveInvoice: function(invoice) {
            try {
                const invoices = this.loadInvoices();
                const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
                
                if (existingIndex >= 0) {
                    invoices[existingIndex] = invoice;
                } else {
                    invoices.push(invoice);
                }
                
                this.saveInvoices(invoices);
                this.updateCustomerFromInvoice(invoice);
                
                return true;
            } catch (error) {
                console.error('Save invoice error:', error);
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
                alert('Failed to import data. Please check the file format.');
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