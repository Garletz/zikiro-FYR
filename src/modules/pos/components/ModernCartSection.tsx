import { AlertCircle, CheckCircle, ChefHat, ShoppingCart, Trash2, Users, Zap } from 'lucide-react'
import TaxBreakdown from '../../../shared/components/ui/TaxBreakdown'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { CartItemDisplay, TableData } from '../types'
import ModernCartItem from './ModernCartItem'

interface ModernCartSectionProps {
    selectedTable: TableData | null
    cartItems: CartItemDisplay[]
    cartTotal: number
    customerName: string
    setCustomerName: (name: string) => void
    paymentMethod: string
    setPaymentMethod: (method: string) => void
    onRemove: (productId: string) => void
    onUpdateQuantity: (productId: string, quantity: number) => void
    onPayment: () => void
    onSendToKitchen: () => void
    onClearCart: () => void
    onSplitTicket: () => void
    isSendingToKitchen: boolean
    showSuccessMessage: string | null
    showErrorMessage: string | null
    getCartTax: () => number
    getCartTotalWithTax: () => number
    getCartTaxBreakdown: () => any[]
    getCategoryColor: (categoryId: string) => string
    compact?: boolean
}

export default function ModernCartSection({
    selectedTable,
    cartItems,
    cartTotal,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    onRemove,
    onUpdateQuantity,
    onPayment,
    onSendToKitchen,
    onClearCart,
    onSplitTicket,
    isSendingToKitchen,
    showSuccessMessage,
    showErrorMessage,
    getCartTotalWithTax,
    getCartTaxBreakdown,
    getCategoryColor,
}: ModernCartSectionProps) {
    const { formatAmount } = useTaxSettings()

    const paymentMethods = [
        { id: 'cash', name: 'Cash', icon: '💵' },
        { id: 'card', name: 'Card', icon: '💳' },
        { id: 'transfer', name: 'Transfer', icon: '📱' },
    ]

    return (
        <div className="h-full w-full bg-slate-800 flex flex-col border-l border-slate-700 min-h-0">
            {/* Compact Cart Header */}
            <div className="px-4 py-2 border-b border-slate-700 bg-slate-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <ShoppingCart className="w-5 h-5 text-slate-300" />
                        <h2 className="text-sm font-semibold text-white">Cart</h2>
                        {selectedTable && (
                            <span className="text-xs text-emerald-400 font-medium">
                                Table {selectedTable.number}
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold text-white">
                            {formatAmount(getCartTotalWithTax())}
                        </div>
                        <div className="text-xs text-slate-400">
                            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>

            {/* Success/Error Messages */}
            {showSuccessMessage && (
                <div className="mx-3 mt-1 p-2 bg-emerald-600 border border-emerald-500 rounded-lg flex items-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white mr-2" />
                    <span className="text-white font-medium text-xs">{showSuccessMessage}</span>
                </div>
            )}

            {showErrorMessage && (
                <div className="mx-3 mt-1 p-2 bg-red-600 border border-red-500 rounded-lg flex items-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-white mr-2" />
                    <span className="text-white font-medium text-xs">{showErrorMessage}</span>
                </div>
            )}

            {/* Cart Items - Scrollable area */}
            <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                        <ShoppingCart className="w-6 h-6 text-slate-500 mb-1" />
                        <p className="text-xs text-slate-500 text-center">
                            {selectedTable
                                ? `Select products for table ${selectedTable.number}`
                                : 'Select products to get started'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {cartItems.map((item: CartItemDisplay) => (
                            <ModernCartItem
                                key={item.product_id}
                                item={item}
                                onRemove={onRemove}
                                onUpdateQuantity={onUpdateQuantity}
                                getCategoryColor={getCategoryColor}
                                showTaxDetails={true}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Compact Cart Summary - Fixed at bottom */}
            <div className="border-t border-slate-700 bg-slate-800 p-2 space-y-2 flex-shrink-0">
                {/* Tax Breakdown */}
                {cartItems.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Subtotal:</span>
                            <span className="font-semibold text-white">{formatAmount(cartTotal)}</span>
                        </div>

                        <TaxBreakdown
                            breakdowns={getCartTaxBreakdown()}
                            showDetails={getCartTaxBreakdown().length > 1}
                            className="text-xs text-slate-400"
                        />

                        <div className="flex justify-between text-sm font-bold text-emerald-400 border-t border-slate-600 pt-1">
                            <span>Total:</span>
                            <span>{formatAmount(getCartTotalWithTax())}</span>
                        </div>
                    </div>
                )}

                {/* Customer Name */}
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                        Customer name
                    </label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer name (optional)"
                        className="w-full px-2 py-1.5 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
                    />
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                        Payment method
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                        {paymentMethods.map(method => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`flex flex-col items-center p-1.5 rounded-lg border transition-all duration-200 ${paymentMethod === method.id
                                    ? 'border-emerald-500 bg-emerald-600 text-white'
                                    : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                                    }`}
                            >
                                <span className="text-xs mb-0.5">{method.icon}</span>
                                <span className="text-xs font-medium">{method.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-1">
                    {/* Main Payment Button */}
                    <button
                        onClick={onPayment}
                        disabled={cartItems.length === 0}
                        className="w-full bg-emerald-600 text-white py-2 px-2 rounded-lg font-bold text-xs hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-1"
                    >
                        <Zap className="w-3 h-3" />
                        <span>Pay {formatAmount(getCartTotalWithTax())}</span>
                    </button>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-2 gap-1">
                        <button
                            onClick={onSendToKitchen}
                            disabled={!selectedTable || cartItems.length === 0 || isSendingToKitchen}
                            className="flex items-center justify-center space-x-1 px-1 py-1.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <ChefHat className="w-3 h-3" />
                            <span className="text-xs">
                                {isSendingToKitchen ? 'Sending...' : 'Kitchen'}
                            </span>
                        </button>

                        <button
                            onClick={onSplitTicket}
                            disabled={cartItems.length === 0}
                            className="flex items-center justify-center space-x-1 px-1 py-1.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <Users className="w-3 h-3" />
                            <span className="text-xs">Split</span>
                        </button>
                    </div>

                    {/* Clear Cart Button */}
                    <button
                        onClick={onClearCart}
                        disabled={cartItems.length === 0}
                        className="w-full flex items-center justify-center space-x-1 px-2 py-1.5 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        <Trash2 className="w-3 h-3" />
                        <span className="text-xs">Clear cart</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
