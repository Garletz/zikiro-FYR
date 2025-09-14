import { invoke } from '@tauri-apps/api/core'
import { Order, OrderItem, OrderStatus } from '../../../shared/types/orders'

export const ordersService = {
  // Créer une commande depuis le panier d'une table
  createOrderFromCart: async (
    tableId: string,
    tableName: string,
    cartItems: Array<{
      product_id: string
      product_name: string
      quantity: number
      unit_price: number
      total_price: number
    }>
  ): Promise<Order> => {
    return invoke('create_order_from_cart', {
      tableId,
      tableName,
      cartItems
    })
  },

  // Récupérer toutes les commandes
  getAllOrders: async (): Promise<Order[]> => {
    return invoke('get_all_orders')
  },



  // Mettre à jour le statut d'une commande
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    return invoke('update_order_status', { orderId, status })
  },

  // Supprimer une commande
  deleteOrder: async (orderId: string): Promise<void> => {
    return invoke('delete_order', { orderId })
  },

  // Récupérer une commande par table
  getOrderByTable: async (tableId: string): Promise<Order | null> => {
    return invoke('get_order_by_table', { tableId })
  },

  // Mettre à jour les items d'une commande
  updateOrderItems: async (orderId: string, items: OrderItem[]): Promise<void> => {
    const itemsJson = JSON.stringify(items)
    return invoke('update_order_items_command', { orderId, itemsJson })
  },

  // Annuler un item de commande
  cancelOrderItem: async (orderId: string, productId: string): Promise<void> => {
    return invoke('cancel_order_item', { orderId, productId })
  },

  // Récupérer les commandes dans la corbeille
  getTrashOrders: async (): Promise<Order[]> => {
    return invoke('get_trash_orders')
  },

  // Déplacer une commande vers la corbeille
  moveToTrash: async (orderId: string): Promise<void> => {
    return invoke('move_order_to_trash', { orderId })
  },

  // Restaurer une commande depuis la corbeille
  restoreFromTrash: async (orderId: string): Promise<void> => {
    return invoke('restore_order_from_trash', { orderId })
  },

  // Supprimer définitivement une commande
  deletePermanently: async (orderId: string): Promise<void> => {
    return invoke('delete_order_permanently', { orderId })
  },

  // Vider complètement la corbeille
  clearTrash: async (): Promise<void> => {
    return invoke('clear_trash')
  }
}