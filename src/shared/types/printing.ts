export interface PrinterInfo {
    name: string;
    port: string;
    is_default: boolean;
    status: string;
}

export interface PrintTestRequest {
    printer_name: string;
    paper_size: string;
    content: string;
}

export interface PrintTicketRequest {
    printer_name: string;
    paper_size: string;
    business_name: string;
    items: TicketItem[];
    total: number;
    tax: number;
    footer_text: string;
}

export interface TicketItem {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
}

export interface PrintSettings {
    printer_name: string;
    paper_size: PaperSize;
    show_logo: boolean;
    show_tax_details: boolean;
    footer_text: string;
    auto_print: boolean;
    print_duplicate: boolean;
}

export interface TerminalOutput {
    success: boolean;
    stdout: string;
    stderr: string;
    exit_code: number;
}

export type PaperSize = '50mm' | '58mm' | '80mm' | 'A4';

export const PAPER_SIZES: Record<PaperSize, { width: number; height: number; description: string }> = {
    '50mm': { width: 50, height: 0, description: '50mm Thermal Receipt' },
    '58mm': { width: 58, height: 0, description: '58mm Thermal Receipt' },
    '80mm': { width: 80, height: 0, description: '80mm Thermal Receipt' },
    'A4': { width: 210, height: 297, description: 'A4 Standard Paper' },
};

export interface PrinterCapabilities {
    supports_escpos: boolean;
    supports_raw: boolean;
    max_width: number;
    supports_graphics: boolean;
}
