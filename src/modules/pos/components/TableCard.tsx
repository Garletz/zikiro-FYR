import { TableData, TableStatus } from '../types'

interface TableCardProps {
  table: TableData
  isSelected: boolean
  onSelect: (table: TableData) => void
  statusConfig: { [key: string]: TableStatus }
}

export default function TableCard({
  table,
  isSelected,
  onSelect,
  statusConfig
}: TableCardProps) {
  const status = statusConfig[table.status]
  const StatusIcon = status.icon
  const padding = 'p-2 lg:p-3'
  const textSize = 'text-lg'
  const iconSize = 'w-3 h-3'
  const badgeText = 'text-xs'

  return (
    <button
      onClick={() => onSelect(table)}
      className={`${padding} rounded-xl border-2 transition-all duration-200 flex-shrink-0 ${isSelected
        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:shadow-md'
        }`}
    >
      <div className="text-center">
        <div className={`${textSize} font-bold text-gray-800 mb-0.5`}>
          {table.number}
        </div>
        <div className="flex items-center justify-center mb-1.5">
          <StatusIcon className={`${iconSize} mr-1`} />
          <span className={`${badgeText} font-medium px-1.5 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className={`${badgeText} text-gray-500`}>
          {table.capacity} seats
        </div>
      </div>
    </button>
  )
}
