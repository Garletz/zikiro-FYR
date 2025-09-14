import { invoke } from '@tauri-apps/api/core'

export interface Table {
  id: string
  name: string
  status: string
  capacity: number
  position_x: number
  position_y: number
}

export interface CartItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface TableCart {
  table_id: string
  items: CartItem[]
  total_amount: number
}

export const tablesService = {
  getAllTables: async (): Promise<Table[]> => {
    return invoke('get_tables')
  },

  createTable: async (table: Omit<Table, 'id'>): Promise<Table> => {
    return invoke('create_table', { request: table })
  },

  updateTable: async (id: string, table: Partial<Table>): Promise<Table> => {
    return invoke('update_table_command', { id, request: table })
  },

  deleteTable: async (id: string): Promise<void> => {
    return invoke('delete_table', { id })
  },

  getTableCart: async (tableId: string): Promise<TableCart | null> => {
    return invoke('get_table_cart_command', { request: { table_id: tableId } })
  },

  addItemToCart: async (tableId: string, item: Omit<CartItem, 'total_price'>): Promise<void> => {
    return invoke('add_item_to_cart', {
      request: {
        table_id: tableId,
        item_request: item
      }
    })
  },

  updateCartItem: async (tableId: string, productId: string, update: { quantity: number }): Promise<void> => {
    return invoke('update_cart_item', {
      request: {
        table_id: tableId,
        product_id: productId,
        update_request: update
      }
    })
  },

  removeItemFromCart: async (tableId: string, productId: string): Promise<void> => {
    return invoke('remove_item_from_cart', { request: { table_id: tableId, product_id: productId } })
  },

  clearTableCart: async (tableId: string): Promise<void> => {
    return invoke('clear_table_cart_command', { request: { table_id: tableId } })
  },
}
