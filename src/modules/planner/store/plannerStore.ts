import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import * as plannerService from '../services/plannerService'
import type {
    CatalogItem,
    Position,
    RestaurantItem,
    RestaurantLayout,
    TableDirection,
    ViewMode
} from '../types/planner'
import {
    isLongTable,
    isTableWithChairs,
    isValidPosition,
    isValidSize
} from '../types/planner'
import {
    calculateLinePositions,
    calculateLongTableLength,
    calculateLongTableStartPosition,
    canPlaceObject,
    createLongTable,
    normalizePosition
} from '../utils/plannerPositionUtils'

interface RestaurantStore {
    currentLayout: RestaurantLayout
    selectedItem: RestaurantItem | null
    viewMode: ViewMode
    placingItem: RestaurantItem | null
    isPlacing: boolean
    isExpandingLine: boolean
    expandingItem: RestaurantItem | null
    lineItems: RestaurantItem[]
    lineDirection: 'horizontal' | 'vertical' | null

    // Loading states
    isLoading: boolean
    error: string | null

    setViewMode: (mode: ViewMode) => void
    selectItem: (item: RestaurantItem | null) => void
    addItem: (item: RestaurantItem) => void
    removeItem: (itemId: string) => void
    updateItemPosition: (itemId: string, position: Position) => void
    updateItemRotation: (itemId: string, rotation: number) => void
    startPlacing: (catalogItem: CatalogItem) => void
    updatePlacingPosition: (position: Position) => void
    confirmPlacement: () => void
    cancelPlacement: () => void
    startExpandingLine: (item: RestaurantItem) => void
    updateExpandingLine: (currentPosition: Position) => void
    confirmExpandingLine: () => void
    cancelExpandingLine: () => void
    saveLayout: (name: string) => Promise<void>
    loadLayout: (layout: RestaurantLayout) => void
    resetLayout: () => void

    // Database operations
    loadLayoutFromDatabase: (layoutId: string) => Promise<void>
    createNewLayout: (name?: string) => Promise<void>
    loadCatalogItems: () => Promise<void>
    saveItemToDatabase: (item: RestaurantItem) => Promise<void>
    updateItemInDatabase: (item: RestaurantItem) => Promise<void>
    deleteItemFromDatabase: (itemId: string) => Promise<void>
    loadDefaultLayout: () => Promise<void>
    getLayouts: () => Promise<RestaurantLayout[]>
    updateLayoutName: (layoutId: string, newName: string) => Promise<void>
    deleteLayout: (layoutId: string) => Promise<void>

    // Utility
    clearError: () => void
}

const DEFAULT_ROOM_SIZE = { width: 20, height: 3, depth: 15 }
const DEFAULT_LAYOUT: RestaurantLayout = {
    id: '1',
    name: 'Nouveau Restaurant',
    items: [],
    roomSize: DEFAULT_ROOM_SIZE,
    createdAt: new Date(),
    updatedAt: new Date(),
}

const createRestaurantItem = (catalogItem: CatalogItem, position: Position): RestaurantItem => ({
    id: `${catalogItem.id}-${Date.now()}`,
    type: catalogItem.type,
    name: catalogItem.name,
    position: normalizePosition(position),
    size: catalogItem.size,
    rotation: 0,
    color: catalogItem.color,
    metadata: {
        catalogItemId: catalogItem.id,
        originalId: `${catalogItem.id}-${Date.now()}`,
        ...catalogItem.metadata
    }
})

const updateLayoutItems = (
    layout: RestaurantLayout,
    updater: (items: RestaurantItem[]) => RestaurantItem[]
): RestaurantLayout => ({
    ...layout,
    items: updater(layout.items),
    updatedAt: new Date(),
})

const usePlannerStore = create<RestaurantStore>()(
    devtools(
        (set, get) => ({
            currentLayout: DEFAULT_LAYOUT,
            selectedItem: null,
            viewMode: '3D',
            placingItem: null,
            isPlacing: false,
            isExpandingLine: false,
            expandingItem: null,
            lineItems: [],
            lineDirection: null,
            isLoading: false,
            error: null,

            setViewMode: (mode) => set({ viewMode: mode }),
            selectItem: (item) => set({ selectedItem: item }),

            addItem: (item) => set((state) => {
                // Validation des données
                if (!isValidPosition(item.position) || !isValidSize(item.size)) {
                    console.error('Invalid item data:', item);
                    return state;
                }

                const newState = {
                    currentLayout: updateLayoutItems(state.currentLayout, (items) => [...items, item]),
                }

                // Auto-save to database avec gestion d'erreur
                setTimeout(async () => {
                    try {
                        await get().saveItemToDatabase(item)
                    } catch (error) {
                        console.error('Auto-save failed:', error);
                        set({ error: 'Erreur de sauvegarde automatique' });
                    }
                }, 0)

                return newState
            }),

            removeItem: (itemId) => set((state) => {
                const newState = {
                    currentLayout: updateLayoutItems(state.currentLayout, (items) =>
                        items.filter((item) => item.id !== itemId)
                    ),
                    selectedItem: state.selectedItem?.id === itemId ? null : state.selectedItem,
                }

                // Auto-delete from database avec gestion d'erreur
                setTimeout(async () => {
                    try {
                        await get().deleteItemFromDatabase(itemId)
                    } catch (error) {
                        console.error('Auto-delete failed:', error);
                        set({ error: 'Erreur de suppression automatique' });
                    }
                }, 0)

                return newState
            }),

            updateItemPosition: (itemId, position) => set((state) => {
                const item = state.currentLayout.items.find(item => item.id === itemId)
                if (!item) return state

                // Les tables longues ne peuvent pas être déplacées
                if (isLongTable(item)) {
                    return state
                }

                // Validation de la position
                if (!isValidPosition(position)) {
                    console.error('Invalid position:', position);
                    return state;
                }

                const otherItems = state.currentLayout.items.filter(item => item.id !== itemId)

                if (canPlaceObject(position, item.size, otherItems)) {
                    const updatedItem = { ...item, position: normalizePosition(position) }
                    const newState = {
                        currentLayout: updateLayoutItems(state.currentLayout, (items) =>
                            items.map((item) =>
                                item.id === itemId ? updatedItem : item
                            )
                        ),
                    }

                    // Auto-save to database avec gestion d'erreur
                    setTimeout(async () => {
                        try {
                            await get().updateItemInDatabase(updatedItem)
                        } catch (error) {
                            console.error('Auto-save position failed:', error);
                            set({ error: 'Erreur de sauvegarde de position' });
                        }
                    }, 0)

                    return newState
                }
                return state
            }),

            updateItemRotation: (itemId, rotation) => set((state) => {
                const updatedItem = state.currentLayout.items.find(item => item.id === itemId)
                if (!updatedItem) return state

                const newItem = { ...updatedItem, rotation: Math.round(rotation * 100) / 100 }
                const newState = {
                    currentLayout: updateLayoutItems(state.currentLayout, (items) =>
                        items.map((item) =>
                            item.id === itemId ? newItem : item
                        )
                    ),
                }

                // Auto-save to database avec gestion d'erreur
                setTimeout(async () => {
                    try {
                        await get().updateItemInDatabase(newItem)
                    } catch (error) {
                        console.error('Auto-save rotation failed:', error);
                        set({ error: 'Erreur de sauvegarde de rotation' });
                    }
                }, 0)

                return newState
            }),

            startPlacing: (catalogItem) => set(() => {
                console.log('startPlacing called with:', catalogItem)
                const newItem = createRestaurantItem(catalogItem, { x: 0, y: 0, z: 0 })
                console.log('Created restaurant item:', newItem)
                return {
                    placingItem: newItem,
                    isPlacing: true,
                    selectedItem: null,
                }
            }),

            updatePlacingPosition: (position) => set((state) => ({
                placingItem: state.placingItem ? { ...state.placingItem, position: normalizePosition(position) } : null,
            })),

            confirmPlacement: () => set((state) => {
                if (!state.placingItem) return state

                if (canPlaceObject(state.placingItem.position, state.placingItem.size, state.currentLayout.items)) {
                    // Si c'est une table restaurant, l'associer automatiquement
                    const itemToPlace = { ...state.placingItem }

                    if (itemToPlace.metadata?.isRestaurantTable && itemToPlace.metadata?.tableId) {
                        // Associer automatiquement la table
                        setTimeout(async () => {
                            try {
                                await import('../services/tablePlannerIntegration').then(({ tablePlannerIntegrationService }) => {
                                    return tablePlannerIntegrationService.associateTableWithPlannerItem(
                                        itemToPlace.id,
                                        itemToPlace.metadata?.tableId
                                    )
                                })
                            } catch (error) {
                                console.error('Auto-association failed:', error);
                            }
                        }, 0)
                    }

                    const newState = {
                        currentLayout: updateLayoutItems(state.currentLayout, (items) => [
                            ...items,
                            itemToPlace,
                        ]),
                        placingItem: null,
                        isPlacing: false,
                    }

                    // Auto-save to database avec gestion d'erreur
                    setTimeout(async () => {
                        try {
                            await get().saveItemToDatabase(itemToPlace)
                        } catch (error) {
                            console.error('Auto-save placement failed:', error);
                            set({ error: 'Erreur de sauvegarde du placement' });
                        }
                    }, 0)

                    return newState
                }
                return state
            }),

            cancelPlacement: () => set({
                placingItem: null,
                isPlacing: false,
                selectedItem: null,
            }),

            startExpandingLine: (item) => set(() => {
                // Seules les tables avec chaises peuvent être étendues
                if (!isTableWithChairs(item)) {
                    return {}
                }

                return {
                    isExpandingLine: true,
                    expandingItem: item,
                    lineItems: [],
                    lineDirection: null,
                    selectedItem: null,
                }
            }),

            updateExpandingLine: (currentPosition) => set((state) => {
                if (!state.isExpandingLine || !state.expandingItem) return state

                const baseItem = state.expandingItem
                const linePositions = calculateLinePositions(baseItem, currentPosition, 1)
                const lineItems: RestaurantItem[] = []

                for (let i = 0; i < linePositions.length; i++) {
                    const position = linePositions[i]

                    if (canPlaceObject(position, baseItem.size, state.currentLayout.items)) {
                        lineItems.push({
                            ...baseItem,
                            id: `${baseItem.id}-line-${i + 1}`,
                            position,
                            color: baseItem.color,
                        })
                    }
                }

                const deltaX = Math.abs(currentPosition.x - baseItem.position.x)
                const deltaZ = Math.abs(currentPosition.z - baseItem.position.z)
                const direction = deltaX > deltaZ ? 'horizontal' : 'vertical'

                return {
                    lineItems,
                    lineDirection: direction,
                }
            }),

            confirmExpandingLine: () => set((state) => {
                if (!state.isExpandingLine || !state.expandingItem) return state

                const originalItem = state.expandingItem
                const lineItems = state.lineItems

                // Calculer la direction et la longueur
                const direction: TableDirection = state.lineDirection || 'horizontal'
                const length = calculateLongTableLength(originalItem, lineItems, direction)
                const startPosition = calculateLongTableStartPosition(originalItem, lineItems, direction)

                // Créer la table longue
                const longTable = createLongTable(originalItem, direction, length, startPosition)

                const newState = {
                    currentLayout: updateLayoutItems(state.currentLayout, (items) => {
                        // Supprimer l'objet original
                        const itemsWithoutOriginal = items.filter(item => item.id !== originalItem.id)
                        // Ajouter la table longue
                        return [...itemsWithoutOriginal, longTable]
                    }),
                    isExpandingLine: false,
                    expandingItem: null,
                    lineItems: [],
                    lineDirection: null,
                }

                // Auto-save to database avec gestion d'erreur
                setTimeout(async () => {
                    try {
                        await get().saveItemToDatabase(longTable)
                    } catch (error) {
                        console.error('Auto-save long table failed:', error);
                        set({ error: 'Erreur de sauvegarde de la table longue' });
                    }
                }, 0)

                return newState
            }),

            cancelExpandingLine: () => set({
                isExpandingLine: false,
                expandingItem: null,
                lineItems: [],
                lineDirection: null,
                selectedItem: null,
            }),

            saveLayout: async (name) => {
                set({ isLoading: true, error: null })
                try {
                    if (!get().currentLayout.id || get().currentLayout.id === '1') {
                        // Create new layout
                        const newLayout = await plannerService.createDefaultLayout(name)
                        await plannerService.saveLayoutToDatabase(newLayout.id, get().currentLayout.items)
                        set((state) => ({
                            currentLayout: {
                                ...state.currentLayout,
                                id: newLayout.id,
                                name: newLayout.name,
                                updatedAt: new Date()
                            }
                        }))
                    } else {
                        // Update existing layout
                        await plannerService.saveLayoutToDatabase(get().currentLayout.id, get().currentLayout.items)
                        set((state) => ({
                            currentLayout: {
                                ...state.currentLayout,
                                name,
                                updatedAt: new Date(),
                            },
                        }))
                    }
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde' })
                } finally {
                    set({ isLoading: false })
                }
            },

            loadLayout: (layout) => set({
                currentLayout: layout,
                selectedItem: null,
                placingItem: null,
                isPlacing: false,
                isExpandingLine: false,
                expandingItem: null,
                lineItems: [],
                lineDirection: null,
            }),

            resetLayout: () => set({
                currentLayout: DEFAULT_LAYOUT,
                selectedItem: null,
                placingItem: null,
                isPlacing: false,
                isExpandingLine: false,
                expandingItem: null,
                lineItems: [],
                lineDirection: null,
            }),

            // Database operations
            loadLayoutFromDatabase: async (layoutId) => {
                set({ isLoading: true, error: null })
                try {
                    console.log('Store: Loading layout from database:', layoutId);
                    const layoutData = await plannerService.loadLayoutFromDatabase(layoutId)
                    if (layoutData) {
                        console.log('Store: Layout data received:', layoutData);
                        console.log('Store: Items count:', layoutData.items.length);

                        // Validation des items chargés
                        const validatedItems = layoutData.items.filter(item => {
                            if (!isValidPosition(item.position) || !isValidSize(item.size)) {
                                console.warn('Invalid item data, skipping:', item);
                                return false;
                            }
                            return true;
                        });

                        set({
                            currentLayout: {
                                id: layoutData.layout.id,
                                name: layoutData.layout.name,
                                items: validatedItems,
                                roomSize: (layoutData.layout as any).room_size,
                                createdAt: new Date((layoutData.layout as any).created_at),
                                updatedAt: new Date((layoutData.layout as any).updated_at)
                            }
                        })
                        console.log('Store: Layout loaded successfully');
                    } else {
                        console.log('Store: No layout data received');
                    }
                } catch (error) {
                    console.error('Store: Error loading layout:', error);
                    set({ error: error instanceof Error ? error.message : 'Erreur lors du chargement' })
                } finally {
                    set({ isLoading: false })
                }
            },

            createNewLayout: async (name = 'Nouveau Restaurant') => {
                set({ isLoading: true, error: null })
                try {
                    const newLayout = await plannerService.createDefaultLayout(name)
                    set({
                        currentLayout: {
                            id: newLayout.id,
                            name: newLayout.name,
                            items: [],
                            roomSize: (newLayout as any).room_size,
                            createdAt: new Date((newLayout as any).created_at),
                            updatedAt: new Date((newLayout as any).updated_at)
                        }
                    })
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Erreur lors de la création' })
                } finally {
                    set({ isLoading: false })
                }
            },

            loadCatalogItems: async () => {
                set({ isLoading: true, error: null })
                try {
                    // This would load catalog items from database
                    // For now, we'll use the static catalog
                    set({ isLoading: false })
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Erreur lors du chargement du catalogue',
                        isLoading: false
                    })
                }
            },

            saveItemToDatabase: async (item) => {
                const { currentLayout } = get()
                if (!currentLayout) {
                    console.log('Store: No current layout for saving item:', item);
                    return
                }

                try {
                    // Vérifier si l'item existe déjà dans la base de données
                    const existingItems = await plannerService.getPlannerItemsByLayoutId(currentLayout.id)
                    const existingItem = existingItems.find(existing => existing.id === item.id)

                    if (existingItem) {
                        // Mettre à jour l'item existant
                        await plannerService.updatePlannerItem(item.id, {
                            id: item.id,
                            name: item.name,
                            position: item.position,
                            size: item.size,
                            rotation: item.rotation,
                            color: item.color,
                            metadata: item.metadata
                        })
                    } else {
                        // Créer un nouvel item
                        await plannerService.createPlannerItem({
                            // layout_id: currentLayout.id,
                            // object_type: item.type,
                            type: item.type,
                            name: item.name,
                            position: item.position,
                            size: item.size,
                            rotation: item.rotation,
                            color: item.color,
                            metadata: item.metadata
                        })
                    }

                } catch (error) {
                    console.error('Store: Error saving item:', error);
                    set({ error: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde de l\'item' })
                }
            },

            updateItemInDatabase: async (item: RestaurantItem) => {
                const { currentLayout } = get()
                if (!currentLayout) {
                    console.log('Store: No current layout for updating item:', item);
                    return
                }

                try {
                    await plannerService.updatePlannerItem(item.id, {
                        id: item.id,
                        name: item.name,
                        position: item.position,
                        size: item.size,
                        rotation: item.rotation,
                        color: item.color,
                        metadata: item.metadata
                    })
                } catch (error) {
                    console.error('Store: Error updating item:', error);
                    set({ error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'item' })
                }
            },

            deleteItemFromDatabase: async (itemId) => {
                try {
                    await plannerService.deletePlannerItem(itemId)
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'item' })
                }
            },

            clearError: () => set({ error: null }),

            // Auto-load default layout (Layout 1)
            loadDefaultLayout: async () => {
                set({ isLoading: true, error: null })
                try {
                    const layouts = await plannerService.getPlannerLayouts()
                    if (layouts.length > 0) {
                        // Always load Layout 1 first, or create it if it doesn't exist
                        const layout1 = layouts.find(l => l.name === 'Layout 1') || layouts[0]
                        await get().loadLayoutFromDatabase(layout1.id)
                    } else {
                        // Create Layout 1 if no layouts exist
                        await get().createNewLayout('Layout 1')
                    }
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Erreur lors du chargement du layout par défaut' })
                } finally {
                    set({ isLoading: false })
                }
            },

            // Get all layouts for the layout selector
            getLayouts: async () => {
                try {
                    return await plannerService.getPlannerLayouts()
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Erreur lors du chargement des layouts' })
                    return []
                }
            },

            // Update layout name
            updateLayoutName: async (layoutId: string, newName: string) => {
                try {
                    await plannerService.updatePlannerLayout(layoutId, { id: layoutId, name: newName })
                    // Update current layout if it's the one being renamed
                    const { currentLayout } = get()
                    if (currentLayout.id === layoutId) {
                        set((state) => ({
                            currentLayout: {
                                ...state.currentLayout,
                                name: newName
                            }
                        }))
                    }
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Erreur lors de la modification du nom' })
                }
            },

            // Delete layout (but not Layout 1)
            deleteLayout: async (layoutId: string) => {
                try {
                    const layout = await plannerService.getPlannerLayoutById(layoutId)
                    if (layout?.name === 'Layout 1') {
                        set({ error: 'Le Layout 1 ne peut pas être supprimé' })
                        return
                    }

                    await plannerService.deletePlannerLayout(layoutId)

                    // If we're deleting the current layout, switch to Layout 1
                    const { currentLayout } = get()
                    if (currentLayout.id === layoutId) {
                        await get().loadDefaultLayout()
                    }
                } catch (error) {
                    set({ error: error instanceof Error ? error.message : 'Erreur lors de la suppression du layout' })
                }
            },
        }),
        {
            name: 'restaurant-store',
        }
    )
)

export { usePlannerStore }
export default usePlannerStore
