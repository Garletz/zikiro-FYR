import { TableData } from '../types'

interface ModernTableCardProps {
    table: TableData
    isSelected: boolean
    onSelect: (table: TableData | null) => void
    statusConfig: any
    reservationTime?: string
}

export default function ModernTableCard({
    table,
    isSelected,
    onSelect,
    statusConfig,
    reservationTime
}: ModernTableCardProps) {
    const config = statusConfig[table.status] || statusConfig.free

    return (
        <div
            className={`relative bg-slate-700 rounded-lg border-2 p-2 cursor-pointer transition-all duration-200 transform hover:scale-105 w-24 h-24 flex flex-col items-center justify-between ${isSelected
                ? 'border-emerald-500 bg-emerald-600'
                : 'border-slate-600 hover:border-slate-500'
                }`}
            onClick={() => onSelect(table)}
        >
            {/* Top Row - Capacity */}
            <div className="flex items-center justify-end w-full">
                {/* Capacity */}
                {table.capacity && (
                    <div className="text-xs text-slate-300 font-medium">
                        {table.capacity}
                    </div>
                )}
            </div>

            {/* Center - Table Number */}
            <h3 className="font-bold text-white text-lg">
                {table.number}
            </h3>

            {/* Bottom Row - Status and Reservation Time */}
            <div className="flex flex-col items-center space-y-1">
                {/* Status */}
                <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${table.status === 'free' ? 'bg-emerald-500 text-white' :
                    table.status === 'occupied' ? 'bg-orange-500 text-white' :
                        table.status === 'reserved' ? 'bg-violet-500 text-white' :
                            'bg-blue-500 text-white'
                    }`}>
                    {config.label}
                </div>

                {/* Reservation Time */}
                {table.status === 'reserved' && reservationTime && (
                    <div className="text-xs text-violet-300 font-medium">
                        {reservationTime}
                    </div>
                )}
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-lg pointer-events-none">
                    <div className="absolute top-1 left-1 w-2 h-2 bg-emerald-400 rounded-full"></div>
                </div>
            )}
        </div>
    )
}
