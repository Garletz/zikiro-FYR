export interface StockItem {
    id: string
    name: string
    category: string
    currentStock: number
    minStock: number
    maxStock: number
    unit: string
    cost: number
    supplier: string
    lastUpdated: Date
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export interface StockCategory {
    id: string
    name: string
    description?: string
    color: string
}

export interface StockMovement {
    id: string
    itemId: string
    type: 'in' | 'out' | 'adjustment'
    quantity: number
    reason: string
    date: Date
    userId: string
}

export interface StockAlert {
    id: string
    itemId: string
    type: 'low_stock' | 'out_of_stock' | 'expiry'
    message: string
    date: Date
    isRead: boolean
}
