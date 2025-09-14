import { Search } from 'lucide-react'
import { Category } from '../services/categoriesService'
import { ProductFilters } from '../types'

interface ProductSearchProps {
  filters: ProductFilters
  categories: Category[]
}

export default function ProductSearch({
  filters,
  categories
}: ProductSearchProps) {

  return (
    <div className="flex flex-col lg:flex-row gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search..."
          value={filters.searchTerm}
          onChange={(e) => filters.onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
        />
      </div>
      <select
        value={filters.selectedCategory}
        onChange={(e) => filters.onCategoryChange(e.target.value)}
        className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
      >
        <option value="all">All categories</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  )
}
