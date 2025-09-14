import { invoke } from '@tauri-apps/api/core';
import type {
    CatalogItem,
    CreatePlannerItemRequest,
    CreatePlannerLayoutRequest,
    PlannerItem,
    PlannerLayout,
    PlannerLayoutWithItems,
    UpdatePlannerItemRequest,
    UpdatePlannerLayoutRequest
} from '../types/planner';
import { normalizeItemAfterLoad, normalizeItemForSave } from '../utils/plannerPositionUtils';

// Mapping function to convert frontend object types to backend ObjectType variants
const mapObjectTypeToBackend = (type: string): string => {
    const typeMap: Record<string, string> = {
        'table': 'Table',
        'chair': 'Chair',
        'bar': 'Bar',
        'kitchen': 'Kitchen',
        'bathroom': 'Bathroom',
        'entrance': 'Entrance',
        'wall': 'Wall',
        'decoration': 'Decoration',
        'test': 'Test',
        'table-with-chairs': 'Table', // Map table-with-chairs to Table
    };
    return typeMap[type] || 'Table'; // Default to Table if unknown
};

// Mapping function to convert backend ObjectType variants to frontend object types
const mapObjectTypeToFrontend = (type: string): string => {
    const typeMap: Record<string, string> = {
        'Table': 'table',
        'Chair': 'chair',
        'Bar': 'bar',
        'Kitchen': 'kitchen',
        'Bathroom': 'bathroom',
        'Entrance': 'entrance',
        'Wall': 'wall',
        'Decoration': 'decoration',
        'Test': 'test',
    };
    return typeMap[type] || 'table'; // Default to table if unknown
};

// ===== LAYOUT SERVICES =====

export const getPlannerLayouts = async (): Promise<PlannerLayout[]> => {
    try {
        return await invoke('get_planner_layouts');
    } catch (error) {
        console.error('Error fetching planner layouts:', error);
        throw error;
    }
};

export const getPlannerLayoutById = async (id: string): Promise<PlannerLayout | null> => {
    try {
        return await invoke('get_planner_layout_by_id_command', { id });
    } catch (error) {
        console.error('Error fetching planner layout:', error);
        throw error;
    }
};

export const createPlannerLayout = async (request: CreatePlannerLayoutRequest): Promise<PlannerLayout> => {
    try {
        return await invoke('create_planner_layout', { request });
    } catch (error) {
        console.error('Error creating planner layout:', error);
        throw error;
    }
};

export const updatePlannerLayout = async (id: string, request: UpdatePlannerLayoutRequest): Promise<void> => {
    try {
        await invoke('update_planner_layout_command', { id, request });
    } catch (error) {
        console.error('Error updating planner layout:', error);
        throw error;
    }
};

export const deletePlannerLayout = async (id: string): Promise<void> => {
    try {
        await invoke('delete_planner_layout_command', { id });
    } catch (error) {
        console.error('Error deleting planner layout:', error);
        throw error;
    }
};

export const getPlannerLayoutWithItems = async (id: string): Promise<PlannerLayoutWithItems | null> => {
    try {
        return await invoke('get_planner_layout_with_items_command', { id });
    } catch (error) {
        console.error('Error fetching planner layout with items:', error);
        throw error;
    }
};

// ===== ITEM SERVICES =====

export const getPlannerItemsByLayoutId = async (layoutId: string): Promise<PlannerItem[]> => {
    try {
        return await invoke('get_planner_items_by_layout_id_command', { layoutId });
    } catch (error) {
        console.error('Error fetching planner items:', error);
        throw error;
    }
};

export const createPlannerItem = async (request: CreatePlannerItemRequest): Promise<PlannerItem> => {
    try {
        // Map the object_type to backend format
        const mappedRequest = {
            ...request,
            object_type: mapObjectTypeToBackend((request as any).object_type)
        };
        return await invoke('create_planner_item', { request: mappedRequest });
    } catch (error) {
        console.error('Error creating planner item:', error);
        throw error;
    }
};

export const updatePlannerItem = async (id: string, request: UpdatePlannerItemRequest): Promise<void> => {
    try {
        // Map the object_type to backend format if it exists
        const mappedRequest = {
            ...request,
            object_type: (request as any).object_type ? mapObjectTypeToBackend((request as any).object_type) : undefined
        };
        await invoke('update_planner_item_command', { id, request: mappedRequest });
    } catch (error) {
        console.error('Error updating planner item:', error);
        throw error;
    }
};

export const deletePlannerItem = async (id: string): Promise<void> => {
    try {
        await invoke('delete_planner_item_command', { id });
    } catch (error) {
        console.error('Error deleting planner item:', error);
        throw error;
    }
};

// ===== CATALOG SERVICES =====

export const getPlannerCatalogItems = async (): Promise<CatalogItem[]> => {
    try {
        return await invoke('get_planner_catalog_items');
    } catch (error) {
        console.error('Error fetching catalog items:', error);
        throw error;
    }
};

export const createPlannerCatalogItem = async (request: {
    object_type: string;
    name: string;
    icon: string;
    size: { width: number; height: number; depth: number };
    color: string;
    category: string;
    description?: string;
}): Promise<CatalogItem> => {
    try {
        return await invoke('create_planner_catalog_item', { request });
    } catch (error) {
        console.error('Error creating catalog item:', error);
        throw error;
    }
};

// ===== INTEGRATION SERVICES =====

export const syncPlannerLayoutWithTables = async (layoutId: string): Promise<void> => {
    try {
        await invoke('sync_planner_layout_with_tables', { layoutId });
    } catch (error) {
        console.error('Error syncing planner layout with tables:', error);
        throw error;
    }
};

export const importTablesToPlannerLayout = async (layoutId: string): Promise<PlannerItem[]> => {
    try {
        return await invoke('import_tables_to_planner_layout', { layoutId });
    } catch (error) {
        console.error('Error importing tables to planner layout:', error);
        throw error;
    }
};

// ===== UTILITY FUNCTIONS =====

export const createDefaultLayout = async (name: string = 'Nouveau Restaurant'): Promise<PlannerLayout> => {
    const defaultRoomSize = {
        width: 800,
        height: 600,
        depth: 300
    };

    return await createPlannerLayout({
        name,
        items: [],
        roomSize: defaultRoomSize,
        metadata: {
            description: 'Layout par défaut',
            version: '1.0'
        }
    });
};

export const saveLayoutToDatabase = async (
    layoutId: string,
    items: PlannerItem[]
): Promise<void> => {
    try {
        // First, delete existing items for this layout
        const existingItems = await getPlannerItemsByLayoutId(layoutId);
        for (const item of existingItems) {
            await deletePlannerItem(item.id);
        }

        // Then create new items with normalized data
        for (const item of items) {
            const normalizedItem = normalizeItemForSave(item);
            await createPlannerItem({
                // layout_id: layoutId,
                // object_type: mapObjectTypeToBackend(normalizedItem.type),
                type: normalizedItem.type,
                name: normalizedItem.name,
                position: normalizedItem.position,
                size: normalizedItem.size,
                rotation: normalizedItem.rotation,
                color: normalizedItem.color,
                metadata: normalizedItem.metadata
            });
        }
    } catch (error) {
        console.error('Error saving layout to database:', error);
        throw error;
    }
};

export const loadLayoutFromDatabase = async (layoutId: string): Promise<{
    layout: PlannerLayout;
    items: PlannerItem[];
} | null> => {
    try {
        console.log('Loading layout from database:', layoutId);
        const layoutWithItems = await getPlannerLayoutWithItems(layoutId);
        if (!layoutWithItems) {
            console.log('No layout found for ID:', layoutId);
            return null;
        }

        console.log('Layout found:', layoutWithItems);
        console.log('Items found:', layoutWithItems.items.length);

        const mappedItems = layoutWithItems.items.map(item => {
            const parsedMetadata = item.metadata ? JSON.parse(item.metadata as unknown as string) : {};

            // Reconstituer les métadonnées manquantes basées sur l'ID
            let enhancedMetadata = { ...parsedMetadata };

            // Si l'ID contient 'table-with-chairs' OU si l'ID original contient 'table-with-chairs', s'assurer que catalogItemId est présent
            if ((item.id.includes('table-with-chairs') || enhancedMetadata.originalId?.includes('table-with-chairs')) && !enhancedMetadata.catalogItemId) {
                enhancedMetadata.catalogItemId = 'table-with-chairs';
            }

            // Si c'est une table longue, s'assurer que isLongTable et direction sont présents
            if (item.id.includes('-long-table')) {
                // Toujours forcer les métadonnées pour les tables longues
                enhancedMetadata.isLongTable = true;

                // Déduire la direction de la taille
                const isHorizontal = item.size.width > item.size.depth;
                enhancedMetadata.direction = isHorizontal ? 'horizontal' : 'vertical';

                // Calculer la longueur originale
                enhancedMetadata.originalLength = isHorizontal ? item.size.width : item.size.depth;
            }

            const mappedItem = {
                id: item.id,
                type: mapObjectTypeToFrontend((item as any).object_type),
                name: item.name,
                position: item.position,
                size: item.size,
                rotation: item.rotation,
                color: item.color,
                metadata: enhancedMetadata
            };

            // Normaliser l'item après chargement pour corriger les problèmes de positionnement
            return normalizeItemAfterLoad(mappedItem as any);
        });

        return {
            layout: layoutWithItems,
            items: mappedItems
        };
    } catch (error) {
        console.error('Error loading layout from database:', error);
        throw error;
    }
};
