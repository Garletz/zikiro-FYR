// Interface CartItem pour le panier local
export interface CartItem {
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
}

export interface LocalCart {
    items: CartItem[]
    total_amount: number
}

export interface CartSummary {
    subtotal: number
    tax_amount: number
    total_with_tax: number
    items_count: number
}

export interface CartItemDisplay extends CartItem {
    product?: {
        id: string
        name: string
        category_id: string
        category_name: string
        price: number
    }
    tax_amount: number
    total_with_tax: number
}
