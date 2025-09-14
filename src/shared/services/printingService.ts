import { invoke } from '@tauri-apps/api/core';
import {
    PAPER_SIZES,
    PaperSize,
    PrinterInfo,
    PrintSettings,
    PrintTestRequest,
    PrintTicketRequest,
    TerminalOutput
} from '../types/printing';

export class PrintingService {
    /**
     * Execute any terminal command (for debugging and advanced operations)
     */
    static async executeTerminalCommand(command: string): Promise<TerminalOutput> {
        try {
            const result = await invoke<TerminalOutput>('execute_terminal_command', { command });
            return result;
        } catch (error) {
            console.error('Failed to execute terminal command:', error);
            throw new Error('Failed to execute terminal command');
        }
    }

    /**
     * Get list of available printers from the system
     * Using native OS commands via terminal
     */
    static async getPrinters(): Promise<PrinterInfo[]> {
        try {
            const printers = await invoke<PrinterInfo[]>('get_printers');
            return printers;
        } catch (error) {
            console.error('Failed to get printers:', error);
            throw new Error('Failed to retrieve printer list');
        }
    }

    /**
     * Print a test page to verify printer configuration
     */
    static async printTestPage(
        printerName: string,
        paperSize: PaperSize,
        content?: string
    ): Promise<string> {
        try {
            const request: PrintTestRequest = {
                printer_name: printerName,
                paper_size: paperSize,
                content: content || `Test page for ${printerName} - ${paperSize}`,
            };

            const result = await invoke<string>('print_test_page', { request });
            return result;
        } catch (error) {
            console.error('Failed to print test page:', error);
            throw new Error('Failed to print test page');
        }
    }

    /**
     * Print a ticket/receipt
     */
    static async printTicket(request: PrintTicketRequest): Promise<string> {
        try {
            const result = await invoke<string>('print_ticket', { request });
            return result;
        } catch (error) {
            console.error('Failed to print ticket:', error);
            throw new Error('Failed to print ticket');
        }
    }

    /**
     * Get default printer name
     */
    static async getDefaultPrinter(): Promise<string> {
        try {
            const result = await invoke<string>('get_default_printer');
            return result;
        } catch (error) {
            console.error('Failed to get default printer:', error);
            throw new Error('Failed to get default printer');
        }
    }

    /**
     * Get printer status
     */
    static async getPrinterStatus(printerName: string): Promise<string> {
        try {
            const result = await invoke<string>('get_printer_status', { printer_name: printerName });
            return result;
        } catch (error) {
            console.error('Failed to get printer status:', error);
            throw new Error('Failed to get printer status');
        }
    }

    /**
     * Get available paper sizes
     */
    static getPaperSizes(): Record<PaperSize, { width: number; height: number; description: string }> {
        return PAPER_SIZES;
    }

    /**
     * Validate print settings
     */
    static validatePrintSettings(settings: Partial<PrintSettings>): string[] {
        const errors: string[] = [];

        if (!settings.printer_name) {
            errors.push('Printer name is required');
        }

        if (!settings.paper_size) {
            errors.push('Paper size is required');
        }

        if (settings.footer_text && settings.footer_text.length > 200) {
            errors.push('Footer text is too long (max 200 characters)');
        }

        return errors;
    }

    /**
     * Get default print settings
     */
    static getDefaultPrintSettings(): PrintSettings {
        return {
            printer_name: '',
            paper_size: '80mm',
            show_logo: true,
            show_tax_details: true,
            footer_text: 'Thank you for your visit!',
            auto_print: false,
            print_duplicate: false,
        };
    }

    /**
     * Format ticket content for printing
     */
    static formatTicketContent(
        businessName: string,
        items: Array<{ name: string; quantity: number; price: number }>,
        total: number,
        tax: number,
        footerText: string,
        paperSize: PaperSize
    ): string {
        const paperWidth = PAPER_SIZES[paperSize as PaperSize]?.width || 80;
        const maxLineLength = Math.floor(paperWidth / 8); // Approximate characters per line

        let content = '';

        // Header
        content += '='.repeat(maxLineLength) + '\n';
        content += businessName.padEnd(maxLineLength).substring(0, maxLineLength) + '\n';
        content += '='.repeat(maxLineLength) + '\n\n';

        // Items
        items.forEach(item => {
            const itemLine = `${item.name} x${item.quantity}`;
            const priceLine = `$${item.price.toFixed(2)}`;
            const totalLine = `$${(item.price * item.quantity).toFixed(2)}`;

            content += itemLine.padEnd(maxLineLength - priceLine.length - totalLine.length) +
                priceLine.padStart(priceLine.length) +
                totalLine.padStart(totalLine.length) + '\n';
        });

        content += '\n';
        content += '-'.repeat(maxLineLength) + '\n';

        // Totals
        content += `Subtotal:`.padEnd(maxLineLength - 8) + `$${total.toFixed(2)}`.padStart(8) + '\n';
        content += `Tax:`.padEnd(maxLineLength - 8) + `$${tax.toFixed(2)}`.padStart(8) + '\n';
        content += `TOTAL:`.padEnd(maxLineLength - 8) + `$${(total + tax).toFixed(2)}`.padStart(8) + '\n';

        content += '='.repeat(maxLineLength) + '\n';
        content += footerText.padEnd(maxLineLength).substring(0, maxLineLength) + '\n';
        content += '='.repeat(maxLineLength) + '\n';

        return content;
    }

    // Save printer configuration to database
    static async savePrinterToDatabase(printerName: string): Promise<string> {
        try {
            return await invoke<string>('save_printer_to_database', {
                printerName,
                port: null,
                driver: null
            });
        } catch (error) {
            throw new Error(`Failed to save printer to database: ${error}`);
        }
    }

    // Get saved printer configuration from database
    static async getSavedPrinterConfig(): Promise<any> {
        try {
            return await invoke<any>('get_saved_printer_config');
        } catch (error) {
            throw new Error(`Failed to get saved printer config: ${error}`);
        }
    }

    // Remove printer configuration from database
    static async removePrinterFromDatabase(): Promise<string> {
        try {
            return await invoke<string>('remove_printer_from_database');
        } catch (error) {
            throw new Error(`Failed to remove printer from database: ${error}`);
        }
    }
}
