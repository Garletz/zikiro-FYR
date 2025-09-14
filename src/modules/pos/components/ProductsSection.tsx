import { Category } from '../services/categoriesService'
import { ProductDisplay, ProductFilters } from '../types'
import ProductCard from './ProductCard'
import ProductSearch from './ProductSearch'

interface ProductsSectionProps {
    products: ProductDisplay[]
    categories: Category[]
    filters: ProductFilters
    onProductSelect: (product: ProductDisplay) => void
    getCategoryColor: (categoryId: string) => string
    compact?: boolean
}

export default function ProductsSection({
    products,
    categories,
    filters,
    onProductSelect,
    getCategoryColor,
}: ProductsSectionProps) {
    const padding = 'p-2 lg:p-3'
    const gridCols = 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'
    const gap = 'gap-3'

    return (
        <div className={`flex-1 ${padding} overflow-auto h-full w-full bg-white`}>
            {/* Search and Filter - ultra compact */}
            <div className="mb-1.5 sticky top-0 bg-white z-10 pb-1">
                <ProductSearch
                    filters={filters}
                    categories={categories}
                />
            </div>

            {/* Products Grid - FILLS ALL AVAILABLE SPACE */}
            <div className={`grid ${gridCols} ${gap} flex-1`}>
                {products?.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={onProductSelect}
                        getCategoryColor={getCategoryColor}
                    />
                ))}
            </div>
        </div>
    )
}
