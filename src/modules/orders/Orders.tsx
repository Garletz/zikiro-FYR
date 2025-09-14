import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    AlertTriangle,
    ChefHat,
    Clock,
    Eye,
    EyeOff,
    Magnet,
    Play,
    Printer,
    RefreshCw,
    RotateCcw,
    Trash2,
    Users,
    X
} from 'lucide-react'
import { useState } from 'react'
import { Order, OrderStatus } from '../../shared/types/orders'
import { ordersService } from './services/ordersService'

export default function Orders() {
    const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
    const [showTrash, setShowTrash] = useState(false)
    const [showCompleted, setShowCompleted] = useState(true)
    const queryClient = useQueryClient()

    // Queries
    const { data: allOrders = [], isLoading: allLoading } = useQuery<Order[]>({
        queryKey: ['all-orders'],
        queryFn: () => ordersService.getAllOrders(),
        refetchInterval: 5000,
        refetchOnWindowFocus: true,
    })

    const { data: trashOrders = [], isLoading: trashLoading } = useQuery<Order[]>({
        queryKey: ['trash-orders'],
        queryFn: () => ordersService.getTrashOrders(),
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
    })

    // Mutations
    const updateOrderStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
            ordersService.updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] })
        },
    })

    const moveToTrashMutation = useMutation({
        mutationFn: (orderId: string) => ordersService.moveToTrash(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] })
            queryClient.invalidateQueries({ queryKey: ['trash-orders'] })
        },
    })

    const restoreFromTrashMutation = useMutation({
        mutationFn: (orderId: string) => ordersService.restoreFromTrash(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] })
            queryClient.invalidateQueries({ queryKey: ['trash-orders'] })
        },
    })

    const deletePermanentlyMutation = useMutation({
        mutationFn: (orderId: string) => ordersService.deletePermanently(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trash-orders'] })
        },
    })

    const clearTrashMutation = useMutation({
        mutationFn: () => ordersService.clearTrash(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trash-orders'] })
        },
    })

    const cancelOrderItemMutation = useMutation({
        mutationFn: ({ orderId, productId }: { orderId: string; productId: string }) =>
            ordersService.cancelOrderItem(orderId, productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-orders'] })
        },
    })

    // Filter orders by status
    const activeOrders = allOrders.filter(order => order.status !== 'completed')
    const displayOrders = showTrash ? trashOrders : (showCompleted ? allOrders : activeOrders)
    const isLoading = showTrash ? trashLoading : allLoading

    const getElapsedTime = (createdAt: string) => {
        const created = new Date(createdAt)
        const now = new Date()
        const diff = now.getTime() - created.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)

        if (hours > 0) {
            return `${hours}h${minutes % 60}m`
        }
        return `${minutes}m`
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500'
            case 'in_kitchen': return 'bg-blue-500'
            case 'ready': return 'bg-green-500'
            case 'completed': return 'bg-gray-500'
        }
    }

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'PENDING'
            case 'in_kitchen': return 'IN KITCHEN'
            case 'ready': return 'READY'
            case 'completed': return 'COMPLETED'
        }
    }

    const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
        switch (currentStatus) {
            case 'pending': return 'in_kitchen'
            case 'in_kitchen': return 'ready'
            case 'ready': return 'completed'
            default: return null
        }
    }

    const getNextStatusLabel = (currentStatus: OrderStatus) => {
        switch (currentStatus) {
            case 'pending': return 'START'
            case 'in_kitchen': return 'READY'
            case 'ready': return 'COMPLETE'
            default: return null
        }
    }

    const getPriorityColor = (elapsedTime: string) => {
        const minutes = parseInt(elapsedTime.replace('m', '').replace('h', ''))
        if (elapsedTime.includes('h') || minutes > 30) return 'border-red-500 bg-red-50'
        if (minutes > 20) return 'border-orange-500 bg-orange-50'
        if (minutes > 10) return 'border-yellow-500 bg-yellow-50'
        return 'border-gray-300 bg-white'
    }

    const getOrderCounts = () => {
        const pending = allOrders.filter(o => o.status === 'pending').length
        const inKitchen = allOrders.filter(o => o.status === 'in_kitchen').length
        const ready = allOrders.filter(o => o.status === 'ready').length
        const completed = allOrders.filter(o => o.status === 'completed').length
        const inTrash = trashOrders.length
        return { pending, inKitchen, ready, completed, inTrash }
    }

    const counts = getOrderCounts()

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Header - Style Cuisine */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <ChefHat className="w-8 h-8 text-white" />
                        <h1 className="text-2xl font-bold text-white">KITCHEN DISPLAY</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-white">
                            <Printer className="w-5 h-5" />
                            <span className="text-sm font-medium">KITCHEN</span>
                        </div>
                        <div className="flex items-center space-x-2 text-white">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                {new Date().toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="text-gray-300 text-sm font-medium">PENDING: {counts.pending}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-300 text-sm font-medium">IN KITCHEN: {counts.inKitchen}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-gray-300 text-sm font-medium">READY: {counts.ready}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                            <span className="text-gray-300 text-sm font-medium">COMPLETED: {counts.completed}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium transition-colors ${showCompleted
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                }`}
                        >
                            {showCompleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <span>COMPLETED</span>
                        </button>
                        <button
                            onClick={() => setShowTrash(!showTrash)}
                            className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-medium transition-colors ${showTrash
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                }`}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>TRASH ({counts.inTrash})</span>
                        </button>
                        {showTrash && trashOrders.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm('Permanently empty trash? This action is irreversible.')) {
                                        clearTrashMutation.mutate()
                                    }
                                }}
                                className="bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                                EMPTY
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Kitchen Rail - Main Content */}
            <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">LOADING...</p>
                        </div>
                    </div>
                ) : displayOrders.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg font-bold">
                                {showTrash ? 'EMPTY TRASH' : 'NO ORDERS'}
                            </p>
                            <p className="text-gray-400">
                                {showTrash ? 'No orders in trash' : 'Waiting for new orders...'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex">
                        {/* Left Rail - Order Tickets */}
                        <div className="w-2/3 h-full overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {displayOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className={`relative transform transition-all duration-300 hover:scale-105 ${getPriorityColor(getElapsedTime(order.created_at))} border-2 rounded-lg shadow-lg overflow-hidden`}
                                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                                    >
                                        {/* Magnetic Top Bar */}
                                        <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-2 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Magnet className="w-4 h-4 text-gray-400" />
                                                <span className="text-white font-mono font-bold text-lg">
                                                    #{order.order_number}
                                                </span>
                                                <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span className="text-white text-sm font-medium">
                                                    {order.table_name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Ticket Content */}
                                        <div className="p-4 bg-white">
                                            {/* Header Info */}
                                            <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-gray-200">
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-500 font-bold">TIME</div>
                                                        <div className="text-lg font-bold text-gray-900">
                                                            {getElapsedTime(order.created_at)}
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-gray-500 font-bold">STATUS</div>
                                                        <div className="text-sm font-bold text-gray-900">
                                                            {getStatusLabel(order.status)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 font-bold">TOTAL</div>
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {order.total_amount.toFixed(2)}€
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Items List */}
                                            <div className="space-y-2 mb-3">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="flex items-center justify-between py-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`w-2 h-2 rounded-full ${item.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                            <span className={`font-bold text-sm ${item.status === 'cancelled' ? 'line-through text-red-500' : 'text-gray-900'}`}>
                                                                {item.quantity}x {item.product_name}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700">
                                                            {item.total_price.toFixed(2)}€
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-between pt-2 border-t-2 border-gray-200">
                                                <div className="flex space-x-2">
                                                    {!showTrash && getNextStatus(order.status) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                updateOrderStatusMutation.mutate({
                                                                    orderId: order.id,
                                                                    status: getNextStatus(order.status)!
                                                                })
                                                            }}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold flex items-center space-x-1 transition-colors"
                                                        >
                                                            <Play className="w-3 h-3" />
                                                            <span>{getNextStatusLabel(order.status)}</span>
                                                        </button>
                                                    )}
                                                    {showTrash && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                restoreFromTrashMutation.mutate(order.id)
                                                            }}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold flex items-center space-x-1 transition-colors"
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            <span>RESTORE</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    {!showTrash && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (confirm('Send this order to trash?')) {
                                                                    moveToTrashMutation.mutate(order.id)
                                                                }
                                                            }}
                                                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            <span>TRASH</span>
                                                        </button>
                                                    )}
                                                    {showTrash && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (confirm('Permanently delete this order?')) {
                                                                    deletePermanentlyMutation.mutate(order.id)
                                                                }
                                                            }}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                            <span>DELETE</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Priority Indicator */}
                                        {!showTrash && (getElapsedTime(order.created_at).includes('h') || parseInt(getElapsedTime(order.created_at)) > 20) && (
                                            <div className="absolute top-2 right-2">
                                                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel - Order Details */}
                        <div className="w-1/3 h-full bg-white border-l border-gray-300 overflow-y-auto">
                            {selectedOrder ? (
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">ORDER DETAILS</h2>
                                        <button
                                            onClick={() => setSelectedOrder(null)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {displayOrders.find(o => o.id === selectedOrder) && (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="font-bold text-gray-900 mb-2">Information</h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Number:</span>
                                                        <span className="font-bold">#{displayOrders.find(o => o.id === selectedOrder)?.order_number}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Table:</span>
                                                        <span className="font-bold">{displayOrders.find(o => o.id === selectedOrder)?.table_name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Time:</span>
                                                        <span className="font-bold">{getElapsedTime(displayOrders.find(o => o.id === selectedOrder)?.created_at || '')}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Status:</span>
                                                        <span className="font-bold">{getStatusLabel(displayOrders.find(o => o.id === selectedOrder)?.status || 'pending')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h3 className="font-bold text-gray-900 mb-2">Items</h3>
                                                <div className="space-y-2">
                                                    {displayOrders.find(o => o.id === selectedOrder)?.items.map((item, index) => (
                                                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`w-2 h-2 rounded-full ${item.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                                <span className={`text-sm ${item.status === 'cancelled' ? 'line-through text-red-500' : 'text-gray-900'}`}>
                                                                    {item.quantity}x {item.product_name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm font-bold text-gray-700">
                                                                    {item.total_price.toFixed(2)}€
                                                                </span>
                                                                {!showTrash && item.status === 'active' && displayOrders.find(o => o.id === selectedOrder)?.status !== 'completed' && (
                                                                    <button
                                                                        onClick={() => cancelOrderItemMutation.mutate({
                                                                            orderId: selectedOrder,
                                                                            productId: item.product_id
                                                                        })}
                                                                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                                                        title="Cancel this item"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-bold text-gray-900">Total</span>
                                                    <span className="text-xl font-bold text-gray-900">
                                                        {displayOrders.find(o => o.id === selectedOrder)?.total_amount.toFixed(2)}€
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-gray-500">
                                        <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p className="font-medium">Select an order</p>
                                        <p className="text-sm">to see details</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
