import { Product } from '../../../shared/types/app'

export interface ProductDisplay extends Product {
  category_name?: string
  tax_rate?: number
  tax_amount?: number
  total_with_tax?: number
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  searchTerm: string
  selectedCategory: string
  onSearchChange: (term: string) => void
  onCategoryChange: (categoryId: string) => void
}

export interface ProductGridProps {
  products: ProductDisplay[]
  onProductSelect: (product: ProductDisplay) => void
  compact?: boolean
}
