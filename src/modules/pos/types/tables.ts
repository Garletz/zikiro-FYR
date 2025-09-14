export interface TableData {
  id: string
  number: number
  name: string
  capacity: number
  status: 'free' | 'occupied' | 'reserved' | 'cleaning'
  position_x: number
  position_y: number
  current_order_id?: string
  created_at: string
  updated_at: string
}

export interface TableStatus {
  status: 'free' | 'occupied' | 'reserved' | 'cleaning'
  label: string
  color: string
  icon: any
}

export interface TableSelection {
  selectedTable: TableData | null
  onTableSelect: (table: TableData | null) => void
}
