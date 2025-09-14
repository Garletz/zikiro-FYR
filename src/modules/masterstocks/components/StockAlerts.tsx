import {
    AlertCircle,
    AlertTriangle,
    Check,
    Package,
    X
} from 'lucide-react'
import { StockAlert, getAlertIcon } from '../types/masterStocks'

interface StockAlertsProps {
    alerts: StockAlert[]
    onMarkAsRead: (alertId: string) => void
}

export default function StockAlerts({ alerts, onMarkAsRead }: StockAlertsProps) {
    const getAlertTitle = (type: string) => {
        switch (type) {
            case 'out_of_stock':
                return 'Out of Stock'
            case 'low_stock':
                return 'Low Stock'
            case 'expiring_soon':
                return 'Expiring Soon'
            case 'expired':
                return 'Product Expired'
            default:
                return 'Alert'
        }
    }

    const getAlertPriority = (type: string) => {
        switch (type) {
            case 'out_of_stock':
            case 'expired':
                return 'high'
            case 'low_stock':
            case 'expiring_soon':
                return 'medium'
            default:
                return 'low'
        }
    }

    if (alerts.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No alerts</p>
                    <p className="text-sm">All your stocks are in good condition</p>
                </div>
            </div>
        )
    }

    // Group alerts by priority
    const highPriorityAlerts = alerts.filter(alert => getAlertPriority(alert.alert_type) === 'high')
    const mediumPriorityAlerts = alerts.filter(alert => getAlertPriority(alert.alert_type) === 'medium')
    const lowPriorityAlerts = alerts.filter(alert => getAlertPriority(alert.alert_type) === 'low')

    return (
        <div className="h-full overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Alertes de Stock</h2>
                    <p className="text-gray-600">{alerts.length} alertes actives</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Check className="w-4 h-4" />
                        <span>Tout marquer comme lu</span>
                    </button>
                </div>
            </div>

            {/* High Priority Alerts */}
            {highPriorityAlerts.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h3 className="text-lg font-semibold text-red-600">Urgent ({highPriorityAlerts.length})</h3>
                    </div>
                    <div className="space-y-4">
                        {highPriorityAlerts.map((alert) => (
                            <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-red-600 text-lg">{getAlertIcon(alert.alert_type)}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-red-900">
                                                {getAlertTitle(alert.alert_type)}
                                            </h4>
                                            <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                                            <p className="text-xs text-red-600 mt-2">
                                                {new Date(alert.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onMarkAsRead(alert.id)}
                                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Medium Priority Alerts */}
            {mediumPriorityAlerts.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-orange-600">Attention ({mediumPriorityAlerts.length})</h3>
                    </div>
                    <div className="space-y-4">
                        {mediumPriorityAlerts.map((alert) => (
                            <div key={alert.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-orange-600 text-lg">{getAlertIcon(alert.alert_type)}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-orange-900">
                                                {getAlertTitle(alert.alert_type)}
                                            </h4>
                                            <p className="text-sm text-orange-700 mt-1">{alert.message}</p>
                                            <p className="text-xs text-orange-600 mt-2">
                                                {new Date(alert.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onMarkAsRead(alert.id)}
                                        className="p-2 text-orange-400 hover:text-orange-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Low Priority Alerts */}
            {lowPriorityAlerts.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center space-x-2 mb-4">
                        <Package className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-blue-600">Information ({lowPriorityAlerts.length})</h3>
                    </div>
                    <div className="space-y-4">
                        {lowPriorityAlerts.map((alert) => (
                            <div key={alert.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 text-lg">{getAlertIcon(alert.alert_type)}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-blue-900">
                                                {getAlertTitle(alert.alert_type)}
                                            </h4>
                                            <p className="text-sm text-blue-700 mt-1">{alert.message}</p>
                                            <p className="text-xs text-blue-600 mt-2">
                                                {new Date(alert.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onMarkAsRead(alert.id)}
                                        className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">{highPriorityAlerts.length} urgentes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">{mediumPriorityAlerts.length} attention</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">{lowPriorityAlerts.length} info</span>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        Dernière mise à jour: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        </div>
    )
}
