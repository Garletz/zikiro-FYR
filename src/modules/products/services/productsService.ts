import { invoke } from '@tauri-apps/api/core'

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

export interface Product {
  id: string
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
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const productsService = {
  // Get all products
  getProducts: async (): Promise<Product[]> => {
    return invoke('get_products')
  },

  // Create a new product
  createProduct: async (request: CreateProductRequest): Promise<Product> => {
    return invoke('create_product', { request })
  },

  // Update a product
  updateProduct: async (id: string, request: UpdateProductRequest): Promise<Product> => {
    return invoke('update_product', { id, request })
  },

  // Delete a product
  deleteProduct: async (id: string): Promise<void> => {
    return invoke('delete_product', { id })
  }
}
