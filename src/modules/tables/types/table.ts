export interface TableData {
  id: string
  number: number
  name: string
  capacity: number
  status: 'free' | 'occupied' | 'reserved' | 'cleaning'
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}

export interface CreateTableRequest {
  number: number
  name: string
  capacity: number
  position_x?: number
  position_y?: number
}

export interface UpdateTableRequest {
  number?: number
  name?: string
  capacity?: number
  status?: TableData['status']
  position_x?: number
  position_y?: number
  current_order_id?: string
}
