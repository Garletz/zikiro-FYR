import { Archive, Database, Download, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { BackupService, ExportOptions, ImportOptions } from '../../../shared/services/backupService';

export const BackupManager: React.FC = () => {
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedDomains, setSelectedDomains] = useState<string[]>([
        'business', 'products', 'categories', 'tables', 'orders'
    ]);
    const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json'>('csv');
    const [importMode, setImportMode] = useState<'replace' | 'merge' | 'skip_duplicates'>('merge');
    const [isImporting, setIsImporting] = useState(false);

    const availableDomains = [
        { id: 'business', name: 'Business Info & Settings', description: 'Company info, tax settings, preferences' },
        { id: 'products', name: 'Products', description: 'Product catalog and inventory' },
        { id: 'categories', name: 'Categories', description: 'Product categories' },
        { id: 'tables', name: 'Tables', description: 'Table configurations' },
        { id: 'orders', name: 'Orders', description: 'Order history and transactions' },
        { id: 'logs', name: 'Logs', description: 'System and activity logs' },
        { id: 'printer_configs', name: 'Printer Configs', description: 'Printer configurations' },
    ];

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        try {
            const backupData = await BackupService.createBackup();
            const jsonData = await BackupService.saveBackupToFile(backupData);

            // Create filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const filename = `POS_Complete_Backup_${timestamp}.json`;

            // Use File System Access API for save dialog
            triggerSaveDialog(jsonData, filename, 'application/json');
        } catch (error) {
            console.error('Error creating backup:', error);
            alert('Error creating backup. Please try again.');
        } finally {
            setIsCreatingBackup(false);
        }
    };

    // Helper function to trigger save dialog
    const triggerSaveDialog = (data: string, filename: string, mimeType: string) => {
        // Create a blob URL
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Try to use the File System Access API if available (modern browsers)
        if ('showSaveFilePicker' in window) {
            (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: `${mimeType} files`,
                    accept: { [mimeType]: [`.${filename.split('.').pop()}`] }
                }]
            }).then(async (fileHandle: any) => {
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                URL.revokeObjectURL(url);
                alert(`File saved successfully to: ${fileHandle.name}`);
            }).catch((err: any) => {
                if (err.name !== 'AbortError') {
                    console.error('Error saving file:', err);
                    // Fallback to download
                    downloadFile(data, filename, mimeType);
                }
            });
        } else {
            // Fallback for older browsers
            downloadFile(data, filename, mimeType);
        }
    };

    // Fallback download function
    const downloadFile = (data: string, filename: string, mimeType: string) => {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const handleExportData = async () => {
        if (selectedDomains.length === 0) {
            alert('Please select at least one domain to export.');
            return;
        }

        setIsExporting(true);
        try {
            const options: ExportOptions = {
                format: exportFormat,
                domains: selectedDomains as any,
            };

            const exportData = await BackupService.exportData(options);

            // Create filename with timestamp and selected domains
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
            const domainsStr = selectedDomains.join('_');
            const extension = exportFormat === 'json' ? 'json' :
                exportFormat === 'csv' ? 'csv' : 'xlsx';
            const filename = `POS_Export_${domainsStr}_${timestamp}.${extension}`;

            // Use File System Access API for save dialog
            const mimeType = exportFormat === 'json' ? 'application/json' :
                exportFormat === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
            triggerSaveDialog(exportData, filename, mimeType);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleDomainToggle = (domainId: string) => {
        setSelectedDomains(prev =>
            prev.includes(domainId)
                ? prev.filter(id => id !== domainId)
                : [...prev, domainId]
        );
    };

    const handleSelectAll = () => {
        setSelectedDomains(availableDomains.map(d => d.id));
    };

    const handleSelectNone = () => {
        setSelectedDomains([]);
    };

    return (
        <div className="space-y-6">
            {/* Complete System Backup */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                    <Archive className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">Complete System Backup</h4>
                        <p className="text-sm text-gray-600">Create a full backup of your entire POS system</p>
                    </div>
                </div>
                <div className="bg-white rounded-md p-4 mb-4">
                    <p className="text-sm text-gray-700 mb-2">
                        <strong>Includes:</strong> All modules, settings, configurations, and data
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                        Perfect for system migration, disaster recovery, or complete data transfer
                    </p>
                </div>
                <button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {isCreatingBackup ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating Complete Backup...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Download Complete Backup
                        </>
                    )}
                </button>
            </div>

            {/* Module Export/Import */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-6">
                    <FileText className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">Module Export & Import</h4>
                        <p className="text-sm text-gray-600">Export or import individual modules independently</p>
                    </div>
                </div>

                {/* Format Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Export Format
                    </label>
                    <div className="flex space-x-6">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                value="csv"
                                checked={exportFormat === 'csv'}
                                onChange={(e) => setExportFormat(e.target.value as any)}
                                className="mr-3 h-4 w-4 text-green-600"
                            />
                            <div className="flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-green-600" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">CSV</div>
                                    <div className="text-xs text-gray-500">Spreadsheet compatible</div>
                                </div>
                            </div>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                value="excel"
                                checked={exportFormat === 'excel'}
                                onChange={(e) => setExportFormat(e.target.value as any)}
                                className="mr-3 h-4 w-4 text-green-600"
                            />
                            <div className="flex items-center">
                                <FileSpreadsheet className="h-5 w-5 mr-2 text-green-600" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Excel</div>
                                    <div className="text-xs text-gray-500">Advanced formatting</div>
                                </div>
                            </div>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                value="json"
                                checked={exportFormat === 'json'}
                                onChange={(e) => setExportFormat(e.target.value as any)}
                                className="mr-3 h-4 w-4 text-green-600"
                            />
                            <div className="flex items-center">
                                <Database className="h-5 w-5 mr-2 text-green-600" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">JSON</div>
                                    <div className="text-xs text-gray-500">Developer friendly</div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Module Selection */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-sm font-medium text-gray-900">Select Modules to Export</h5>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleSelectAll}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Select All
                            </button>
                            <button
                                onClick={handleSelectNone}
                                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableDomains.map((domain) => (
                            <div
                                key={domain.id}
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedDomains.includes(domain.id)
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => handleDomainToggle(domain.id)}
                            >
                                <div className="flex items-start">
                                    <input
                                        type="checkbox"
                                        checked={selectedDomains.includes(domain.id)}
                                        onChange={() => handleDomainToggle(domain.id)}
                                        className="mt-1 mr-3 h-4 w-4 text-green-600"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center mb-1">
                                            <div className={`w-3 h-3 rounded-full mr-2 ${selectedDomains.includes(domain.id) ? 'bg-green-500' : 'bg-gray-300'
                                                }`}></div>
                                            <h6 className="text-sm font-semibold text-gray-900">
                                                {domain.name}
                                            </h6>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            {domain.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={handleExportData}
                        disabled={isExporting || selectedDomains.length === 0}
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {isExporting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Exporting {selectedDomains.length} Module{selectedDomains.length > 1 ? 's' : ''}...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Export Selected Modules
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Module Import */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                    <Upload className="h-6 w-6 text-orange-600 mr-3" />
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900">Import Modules</h4>
                        <p className="text-sm text-gray-600">Import data from exported module files</p>
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 text-xs font-bold">!</span>
                            </div>
                        </div>
                        <div className="ml-3">
                            <h5 className="text-sm font-medium text-orange-800">Important Notice</h5>
                            <p className="text-sm text-orange-700 mt-1">
                                Importing will replace existing data in the selected modules.
                                We recommend creating a backup before importing.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Module Files to Import
                        </label>
                        {/* Import Mode Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Import Mode
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-start cursor-pointer">
                                    <input
                                        type="radio"
                                        value="replace"
                                        checked={importMode === 'replace'}
                                        onChange={(e) => setImportMode(e.target.value as any)}
                                        className="mt-1 mr-3 h-4 w-4 text-orange-600"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Replace All</div>
                                        <div className="text-xs text-gray-500">
                                            Always create new items (may create duplicates)
                                        </div>
                                    </div>
                                </label>
                                <label className="flex items-start cursor-pointer">
                                    <input
                                        type="radio"
                                        value="merge"
                                        checked={importMode === 'merge'}
                                        onChange={(e) => setImportMode(e.target.value as any)}
                                        className="mt-1 mr-3 h-4 w-4 text-orange-600"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Smart Merge</div>
                                        <div className="text-xs text-gray-500">
                                            Update existing items, create new ones if needed
                                        </div>
                                    </div>
                                </label>
                                <label className="flex items-start cursor-pointer">
                                    <input
                                        type="radio"
                                        value="skip_duplicates"
                                        checked={importMode === 'skip_duplicates'}
                                        onChange={(e) => setImportMode(e.target.value as any)}
                                        className="mt-1 mr-3 h-4 w-4 text-orange-600"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Skip Duplicates</div>
                                        <div className="text-xs text-gray-500">
                                            Only import items that don't already exist
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <input
                            type="file"
                            accept=".json,.csv,.xlsx"
                            multiple
                            disabled={isImporting}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 file:cursor-pointer disabled:opacity-50"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                    setIsImporting(true);

                                    // Handle multiple file imports
                                    const importPromises = files.map(file => {
                                        return new Promise((resolve, reject) => {
                                            const reader = new FileReader();
                                            reader.onload = async (event) => {
                                                try {
                                                    const data = JSON.parse(event.target?.result as string);
                                                    const options: ImportOptions = {
                                                        mode: importMode,
                                                        domains: selectedDomains as any
                                                    };
                                                    await BackupService.restoreFromBackup(data, options);
                                                    resolve(`Module imported successfully: ${file.name}`);
                                                } catch (error) {
                                                    console.error('Error importing module:', error);
                                                    reject(`Error importing module: ${file.name}. Please check the file format.`);
                                                }
                                            };
                                            reader.readAsText(file);
                                        });
                                    });

                                    Promise.all(importPromises)
                                        .then(results => {
                                            alert(`Import completed! ${results.length} file(s) processed.`);
                                        })
                                        .catch(error => {
                                            alert(`Import error: ${error}`);
                                        })
                                        .finally(() => {
                                            setIsImporting(false);
                                        });
                                }
                            }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Supported formats: JSON (complete backup), CSV, Excel
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
