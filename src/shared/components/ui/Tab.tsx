import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircle, GripVertical, X } from 'lucide-react'
import { Tab as TabType } from '../../types/app'

interface TabProps {
    tab: TabType
    isActive: boolean
    onSwitch: () => void
    onClose: () => void
}

export default function Tab({ tab, isActive, onSwitch, onClose }: TabProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tab.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
        group flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 cursor-pointer
        transition-all duration-200 min-w-0 flex-shrink-0
        ${isActive
                    ? 'bg-white border-primary-500 text-primary-700 shadow-sm'
                    : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }
        ${isDragging ? 'opacity-30 scale-95 shadow-lg' : ''}
      `}
            onClick={onSwitch}
        >
            {/* Handle de drag & drop */}
            <div
                {...attributes}
                {...listeners}
                className={`
          flex-shrink-0 cursor-grab active:cursor-grabbing p-1 rounded transition-colors
          ${isDragging ? 'bg-gray-200' : 'hover:bg-gray-200'}
        `}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical size={14} className="text-gray-400" />
            </div>

            {/* Icône d'erreur */}
            {tab.error && (
                <div title={tab.error}>
                    <AlertCircle
                        size={16}
                        className="text-danger-500 flex-shrink-0"
                    />
                </div>
            )}

            {/* Titre */}
            <span className="truncate font-medium text-sm">
                {tab.title}
            </span>

            {/* Bouton fermer */}
            {tab.canClose && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                    }}
                    className={`
            p-1 rounded-full transition-all duration-200 flex-shrink-0
            ${isActive
                            ? 'hover:bg-primary-100 text-primary-600'
                            : 'hover:bg-gray-300 text-gray-500'
                        }
            opacity-0 group-hover:opacity-100
          `}
                    title="Fermer l'onglet"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    )
}
