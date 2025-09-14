import { useQuery } from '@tanstack/react-query'
import { endOfDay, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import { enUS } from 'date-fns/locale'
import {
  BarChart3,
  Calculator,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  ShoppingCart,
  TrendingUp
} from 'lucide-react'
import { useState } from 'react'
import { logsService } from '../../shared/services/logsService'

type DateRange = 'today' | 'week' | 'month' | 'custom'
type PaymentMethod = 'all' | 'cash' | 'card' | 'transfer'

interface SalesSummary {
  totalSales: number
  totalTransactions: number
  averageTransaction: number
  totalItems: number
  totalTaxAmount: number
  cashSales: number
  cardSales: number
  transferSales: number
  cashTransactions: number
  cardTransactions: number
  transferTransactions: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

interface TopTable {
  name: string
  transactions: number
  revenue: number
}

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('all')

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date()
    let start: Date
    let end: Date

    switch (dateRange) {
      case 'today':
        start = startOfDay(now)
        end = endOfDay(now)
        break
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 })
        end = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'custom':
        start = customStartDate ? new Date(customStartDate) : startOfDay(now)
        end = customEndDate ? new Date(customEndDate) : endOfDay(now)
        break
      default:
        start = startOfDay(now)
        end = endOfDay(now)
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }

  // Query for financial logs
  const { data: financialLogs = [], isLoading } = useQuery({
    queryKey: ['financialLogs', dateRange, customStartDate, customEndDate],
    queryFn: () => logsService.getFinancialLogs(getDateRange().start, getDateRange().end),
  })

  // Filter logs by payment method
  const filteredLogs = financialLogs.filter(log => {
    if (paymentMethod === 'all') return true

    try {
      const metadata = JSON.parse(log.metadata || '{}')
      const logPaymentMethod = metadata.payment_method?.toLowerCase() || ''

      switch (paymentMethod) {
        case 'cash':
          return logPaymentMethod.includes('cash')
        case 'card':
          return logPaymentMethod.includes('card')
        case 'transfer':
          return logPaymentMethod.includes('transfer')
        default:
          return true
      }
    } catch {
      return true
    }
  })

  // Calculate sales summary
  const calculateSalesSummary = (): SalesSummary => {
    let totalSales = 0
    let totalTransactions = 0
    let totalItems = 0
    let totalTaxAmount = 0
    let cashSales = 0
    let cardSales = 0
    let transferSales = 0
    let cashTransactions = 0
    let cardTransactions = 0
    let transferTransactions = 0

    filteredLogs.forEach(log => {
      if (log.amount) {
        try {
          const metadata = JSON.parse(log.metadata || '{}')

          // Distinguer les logs de vente des logs de TVA
          const isTaxLog = log.title?.includes('TVA') || log.title?.includes('tax') ||
            log.description?.includes('TVA') || log.description?.includes('tax')

          if (isTaxLog) {
            // C'est un log de TVA - on l'ajoute seulement à la TVA collectée
            totalTaxAmount += log.amount
          } else {
            // C'est un log de vente - on l'ajoute au chiffre d'affaires
            totalSales += log.amount
            totalTransactions += 1

            const itemsCount = metadata.items_count || 0
            totalItems += itemsCount

            const paymentMethod = metadata.payment_method?.toLowerCase() || ''

            if (paymentMethod.includes('cash')) {
              cashSales += log.amount
              cashTransactions += 1
            } else if (paymentMethod.includes('card')) {
              cardSales += log.amount
              cardTransactions += 1
            } else if (paymentMethod.includes('transfer')) {
              transferSales += log.amount
              transferTransactions += 1
            }
          }
        } catch {
          // If metadata parsing fails, assume it's a sale log
          totalSales += log.amount
          totalTransactions += 1
          cashSales += log.amount
          cashTransactions += 1
        }
      }
    })

    return {
      totalSales,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      totalItems,
      totalTaxAmount,
      cashSales,
      cardSales,
      transferSales,
      cashTransactions,
      cardTransactions,
      transferTransactions
    }
  }

  // Get top products
  const getTopProducts = (): TopProduct[] => {
    const productMap = new Map<string, { quantity: number; revenue: number }>()

    filteredLogs.forEach(log => {
      try {
        const metadata = JSON.parse(log.metadata || '{}')

        // Ne traiter que les logs de vente (pas les logs de TVA)
        const isTaxLog = log.title?.includes('TVA') || log.title?.includes('tax') ||
          log.description?.includes('TVA') || log.description?.includes('tax')

        if (!isTaxLog) {
          const items = metadata.items || []

          items.forEach((item: any) => {
            const productName = item.product_name || 'Unknown Product'
            const quantity = item.quantity || 0
            const unitPrice = item.unit_price || 0
            const revenue = quantity * unitPrice

            const existing = productMap.get(productName) || { quantity: 0, revenue: 0 }
            productMap.set(productName, {
              quantity: existing.quantity + quantity,
              revenue: existing.revenue + revenue
            })
          })
        }
      } catch {
        // Skip if metadata parsing fails
      }
    })

    return Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  // Get top tables
  const getTopTables = (): TopTable[] => {
    const tableMap = new Map<string, { transactions: number; revenue: number }>()

    filteredLogs.forEach(log => {
      if (log.table_name && log.amount) {
        // Ne traiter que les logs de vente (pas les logs de TVA)
        const isTaxLog = log.title?.includes('TVA') || log.title?.includes('tax') ||
          log.description?.includes('TVA') || log.description?.includes('tax')

        if (!isTaxLog) {
          const existing = tableMap.get(log.table_name) || { transactions: 0, revenue: 0 }
          tableMap.set(log.table_name, {
            transactions: existing.transactions + 1,
            revenue: existing.revenue + log.amount
          })
        }
      }
    })

    return Array.from(tableMap.entries())
      .map(([name, data]) => ({
        name,
        transactions: data.transactions,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  const salesSummary = calculateSalesSummary()
  const topProducts = getTopProducts()
  const topTables = getTopTables()
  const { start, end } = getDateRange()

  const exportReport = () => {
    const reportData = {
      period: `${format(new Date(start), 'dd/MM/yyyy', { locale: enUS })} - ${format(new Date(end), 'dd/MM/yyyy', { locale: enUS })}`,
      summary: {
        ...salesSummary,
        totalTaxAmount: salesSummary.totalTaxAmount,
        netAmount: salesSummary.totalSales - salesSummary.totalTaxAmount
      },
      topProducts,
      topTables,
      generatedAt: new Date().toLocaleString('en-US')
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-gray-700" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
              <p className="text-sm text-gray-500">
                Financial report from {format(new Date(start), 'dd/MM/yyyy', { locale: enUS })} to {format(new Date(end), 'dd/MM/yyyy', { locale: enUS })}
              </p>
            </div>
          </div>

          <button
            onClick={exportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesSummary.totalSales.toFixed(2)}€
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tax</p>
                  <p className="text-2xl font-bold text-red-600">
                    {salesSummary.totalTaxAmount.toFixed(2)}€
                  </p>
                </div>
                <Calculator className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesSummary.totalTransactions}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Transaction</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesSummary.averageTransaction.toFixed(2)}€
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Items Sold</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesSummary.totalItems}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Cash</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{salesSummary.cashSales.toFixed(2)}€</p>
                    <p className="text-xs text-gray-500">{salesSummary.cashTransactions} transactions</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Card</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{salesSummary.cardSales.toFixed(2)}€</p>
                    <p className="text-xs text-gray-500">{salesSummary.cardTransactions} transactions</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Transfer</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{salesSummary.transferSales.toFixed(2)}€</p>
                    <p className="text-xs text-gray-500">{salesSummary.transferTransactions} transactions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Tables</h3>
              <div className="space-y-3">
                {topTables.slice(0, 5).map((table, index) => (
                  <div key={table.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium">{table.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{table.revenue.toFixed(2)}€</p>
                      <p className="text-xs text-gray-500">{table.transactions} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Product</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-700">Quantity</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={product.name} className="border-b border-gray-100">
                      <td className="py-2 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className="text-sm font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right text-sm">{product.quantity}</td>
                      <td className="py-2 px-4 text-right text-sm font-bold text-green-600">
                        {product.revenue.toFixed(2)}€
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Diagnostic Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Diagnostic</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-700">Total Financial Logs</p>
                <p className="text-2xl font-bold text-blue-600">{financialLogs.length}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-700">Filtered Logs</p>
                <p className="text-2xl font-bold text-green-600">{filteredLogs.length}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-700">Excluded Logs</p>
                <p className="text-2xl font-bold text-orange-600">{financialLogs.length - filteredLogs.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
