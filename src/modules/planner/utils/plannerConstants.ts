// Configuration de la grille
export const GRID_CONFIG = {
    CELL_SIZE: 40,
    GRID_WIDTH: 20,
    GRID_HEIGHT: 15,
    ROOM_WIDTH: 20,
    ROOM_DEPTH: 15,
} as const

// Configuration des interactions
export const INTERACTION_CONFIG = {
    LONG_PRESS_DELAY: 500,
    DOUBLE_CLICK_DELAY: 300,
    DRAG_THRESHOLD: 5,
} as const

// Types d'objets disponibles
export const OBJECT_TYPES = {
    TABLE: 'table',
    CHAIR: 'chair',
    BAR: 'bar',
    KITCHEN: 'kitchen',
    BATHROOM: 'bathroom',
    ENTRANCE: 'entrance',
    WALL: 'wall',
    DECORATION: 'decoration',
    TEST: 'test',
} as const

// Couleurs par type d'objet
export const OBJECT_COLORS = {
    [OBJECT_TYPES.TABLE]: '#8B4513',
    [OBJECT_TYPES.CHAIR]: '#654321',
    [OBJECT_TYPES.BAR]: '#D2691E',
    [OBJECT_TYPES.KITCHEN]: '#DC143C',
    [OBJECT_TYPES.BATHROOM]: '#4169E1',
    [OBJECT_TYPES.ENTRANCE]: '#32CD32',
    [OBJECT_TYPES.WALL]: '#696969',
    [OBJECT_TYPES.DECORATION]: '#228B22',
    [OBJECT_TYPES.TEST]: '#FF6B6B',
} as const

// Dimensions par défaut des objets (en unités de grille)
export const OBJECT_DIMENSIONS = {
    [OBJECT_TYPES.TABLE]: { width: 1, height: 1, depth: 1 },
    [OBJECT_TYPES.CHAIR]: { width: 1, height: 1, depth: 1 },
    [OBJECT_TYPES.BAR]: { width: 2, height: 1, depth: 1 },
    [OBJECT_TYPES.KITCHEN]: { width: 3, height: 2, depth: 2 },
    [OBJECT_TYPES.BATHROOM]: { width: 2, height: 2, depth: 2 },
    [OBJECT_TYPES.ENTRANCE]: { width: 1, height: 1, depth: 1 },
    [OBJECT_TYPES.WALL]: { width: 1, height: 1, depth: 1 },
    [OBJECT_TYPES.DECORATION]: { width: 1, height: 1, depth: 1 },
    [OBJECT_TYPES.TEST]: { width: 1, height: 1, depth: 1 },
} as const

