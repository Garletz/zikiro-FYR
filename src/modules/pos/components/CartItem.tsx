import { Minus, Plus, Trash2 } from 'lucide-react'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { CartItemDisplay } from '../types'

interface CartItemProps {
    item: CartItemDisplay
    onRemove: (productId: string) => void
    onUpdateQuantity: (productId: string, quantity: number) => void
    getCategoryColor: (categoryId: string) => string
    showTaxDetails?: boolean
    compact?: boolean
}

export default function CartItem({
    item,
    onRemove,
    onUpdateQuantity,
    getCategoryColor,
    showTaxDetails = false,
    compact = false
}: CartItemProps) {
    const { formatAmount } = useTaxSettings()
    const padding = 'p-2'
    const textSize = 'text-xs'
    const iconSize = 'w-3 h-3'

    return (
        <div className={`bg-gray-50 rounded-lg ${padding}`}>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex-1">
                    <h4 className={`font-semibold text-gray-900 ${textSize}`}>
                        {item.product_name}
                    </h4>
                    {item.product && (
                        <div className="flex items-center space-x-1.5">
                            <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: getCategoryColor(item.product.category_id) }}
                            ></div>
                            <p className={`text-xs text-gray-600`}>
                                {item.product.category_name}
                            </p>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onRemove(item.product_id)}
                    className="p-0.5 text-red-400 hover:text-red-600 transition-colors"
                >
                    <Trash2 className={iconSize} />
                </button>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                        className="p-1 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Minus className={iconSize} />
                    </button>
                    <span className={`w-8 text-center font-bold ${compact ? 'text-base' : 'text-lg'}`}>
                        {item.quantity}
                    </span>
                    <button
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                        className="p-1 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Plus className={iconSize} />
                    </button>
                </div>

                <div className="text-right">
                    <p className={`text-gray-600 ${textSize}`}>
                        {formatAmount(item.unit_price)}
                    </p>
                    <p className={`font-bold ${compact ? 'text-base' : 'text-lg'} text-blue-600`}>
                        {formatAmount(item.total_price)}
                    </p>

                    {/* Affichage de la TVA si mode par catégorie */}
                    {showTaxDetails && item.product && (
                        <div className={`text-xs text-gray-500 mt-1`}>
                            <div>TVA: +{formatAmount(item.tax_amount)}</div>
                            <div className="font-medium text-gray-700">
                                Total: {formatAmount(item.total_with_tax)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
