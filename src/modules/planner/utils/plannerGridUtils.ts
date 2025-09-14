import { RestaurantItem } from '../types/planner'

// Configuration de la grille améliorée
export const GRID_CONFIG = {
    CELL_SIZE: 40, // Taille en pixels (doit correspondre à la grille 3D)
    GRID_WIDTH: 20, // Nombre de cellules en largeur
    GRID_HEIGHT: 15, // Nombre de cellules en profondeur
    ROOM_WIDTH: 20, // Largeur de la salle en unités 3D
    ROOM_DEPTH: 15, // Profondeur de la salle en unités 3D
} as const

// Fonctions utilitaires pour la grille
export const GRID_UTILS = {
    // Convertir les coordonnées pixels en coordonnées de grille
    pixelToGrid: (x: number, y: number, centerX: number, centerY: number) => ({
        x: Math.round((x - centerX) / GRID_CONFIG.CELL_SIZE),
        z: Math.round((y - centerY) / GRID_CONFIG.CELL_SIZE)
    }),

    // Convertir les coordonnées de grille en pixels (centre du carré)
    gridToPixel: (gridX: number, gridZ: number, centerX: number, centerY: number) => ({
        x: gridX * GRID_CONFIG.CELL_SIZE + centerX + GRID_CONFIG.CELL_SIZE / 2,
        y: gridZ * GRID_CONFIG.CELL_SIZE + centerY + GRID_CONFIG.CELL_SIZE / 2
    }),

    // Convertir les coordonnées de grille en pixels (coin supérieur gauche du carré)
    gridToPixelCorner: (gridX: number, gridZ: number, centerX: number, centerY: number) => ({
        x: gridX * GRID_CONFIG.CELL_SIZE + centerX,
        y: gridZ * GRID_CONFIG.CELL_SIZE + centerY
    }),

    // Vérifier si une position est dans les limites de la grille
    isInBounds: (x: number, z: number) => {
        const halfWidth = Math.floor(GRID_CONFIG.GRID_WIDTH / 2)
        const halfHeight = Math.floor(GRID_CONFIG.GRID_HEIGHT / 2)
        return x >= -halfWidth && x <= halfWidth && z >= -halfHeight && z <= halfHeight
    },

    // Obtenir les carrés occupés par un objet
    getOccupiedSquares: (position: { x: number, z: number } | undefined, size: { width: number, depth: number } | undefined) => {
        // Vérifications de sécurité
        if (!position || !size || typeof position.x !== 'number' || typeof position.z !== 'number') {
            return []
        }

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
    },

    // Vérifier si un objet peut être placé à une position
    canPlaceObject: (position: { x: number, z: number } | undefined, size: { width: number, depth: number } | undefined, existingItems: RestaurantItem[]) => {
        // Vérifications de sécurité
        if (!position || !size || typeof position.x !== 'number' || typeof position.z !== 'number') {
            return false
        }

        // Vérifier les limites
        const occupiedSquares = GRID_UTILS.getOccupiedSquares(position, size)
        for (const square of occupiedSquares) {
            if (!GRID_UTILS.isInBounds(square.x, square.z)) {
                return false
            }
        }

        // Vérifier les collisions avec les objets existants
        for (const item of existingItems) {
            const itemSquares = GRID_UTILS.getOccupiedSquares(
                { x: item.position.x, z: item.position.z },
                { width: item.size.width, depth: item.size.depth }
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
    },

    // Calculer la position optimale pour une ligne d'objets
    calculateLinePositions: (startItem: RestaurantItem, endPosition: { x: number, z: number } | undefined, spacing: number = 1) => {
        // Vérifications de sécurité
        if (!endPosition || typeof endPosition.x !== 'number' || typeof endPosition.z !== 'number') {
            return []
        }

        const startPos = { x: startItem.position.x, z: startItem.position.z }
        const deltaX = Math.abs(endPosition.x - startPos.x)
        const deltaZ = Math.abs(endPosition.z - startPos.z)
        const direction = deltaX > deltaZ ? 'horizontal' : 'vertical'
        const distance = direction === 'horizontal' ? deltaX : deltaZ

        // Calculer le nombre d'objets avec espacement de 1 carré (comme les objets individuels)
        const numItems = Math.max(0, Math.floor(distance / spacing))

        const positions = []
        for (let i = 1; i <= numItems; i++) {
            const offset = i * spacing
            const position = {
                x: direction === 'horizontal'
                    ? startPos.x + (endPosition.x > startPos.x ? offset : -offset)
                    : startPos.x,
                z: direction === 'vertical'
                    ? startPos.z + (endPosition.z > startPos.z ? offset : -offset)
                    : startPos.z,
            }
            positions.push(position)
        }

        return positions
    },

    // Vérifier si une ligne d'objets peut être placée
    canPlaceLine: (positions: { x: number, z: number }[], itemSize: { width: number, depth: number }, existingItems: RestaurantItem[]) => {
        for (const position of positions) {
            if (!GRID_UTILS.canPlaceObject(position, itemSize, existingItems)) {
                return false
            }
        }
        return true
    }
} as const
