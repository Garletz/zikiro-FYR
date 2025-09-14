export interface MultilingualNames {
  en?: string
  fr?: string
  es?: string
  de?: string
  it?: string
  pt?: string
  [key: string]: string | undefined
}

export interface Module {
  id: string
  title: string
  icon: string
  path: string
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'purple'
  isMain?: boolean
  description: string
  names?: MultilingualNames
}

export interface Tab {
  id: string
  moduleId: string
  title: string
  path: string
  isActive: boolean
  canClose: boolean
  error?: string
  params?: any
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
  tax_amount?: number
  total_with_tax?: number
}

export interface AppState {
  // Navigation
  isDashboard: boolean
  activeTabId: string | null

  // Onglets
  tabs: Tab[]
  tabHistory: string[]

  // Actions
  openModule: (moduleId: string, params?: any) => void
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  reorderTabs: (sourceIndex: number, destinationIndex: number) => void
  goToDashboard: () => void
  setTabError: (tabId: string, error: string) => void
  clearTabError: (tabId: string) => void
}

