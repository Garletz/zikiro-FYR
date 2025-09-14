import { Minus, Plus, Trash2 } from 'lucide-react'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { CartItemDisplay } from '../types'

interface ModernCartItemProps {
    item: CartItemDisplay
    onRemove: (productId: string) => void
    onUpdateQuantity: (productId: string, quantity: number) => void
    getCategoryColor: (categoryId: string) => string
    showTaxDetails?: boolean
}

export default function ModernCartItem({
    item,
    onRemove,
    onUpdateQuantity,
    getCategoryColor,
    showTaxDetails = false
}: ModernCartItemProps) {
    const { formatAmount } = useTaxSettings()

    return (
        <div className="bg-slate-700 rounded-lg border border-slate-600 p-2 hover:bg-slate-600 transition-all duration-200">
            <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-xs leading-tight mb-0.5">
                        {item.product_name}
                    </h4>
                    {item.product && (
                        <div className="flex items-center space-x-1">
                            <div
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: getCategoryColor(item.product.category_id) }}
                            ></div>
                            <p className="text-xs text-slate-400 truncate">
                                {item.product.category_name}
                            </p>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onRemove(item.product_id)}
                    className="p-0.5 text-slate-400 hover:text-red-400 hover:bg-red-600 rounded transition-all duration-200"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>

            <div className="flex items-center justify-between">
                {/* Quantity Controls */}
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                        className="w-5 h-5 bg-slate-600 hover:bg-slate-500 border border-slate-500 rounded text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-center"
                    >
                        <Minus className="w-2 h-2" />
                    </button>
                    <div className="w-6 h-5 bg-emerald-600 border border-emerald-500 rounded flex items-center justify-center">
                        <span className="font-bold text-white text-xs">
                            {item.quantity}
                        </span>
                    </div>
                    <button
                        onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                        className="w-5 h-5 bg-slate-600 hover:bg-slate-500 border border-slate-500 rounded text-slate-300 hover:text-white transition-all duration-200 flex items-center justify-center"
                    >
                        <Plus className="w-2 h-2" />
                    </button>
                </div>

                {/* Price Display */}
                <div className="text-right">
                    <p className="text-xs text-slate-400">
                        {formatAmount(item.unit_price)} each
                    </p>
                    <p className="font-bold text-emerald-400 text-xs">
                        {formatAmount(item.total_price)}
                    </p>

                    {/* Tax Details */}
                    {showTaxDetails && item.product && (
                        <div className="text-xs text-slate-500">
                            <div>TVA: +{formatAmount(item.tax_amount)}</div>
                            <div className="font-medium text-slate-300">
                                Total: {formatAmount(item.total_with_tax)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
