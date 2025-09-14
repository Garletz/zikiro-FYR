import { CreditCard, X } from 'lucide-react'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  totalAmount: number
  paymentMethod: string
  customerName: string
  isProcessing: boolean
}

export default function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  paymentMethod,
  customerName,
  isProcessing
}: PaymentModalProps) {
  const { formatAmount } = useTaxSettings()

  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'card', name: 'Card' },
    { id: 'transfer', name: 'Transfer' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Payment Confirmation</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-semibold text-gray-800">
              Total to pay: {formatAmount(totalAmount)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Mode: {paymentMethods.find(m => m.id === paymentMethod)?.name}
            </p>
          </div>

          {customerName && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">Customer:</p>
              <p className="font-semibold">{customerName}</p>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
