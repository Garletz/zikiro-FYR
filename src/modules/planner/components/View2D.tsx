import React, { useEffect, useRef, useState } from 'react'
import { cn } from '../../../shared/utils/cn'
import { getTableStatusConfig, tablePlannerIntegrationService } from '../services/tablePlannerIntegration'
import { usePlannerStore } from '../store/plannerStore'
import type { RestaurantItem } from '../types/planner'
import { isLongTable, isTableWithChairs } from '../types/planner'
import { GRID_CONFIG } from '../utils/plannerConstants'
import {
    canPlaceObject,
    gridToPixel,
    gridToPixelCorner,
    isInBounds,
    pixelToGrid
} from '../utils/plannerPositionUtils'

// Composant pour afficher les informations de la table
const TableInfoDisplay: React.FC<{ tableId: string }> = ({ tableId }) => {
    const [tableInfo, setTableInfo] = useState<{
        status: string
        capacity: number
    } | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadTableInfo = async () => {
            try {
                const tables = await tablePlannerIntegrationService.getAllTablesWithStatus()
                const table = tables.find(t => t.id === tableId)
                if (table) {
                    setTableInfo({
                        status: table.status,
                        capacity: table.capacity
                    })
                }
            } catch (error) {
                console.error('Erreur lors du chargement des informations de la table:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadTableInfo()
    }, [tableId])

    if (isLoading) {
        return (
            <div className="text-xs text-gray-500">
                Chargement...
            </div>
        )
    }

    if (!tableInfo) {
        return (
            <div className="text-xs text-gray-500">
                Informations non disponibles
            </div>
        )
    }

    const statusConfig = getTableStatusConfig(tableInfo.status)

    return (
        <div className="space-y-2 border-t border-gray-200 pt-2">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Statut:</span>
                <div className="flex items-center space-x-1">
                    <span className="text-sm">{statusConfig.icon}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Capacité:</span>
                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">
                    {tableInfo.capacity} places
                </span>
            </div>
        </div>
    )
}

const View2D: React.FC = () => {
    const {
        currentLayout,
        placingItem,
        isPlacing,
        isExpandingLine,
        lineItems,
        selectedItem,
        updatePlacingPosition,
        confirmPlacement,
        selectItem,
        updateItemPosition,
        confirmExpandingLine,
        startExpandingLine,
        cancelExpandingLine,
        cancelPlacement,
        updateExpandingLine,
        removeItem
    } = usePlannerStore()
    const [canPlace, setCanPlace] = useState(false)
    const [isDraggingItem, setIsDraggingItem] = useState(false)
    const [draggedItem, setDraggedItem] = useState<RestaurantItem | null>(null)
    const [isProcessingAction, setIsProcessingAction] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [centerX, setCenterX] = useState(0)
    const [centerY, setCenterY] = useState(0)



    // Calculer le centre du conteneur
    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setCenterX(rect.width / 2)
            setCenterY(rect.height / 2)
        }
    }, [])

    // Nettoyer les états quand on change de mode
    useEffect(() => {
        if (!isPlacing && !isDraggingItem && !isExpandingLine) {
            cleanupStates()
        }
    }, [isPlacing, isDraggingItem, isExpandingLine])

    // Gestionnaire de touches (seulement Échap)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isExpandingLine) {
                    cancelExpandingLine()
                } else if (isPlacing) {
                    cancelPlacement()
                } else if (isDraggingItem) {
                    cleanupStates()
                }

            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isExpandingLine, isPlacing, isDraggingItem, cancelExpandingLine, cancelPlacement])

    // Gestionnaire de double-clic/long press sur un objet
    const handleItemDoubleClick = (item: RestaurantItem, e: React.MouseEvent) => {
        e.stopPropagation()
        // Les tables longues ne peuvent pas être étendues
        if (isLongTable(item)) {
            return
        }
        if (!isProcessingAction && !isPlacing && !isDraggingItem) {
            startExpandingLine(item)
        }
    }

    // Fonction de nettoyage des états
    const cleanupStates = () => {
        setIsDraggingItem(false)
        setDraggedItem(null)
        setCanPlace(false)
        setIsProcessingAction(false)
    }

    // Gestionnaire de début de drag d'un objet
    const handleItemMouseDown = (item: RestaurantItem, e: React.MouseEvent) => {
        e.stopPropagation()

        if (isProcessingAction || isPlacing || isExpandingLine) return

        // Les tables longues ne peuvent pas être déplacées, mais peuvent être sélectionnées
        if (isLongTable(item)) {
            selectItem(item)
            return
        }

        selectItem(item)

        const handleMouseMoveStart = (moveEvent: MouseEvent) => {
            // Les tables longues ne peuvent pas être déplacées
            if (isLongTable(item)) {
                return
            }

            if (Math.abs(moveEvent.clientX - e.clientX) > 5 || Math.abs(moveEvent.clientY - e.clientY) > 5) {
                if (!isProcessingAction) {
                    setIsProcessingAction(true)
                    setIsDraggingItem(true)
                    setDraggedItem(item)
                }
                document.removeEventListener('mousemove', handleMouseMoveStart)
                document.removeEventListener('mouseup', handleMouseUpStart)
            }
        }

        document.addEventListener('mousemove', handleMouseMoveStart)

        const handleMouseUpStart = () => {
            document.removeEventListener('mousemove', handleMouseMoveStart)
            document.removeEventListener('mouseup', handleMouseUpStart)
        }

        document.addEventListener('mouseup', handleMouseUpStart)
    }

    // Gestionnaire de mouvement de souris pour le drag et placement
    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const gridPos = pixelToGrid(mouseX, mouseY, centerX, centerY)

        if (isPlacing && placingItem) {
            const canPlaceHere = canPlaceObject(
                gridPos,
                placingItem.size,
                currentLayout.items
            )
            setCanPlace(canPlaceHere)
            updatePlacingPosition(gridPos)
        } else if (isDraggingItem && draggedItem && isProcessingAction) {
            const otherItems = currentLayout.items.filter(otherItem => otherItem.id !== draggedItem.id)
            const canPlaceHere = canPlaceObject(
                gridPos,
                draggedItem.size,
                otherItems
            )
            setCanPlace(canPlaceHere)
            setDraggedItem({ ...draggedItem, position: gridPos })
        } else if (isExpandingLine) {
            updateExpandingLine(gridPos)
        }
    }

    // Gestionnaire de fin de drag
    const handleMouseUp = (e: React.MouseEvent) => {
        if (isDraggingItem && draggedItem && isProcessingAction) {
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top
            const gridPos = pixelToGrid(mouseX, mouseY, centerX, centerY)

            if (isInBounds(gridPos.x, gridPos.z)) {
                const otherItems = currentLayout.items.filter(otherItem => otherItem.id !== draggedItem.id)
                if (canPlaceObject(gridPos, draggedItem.size, otherItems)) {
                    updateItemPosition(draggedItem.id, gridPos)
                }
            }

            cleanupStates()
        }
    }

    // Gestionnaire de clic
    const handleClick = (e: React.MouseEvent) => {
        if (isExpandingLine) {
            confirmExpandingLine()
            return
        }

        if (!isPlacing || !placingItem || isProcessingAction) return

        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return

        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const gridPos = pixelToGrid(mouseX, mouseY, centerX, centerY)

        if (isInBounds(gridPos.x, gridPos.z)) {
            confirmPlacement()
        }
    }

    // Gestionnaire de clic sur un objet
    const handleItemClick = (item: RestaurantItem, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isProcessingAction && !isPlacing && !isExpandingLine) {
            selectItem(item)
        }
    }

    // Gestionnaire de clic droit pour annuler l'expansion
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        if (isExpandingLine) {
            cancelExpandingLine()
        }
    }

    // Fonction pour obtenir l'icône d'un objet
    const getItemIcon = (type: string, itemId?: string, metadata?: any) => {
        // Cas spécial pour les tables longues
        if (isLongTable({ id: itemId || '', type: type as any, name: '', position: { x: 0, y: 0, z: 0 }, size: { width: 1, height: 1, depth: 1 }, rotation: 0, color: '', metadata })) {
            return '🍽️'
        }

        // Cas spécial pour la table avec chaises
        if (isTableWithChairs({ id: itemId || '', type: type as any, name: '', position: { x: 0, y: 0, z: 0 }, size: { width: 1, height: 1, depth: 1 }, rotation: 0, color: '', metadata })) {
            return '🍽️'
        }

        switch (type) {
            case 'table': return '🟫'
            case 'chair': return '🪑'
            case 'bar': return '🍺'
            case 'kitchen': return '👨‍🍳'
            case 'bathroom': return '🚽'
            case 'entrance': return '🚪'
            case 'wall': return '🧱'
            case 'decoration': return '🪴'
            case 'test': return '🧪'
            default: return '📦'
        }
    }

    // Fonction pour obtenir le style spécial d'un objet
    const getItemStyle = (item: RestaurantItem) => {
        const baseStyle = {
            backgroundColor: item.color,
        }

        // Style spécial pour les tables longues
        if (isLongTable(item)) {
            return {
                ...baseStyle,
                background: `linear-gradient(45deg, #A0522D 0%, ${item.color} 50%, #8B4513 100%)`,
                border: '2px solid #654321',
                boxShadow: 'inset 0 0 15px rgba(0,0,0,0.4)',
            }
        }

        // Style spécial pour la table avec chaises
        if (isTableWithChairs(item)) {
            return {
                ...baseStyle,
                background: `radial-gradient(circle at 30% 30%, #A0522D 0%, ${item.color} 70%)`,
                border: '2px solid #654321',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
            }
        }

        return baseStyle
    }

    return (
        <div className="relative w-full h-full bg-white overflow-hidden border-0">
            <div
                ref={containerRef}
                className="relative w-full h-full border-0"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
          `,
                    backgroundSize: `${GRID_CONFIG.CELL_SIZE}px ${GRID_CONFIG.CELL_SIZE}px`,
                    backgroundPosition: `${centerX}px ${centerY}px`
                }}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                onMouseUp={handleMouseUp}
                onContextMenu={handleContextMenu}
            >
                {/* Cage de délimitation 2D - alignée sur les limites exactes de la zone valide */}
                <div
                    className="absolute border-2 border-gray-400 border-dashed pointer-events-none"
                    style={{
                        left: `${centerX - 400}px`,
                        top: `${centerY - 280}px`,
                        width: `800px`,
                        height: `600px`,
                        opacity: 0.6
                    }}
                />

                {/* Objets placés */}
                {currentLayout.items.map((item) => {
                    if (isDraggingItem && draggedItem?.id === item.id) {
                        return null
                    }

                    const centerPos = gridToPixel(item.position.x, item.position.z, centerX, centerY)
                    const objectWidth = item.size.width * GRID_CONFIG.CELL_SIZE
                    const objectHeight = item.size.depth * GRID_CONFIG.CELL_SIZE

                    // Pour les tables longues, commencer à la position de départ, pas centrer
                    let left, top
                    if (isLongTable(item)) {
                        // La position est déjà calculée correctement dans le store
                        const startPos = gridToPixelCorner(item.position.x, item.position.z, centerX, centerY)
                        left = startPos.x
                        top = startPos.y
                    } else {
                        // Pour les autres objets, centrer normalement
                        left = centerPos.x - objectWidth / 2
                        top = centerPos.y - objectHeight / 2
                    }

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                'absolute cursor-pointer transition-all duration-200 select-none',
                                selectedItem?.id === item.id && 'ring-2 ring-blue-500 ring-offset-2',
                                isLongTable(item) && 'cursor-default'
                            )}
                            style={{
                                left: `${left}px`,
                                top: `${top}px`,
                                width: `${objectWidth}px`,
                                height: `${objectHeight}px`,
                                ...getItemStyle(item)
                            }}
                            onClick={(e) => handleItemClick(item, e)}
                            onMouseDown={(e) => handleItemMouseDown(item, e)}
                            onDoubleClick={(e) => handleItemDoubleClick(item, e)}
                        >
                            <div className="flex items-center justify-center w-full h-full text-white text-xs font-bold">
                                {getItemIcon(item.type, item.id, item.metadata || undefined)}
                            </div>
                        </div>
                    )
                })}

                {/* Objets temporaires de ligne */}
                {isExpandingLine && lineItems.map((item) => {
                    const centerPos = gridToPixel(item.position.x, item.position.z, centerX, centerY)
                    const objectWidth = item.size.width * GRID_CONFIG.CELL_SIZE
                    const objectHeight = item.size.depth * GRID_CONFIG.CELL_SIZE

                    return (
                        <div
                            key={item.id}
                            className="absolute cursor-pointer transition-all duration-200 select-none opacity-70"
                            style={{
                                left: `${centerPos.x - objectWidth / 2}px`,
                                top: `${centerPos.y - objectHeight / 2}px`,
                                width: `${objectWidth}px`,
                                height: `${objectHeight}px`,
                                backgroundColor: item.color,
                                border: '2px dashed #666'
                            }}
                        >
                            <div className="flex items-center justify-center w-full h-full text-white text-xs font-bold">
                                {getItemIcon(item.type, item.id, item.metadata || undefined)}
                            </div>
                        </div>
                    )
                })}

                {/* Objet en cours de placement */}
                {isPlacing && placingItem && (
                    <div
                        className={cn(
                            'absolute cursor-pointer transition-all duration-200 select-none',
                            canPlace ? 'opacity-100' : 'opacity-50'
                        )}
                        style={{
                            left: `${gridToPixel(placingItem.position.x, placingItem.position.z, centerX, centerY).x - (placingItem.size.width * GRID_CONFIG.CELL_SIZE) / 2}px`,
                            top: `${gridToPixel(placingItem.position.x, placingItem.position.z, centerX, centerY).y - (placingItem.size.depth * GRID_CONFIG.CELL_SIZE) / 2}px`,
                            width: `${placingItem.size.width * GRID_CONFIG.CELL_SIZE}px`,
                            height: `${placingItem.size.depth * GRID_CONFIG.CELL_SIZE}px`,
                            backgroundColor: placingItem.color,
                            border: canPlace ? '2px solid #10B981' : '2px dashed #EF4444'
                        }}
                    >
                        <div className="flex items-center justify-center w-full h-full text-white text-xs font-bold">
                            {getItemIcon(placingItem.type, placingItem.id, placingItem.metadata || undefined)}
                        </div>
                    </div>
                )}

                {/* Objet en cours de drag */}
                {isDraggingItem && draggedItem && (
                    <div
                        className={cn(
                            'absolute cursor-pointer transition-all duration-200 select-none',
                            canPlace ? 'opacity-100' : 'opacity-50'
                        )}
                        style={{
                            left: `${gridToPixel(draggedItem.position.x, draggedItem.position.z, centerX, centerY).x - (draggedItem.size.width * GRID_CONFIG.CELL_SIZE) / 2}px`,
                            top: `${gridToPixel(draggedItem.position.x, draggedItem.position.z, centerX, centerY).y - (draggedItem.size.depth * GRID_CONFIG.CELL_SIZE) / 2}px`,
                            width: `${draggedItem.size.width * GRID_CONFIG.CELL_SIZE}px`,
                            height: `${draggedItem.size.depth * GRID_CONFIG.CELL_SIZE}px`,
                            backgroundColor: draggedItem.color,
                            border: canPlace ? '2px solid #10B981' : '2px dashed #EF4444'
                        }}
                    >
                        <div className="flex items-center justify-center w-full h-full text-white text-xs font-bold">
                            {getItemIcon(draggedItem.type, draggedItem.id, draggedItem.metadata || undefined)}
                        </div>
                    </div>
                )}


            </div>

            {/* Indicateurs d'état */}
            {isExpandingLine && (
                <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm">
                    Extension en cours - Cliquez pour confirmer, Clic droit pour annuler
                </div>
            )}

            {isPlacing && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm">
                    Placement en cours - Cliquez pour placer, Échap pour annuler
                </div>
            )}

            {/* Actions pour l'objet sélectionné */}
            {selectedItem && (
                <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg min-w-48">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                        {selectedItem.name}
                    </div>

                    {/* Informations de la table si c'est une table restaurant */}
                    {selectedItem.metadata?.isRestaurantTable && selectedItem.metadata?.tableId && (
                        <TableInfoDisplay tableId={selectedItem.metadata.tableId} />
                    )}

                    <div className="space-y-2 mt-3">
                        <button
                            onClick={() => removeItem(selectedItem.id)}
                            className="w-full px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                            Supprimer
                        </button>
                        {isLongTable(selectedItem) && (
                            <div className="text-xs text-gray-500">
                                Table longue fusionnée
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default View2D
