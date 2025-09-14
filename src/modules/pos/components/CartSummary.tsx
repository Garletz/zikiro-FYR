import { ChefHat, Users, Zap } from 'lucide-react'
import TaxBreakdown from '../../../shared/components/ui/TaxBreakdown'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { TableData } from '../types'

interface CartSummaryProps {
  cartTotal: number
  cartItems: any[]
  selectedTable: TableData | null
  customerName: string
  setCustomerName: (name: string) => void
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  onPayment: () => void
  onSendToKitchen: () => void
  onClearCart: () => void
  onSplitTicket: () => void
  isSendingToKitchen: boolean
  getCartTotalWithTax: () => number
  getCartTaxBreakdown: () => any[]
}

export default function CartSummary({
  cartTotal,
  cartItems,
  selectedTable,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  onPayment,
  onSendToKitchen,
  onClearCart,
  onSplitTicket,
  isSendingToKitchen,
  getCartTotalWithTax,
  getCartTaxBreakdown
}: CartSummaryProps) {
  const { formatAmount } = useTaxSettings()
  const padding = 'p-2 lg:p-3'
  const margin = 'mb-2 lg:mb-3'

  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'card', name: 'Card' },
    { id: 'transfer', name: 'Transfer' },
  ]

  return (
    <div className={`border-t border-gray-200 ${padding} bg-gray-50 flex-shrink-0`}>
      <div className={`space-y-2 ${margin}`}>
        <div className="flex justify-between text-base">
          <span className="font-medium">Subtotal:</span>
          <span className="font-bold">{cartTotal.toFixed(2)} €</span>
        </div>

        <TaxBreakdown
          breakdowns={getCartTaxBreakdown()}
          showDetails={getCartTaxBreakdown().length > 1}
          className="text-xs text-gray-600"
        />

        <div className="flex justify-between text-lg font-bold text-blue-600 border-t border-gray-300 pt-2">
          <span>Total:</span>
          <span>{formatAmount(getCartTotalWithTax())}</span>
        </div>
      </div>

      {/* Customer Name */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer name
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Customer name (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Payment Method */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          {paymentMethods.map(method => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons - NORMAL SIZE */}
      <div className="space-y-2">
        <button
          onClick={onPayment}
          disabled={cartItems.length === 0}
          className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          <div className="flex items-center justify-center">
            <Zap className="w-4 h-4 mr-2" />
            Pay {formatAmount(getCartTotalWithTax())}
          </div>
        </button>

        {/* "Send to kitchen" button - ALWAYS VISIBLE BUT GRAYED BY DEFAULT */}
        <button
          onClick={onSendToKitchen}
          disabled={!selectedTable || cartItems.length === 0 || isSendingToKitchen}
          className="w-full bg-orange-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <ChefHat className="w-4 h-4" />
          <span className="text-sm">
            {isSendingToKitchen ? 'Sending...' : 'Send to kitchen'}
          </span>
        </button>

        <button
          onClick={onClearCart}
          disabled={cartItems.length === 0}
          className="w-full bg-gray-200 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Clear cart
        </button>

        {/* Button to split the bill - ALWAYS VISIBLE BUT GRAYED */}
        <button
          onClick={onSplitTicket}
          disabled={cartItems.length === 0}
          className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm"
        >
          <Users className="w-4 h-4" />
          <span>Split the bill</span>
        </button>
      </div>
    </div>
  )
}
