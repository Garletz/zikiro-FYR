import { invoke } from '@tauri-apps/api/core'

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost?: number
  category_id: string
  category_name?: string
  stock_quantity?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export const productsService = {
  getAllProducts: async (): Promise<Product[]> => {
    return invoke('get_products')
  },

  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    return invoke('create_product', { request: product })
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    return invoke('update_product', { id, request: product })
  },

  deleteProduct: async (id: string): Promise<void> => {
    return invoke('delete_product', { id })
  },
}
