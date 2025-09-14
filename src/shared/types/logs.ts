export enum LogType {
    Financial = 'Financial',
    System = 'System',
    User = 'User',
    Error = 'Error',
    Warning = 'Warning',
    Info = 'Info',
}

export enum LogCategory {
    Sale = 'Sale',
    Refund = 'Refund',
    TableStatus = 'TableStatus',
    Product = 'Product',
    Category = 'Category',
    User = 'User',
    System = 'System',
    Error = 'Error',
    Other = 'Other',
}

export interface LogEntry {
    id: string
    log_type: LogType
    category: LogCategory
    title: string
    description: string
    amount?: number
    table_id?: string
    table_name?: string
    product_id?: string
    product_name?: string
    user_id?: string
    user_name?: string
    metadata?: string
    created_at: string
}

export interface CreateLogEntryRequest {
    log_type: LogType
    category: LogCategory
    title: string
    description: string
    amount?: number
    table_id?: string
    table_name?: string
    product_id?: string
    product_name?: string
    user_id?: string
    user_name?: string
    metadata?: string
}

export interface LogFilter {
    log_type?: LogType
    category?: LogCategory
    table_id?: string
    product_id?: string
    user_id?: string
    start_date?: string
    end_date?: string
    min_amount?: number
    max_amount?: number
}

export interface LogStats {
    total_logs: number
    financial_logs: number
    system_logs: number
    error_logs: number
    total_amount: number
    today_logs: number
    today_amount: number
}
