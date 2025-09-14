import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import { useState } from 'react'
import { useApp } from '../../contexts/AppContext'
import Tab from '../ui/Tab'
import TabContent from './TabContent'

export default function TabManager() {
    const { tabs, activeTabId, switchTab, closeTab, setTabError, reorderTabs } = useApp()
    const [activeId, setActiveId] = useState<string | null>(null)

    // Sensor configuration for drag & drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum distance before drag activation
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Handle drag start
    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    // Handle drag & drop end
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null)
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = tabs.findIndex(tab => tab.id === active.id)
            const newIndex = tabs.findIndex(tab => tab.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                reorderTabs(oldIndex, newIndex)
            }
        }
    }

    // Trouver l'onglet actif pour l'overlay
    const activeTab = activeId ? tabs.find(tab => tab.id === activeId) : null

    if (tabs.length === 0) {
        return null
    }

    return (
        <div className="flex flex-col h-full">
            {/* Barre d'onglets avec drag & drop */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToHorizontalAxis]} // Contrainte horizontale
            >
                <div className="flex items-center bg-gray-50 border-b border-gray-200 px-4 overflow-x-auto">
                    <SortableContext
                        items={tabs.map(tab => tab.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.id}
                                tab={tab}
                                isActive={tab.id === activeTabId}
                                onSwitch={() => switchTab(tab.id)}
                                onClose={() => closeTab(tab.id)}
                            />
                        ))}
                    </SortableContext>
                </div>

                {/* Overlay pendant le drag */}
                <DragOverlay>
                    {activeTab ? (
                        <div className="bg-white border border-gray-300 rounded-t-lg shadow-lg opacity-90">
                            <div className="flex items-center gap-2 px-4 py-2">
                                <div className="flex-shrink-0 p-1">
                                    <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                                </div>
                                <span className="truncate font-medium text-sm text-gray-700">
                                    {activeTab.title}
                                </span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Contenu des onglets - Seul l'onglet actif est rendu */}
            <div className="flex-1 bg-white overflow-auto relative">
                {activeTabId ? (
                    <TabContent
                        key={activeTabId}
                        tab={tabs.find(tab => tab.id === activeTabId)}
                        isActive={true}
                        onError={(error) => setTabError(activeTabId, error.message)}
                    />
                ) : (
                    // Fallback vers le dashboard si aucun onglet actif
                    <TabContent
                        key="dashboard"
                        tab={{ id: 'dashboard', moduleId: 'dashboard' }}
                        isActive={true}
                        onError={(error) => setTabError('dashboard', error.message)}
                    />
                )}
            </div>
        </div>
    )
}
