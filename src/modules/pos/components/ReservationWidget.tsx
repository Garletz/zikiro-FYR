import { AlertCircle, Calendar, CheckCircle, Clock, MoreVertical, Phone, Users, XCircle } from 'lucide-react'
import { useState } from 'react'
import { ReservationStatus } from '../../tables/types/reservation'
import { ReservationEvent } from '../types/timeline'

interface ReservationWidgetProps {
    reservation: ReservationEvent
    priority: 'low' | 'medium' | 'high' | 'urgent'
    onConfirmArrival: (reservationId: string) => void
    onModifyReservation: (reservation: ReservationEvent) => void
    onStatusChange: (reservationId: string, status: ReservationStatus) => void
    compact?: boolean
}

export default function ReservationWidget({
    reservation,
    priority,
    onConfirmArrival,
    onModifyReservation,
    onStatusChange,
    compact = false
}: ReservationWidgetProps) {
    const [showActions, setShowActions] = useState(false)

    const getPriorityColor = () => {
        switch (priority) {
            case 'urgent':
                return 'bg-orange-100 border-orange-300 text-orange-800'
            case 'high':
                return 'bg-blue-100 border-blue-300 text-blue-800'
            case 'medium':
                return 'bg-gray-100 border-gray-300 text-gray-800'
            case 'low':
                return 'bg-green-100 border-green-300 text-green-800'
        }
    }

    const getTableNumber = () => {
        // Priorité 1: table_number (maintenant disponible grâce à getReservationsWithTableInfo)
        if (reservation.table_number) {
            return reservation.table_number
        }
        // Priorité 2: Essayer d'extraire le numéro de l'ID
        if (reservation.table_id) {
            const match = reservation.table_id.match(/(\d+)/)
            return match ? match[1] : reservation.table_id.substring(0, 8)
        }
        return 'Unknown'
    }

    const getStatusText = () => {
        if (reservation.isOverdue) {
            return `OVERDUE`
        }

        if (reservation.minutesUntil < 15) {
            return `ARRIVING IN ${reservation.minutesUntil}min`
        }

        if (reservation.minutesUntil < 60) {
            return `ARRIVING IN ${reservation.minutesUntil}min`
        }

        return `RESERVED FOR ${reservation.reservation_time}`
    }

    const getStatusIcon = () => {
        if (reservation.isOverdue) {
            return <AlertCircle className="w-4 h-4 text-red-500" />
        }

        if (reservation.minutesUntil < 15) {
            return <AlertCircle className="w-4 h-4 text-orange-500 animate-pulse" />
        }

        if (reservation.minutesUntil < 60) {
            return <Clock className="w-4 h-4 text-blue-500" />
        }

        return <Calendar className="w-4 h-4 text-gray-500" />
    }

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':')
        return `${hours}:${minutes}`
    }

    const handleQuickAction = (action: string) => {
        setShowActions(false)

        switch (action) {
            case 'confirm':
                onConfirmArrival(reservation.id)
                break
            case 'modify':
                onModifyReservation(reservation)
                break
            case 'cancel':
                onStatusChange(reservation.id, 'cancelled')
                break
            case 'no_show':
                onStatusChange(reservation.id, 'no_show')
                break
        }
    }

    if (compact) {
        return (
            <div className={`rounded-lg border-2 p-3 mb-3 ${getPriorityColor()}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {getStatusIcon()}
                        <span className="font-semibold text-sm">{getStatusText()}</span>
                    </div>
                    <span className="text-xs opacity-75">
                        {formatTime(reservation.reservation_time)}
                    </span>
                </div>

                <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Table {getTableNumber()}</span>
                        <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                            {reservation.party_size} people
                        </span>
                    </div>

                    <div className="text-sm">
                        <span className="font-medium">{reservation.customer_name}</span>
                        {reservation.customer_phone && (
                            <span className="text-xs opacity-75 ml-2">
                                {reservation.customer_phone}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`rounded-xl border-2 p-4 mb-4 ${getPriorityColor()} relative`}>
            {/* En-tête avec statut et actions */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    {getStatusIcon()}
                    <span className="font-semibold text-sm">{getStatusText()}</span>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm opacity-75">
                        {formatTime(reservation.reservation_time)}
                    </span>

                    <div className="relative">
                        <button
                            onClick={() => setShowActions(!showActions)}
                            className="p-1 rounded-full hover:bg-white hover:bg-opacity-50 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showActions && (
                            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                                <button
                                    onClick={() => handleQuickAction('confirm')}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Confirmer arrivée</span>
                                </button>
                                <button
                                    onClick={() => handleQuickAction('modify')}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <span>Modifier</span>
                                </button>
                                <button
                                    onClick={() => handleQuickAction('cancel')}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span>Annuler</span>
                                </button>
                                <button
                                    onClick={() => handleQuickAction('no_show')}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                                >
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    <span>Marquer absent</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Informations détaillées */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Table {getTableNumber()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{reservation.party_size} people</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="text-sm font-medium">
                        {reservation.customer_name}
                    </div>

                    {reservation.customer_phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{reservation.customer_phone}</span>
                        </div>
                    )}
                </div>

                {reservation.special_requests && (
                    <div className="text-sm italic opacity-75 bg-white bg-opacity-50 p-2 rounded-lg">
                        "{reservation.special_requests}"
                    </div>
                )}
            </div>

            {/* Actions rapides */}
            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => handleQuickAction('confirm')}
                    className="flex-1 px-3 py-2 bg-white bg-opacity-50 rounded-lg hover:bg-opacity-75 transition-colors text-sm font-medium"
                >
                    Confirmer arrivée
                </button>
                <button
                    onClick={() => handleQuickAction('modify')}
                    className="flex-1 px-3 py-2 bg-white bg-opacity-50 rounded-lg hover:bg-opacity-75 transition-colors text-sm font-medium"
                >
                    Modifier
                </button>
            </div>
        </div>
    )
}
