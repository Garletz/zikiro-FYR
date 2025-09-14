export interface OrderItem {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
    status: 'active' | 'cancelled'
}

export interface Order {
    id: string
    order_number: string
    table_id: string
    table_name: string
    items: OrderItem[]
    total_amount: number
    status: 'pending' | 'in_kitchen' | 'ready' | 'completed'
    created_at: string
}

export type OrderStatus = Order['status']

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    in_kitchen: { label: 'En cuisine', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    ready: { label: 'Prêt', color: 'bg-green-100 text-green-800 border-green-200' },
    completed: { label: 'Terminé', color: 'bg-gray-100 text-gray-800 border-gray-200' },
}

export const ITEM_STATUS_CONFIG: Record<OrderItem['status'], { label: string; color: string }> = {
    active: { label: 'Actif', color: 'text-gray-900' },
    cancelled: { label: 'Annulé', color: 'text-red-500 line-through' },
}
