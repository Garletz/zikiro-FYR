import { Coffee, Utensils, Wine } from 'lucide-react'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { ProductDisplay } from '../types'

interface ProductCardProps {
  product: ProductDisplay
  onSelect: (product: ProductDisplay) => void
  getCategoryColor: (categoryId: string) => string
}

export default function ProductCard({
  product,
  onSelect,
  getCategoryColor
}: ProductCardProps) {
  const { formatAmount, calculateTax } = useTaxSettings()
  const padding = 'p-2'

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || ''
    if (name.includes('boisson') || name.includes('drink')) return Wine
    if (name.includes('plat') || name.includes('main')) return Utensils
    return Coffee
  }

  const CategoryIcon = getCategoryIcon(product.category_name || '')
  const productTaxAmount = product.tax_amount || calculateTax(product.price, product.category_id)

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 ${padding} hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-105`}
      onClick={() => onSelect(product)}
    >
      <div className="text-center">
        {/* Category icon - normal size */}
        <div className="flex justify-center mb-2">
          <CategoryIcon className="w-5 h-5 text-blue-600" />
        </div>

        {/* Product name - normal size */}
        <h3 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Category - normal size */}
        <div className="mb-2">
          <div className="flex items-center justify-center space-x-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getCategoryColor(product.category_id) }}
            ></div>
            <span className="text-gray-600 text-xs">
              {product.category_name}
            </span>
          </div>
        </div>

        {/* Prix - taille normale */}
        <div className="mb-2">
          <p className="font-bold text-blue-600 text-sm">
            {formatAmount(product.price)}
          </p>
          {product.tax_rate && (
            <p className="text-gray-500 text-xs">
              +{formatAmount(productTaxAmount)} TVA
            </p>
          )}
        </div>

        {/* Stock - taille normale */}
        <div className="text-gray-500 bg-gray-100 rounded-full px-2 py-1 inline-block text-xs">
          Stock: {product.stock_quantity}
        </div>
      </div>
    </div>
  )
}
