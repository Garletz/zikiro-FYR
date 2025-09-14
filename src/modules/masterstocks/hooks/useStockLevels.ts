import { useEffect, useState } from 'react'
import { masterStocksService } from '../services/masterStocksService'
import { StockAlert, StockDashboardData } from '../types/masterStocks'

export const useStockLevels = () => {
    const [dashboardData, setDashboardData] = useState<StockDashboardData | null>(null)
    const [alerts, setAlerts] = useState<StockAlert[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await masterStocksService.getDashboardData()
            setDashboardData(data)
            setAlerts(data.alerts)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données')
        } finally {
            setLoading(false)
        }
    }

    const markAlertAsRead = async (alertId: string) => {
        try {
            await masterStocksService.markAlertAsRead(alertId)
            setAlerts(prev => prev.filter(alert => alert.id !== alertId))
            if (dashboardData) {
                setDashboardData(prev => prev ? {
                    ...prev,
                    alerts: prev.alerts.filter(alert => alert.id !== alertId)
                } : null)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'alerte')
            throw err
        }
    }

    const refreshData = async () => {
        await fetchDashboardData()
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    return {
        dashboardData,
        alerts,
        loading,
        error,
        fetchDashboardData,
        markAlertAsRead,
        refreshData
    }
}
