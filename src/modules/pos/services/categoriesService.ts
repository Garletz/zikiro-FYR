import { invoke } from '@tauri-apps/api/core'

export interface Category {
  id: string
  name: string
  color?: string
  tax_rate_id?: string
}

export const categoriesService = {
  getAllCategories: async (): Promise<Category[]> => {
    return invoke('get_categories')
  },

  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    return invoke('create_category', { request: category })
  },

  updateCategory: async (id: string, category: Partial<Category>): Promise<Category> => {
    return invoke('update_category', { id, request: category })
  },

  deleteCategory: async (id: string): Promise<void> => {
    return invoke('delete_category', { id })
  },
}
