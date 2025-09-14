import { Search, Star } from 'lucide-react'
import { useState } from 'react'
import { Category } from '../services/categoriesService'
import { ProductDisplay, ProductFilters } from '../types'
import ModernProductCard from './ModernProductCard'

interface ModernProductsSectionProps {
    products: ProductDisplay[]
    categories: Category[]
    filters: ProductFilters
    onProductSelect: (product: ProductDisplay) => void
    getCategoryColor: (categoryId: string) => string
}

export default function ModernProductsSection({
    products,
    categories,
    filters,
    onProductSelect,
    getCategoryColor
}: ModernProductsSectionProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    // Filter products by selected category
    const filteredProducts = selectedCategory === 'all'
        ? products.filter(p => p.name.toLowerCase().includes(filters.searchTerm.toLowerCase()))
        : products.filter(p =>
            p.category_id === selectedCategory &&
            p.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
        )

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId)
        filters.onCategoryChange(categoryId)
    }

    return (
        <div className="h-full w-full bg-slate-800 flex flex-col min-h-0">
            {/* Game-like Header */}
            <div className="px-3 py-2 border-b border-slate-700 bg-slate-800 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <h2 className="text-sm font-bold text-white">Products Collection</h2>
                        <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                            {filteredProducts.length}
                        </span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="🔍 Search items..."
                        value={filters.searchTerm}
                        onChange={(e) => filters.onSearchChange(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
                    />
                </div>
            </div>

            {/* Category Tabs - Game Style */}
            <div className="px-3 py-2 border-b border-slate-700 bg-slate-800 flex-shrink-0">
                <div className="flex space-x-1 overflow-x-auto">
                    {/* All Categories Tab */}
                    <button
                        onClick={() => handleCategorySelect('all')}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center space-x-1 ${selectedCategory === 'all'
                            ? 'bg-slate-600 text-white shadow-lg transform scale-105'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {/* Color Dot for All */}
                        <div className="w-2 h-2 rounded-full shadow-sm bg-slate-400"></div>
                        <span>⭐ All</span>
                    </button>

                    {/* Category Tabs */}
                    {categories.map(category => {
                        const categoryColor = getCategoryColor(category.id)
                        const isSelected = selectedCategory === category.id

                        return (
                            <button
                                key={category.id}
                                onClick={() => handleCategorySelect(category.id)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center space-x-1 ${isSelected
                                    ? `bg-gradient-to-r ${categoryColor} text-white shadow-lg transform scale-105`
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                {/* Color Dot */}
                                <div
                                    className="w-2 h-2 rounded-full shadow-sm"
                                    style={{ backgroundColor: getCategoryColor(category.id) }}
                                ></div>
                                <span>{category.name}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Products Grid - Game Style */}
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                        <div className="text-sm mb-2 font-semibold text-slate-600">powered by STRYTOME</div>
                        <p className="text-sm text-slate-500 font-medium">No items found</p>
                        <p className="text-xs text-slate-600">Try a different category or search term</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 gap-2">
                        {filteredProducts.map(product => (
                            <ModernProductCard
                                key={product.id}
                                product={product}
                                onSelect={onProductSelect}
                                getCategoryColor={getCategoryColor}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
