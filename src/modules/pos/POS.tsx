import { useQuery } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'

import { useApp } from '../../shared/contexts/AppContext'
import { useUserSettings } from '../../shared/contexts/UserSettingsContext'
import { useActiveTabState } from '../../shared/hooks/useTabState'
import { useTaxSettings } from '../../shared/hooks/useTaxSettings'
import { categoriesService, Category } from './services/categoriesService'
import { productsService } from './services/productsService'
import { TableCart, tablesService } from './services/tablesService'

// Import refactored components
import { PaymentModal, SplitTicketModal } from './components'
import ModernPOSLayout from './components/ModernPOSLayout'

// Import specialized hooks
import { useCart, usePayment, useSplitTicket, useTables } from './hooks'

// Import types
import { ProductDisplay, TableData } from './types'

export default function POS() {
  const { tabs, activeTabId } = useApp()
  const { settings } = useUserSettings()
  const currentTab = tabs.find(tab => tab.id === activeTabId)

  // Main states with tab persistence
  const [selectedTable, setSelectedTable] = useActiveTabState<TableData | null>(
    'selectedTable',
    currentTab?.params?.selectedTable || null,
    true
  )
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Fullscreen management
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err)
      })
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Keyboard shortcut for fullscreen (F11)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        event.preventDefault()
        toggleFullscreen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])


  const [customerName, setCustomerName] = useActiveTabState<string>(
    'customerName',
    '',
    true
  )

  const [paymentMethod, setPaymentMethod] = useActiveTabState<string>(
    'paymentMethod',
    'cash',
    true
  )

  const [searchTerm, setSearchTerm] = useActiveTabState<string>(
    'searchTerm',
    '',
    true
  )

  const [selectedCategory, setSelectedCategory] = useActiveTabState<string>(
    'selectedCategory',
    'all',
    true
  )

  // Temporary states (not persisted)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSplitTicketModal, setShowSplitTicketModal] = useState(false)
  const [shouldGenerateTicket, setShouldGenerateTicket] = useState(false)


  // Queries
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsService.getAllProducts,
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoriesService.getAllCategories,
  })

  const { data: tables = [] } = useQuery<TableData[]>(
    ['tables'],
    () => invoke<TableData[]>('get_tables'),
    {
      refetchInterval: 2000,
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )

  // Table cart query (only when table is selected)
  const { data: tableCart } = useQuery<TableCart | null>({
    queryKey: ['table-cart', selectedTable?.id],
    queryFn: () => {
      if (!selectedTable) return null
      return tablesService.getTableCart(selectedTable.id)
    },
    enabled: !!selectedTable,
    retry: 1,
    onError: (_error) => {
      // Error handled silently for cart fetching
    }
  })

  // Specialized hooks
  const cartHook = useCart(selectedTable, products as any, categories)

  // Get current cart data - FIXED FOR DIRECT SALES MODE
  const cartItems = selectedTable ? (tableCart?.items || []) : cartHook.enrichCartItems(cartHook.localCart.items)
  const cartTotal = selectedTable ? (tableCart?.total_amount || 0) : cartHook.localCart.total_amount
  const tablesHook = useTables()
  const paymentHook = usePayment(selectedTable, cartItems, products as any)

  // Tax calculation functions
  const { calculateTax, getTaxName } = useTaxSettings()

  const getCartTaxBreakdown = () => {
    if (cartItems.length === 0) return []

    const taxGroups = new Map<string, { rate: number, name: string, amount: number }>()

    cartItems.forEach(item => {
      const rate = 0 // getTaxRateForCategory(product?.category_id, categories)
      const key = `${rate}`

      if (taxGroups.has(key)) {
        taxGroups.get(key)!.amount += item.total_price
      } else {
        taxGroups.set(key, {
          rate,
          name: `${getTaxName()} ${rate}%`,
          amount: item.total_price
        })
      }
    })

    return Array.from(taxGroups.values()).map(group => ({
      tax_rate_id: `rate-${group.rate}`,
      tax_rate_name: group.name,
      rate: group.rate,
      taxable_amount: group.amount,
      tax_amount: calculateTax(group.amount, undefined, categories)
    }))
  }

  const getCartTax = () => {
    const breakdowns = getCartTaxBreakdown()
    return breakdowns.reduce((sum, breakdown) => sum + breakdown.tax_amount, 0)
  }

  const getCartTotalWithTax = () => cartTotal + getCartTax()

  // Hook for ticket splitting
  const splitTicketHook = useSplitTicket(cartItems, cartTotal, getCartTax)

  // Enriched product functions
  const enrichedProducts: ProductDisplay[] = products.map((product: any) => {
    const category = categories.find(c => c.id === product.category_id)
    const taxRate = 0 // getTaxRateForCategory(product.category_id, categories)
    const taxAmount = calculateTax(product.price, product.category_id, categories)

    return {
      ...product,
      category_name: category?.name,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_with_tax: product.price + taxAmount
    }
  })

  // Function to get category color
  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#3B82F6'
  }

  // Cart management functions
  const addToCart = (product: ProductDisplay) => {
    cartHook.addToCart(product)
    setShowSuccessMessage('Product added to cart')
    setTimeout(() => setShowSuccessMessage(null), 2000)
  }

  const removeFromCart = (productId: string) => {
    cartHook.removeFromCart(productId)
    setShowSuccessMessage('Product removed from cart')
    setTimeout(() => setShowSuccessMessage(null), 2000)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    cartHook.updateQuantity(productId, quantity)
  }

  const clearCart = async () => {
    await cartHook.clearCart()
    setShowSuccessMessage('Cart cleared')
    setTimeout(() => setShowSuccessMessage(null), 2000)
  }

  // Payment functions
  const handlePayment = async () => {
    if (!cartItems || cartItems.length === 0) {
      setShowErrorMessage('Cart is empty')
      setTimeout(() => setShowErrorMessage(null), 3000)
      return
    }

    try {
      const totalAmount = getCartTotalWithTax()
      const taxAmount = getCartTax()
      const itemsCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
      const paymentMethods = [
        { id: 'cash', name: 'Cash' },
        { id: 'card', name: 'Card' },
        { id: 'transfer', name: 'Transfer' },
      ]
      const paymentMethodName = paymentMethods.find(m => m.id === paymentMethod)?.name || 'Unknown'

      await paymentHook.processPayment(
        totalAmount,
        taxAmount,
        itemsCount,
        paymentMethodName,
        customerName,
        () => {
          clearCart()
          if (selectedTable) {
            tablesHook.setTableCleaning(selectedTable.id)
          }
          setShowSuccessMessage('Payment completed successfully!')
          setTimeout(() => setShowSuccessMessage(null), 3000)
          setShowPaymentModal(false)
        }
      )
    } catch (error) {
      console.error('❌ Payment error:', error)
      setShowErrorMessage(`Payment error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => setShowErrorMessage(null), 5000)
    }
  }

  // Function to trigger SMS ticket auto-fill
  const handlePaymentClick = () => {
    setShouldGenerateTicket(true)
    setShowPaymentModal(true)
  }

  // Reset l'auto-remplissage après un délai
  useEffect(() => {
    if (shouldGenerateTicket) {
      const timer = setTimeout(() => {
        setShouldGenerateTicket(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [shouldGenerateTicket])

  const sendToKitchen = async () => {
    try {
      await paymentHook.sendToKitchen()
      setShowSuccessMessage('Commande envoyée en cuisine avec succès !')
      setTimeout(() => setShowSuccessMessage(null), 3000)
    } catch (error) {
      setShowErrorMessage('Erreur lors de l\'envoi en cuisine')
      setTimeout(() => setShowErrorMessage(null), 3000)
    }
  }

  // Filtrage des produits
  const filteredProducts = enrichedProducts?.filter(product => {
    const matchesCategory = selectedCategory === 'all' || (product as any).category_id === selectedCategory
    const matchesSearch = (product as any).name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })


  // Empêcher le scroll de la page entière
  useEffect(() => {
    // Empêcher le scroll sur le body
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'

    // Nettoyer au démontage
    return () => {
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
  }, [])

  return (
    <div className="w-full overflow-hidden flex flex-col" style={{
      userSelect: 'none',
      touchAction: 'none',
      position: isFullscreen ? 'fixed' : 'fixed',
      top: isFullscreen ? '0' : '40px',
      left: 0,
      right: 0,
      bottom: 0,
      height: isFullscreen ? '100vh' : 'calc(100vh - 40px)',
      pointerEvents: 'auto',
      zIndex: isFullscreen ? 9999 : 1,
      overflow: 'hidden'
    }}>
      {/* Modern Layout with Asian-inspired design */}
      <ModernPOSLayout
        // Tables
        tables={tables}
        selectedTable={selectedTable}
        onTableSelect={setSelectedTable}

        // Cart
        cartItems={cartItems as any}
        cartTotal={cartTotal}
        customerName={customerName}
        setCustomerName={setCustomerName}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onPayment={handlePaymentClick}
        onSendToKitchen={sendToKitchen}
        onClearCart={clearCart}
        onSplitTicket={() => setShowSplitTicketModal(true)}
        isSendingToKitchen={paymentHook.isSendingToKitchen}
        showSuccessMessage={showSuccessMessage}
        showErrorMessage={showErrorMessage}
        getCartTax={getCartTax}
        getCartTotalWithTax={getCartTotalWithTax}
        getCartTaxBreakdown={getCartTaxBreakdown}
        getCategoryColor={getCategoryColor}

        // Products
        products={filteredProducts}
        categories={categories}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onProductSelect={addToCart}

        // Layout
        leftHandedMode={settings.leftHandedMode}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}

        // SMS Chat
        currentOrder={{
          id: `ORD-${Date.now()}`,
          total: cartTotal,
          items: cartItems.map(item => ({
            name: item.product_name,
            quantity: item.quantity,
            price: item.unit_price
          }))
        }}
        onPaymentComplete={() => setShowPaymentModal(true)}
        shouldGenerateTicket={shouldGenerateTicket}
      />

      {/* Modal de paiement */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePayment}
        totalAmount={getCartTotalWithTax()}
        paymentMethod={paymentMethod}
        customerName={customerName}
        isProcessing={paymentHook.isProcessingPayment}
      />

      {/* Modal de division des tickets */}
      <SplitTicketModal
        isOpen={showSplitTicketModal}
        onClose={() => setShowSplitTicketModal(false)}
        splitMode={splitTicketHook.splitMode}
        setSplitMode={splitTicketHook.setSplitMode}
        splitCount={splitTicketHook.splitCount}
        setSplitCount={splitTicketHook.setSplitCount}
        customSplits={splitTicketHook.customSplits}
        setCustomSplits={splitTicketHook.setCustomSplits}
        itemAssignments={splitTicketHook.itemAssignments}
        paidAmounts={splitTicketHook.paidAmounts}
        currentPayer={splitTicketHook.currentPayer}
        setCurrentPayer={splitTicketHook.setCurrentPayer}
        getSplitBreakdown={splitTicketHook.getSplitBreakdown}
        getTotalRemaining={splitTicketHook.getTotalRemaining}
        getTotalPaid={splitTicketHook.getTotalPaid}
        handlePartialPayment={splitTicketHook.handlePartialPayment}
        assignItemToTicket={splitTicketHook.assignItemToTicket}
        clearSplit={splitTicketHook.clearSplit}
        isNoteFullyPaid={splitTicketHook.isNoteFullyPaid}
        cartItems={cartItems}
        cartTotal={cartTotal}
        getCartTax={getCartTax}
        getCartTotalWithTax={getCartTotalWithTax}
      />
    </div>
  )
}
