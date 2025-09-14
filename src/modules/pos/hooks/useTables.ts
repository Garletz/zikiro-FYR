import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tablesService } from '../services/tablesService'

export const useTables = () => {
  const queryClient = useQueryClient()

  const updateTableStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      return tablesService.updateTable(id, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    },
    onError: (_error) => {
      // Error handled silently for status updates
    },
  })

  const updateTableStatus = (id: string, status: string) => {
    updateTableStatusMutation.mutate({ id, status })
  }

  const setTableOccupied = (tableId: string) => {
    updateTableStatus(tableId, 'occupied')
  }

  const setTableFree = (tableId: string) => {
    updateTableStatus(tableId, 'free')
  }

  const setTableCleaning = (tableId: string) => {
    updateTableStatus(tableId, 'cleaning')
  }

  return {
    updateTableStatus,
    setTableOccupied,
    setTableFree,
    setTableCleaning,
    updateTableStatusMutation
  }
}
