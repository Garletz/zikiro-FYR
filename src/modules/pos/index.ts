// Module POS - Export principal
export { default as POS } from './POS'

// Export des composants
export { default as CartItem } from './components/CartItem'
export { default as CartSection } from './components/CartSection'
export { default as CartSummary } from './components/CartSummary'
export { default as ChatSection } from './components/ChatSection'
export { default as PaymentModal } from './components/PaymentModal'
export { default as POSLayout } from './components/POSLayout'
export { default as ProductCard } from './components/ProductCard'
export { default as ProductSearch } from './components/ProductSearch'
export { default as ProductsSection } from './components/ProductsSection'
export { default as SplitTicketModal } from './components/SplitTicketModal'
export { default as TableCard } from './components/TableCard'
export { default as TablesSection } from './components/TablesSection'

// Export des hooks
export * from './hooks/useCart'
export * from './hooks/usePayment'
export * from './hooks/useSplitTicket'
export * from './hooks/useTables'

// Export des services
export * from './services/categoriesService'
export * from './services/productsService'
export * from './services/tablesService'

// Export des types
export * from './types/cart'
export * from './types/payment'
export * from './types/products'
export * from './types/tables'

