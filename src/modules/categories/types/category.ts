export interface Category {
  id: string
  name: string
  description?: string
  color?: string  // Optionnel comme en Rust
  tax_rate_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  color?: string
  tax_rate_id?: string
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  color?: string
  tax_rate_id?: string
  is_active?: boolean
}
