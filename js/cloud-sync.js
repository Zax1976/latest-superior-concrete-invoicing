/**
 * J. Stark Business Invoicing System - Cloud Sync Module
 * Handles cloud storage integration for backup and sync
 */

(function() {
    'use strict';
    
    const CloudSync = {
        // Cloud provider configurations
        providers: {
            googleDrive: {
                name: 'Google Drive',
                enabled: false,
                clientId: '', // Add your Google Drive client ID
                apiKey: '', // Add your Google Drive API key
                scope: 'https://www.googleapis.com/auth/drive.file'
            },
            dropbox: {
                name: 'Dropbox',
                enabled: false,
                appKey: '', // Add your Dropbox app key
                redirectUri: window.location.origin
            },
            onedrive: {
                name: 'OneDrive',
                enabled: false,
                clientId: '', // Add your OneDrive client ID
                redirectUri: window.location.origin
            }
        },
        
        // Current sync status
        syncStatus: {
            lastSync: null,
            isOnline: navigator.onLine,
            pendingChanges: 0,
            provider: null
        },
        
        init: function() {
            try {
                this.setupNetworkListeners();
                this.loadSyncSettings();
                this.checkPendingSync();
                console.log('Cloud Sync initialized');
            } catch (error) {
                console.error('Cloud Sync initialization error:', error);
            }
        },
        
        setupNetworkListeners: function() {
            try {
                window.addEventListener('online', () => {
                    this.syncStatus.isOnline = true;
                    this.attemptSync();
                });
                
                window.addEventListener('offline', () => {
                    this.syncStatus.isOnline = false;
                });
            } catch (error) {
                console.error('Network listeners setup error:', error);
            }
        },
        
        loadSyncSettings: function() {
            try {
                const settings = localStorage.getItem('jstark_sync_settings');
                if (settings) {
                    const syncSettings = JSON.parse(settings);
                    this.syncStatus = { ...this.syncStatus, ...syncSettings };
                }
            } catch (error) {
                console.error('Load sync settings error:', error);
            }
        },
        
        saveSyncSettings: function() {
            try {
                localStorage.setItem('jstark_sync_settings', JSON.stringify(this.syncStatus));
            } catch (error) {
                console.error('Save sync settings error:', error);
            }
        },
        
        // Manual export for cloud storage
        exportToCloud: function(provider = 'manual') {
            try {
                const data = this.prepareExportData();
                const filename = `jstark-backup-${new Date().toISOString().split('T')[0]}.json`;
                
                switch (provider) {
                    case 'download':
                        this.downloadBackup(data, filename);
                        break;
                    case 'googledrive':
                        this.uploadToGoogleDrive(data, filename);
                        break;
                    case 'dropbox':
                        this.uploadToDropbox(data, filename);
                        break;
                    case 'onedrive':
                        this.uploadToOneDrive(data, filename);
                        break;
                    default:
                        this.downloadBackup(data, filename);
                }
                
                return true;
            } catch (error) {
                console.error('Export to cloud error:', error);
                return false;
            }
        },
        
        prepareExportData: function() {
            try {
                const exportData = {
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    application: 'J. Stark Invoicing System',
                    data: {
                        invoices: JSON.parse(localStorage.getItem('jstark_invoices') || '[]'),
                        customers: JSON.parse(localStorage.getItem('jstark_customers') || '[]'),
                        settings: JSON.parse(localStorage.getItem('jstark_settings') || '{}'),
                        nextInvoiceNumber: localStorage.getItem('jstark_next_invoice_number') || '1'
                    }
                };
                
                return JSON.stringify(exportData, null, 2);
            } catch (error) {
                console.error('Prepare export data error:', error);
                return null;
            }
        },
        
        downloadBackup: function(data, filename) {
            try {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                
                if (window.App) {
                    window.App.showSuccess('Backup downloaded successfully!');
                }
                
                return true;
            } catch (error) {
                console.error('Download backup error:', error);
                return false;
            }
        },
        
        // Google Drive integration
        uploadToGoogleDrive: function(data, filename) {
            try {
                if (!this.providers.googleDrive.enabled) {
                    alert('Google Drive integration not configured. Please contact support.');
                    return false;
                }
                
                // This would require Google Drive API setup
                // For now, show instructions
                this.showCloudInstructions('Google Drive');
                
                return true;
            } catch (error) {
                console.error('Google Drive upload error:', error);
                return false;
            }
        },
        
        // Dropbox integration
        uploadToDropbox: function(data, filename) {
            try {
                if (!this.providers.dropbox.enabled) {
                    alert('Dropbox integration not configured. Please contact support.');
                    return false;
                }
                
                // This would require Dropbox API setup
                this.showCloudInstructions('Dropbox');
                
                return true;
            } catch (error) {
                console.error('Dropbox upload error:', error);
                return false;
            }
        },
        
        // OneDrive integration
        uploadToOneDrive: function(data, filename) {
            try {
                if (!this.providers.onedrive.enabled) {
                    alert('OneDrive integration not configured. Please contact support.');
                    return false;
                }
                
                // This would require OneDrive API setup
                this.showCloudInstructions('OneDrive');
                
                return true;
            } catch (error) {
                console.error('OneDrive upload error:', error);
                return false;
            }
        },
        
        showCloudInstructions: function(provider) {
            const instructions = {
                'Google Drive': `
                    <h3>Google Drive Backup Instructions:</h3>
                    <ol>
                        <li>Download the backup file that was just created</li>
                        <li>Go to <a href="https://drive.google.com" target="_blank">Google Drive</a></li>
                        <li>Create a folder called "J. Stark Invoicing Backups"</li>
                        <li>Upload the backup file to this folder</li>
                        <li>Set up automatic sync by enabling Google Drive sync on this device</li>
                    </ol>
                `,
                'Dropbox': `
                    <h3>Dropbox Backup Instructions:</h3>
                    <ol>
                        <li>Download the backup file that was just created</li>
                        <li>Go to <a href="https://dropbox.com" target="_blank">Dropbox</a></li>
                        <li>Create a folder called "J. Stark Invoicing Backups"</li>
                        <li>Upload the backup file to this folder</li>
                        <li>Install Dropbox app on your devices for automatic sync</li>
                    </ol>
                `,
                'OneDrive': `
                    <h3>OneDrive Backup Instructions:</h3>
                    <ol>
                        <li>Download the backup file that was just created</li>
                        <li>Go to <a href="https://onedrive.live.com" target="_blank">OneDrive</a></li>
                        <li>Create a folder called "J. Stark Invoicing Backups"</li>
                        <li>Upload the backup file to this folder</li>
                        <li>Use OneDrive sync on your devices for automatic backup</li>
                    </ol>
                `
            };
            
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 500px; max-height: 80vh; overflow-y: auto;">
                    ${instructions[provider]}
                    <button onclick="this.closest('div').parentElement.remove()" style="background: #DC143C; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 1rem;">
                        Close
                    </button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Auto-download backup
            this.downloadBackup(this.prepareExportData(), `jstark-backup-${new Date().toISOString().split('T')[0]}.json`);
        },
        
        // Import from cloud
        importFromCloud: function() {
            try {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                
                input.onchange = (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const importData = JSON.parse(e.target.result);
                                this.restoreFromImport(importData);
                            } catch (error) {
                                console.error('Import parsing error:', error);
                                alert('Invalid backup file format. Please check the file and try again.');
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                
                input.click();
                
                return true;
            } catch (error) {
                console.error('Import from cloud error:', error);
                return false;
            }
        },
        
        restoreFromImport: function(importData) {
            try {
                if (!importData.data) {
                    throw new Error('Invalid import data format');
                }
                
                if (!confirm('This will replace all existing data. Are you sure you want to continue?')) {
                    return false;
                }
                
                const data = importData.data;
                
                // Restore data
                if (data.invoices) {
                    localStorage.setItem('jstark_invoices', JSON.stringify(data.invoices));
                }
                if (data.customers) {
                    localStorage.setItem('jstark_customers', JSON.stringify(data.customers));
                }
                if (data.settings) {
                    localStorage.setItem('jstark_settings', JSON.stringify(data.settings));
                }
                if (data.nextInvoiceNumber) {
                    localStorage.setItem('jstark_next_invoice_number', data.nextInvoiceNumber);
                }
                
                // Update sync status
                this.syncStatus.lastSync = new Date().toISOString();
                this.saveSyncSettings();
                
                if (window.App) {
                    window.App.showSuccess('Data restored successfully! Please refresh the page.');
                    
                    // Refresh the page after a delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
                
                return true;
            } catch (error) {
                console.error('Restore from import error:', error);
                alert('Failed to restore data. Please check the backup file.');
                return false;
            }
        },
        
        // Check for pending sync operations
        checkPendingSync: function() {
            try {
                const pendingData = localStorage.getItem('jstark_pending_sync');
                if (pendingData) {
                    const pending = JSON.parse(pendingData);
                    this.syncStatus.pendingChanges = pending.length;
                    
                    if (this.syncStatus.isOnline) {
                        this.attemptSync();
                    }
                }
            } catch (error) {
                console.error('Check pending sync error:', error);
            }
        },
        
        // Attempt automatic sync
        attemptSync: function() {
            try {
                if (!this.syncStatus.isOnline) {
                    console.log('Cannot sync - offline');
                    return;
                }
                
                // Create automatic backup
                if (window.StorageManager) {
                    window.StorageManager.createBackup();
                }
                
                // Update sync status
                this.syncStatus.lastSync = new Date().toISOString();
                this.saveSyncSettings();
                
                console.log('Automatic sync completed');
                
            } catch (error) {
                console.error('Attempt sync error:', error);
            }
        },
        
        // Get sync status for UI
        getSyncStatus: function() {
            return {
                ...this.syncStatus,
                lastSyncFormatted: this.syncStatus.lastSync ? 
                    new Date(this.syncStatus.lastSync).toLocaleString() : 
                    'Never',
                isOnline: navigator.onLine
            };
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            CloudSync.init();
        });
    } else {
        CloudSync.init();
    }
    
    // Export for global access
    window.CloudSync = CloudSync;
    
})();