import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { useState } from 'react'
import { ReservationStatus, ReservationWithTable } from '../types/reservation'

interface ReservationsCalendarProps {
    selectedDate: Date
    onDateChange: (date: Date) => void
    reservations: ReservationWithTable[]
    onReservationClick: (reservation: ReservationWithTable) => void
    onReservationStatusChange: (reservationId: string, status: ReservationStatus) => void
}

export default function ReservationsCalendar({
    selectedDate,
    onDateChange,
    reservations,
    onReservationClick,
    onReservationStatusChange
}: ReservationsCalendarProps) {
    const [isLoading] = useState(false)
    const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'all'>('all')

    const filteredReservations = reservations.filter(reservation =>
        filterStatus === 'all' || reservation.status === filterStatus
    )

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        onDateChange(newDate)
    }

    const goToToday = () => {
        onDateChange(new Date())
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getStatusIcon = (status: ReservationStatus) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="w-4 h-4 text-blue-500" />
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-500" />
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'no_show':
                return <AlertCircle className="w-4 h-4 text-orange-500" />
            case 'arrived':
                return <CheckCircle className="w-4 h-4 text-purple-500" />
        }
    }

    const getStatusColor = (status: ReservationStatus) => {
        switch (status) {
            case 'confirmed':
                return 'bg-blue-100 border-blue-200 text-blue-800'
            case 'cancelled':
                return 'bg-red-100 border-red-200 text-red-800'
            case 'completed':
                return 'bg-green-100 border-green-200 text-green-800'
            case 'no_show':
                return 'bg-orange-100 border-orange-200 text-orange-800'
            case 'arrived':
                return 'bg-purple-100 border-purple-200 text-purple-800'
        }
    }

    const getStatusLabel = (status: ReservationStatus) => {
        switch (status) {
            case 'confirmed':
                return 'Confirmed'
            case 'cancelled':
                return 'Cancelled'
            case 'completed':
                return 'Completed'
            case 'no_show':
                return 'No Show'
            case 'arrived':
                return 'Arrived'
        }
    }


    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Navigation compacte */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => navigateDate('prev')}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="text-sm font-medium text-gray-900">
                            {formatDate(selectedDate)}
                        </span>
                        <button
                            onClick={() => navigateDate('next')}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                    <button
                        onClick={goToToday}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                        Today
                    </button>
                </div>

                {/* Filtres de statut compacts */}
                <div className="mt-2 flex space-x-1">
                    {(['all', 'confirmed', 'completed', 'no_show', 'arrived'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filterStatus === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {status === 'all' ? 'All' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Liste des réservations */}
            <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredReservations.length === 0 ? (
                    <div className="text-center py-12">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Reservations</h4>
                        <p className="text-gray-500">
                            {filterStatus === 'all'
                                ? 'No reservations for this date'
                                : `No ${getStatusLabel(filterStatus).toLowerCase()} reservations for this date`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredReservations.map((reservation) => (
                            <div
                                key={reservation.id}
                                className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onReservationClick(reservation)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        {/* Ligne compacte avec toutes les infos */}
                                        <div className="flex items-center space-x-3">
                                            {getStatusIcon(reservation.status)}
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                                                {getStatusLabel(reservation.status)}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {reservation.reservation_time}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {reservation.customer_name}
                                            </span>
                                            <div className="flex items-center space-x-3 text-xs text-gray-600">
                                                <span>{reservation.party_size}p</span>
                                                <span>T{reservation.table_number}</span>
                                                {reservation.customer_phone && (
                                                    <span>{reservation.customer_phone}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions rapides compactes */}
                                    <div className="flex space-x-1 ml-3">
                                        {reservation.status === 'confirmed' && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onReservationStatusChange(reservation.id, 'arrived')
                                                    }}
                                                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                                                >
                                                    Arrived
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onReservationStatusChange(reservation.id, 'cancelled')
                                                    }}
                                                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}

                                        {reservation.status === 'completed' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onReservationStatusChange(reservation.id, 'no_show')
                                                }}
                                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors"
                                            >
                                                No Show
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer avec statistiques */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                        {filteredReservations.length} reservation{filteredReservations.length > 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Confirmed: {reservations.filter(r => r.status === 'confirmed').length}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Completed: {reservations.filter(r => r.status === 'completed').length}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
