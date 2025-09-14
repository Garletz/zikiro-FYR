import { X } from 'lucide-react'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { CartItem, SplitBreakdown } from '../types'

interface SplitTicketModalProps {
  isOpen: boolean
  onClose: () => void
  splitMode: 'equal' | 'custom' | 'item'
  setSplitMode: (mode: 'equal' | 'custom' | 'item') => void
  splitCount: number
  setSplitCount: (count: number) => void
  customSplits: { [key: string]: number }
  setCustomSplits: (splits: { [key: string]: number }) => void
  itemAssignments: { [key: string]: string[] }
  paidAmounts: { [key: string]: number }
  currentPayer: string
  setCurrentPayer: (payer: string) => void
  getSplitBreakdown: () => SplitBreakdown[]
  getTotalRemaining: () => number
  getTotalPaid: () => number
  handlePartialPayment: (ticketId: string, amount: number) => void
  assignItemToTicket: (itemId: string, ticketId: string, assign: boolean) => void
  clearSplit: () => void
  isNoteFullyPaid: () => boolean
  cartItems: CartItem[]
  cartTotal: number
  getCartTax: () => number
  getCartTotalWithTax: () => number
}

export default function SplitTicketModal({
  isOpen,
  onClose,
  splitMode,
  setSplitMode,
  splitCount,
  setSplitCount,
  customSplits,
  setCustomSplits,
  itemAssignments,
  paidAmounts: _paidAmounts,
  currentPayer: _currentPayer,
  setCurrentPayer: _setCurrentPayer,
  getSplitBreakdown,
  getTotalRemaining: _getTotalRemaining,
  getTotalPaid: _getTotalPaid,
  handlePartialPayment: _handlePartialPayment,
  assignItemToTicket,
  clearSplit,
  isNoteFullyPaid: _isNoteFullyPaid,
  cartItems,
  cartTotal,
  getCartTax,
  getCartTotalWithTax
}: SplitTicketModalProps) {
  const { formatAmount } = useTaxSettings()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Fixed header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">Split the bill</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-6 h-full">

            {/* Column 1 - Quick configuration */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-base font-semibold text-gray-800 mb-3">Configuration</h4>

                {/* Split mode - Compact version */}
                <div className="space-y-2 mb-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSplitMode('equal')}
                      className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-colors ${splitMode === 'equal' ? 'border-purple-500 bg-purple-100 text-purple-700' : 'border-gray-300'}`}
                    >
                      Equal
                    </button>
                    <button
                      onClick={() => setSplitMode('custom')}
                      className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-colors ${splitMode === 'custom' ? 'border-purple-500 bg-purple-100 text-purple-700' : 'border-gray-300'}`}
                    >
                      Custom
                    </button>
                    <button
                      onClick={() => setSplitMode('item')}
                      className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-colors ${splitMode === 'item' ? 'border-purple-500 bg-purple-100 text-purple-700' : 'border-gray-300'}`}
                    >
                      Items
                    </button>
                  </div>
                </div>

                {/* Number of people - Compact grid */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Number of people</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                      <button
                        key={count}
                        onClick={() => setSplitCount(count)}
                        className={`py-2 px-1 text-xs rounded border transition-colors ${splitCount === count
                          ? 'border-purple-500 bg-purple-100 text-purple-700 font-bold'
                          : 'border-gray-300 hover:border-purple-300'
                          }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSplitCount(2)
                      setSplitMode('equal')
                      clearSplit()
                    }}
                    className="w-full py-2 px-3 text-xs bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2 - Bill preview */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="text-base font-semibold text-gray-800 mb-3">Bill</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatAmount(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT:</span>
                    <span>{formatAmount(getCartTax())}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-1">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{formatAmount(getCartTotalWithTax())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time distribution */}
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h4 className="text-base font-semibold text-purple-800 mb-3">Distribution</h4>
                <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                  {getSplitBreakdown().map((person) => (
                    <div key={person.id} className="flex justify-between items-center">
                      <span className="truncate">{person.name}:</span>
                      <span className="font-medium">{formatAmount(person.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3 - Detailed configuration according to mode */}
            <div className="space-y-4">
              {splitMode === 'custom' && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <h4 className="text-base font-semibold text-yellow-800 mb-3">Custom amounts</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Array.from({ length: splitCount }, (_, i) => {
                      const ticketId = `ticket-${i + 1}`

                      return (
                        <div key={ticketId} className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-700 w-8">
                            {i + 1}:
                          </span>
                          <input
                            type="number"
                            value={customSplits[ticketId] || ''}
                            onChange={(e) => {
                              const newValue = Number(e.target.value) || 0
                              setCustomSplits({
                                ...customSplits,
                                [ticketId]: newValue
                              })
                            }}
                            placeholder="0.00"
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                          />
                          <span className="text-xs text-gray-500">€</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 p-2 bg-white rounded text-xs">
                    <div className="flex justify-between">
                      <span>Entered:</span>
                      <span className="font-medium">{Object.values(customSplits).reduce((sum, val) => sum + val, 0).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className="font-medium">{Math.max(0, getCartTotalWithTax() - Object.values(customSplits).reduce((sum, val) => sum + val, 0)).toFixed(2)}€</span>
                    </div>
                    <div className={`font-bold ${Math.abs(Object.values(customSplits).reduce((sum, val) => sum + val, 0) - getCartTotalWithTax()) > 0.01
                      ? 'text-red-600'
                      : 'text-green-600'
                      }`}>
                      {Math.abs(Object.values(customSplits).reduce((sum, val) => sum + val, 0) - getCartTotalWithTax()) > 0.01
                        ? '❌ Incorrect'
                        : '✅ Correct'
                      }
                    </div>
                  </div>
                </div>
              )}

              {splitMode === 'item' && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <h4 className="text-base font-semibold text-green-800 mb-3">Item assignment</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cartItems.map((item) => {
                      const assignedTicket = itemAssignments[item.product_id]?.[0] // One ticket per item
                      return (
                        <div key={item.product_id} className="bg-white p-2 rounded border border-green-200">
                          <div className="text-xs font-medium mb-1 truncate">{item.product_name}</div>
                          <div className="text-xs text-gray-600 mb-2">{formatAmount(item.total_price)}</div>
                          <div className="grid grid-cols-3 gap-1">
                            {Array.from({ length: splitCount }, (_, i) => {
                              const ticketId = `ticket-${i + 1}`
                              const isAssigned = assignedTicket === ticketId
                              return (
                                <button
                                  key={ticketId}
                                  onClick={() => {
                                    // If we click on the already selected button, we deselect it
                                    if (isAssigned) {
                                      assignItemToTicket(item.product_id, ticketId, false)
                                    } else {
                                      // Otherwise we assign this item to this person (and remove from others)
                                      assignItemToTicket(item.product_id, ticketId, true)
                                    }
                                  }}
                                  className={`p-1 text-xs rounded border transition-colors ${isAssigned
                                    ? 'bg-green-100 border-green-300 text-green-700'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                  {i + 1}
                                </button>
                              )
                            })}
                          </div>
                          {assignedTicket && (
                            <div className="text-xs text-green-600 mt-1">
                              → Person {assignedTicket.replace('ticket-', '')}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Column 4 - Overview and actions */}
            <div className="space-y-4">
              {/* Split summary */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="text-base font-semibold text-blue-800 mb-3">Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span className="font-medium capitalize">{splitMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>People:</span>
                    <span className="font-medium">{splitCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{formatAmount(getCartTotalWithTax())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Per person:</span>
                    <span className="font-medium">{formatAmount(getCartTotalWithTax() / splitCount)}</span>
                  </div>
                </div>
              </div>

              {/* Final actions */}
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h4 className="text-base font-semibold text-purple-800 mb-3">Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onClose()
                    }}
                    className="w-full py-2 px-3 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Confirm split
                  </button>
                  <button
                    onClick={clearSplit}
                    className="w-full py-2 px-3 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
