import { invoke } from '@tauri-apps/api/core'

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

export const tablesService = {
  // Get all tables
  getTables: async (): Promise<TableData[]> => {
    return invoke('get_tables')
  },

  // Create a new table
  createTable: async (request: CreateTableRequest): Promise<TableData> => {
    return invoke('create_table', { request })
  },

  // Update a table
  updateTable: async (id: string, request: UpdateTableRequest): Promise<void> => {
    return invoke('update_table_command', { id, request })
  },

  // Delete a table
  deleteTable: async (id: string): Promise<void> => {
    return invoke('delete_table_command', { id })
  },

  // Get table by ID
  getTableById: async (id: string): Promise<TableData | null> => {
    return invoke('get_table_by_id_command', { id })
  },

  // Get next available table number
  getNextTableNumber: async (): Promise<number> => {
    return invoke('get_next_table_number_command')
  }
}
