import { invoke } from '@tauri-apps/api/core'

export interface TablePlannerItem {
  planner_item: {
    id: string
    layout_id: string
    object_type: string
    name: string
    position: { x: number; y: number; z: number }
    size: { width: number; height: number; depth: number }
    rotation: number
    color: string
    metadata?: string
    table_id?: string
    table_number?: number
    created_at: string
    updated_at: string
  }
  table_status?: string
  table_capacity?: number
}

export interface Table {
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

export const tablePlannerIntegrationService = {
  // Récupérer les items du planner avec le statut des tables
  async getPlannerItemsWithTableStatus(_layoutId: string): Promise<TablePlannerItem[]> {
    // Pour l'instant, retourner un tableau vide car cette commande n'existe pas
    // TODO: Implémenter cette fonctionnalité si nécessaire
    return []
  },

  // Associer une table à un item du planner
  async associateTableWithPlannerItem(plannerItemId: string, tableId: string): Promise<void> {
    // Pour l'instant, ne rien faire car cette commande n'existe pas
    // TODO: Implémenter cette fonctionnalité si nécessaire
    console.log('Associating table', tableId, 'with planner item', plannerItemId)
  },

  // Dissocier une table d'un item du planner
  async disassociateTableFromPlannerItem(plannerItemId: string): Promise<void> {
    // Pour l'instant, ne rien faire car cette commande n'existe pas
    // TODO: Implémenter cette fonctionnalité si nécessaire
    console.log('Disassociating table from planner item', plannerItemId)
  },

  // Récupérer les tables disponibles pour association
  async getAvailableTablesForAssociation(): Promise<Table[]> {
    // Utiliser la commande existante get_tables
    return invoke('get_tables')
  },

  // Récupérer toutes les tables avec leur statut
  async getAllTablesWithStatus(): Promise<Table[]> {
    return invoke('get_tables')
  },

  // Synchroniser les positions entre tables et planner
  async syncTablePositions(tableId: string, positionX: number, positionY: number): Promise<void> {
    return invoke('update_table_command', {
      id: tableId,
      request: { position_x: positionX, position_y: positionY }
    })
  }
}

// Utilitaires pour les statuts de table
export const tableStatusConfig = {
  free: {
    label: 'Libre',
    color: '#22c55e',
    bgColor: '#dcfce7',
    borderColor: '#bbf7d0',
    icon: '🟢'
  },
  occupied: {
    label: 'Occupée',
    color: '#f97316',
    bgColor: '#fed7aa',
    borderColor: '#fdba74',
    icon: '🟠'
  },
  reserved: {
    label: 'Réservée',
    color: '#ef4444',
    bgColor: '#fecaca',
    borderColor: '#fca5a5',
    icon: '🔴'
  },
  cleaning: {
    label: 'Nettoyage',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    borderColor: '#bfdbfe',
    icon: '🔵'
  }
}

export const getTableStatusConfig = (status: string) => {
  return tableStatusConfig[status as keyof typeof tableStatusConfig] || tableStatusConfig.free
}
