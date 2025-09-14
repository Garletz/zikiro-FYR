import { invoke } from '@tauri-apps/api/core'

export interface CreateCategoryRequest {
  name: string
  description?: string
  color?: string
  is_active?: boolean
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  color?: string
  is_active?: boolean
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  tax_rate_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const categoriesService = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    return invoke('get_categories')
  },

  // Create a new category
  createCategory: async (request: CreateCategoryRequest): Promise<Category> => {
    return invoke('create_category', { request })
  },

  // Update a category
  updateCategory: async (id: string, request: UpdateCategoryRequest): Promise<Category> => {
    return invoke('update_category', { id, request })
  },

  // Delete a category
  deleteCategory: async (id: string): Promise<void> => {
    return invoke('delete_category', { id })
  }
}
