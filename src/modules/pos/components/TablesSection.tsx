import { Receipt, Table as TableIcon } from 'lucide-react'
import { TableData } from '../types'
import TableCard from './TableCard'

interface TablesSectionProps {
    tables: TableData[]
    selectedTable: TableData | null
    onTableSelect: (table: TableData | null) => void
    compact?: boolean
}

export default function TablesSection({
    tables,
    selectedTable,
    onTableSelect,
}: TablesSectionProps) {
    const padding = 'p-2 lg:p-3'

    const statusConfig = {
        free: {
            status: 'free' as const,
            label: 'Free',
            color: 'bg-green-100 border-green-300 text-green-800',
            icon: TableIcon
        },
        occupied: {
            status: 'occupied' as const,
            label: 'Occupied',
            color: 'bg-orange-100 border-orange-300 text-orange-800',
            icon: TableIcon
        },
        reserved: {
            status: 'reserved' as const,
            label: 'Reserved',
            color: 'bg-red-100 border-red-300 text-red-800',
            icon: TableIcon
        },
        cleaning: {
            status: 'cleaning' as const,
            label: 'Cleaning',
            color: 'bg-blue-100 border-blue-300 text-blue-800',
            icon: TableIcon
        }
    }

    return (
        <div className={`bg-white ${padding} flex-shrink-0 h-full w-full`}>
            {/* Direct sale button - more compact */}
            <div className="mb-2">
                <button
                    onClick={() => onTableSelect(null)}
                    className={`inline-flex items-center p-1.5 rounded-lg border-2 transition-all duration-200 ${!selectedTable
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                        }`}
                >
                    <Receipt className="w-4 h-4 mr-1.5" />
                    <span className="font-medium text-xs">
                        Direct sale
                    </span>
                </button>
            </div>

            {/* Tables Grid - ISOLATED HORIZONTAL SCROLLING */}
            <div className="overflow-x-auto w-full">
                <div className="flex space-x-3 lg:space-x-4 max-w-4xl" style={{ width: 'max-content' }}>
                    {tables.map((table: TableData) => (
                        <TableCard
                            key={table.id}
                            table={table}
                            isSelected={selectedTable?.id === table.id}
                            onSelect={onTableSelect}
                            statusConfig={statusConfig}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
