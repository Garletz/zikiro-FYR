import { AlertCircle, CheckCircle, Clock, Receipt, Table as TableIcon, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { reservationService } from '../../tables/services/reservationService'
import { TableData } from '../types'
import ModernTableCard from './ModernTableCard'

interface ModernTablesSectionProps {
    tables: TableData[]
    selectedTable: TableData | null
    onTableSelect: (table: TableData | null) => void
}

export default function ModernTablesSection({
    tables,
    selectedTable,
    onTableSelect
}: ModernTablesSectionProps) {
    const [reservations, setReservations] = useState<Map<string, string>>(new Map())

    // Récupérer les réservations du jour
    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const today = new Date().toISOString().split('T')[0]
                const todayReservations = await reservationService.getReservationsWithTableInfo(today)

                // Créer une map table_id -> heure de réservation
                const reservationMap = new Map<string, string>()
                todayReservations
                    .filter(reservation => reservation.status === 'confirmed' && reservation.table_id)
                    .forEach(reservation => {
                        // Formater l'heure (ex: "19:00")
                        const time = reservation.reservation_time.substring(0, 5)
                        reservationMap.set(reservation.table_id, time)
                    })

                setReservations(reservationMap)
            } catch (error) {
                console.error('Error fetching reservations:', error)
            }
        }

        fetchReservations()
    }, [])
    const statusConfig = {
        free: {
            label: 'Free',
            color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
            icon: CheckCircle,
            bgColor: 'from-emerald-50 to-emerald-100'
        },
        occupied: {
            label: 'Occupied',
            color: 'bg-orange-100 border-orange-300 text-orange-800',
            icon: Users,
            bgColor: 'from-orange-50 to-orange-100'
        },
        reserved: {
            label: 'Reserved',
            color: 'bg-violet-100 border-violet-300 text-violet-800',
            icon: Clock,
            bgColor: 'from-violet-50 to-violet-100'
        },
        cleaning: {
            label: 'Cleaning',
            color: 'bg-blue-100 border-blue-300 text-blue-800',
            icon: AlertCircle,
            bgColor: 'from-blue-50 to-blue-100'
        }
    }


    return (
        <div className="h-full w-full bg-slate-800 flex flex-col min-h-0">
            {/* Compact Header */}
            <div className="px-4 py-2 border-b border-slate-700 bg-slate-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <TableIcon className="w-4 h-4 text-slate-300" />
                        <h2 className="text-sm font-semibold text-white">Tables</h2>
                    </div>

                    {/* Direct Sale Button */}
                    <button
                        onClick={() => onTableSelect(null)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${!selectedTable
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        <Receipt className="w-3 h-3" />
                        <span>Direct Sale</span>
                    </button>
                </div>
            </div>

            {/* Tables Grid - Horizontal Scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 min-h-0 scrollbar-hide">
                {tables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                        <TableIcon className="w-6 h-6 text-slate-500 mb-1" />
                        <p className="text-xs text-slate-500">No tables configured</p>
                    </div>
                ) : (
                    <div className="flex gap-3 min-w-max items-center">
                        {tables.map((table: TableData) => (
                            <ModernTableCard
                                key={table.id}
                                table={table}
                                isSelected={selectedTable?.id === table.id}
                                onSelect={onTableSelect}
                                statusConfig={statusConfig}
                                reservationTime={reservations.get(table.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
