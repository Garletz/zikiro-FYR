// MasterStocks TypeScript types

export interface Ingredient {
    id: string
    name: string
    description?: string
    category: string
    unit: string
    current_stock: number
    min_stock: number
    max_stock: number
    cost_per_unit: number
    supplier_id?: string
    barcode?: string
    image_url?: string
    expiration_date?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Supplier {
    id: string
    name: string
    contact_person?: string
    email?: string
    phone?: string
    address?: string
    payment_terms?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Invoice {
    id: string
    invoice_number: string
    supplier_id: string
    supplier_name: string
    invoice_date: string
    total_amount: number
    image_url?: string
    status: InvoiceStatus
    created_at: string
    updated_at: string
}

export type InvoiceStatus = 'pending' | 'processed' | 'error'

export interface InvoiceItem {
    id: string
    invoice_id: string
    ingredient_id?: string
    ingredient_name: string
    quantity: number
    unit: string
    unit_price: number
    total_price: number
    expiration_date?: string
    barcode?: string
    created_at: string
}

export interface StockMovement {
    id: string
    ingredient_id: string
    movement_type: StockMovementType
    quantity: number
    unit: string
    reason: string
    reference_id?: string
    created_by?: string
    created_at: string
}

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'expired'

export interface StockAlert {
    id: string
    ingredient_id: string
    alert_type: StockAlertType
    message: string
    is_read: boolean
    created_at: string
}

export type StockAlertType = 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired'

export type StockLevel = 'out_of_stock' | 'low_stock' | 'normal_stock' | 'high_stock'

// Request/Response types
export interface CreateIngredientRequest {
    name: string
    description?: string
    category: string
    unit: string
    min_stock: number
    max_stock: number
    cost_per_unit: number
    supplier_id?: string
    barcode?: string
    image_url?: string
    expiration_date?: string
}

export interface UpdateIngredientRequest {
    name?: string
    description?: string
    category?: string
    unit?: string
    current_stock?: number
    min_stock?: number
    max_stock?: number
    cost_per_unit?: number
    supplier_id?: string
    barcode?: string
    image_url?: string
    expiration_date?: string
    is_active?: boolean
}

export interface CreateSupplierRequest {
    name: string
    contact_person?: string
    email?: string
    phone?: string
    address?: string
    payment_terms?: string
}

export interface UpdateSupplierRequest {
    name?: string
    contact_person?: string
    email?: string
    phone?: string
    address?: string
    payment_terms?: string
    is_active?: boolean
}

// AI Invoice Analysis types
export interface InvoiceAnalysisRequest {
    image_data: string
    mime_type: string
}

export interface InvoiceAnalysisResponse {
    success: boolean
    invoice_data?: InvoiceData
    error?: string
}

export interface InvoiceData {
    supplier_name: string
    invoice_number: string
    invoice_date: string
    total_amount: number
    items: InvoiceItemData[]
}

export interface InvoiceItemData {
    name: string
    quantity: number
    unit: string
    unit_price: number
    total_price: number
    expiration_date?: string
    barcode?: string
}

// UI Helper types
export interface StockBarometerData {
    ingredient: Ingredient
    stockLevel: StockLevel
    percentage: number
    color: string
    icon: string
}

export interface StockDashboardData {
    totalIngredients: number
    lowStockCount: number
    outOfStockCount: number
    expiringSoonCount: number
    totalValue: number
    recentMovements: StockMovement[]
    alerts: StockAlert[]
}

// Utility functions
export const getStockLevel = (ingredient: Ingredient): StockLevel => {
    if (ingredient.current_stock <= 0) {
        return 'out_of_stock'
    } else if (ingredient.current_stock <= ingredient.min_stock) {
        return 'low_stock'
    } else if (ingredient.current_stock >= ingredient.max_stock * 0.75) {
        return 'high_stock'
    } else {
        return 'normal_stock'
    }
}

export const getStockPercentage = (ingredient: Ingredient): number => {
    if (ingredient.max_stock === 0) return 0
    return Math.min(100, (ingredient.current_stock / ingredient.max_stock) * 100)
}

export const getStockColor = (level: StockLevel): string => {
    switch (level) {
        case 'out_of_stock':
            return 'text-red-600 bg-red-50'
        case 'low_stock':
            return 'text-orange-600 bg-orange-50'
        case 'normal_stock':
            return 'text-yellow-600 bg-yellow-50'
        case 'high_stock':
            return 'text-green-600 bg-green-50'
        default:
            return 'text-gray-600 bg-gray-50'
    }
}

export const getStockIcon = (level: StockLevel): string => {
    switch (level) {
        case 'out_of_stock':
            return '🔴'
        case 'low_stock':
            return '🟠'
        case 'normal_stock':
            return '🟡'
        case 'high_stock':
            return '🟢'
        default:
            return '⚪'
    }
}

export const getAlertColor = (type: StockAlertType): string => {
    switch (type) {
        case 'out_of_stock':
            return 'text-red-600 bg-red-50 border-red-200'
        case 'low_stock':
            return 'text-orange-600 bg-orange-50 border-orange-200'
        case 'expiring_soon':
            return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'expired':
            return 'text-red-600 bg-red-50 border-red-200'
        default:
            return 'text-gray-600 bg-gray-50 border-gray-200'
    }
}

export const getAlertIcon = (type: StockAlertType): string => {
    switch (type) {
        case 'out_of_stock':
            return '🚫'
        case 'low_stock':
            return '⚠️'
        case 'expiring_soon':
            return '⏰'
        case 'expired':
            return '💀'
        default:
            return 'ℹ️'
    }
}
