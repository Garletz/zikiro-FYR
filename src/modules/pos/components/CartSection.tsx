import { AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react'
import { CartItemDisplay, TableData } from '../types'
import CartItem from './CartItem'
import CartSummary from './CartSummary'

interface CartSectionProps {
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

export default function CartSection({
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
}: CartSectionProps) {
    const padding = 'p-2 lg:p-3'
    const headerPadding = 'p-2 lg:p-3'
    const textSize = 'text-lg'
    const iconSize = 'w-5 h-5'

    return (
        <div className="w-full h-full bg-white flex flex-col flex-shrink-0">
            {/* Cart Header */}
            <div className={`${headerPadding} border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0`}>
                <h2 className={`${textSize} font-bold flex items-center text-gray-800`}>
                    <ShoppingCart className={`${iconSize} mr-3 text-blue-600`} />
                    Cart
                    {selectedTable && (
                        <span className="ml-3 text-sm bg-blue-200 text-blue-800 px-3 py-1 rounded-full">
                            Table {selectedTable.number}
                        </span>
                    )}
                </h2>
            </div>

            {/* Success/Error Messages */}
            {showSuccessMessage && (
                <div className={`mx-2 mt-2 ${padding} bg-green-50 border border-green-200 rounded-lg flex items-center flex-shrink-0`}>
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium text-sm">{showSuccessMessage}</span>
                </div>
            )}

            {showErrorMessage && (
                <div className={`mx-2 mt-2 ${padding} bg-red-50 border border-red-200 rounded-lg flex items-center flex-shrink-0`}>
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-red-800 font-medium text-sm">{showErrorMessage}</span>
                </div>
            )}

            {/* Cart Items - Scrollable area - FILLS ALL AVAILABLE SPACE */}
            <div className={`flex-1 overflow-y-auto ${padding} min-h-0`}>
                {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-full">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">Cart is empty</p>
                        <p className="text-sm text-gray-400 text-center">
                            {selectedTable ? `Select products for table ${selectedTable.number}` : 'Select products to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cartItems.map((item: CartItemDisplay) => (
                            <CartItem
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

            {/* Cart Summary */}
            <CartSummary
                cartTotal={cartTotal}
                cartItems={cartItems}
                selectedTable={selectedTable}
                customerName={customerName}
                setCustomerName={setCustomerName}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                onPayment={onPayment}
                onSendToKitchen={onSendToKitchen}
                onClearCart={onClearCart}
                onSplitTicket={onSplitTicket}
                isSendingToKitchen={isSendingToKitchen}
                getCartTotalWithTax={getCartTotalWithTax}
                getCartTaxBreakdown={getCartTaxBreakdown}
            />
        </div>
    )
}
