// Types de base
export interface Position {
    x: number
    y: number
    z: number
}

export interface Size {
    width: number
    height: number
    depth: number
}

export interface RoomSize {
    width: number
    height: number
    depth: number
}

// Types d'objets
export type ObjectType = 'table' | 'chair' | 'bar' | 'kitchen' | 'bathroom' | 'entrance' | 'wall' | 'decoration' | 'test'

// Types spécifiques pour les tables
export type TableType = 'single' | 'with-chairs' | 'long'
export type TableDirection = 'horizontal' | 'vertical'

// Configuration des tables
export interface TableConfig {
    type: TableType
    direction?: TableDirection
    length?: number
    originalId?: string
}

// Objet du catalogue
export interface CatalogItem {
    id: string
    type: ObjectType
    name: string
    icon: string
    size: Size
    color: string
    category: string
    description?: string
    metadata?: Record<string, any>
}

// Objet placé dans le restaurant
export interface RestaurantItem {
    id: string
    type: ObjectType
    name: string
    position: Position
    size: Size
    rotation: number
    color: string
    metadata?: Record<string, any>
}

// Layout du restaurant
export interface RestaurantLayout {
    id: string
    name: string
    items: RestaurantItem[]
    roomSize: RoomSize
    createdAt: Date
    updatedAt: Date
    metadata?: Record<string, any>
}

// Modes de vue
export type ViewMode = '2D' | '3D'

// États d'interaction
export type InteractionState = 'idle' | 'placing' | 'expanding' | 'dragging' | 'selecting'

// Directions pour l'agrandissement en ligne
export type LineDirection = 'horizontal' | 'vertical' | null

// Configuration de la grille
export interface GridConfig {
    cellSize: number
    width: number
    height: number
}

// Configuration des interactions
export interface InteractionConfig {
    longPressDelay: number
    doubleClickDelay: number
    dragThreshold: number
}

// Événements de souris/tactile
export interface MouseEvent {
    clientX: number
    clientY: number
    preventDefault: () => void
}

export interface TouchEvent {
    touches: Array<{
        clientX: number
        clientY: number
    }>
    preventDefault: () => void
}

// Types pour les hooks personnalisés
export interface UseLongPressOptions {
    onLongPress: () => void
    onPress?: () => void
    delay?: number
    preventDefault?: boolean
}

export interface UseDoubleClickOptions {
    onDoubleClick: () => void
    onSingleClick?: () => void
    delay?: number
}

// Types pour les composants UI
export interface ButtonVariant {
    primary: string
    secondary: string
    success: string
    warning: string
    danger: string
}

export interface ButtonSize {
    sm: string
    md: string
    lg: string
}

// Types pour les actions du store
export interface StoreActions {
    // Actions de base
    setViewMode: (mode: ViewMode) => void
    selectItem: (item: RestaurantItem | null) => void

    // Actions de drag & drop
    setDragItem: (item: CatalogItem | null) => void
    setIsDragging: (isDragging: boolean) => void

    // Actions de gestion des items
    addItem: (item: RestaurantItem) => void
    removeItem: (itemId: string) => void
    updateItemPosition: (itemId: string, position: Position) => void
    updateItemRotation: (itemId: string, rotation: number) => void

    // Actions de placement
    startPlacing: (catalogItem: CatalogItem) => void
    updatePlacingPosition: (position: Position) => void
    confirmPlacement: () => void
    cancelPlacement: () => void

    // Actions d'agrandissement en ligne
    startExpandingLine: (item: RestaurantItem) => void
    updateExpandingLine: (currentPosition: Position) => void
    confirmExpandingLine: () => void
    cancelExpandingLine: () => void

    // Actions de layout
    saveLayout: (name: string) => void
    loadLayout: (layout: RestaurantLayout) => void
    resetLayout: () => void
}

// Types pour les utilitaires
export type ClassValue = string | number | boolean | undefined | null | Record<string, any> | ClassValue[]

// Types pour les services
export interface CreatePlannerItemRequest {
    type: ObjectType
    name: string
    position: Position
    size: Size
    rotation: number
    color: string
    metadata?: Record<string, any>
}

export interface CreatePlannerLayoutRequest {
    name: string
    items: RestaurantItem[]
    roomSize: RoomSize
    metadata?: Record<string, any>
}

export interface UpdatePlannerItemRequest {
    id: string
    type?: ObjectType
    name?: string
    position?: Position
    size?: Size
    rotation?: number
    color?: string
    metadata?: Record<string, any>
}

export interface UpdatePlannerLayoutRequest {
    id: string
    name?: string
    items?: RestaurantItem[]
    roomSize?: RoomSize
    metadata?: Record<string, any>
}

// Alias pour compatibilité
export type PlannerItem = RestaurantItem
export type PlannerLayout = RestaurantLayout
export type PlannerLayoutWithItems = RestaurantLayout

// ===== UTILITAIRES DE VALIDATION =====

// Validation des positions
export const isValidPosition = (position: Position): boolean => {
    return typeof position.x === 'number' &&
        typeof position.y === 'number' &&
        typeof position.z === 'number' &&
        !isNaN(position.x) &&
        !isNaN(position.y) &&
        !isNaN(position.z)
}

// Validation des tailles
export const isValidSize = (size: Size): boolean => {
    return typeof size.width === 'number' &&
        typeof size.height === 'number' &&
        typeof size.depth === 'number' &&
        size.width > 0 &&
        size.height > 0 &&
        size.depth > 0
}

// Vérification si c'est une table longue
export const isLongTable = (item: RestaurantItem): boolean => {
    return item.metadata?.isLongTable === true ||
        item.id.includes('-long-table')
}

// Vérification si c'est une table avec chaises
export const isTableWithChairs = (item: RestaurantItem): boolean => {
    return item.id.includes('table-with-chairs') ||
        item.metadata?.catalogItemId === 'table-with-chairs'
}

// Obtention de la configuration de table
export const getTableConfig = (item: RestaurantItem): TableConfig | null => {
    if (item.type !== 'table') return null

    if (isLongTable(item)) {
        return {
            type: 'long',
            direction: item.metadata?.direction || 'horizontal',
            length: item.metadata?.originalLength ||
                (item.metadata?.direction === 'horizontal' ? item.size.width : item.size.depth),
            originalId: item.metadata?.originalId
        }
    }

    if (isTableWithChairs(item)) {
        return {
            type: 'with-chairs',
            originalId: item.id
        }
    }

    return {
        type: 'single'
    }
}
