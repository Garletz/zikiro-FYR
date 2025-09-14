export interface PaymentMethod {
  id: string
  name: string
  icon: any
}

export interface SplitTicketConfig {
  mode: 'equal' | 'custom' | 'item'
  count: number
  customSplits: { [key: string]: number }
  itemAssignments: { [key: string]: string[] }
  paidAmounts: { [key: string]: number }
}

export interface SplitBreakdown {
  id: string
  name: string
  amount: number
  paid: number
  remaining: number
  items?: any[]
}

export interface PaymentSummary {
  subtotal: number
  tax_amount: number
  total_with_tax: number
  customer_name: string
  payment_method: string
}
