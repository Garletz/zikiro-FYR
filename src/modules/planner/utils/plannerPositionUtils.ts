import { Position, RestaurantItem, Size, TableDirection } from '../types/planner'
import { GRID_CONFIG } from './plannerConstants'

// ===== UTILITAIRES DE POSITION =====

/**
 * Convertit les coordonnées pixels en coordonnées de grille
 */
export const pixelToGrid = (x: number, y: number, centerX: number, centerY: number): Position => ({
    x: Math.round((x - centerX) / GRID_CONFIG.CELL_SIZE),
    y: 0, // Toujours 0 pour la 2D
    z: Math.round((y - centerY) / GRID_CONFIG.CELL_SIZE)
})

/**
 * Convertit les coordonnées de grille en pixels (centre du carré)
 */
export const gridToPixel = (gridX: number, gridZ: number, centerX: number, centerY: number) => ({
    x: gridX * GRID_CONFIG.CELL_SIZE + centerX + GRID_CONFIG.CELL_SIZE / 2,
    y: gridZ * GRID_CONFIG.CELL_SIZE + centerY + GRID_CONFIG.CELL_SIZE / 2
})

/**
 * Convertit les coordonnées de grille en pixels (coin supérieur gauche)
 */
export const gridToPixelCorner = (gridX: number, gridZ: number, centerX: number, centerY: number) => ({
    x: gridX * GRID_CONFIG.CELL_SIZE + centerX,
    y: gridZ * GRID_CONFIG.CELL_SIZE + centerY
})

/**
 * Convertit les coordonnées de grille en position 3D
 */
export const gridTo3DPosition = (gridX: number, gridZ: number, height: number = 0): Position => ({
    x: gridX + 0.5, // Centrage en 3D
    y: height,
    z: gridZ + 0.5
})

/**
 * Normalise une position pour assurer la cohérence
 */
export const normalizePosition = (position: Position): Position => ({
    x: Math.round(position.x * 100) / 100, // Arrondir à 2 décimales
    y: Math.round(position.y * 100) / 100,
    z: Math.round(position.z * 100) / 100
})

// ===== UTILITAIRES DE TABLE LONGUE =====

/**
 * Crée une table longue à partir d'une table avec chaises
 */
export const createLongTable = (
    baseItem: RestaurantItem,
    direction: TableDirection,
    length: number,
    startPosition: Position
): RestaurantItem => {
    const isHorizontal = direction === 'horizontal'

    return {
        ...baseItem,
        id: `${baseItem.id}-long-table-${Date.now()}`,
        position: normalizePosition(startPosition),
        size: {
            width: isHorizontal ? length : 1,
            height: 1,
            depth: isHorizontal ? 1 : length
        },
        metadata: {
            ...baseItem.metadata,
            isLongTable: true,
            direction,
            originalLength: length,
            originalId: baseItem.id,
            catalogItemId: 'table-with-chairs'
        }
    }
}

/**
 * Calcule les positions pour l'extension en ligne
 */
export const calculateLinePositions = (
    startItem: RestaurantItem,
    endPosition: Position,
    spacing: number = 1
): Position[] => {
    const startPos = { x: startItem.position.x, z: startItem.position.z }
    const deltaX = Math.abs(endPosition.x - startPos.x)
    const deltaZ = Math.abs(endPosition.z - startPos.z)
    const direction = deltaX > deltaZ ? 'horizontal' : 'vertical'
    const distance = direction === 'horizontal' ? deltaX : deltaZ

    // Calculer le nombre d'objets avec espacement
    const numItems = Math.max(0, Math.floor(distance / spacing))

    const positions: Position[] = []
    for (let i = 1; i <= numItems; i++) {
        const offset = i * spacing
        const position = {
            x: direction === 'horizontal'
                ? startPos.x + (endPosition.x > startPos.x ? offset : -offset)
                : startPos.x,
            y: 0,
            z: direction === 'vertical'
                ? startPos.z + (endPosition.z > startPos.z ? offset : -offset)
                : startPos.z,
        }
        positions.push(normalizePosition(position))
    }

    return positions
}

/**
 * Calcule la position de départ optimale pour une table longue
 */
export const calculateLongTableStartPosition = (
    originalItem: RestaurantItem,
    lineItems: RestaurantItem[],
    direction: TableDirection
): Position => {
    if (lineItems.length === 0) {
        return normalizePosition(originalItem.position)
    }

    const allPositions = [originalItem.position, ...lineItems.map(item => item.position)]

    if (direction === 'horizontal') {
        const minX = Math.min(...allPositions.map(pos => pos.x))
        return normalizePosition({
            x: minX,
            y: 0,
            z: originalItem.position.z
        })
    } else {
        const minZ = Math.min(...allPositions.map(pos => pos.z))
        return normalizePosition({
            x: originalItem.position.x,
            y: 0,
            z: minZ
        })
    }
}

/**
 * Calcule la longueur totale d'une table longue
 */
export const calculateLongTableLength = (
    originalItem: RestaurantItem,
    lineItems: RestaurantItem[],
    direction: TableDirection
): number => {
    if (lineItems.length === 0) {
        return 1
    }

    const allPositions = [originalItem.position, ...lineItems.map(item => item.position)]

    if (direction === 'horizontal') {
        const maxX = Math.max(...allPositions.map(pos => pos.x))
        const minX = Math.min(...allPositions.map(pos => pos.x))
        return maxX - minX + 1
    } else {
        const maxZ = Math.max(...allPositions.map(pos => pos.z))
        const minZ = Math.min(...allPositions.map(pos => pos.z))
        return maxZ - minZ + 1
    }
}

// ===== UTILITAIRES DE VALIDATION =====

/**
 * Vérifie si une position est dans les limites de la grille
 */
export const isInBounds = (x: number, z: number): boolean => {
    // Utiliser les mêmes limites que la grille 3D
    // La grille 3D va de -ROOM_WIDTH/2 à +ROOM_WIDTH/2 et -ROOM_DEPTH/2 à +ROOM_DEPTH/2
    const halfWidth = GRID_CONFIG.ROOM_WIDTH / 2
    const halfDepth = GRID_CONFIG.ROOM_DEPTH / 2

    return x >= -halfWidth && x < halfWidth && z >= -halfDepth && z < halfDepth
}

/**
 * Obtenir les carrés occupés par un objet
 */
export const getOccupiedSquares = (
    position: Position,
    size: Size
): Array<{ x: number, z: number }> => {
    const squares = []
    for (let dx = 0; dx < size.width; dx++) {
        for (let dz = 0; dz < size.depth; dz++) {
            squares.push({
                x: position.x + dx,
                z: position.z + dz
            })
        }
    }
    return squares
}

/**
 * Vérifier si un objet peut être placé à une position
 */
export const canPlaceObject = (
    position: Position,
    size: Size,
    existingItems: RestaurantItem[]
): boolean => {
    // Vérifier les limites
    const occupiedSquares = getOccupiedSquares(position, size)
    for (const square of occupiedSquares) {
        if (!isInBounds(square.x, square.z)) {
            return false
        }
    }

    // Vérifier les collisions avec les objets existants
    for (const item of existingItems) {
        const itemSquares = getOccupiedSquares(
            item.position,
            item.size
        )

        for (const newSquare of occupiedSquares) {
            for (const existingSquare of itemSquares) {
                if (newSquare.x === existingSquare.x && newSquare.z === existingSquare.z) {
                    return false
                }
            }
        }
    }

    return true
}

// ===== UTILITAIRES DE PERSISTANCE =====

/**
 * Normalise un item pour la sauvegarde
 */
export const normalizeItemForSave = (item: RestaurantItem): RestaurantItem => {
    return {
        ...item,
        position: normalizePosition(item.position),
        size: {
            width: Math.round(item.size.width * 100) / 100,
            height: Math.round(item.size.height * 100) / 100,
            depth: Math.round(item.size.depth * 100) / 100
        },
        rotation: Math.round(item.rotation * 100) / 100
    }
}

/**
 * Normalise un item après chargement
 */
export const normalizeItemAfterLoad = (item: RestaurantItem): RestaurantItem => {
    return {
        ...item,
        position: normalizePosition(item.position),
        size: {
            width: Math.round(item.size.width * 100) / 100,
            height: Math.round(item.size.height * 100) / 100,
            depth: Math.round(item.size.depth * 100) / 100
        },
        rotation: Math.round(item.rotation * 100) / 100
    }
}
