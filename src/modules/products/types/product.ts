export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost: number  // Non-optionnel comme en Rust
  category_id: string
  barcode?: string
  sku?: string
  stock_quantity: number  // Non-optionnel comme en Rust
  min_stock: number  // Non-optionnel comme en Rust
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  cost?: number
  category_id: string
  barcode?: string
  sku?: string
  stock_quantity?: number
  min_stock?: number
  image_url?: string
  is_active?: boolean
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  cost?: number
  category_id?: string
  barcode?: string
  sku?: string
  stock_quantity?: number
  min_stock?: number
  image_url?: string
  is_active?: boolean
}
