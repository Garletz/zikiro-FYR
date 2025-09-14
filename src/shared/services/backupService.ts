import { invoke } from '@tauri-apps/api/core';
import { BusinessService } from './businessService';

export interface BackupData {
    business: any;
    products: any[];
    categories: any[];
    tables: any[];
    orders: any[];
    logs: any[];
    printer_configs: any[];
    timestamp: string;
    version: string;
}

export interface ExportOptions {
    format: 'csv' | 'excel' | 'json';
    domains: ('business' | 'products' | 'categories' | 'tables' | 'orders' | 'logs' | 'printer_configs')[];
    dateRange?: {
        start: string;
        end: string;
    };
}

export interface ImportOptions {
    mode: 'replace' | 'merge' | 'skip_duplicates';
    domains: ('business' | 'products' | 'categories' | 'tables' | 'orders' | 'logs' | 'printer_configs')[];
}

export class BackupService {
    // Create a complete backup of all data
    static async createBackup(): Promise<BackupData> {
        try {
            const timestamp = new Date().toISOString();

            // Get all data from different domains
            const [businessInfo, taxSettings, userPreferences, systemConfig] = await Promise.all([
                BusinessService.getBusinessInfo().catch(() => null),
                BusinessService.getTaxSettings().catch(() => null),
                BusinessService.getUserPreferences().catch(() => null),
                BusinessService.getSystemConfig().catch(() => null),
            ]);

            const business = {
                business_info: businessInfo,
                tax_settings: taxSettings,
                user_preferences: userPreferences,
                system_config: systemConfig,
            };

            // Get other data using Tauri commands
            const [products, categories, tables, orders, logs, printerConfigs] = await Promise.all([
                invoke('get_products').catch(() => []),
                invoke('get_categories').catch(() => []),
                invoke('get_tables').catch(() => []),
                invoke('get_all_orders').catch(() => []),
                invoke('get_logs_command').catch(() => []),
                invoke('get_saved_printer_config').catch(() => null),
            ]);

            const backupData: BackupData = {
                business,
                products: (products as any) || [],
                categories: (categories as any) || [],
                tables: (tables as any) || [],
                orders: (orders as any) || [],
                logs: (logs as any) || [],
                printer_configs: printerConfigs ? [printerConfigs] : [],
                timestamp,
                version: '1.0.0',
            };

            return backupData;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    // Export data in specific format
    static async exportData(options: ExportOptions): Promise<string> {
        try {
            const backupData = await this.createBackup();
            const filteredData = this.filterDataByDomains(backupData, options.domains);

            switch (options.format) {
                case 'json':
                    return this.exportToJSON(filteredData);
                case 'csv':
                    return this.exportToCSV(filteredData, options.domains);
                case 'excel':
                    return this.exportToExcel(filteredData, options.domains);
                default:
                    throw new Error(`Unsupported export format: ${options.format}`);
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    // Filter data by selected domains
    private static filterDataByDomains(data: BackupData, domains: string[]): any {
        const filtered: any = {};

        domains.forEach(domain => {
            if (data[domain as keyof BackupData]) {
                filtered[domain] = data[domain as keyof BackupData];
            }
        });

        return filtered;
    }

    // Export to JSON
    private static exportToJSON(data: any): string {
        return JSON.stringify(data, null, 2);
    }

    // Export to CSV
    private static exportToCSV(data: any, domains: string[]): string {
        let csvContent = '';

        domains.forEach(domain => {
            if (data[domain]) {
                csvContent += `\n=== ${domain.toUpperCase()} ===\n`;

                if (Array.isArray(data[domain])) {
                    if (data[domain].length > 0) {
                        // Get headers from first object
                        const headers = Object.keys(data[domain][0]);
                        csvContent += headers.join(',') + '\n';

                        // Add data rows
                        data[domain].forEach((item: any) => {
                            const row = headers.map(header => {
                                const value = item[header];
                                // Escape commas and quotes in CSV
                                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                                    return `"${value.replace(/"/g, '""')}"`;
                                }
                                return value || '';
                            });
                            csvContent += row.join(',') + '\n';
                        });
                    }
                } else {
                    // For non-array data, create key-value pairs
                    csvContent += 'Key,Value\n';
                    Object.entries(data[domain]).forEach(([key, value]) => {
                        csvContent += `${key},"${value}"\n`;
                    });
                }
                csvContent += '\n';
            }
        });

        return csvContent;
    }

    // Export to Excel (simplified - would need a proper Excel library in real implementation)
    private static exportToExcel(data: any, domains: string[]): string {
        // For now, return CSV format with Excel extension
        // In a real implementation, you'd use a library like 'xlsx'
        return this.exportToCSV(data, domains);
    }

    // Save backup to file
    static async saveBackupToFile(backupData: BackupData): Promise<string> {
        try {
            const jsonData = JSON.stringify(backupData, null, 2);

            // In a real implementation, you'd use Tauri's dialog API to save file
            // For now, we'll return the data as a string
            return jsonData;
        } catch (error) {
            console.error('Error saving backup to file:', error);
            throw error;
        }
    }

    // Restore from backup with import options
    static async restoreFromBackup(backupData: BackupData, options?: ImportOptions): Promise<void> {
        try {
            const importMode = options?.mode || 'replace';
            const selectedDomains = options?.domains || ['business', 'products', 'categories', 'tables'];

            console.log(`Starting import with mode: ${importMode} for domains:`, selectedDomains);

            // Restore business data
            if (selectedDomains.includes('business') && backupData.business) {
                if (backupData.business.business_info) {
                    await BusinessService.saveBusinessInfo(backupData.business.business_info);
                }
                if (backupData.business.tax_settings) {
                    await BusinessService.saveTaxSettings(backupData.business.tax_settings);
                }
                if (backupData.business.user_preferences) {
                    await BusinessService.saveUserPreferences(backupData.business.user_preferences);
                }
                if (backupData.business.system_config) {
                    await BusinessService.saveSystemConfig(backupData.business.system_config);
                }
            }

            // Handle products with intelligent import
            if (selectedDomains.includes('products') && backupData.products && backupData.products.length > 0) {
                await this.importProducts(backupData.products, importMode);
            }

            // Handle categories with intelligent import
            if (selectedDomains.includes('categories') && backupData.categories && backupData.categories.length > 0) {
                await this.importCategories(backupData.categories, importMode);
            }

            // Handle tables with intelligent import
            if (selectedDomains.includes('tables') && backupData.tables && backupData.tables.length > 0) {
                await this.importTables(backupData.tables, importMode);
            }

            // Note: Orders and logs are typically not restored as they are historical data
            console.log('Backup restored successfully');
        } catch (error) {
            console.error('Error restoring backup:', error);
            throw error;
        }
    }

    // Intelligent product import
    private static async importProducts(products: any[], mode: string): Promise<void> {
        const existingProducts = await invoke('get_products').catch(() => []) as any[];

        for (const product of products) {
            if (mode === 'replace') {
                // Always create new (current behavior)
                await invoke('create_product', { request: product }).catch(console.error);
            } else if (mode === 'merge') {
                // Check for duplicates by name and category
                const existing = existingProducts.find(p =>
                    p.name === product.name && p.category_id === product.category_id
                );

                if (existing) {
                    // Update existing product
                    await invoke('update_product', {
                        id: existing.id,
                        request: {
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            cost: product.cost,
                            category_id: product.category_id,
                            barcode: product.barcode,
                            sku: product.sku,
                            stock_quantity: product.stock_quantity,
                            min_stock: product.min_stock,
                            image_url: product.image_url,
                            is_active: product.is_active
                        }
                    }).catch(console.error);
                } else {
                    // Create new product
                    await invoke('create_product', { request: product }).catch(console.error);
                }
            } else if (mode === 'skip_duplicates') {
                // Check for duplicates by name and category
                const existing = existingProducts.find(p =>
                    p.name === product.name && p.category_id === product.category_id
                );

                if (!existing) {
                    // Only create if no duplicate
                    await invoke('create_product', { request: product }).catch(console.error);
                }
            }
        }
    }

    // Intelligent category import
    private static async importCategories(categories: any[], mode: string): Promise<void> {
        const existingCategories = await invoke('get_categories').catch(() => []) as any[];

        for (const category of categories) {
            if (mode === 'replace') {
                // Always create new
                await invoke('create_category', { request: category }).catch(console.error);
            } else if (mode === 'merge') {
                // Check for duplicates by name
                const existing = existingCategories.find(c => c.name === category.name);

                if (existing) {
                    // Update existing category
                    await invoke('update_category', {
                        id: existing.id,
                        request: {
                            name: category.name,
                            description: category.description,
                            color: category.color,
                            tax_rate_id: category.tax_rate_id
                        }
                    }).catch(console.error);
                } else {
                    // Create new category
                    await invoke('create_category', { request: category }).catch(console.error);
                }
            } else if (mode === 'skip_duplicates') {
                // Check for duplicates by name
                const existing = existingCategories.find(c => c.name === category.name);

                if (!existing) {
                    // Only create if no duplicate
                    await invoke('create_category', { request: category }).catch(console.error);
                }
            }
        }
    }

    // Intelligent table import
    private static async importTables(tables: any[], mode: string): Promise<void> {
        const existingTables = await invoke('get_tables').catch(() => []) as any[];

        for (const table of tables) {
            if (mode === 'replace') {
                // Always create new
                await invoke('create_table', { request: table }).catch(console.error);
            } else if (mode === 'merge') {
                // Check for duplicates by name
                const existing = existingTables.find(t => t.name === table.name);

                if (existing) {
                    // Update existing table
                    await invoke('update_table', {
                        id: existing.id,
                        request: {
                            name: table.name,
                            capacity: table.capacity,
                            status: table.status,
                            position: table.position
                        }
                    }).catch(console.error);
                } else {
                    // Create new table
                    await invoke('create_table', { request: table }).catch(console.error);
                }
            } else if (mode === 'skip_duplicates') {
                // Check for duplicates by name
                const existing = existingTables.find(t => t.name === table.name);

                if (!existing) {
                    // Only create if no duplicate
                    await invoke('create_table', { request: table }).catch(console.error);
                }
            }
        }
    }

    // Get available backup files
    static async getAvailableBackups(): Promise<string[]> {
        try {
            // In a real implementation, you'd scan a backup directory
            // For now, return empty array
            return [];
        } catch (error) {
            console.error('Error getting available backups:', error);
            return [];
        }
    }
}
