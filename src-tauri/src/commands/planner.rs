use crate::database::{
    get_db_path, get_connection,
    get_all_planner_layouts, get_planner_layout_by_id, insert_planner_layout, update_planner_layout, delete_planner_layout,
    get_planner_items_by_layout_id, insert_planner_item, update_planner_item, delete_planner_item,
    get_all_catalog_items, insert_catalog_item, get_planner_layout_with_items
};
use crate::models::{
    PlannerLayout, PlannerItem, CatalogItem, CreatePlannerLayoutRequest, UpdatePlannerLayoutRequest,
    CreatePlannerItemRequest, UpdatePlannerItemRequest, PlannerLayoutWithItems, ObjectType, Position, Size, RoomSize
};
use tauri::command;
use serde_json;

// ===== LAYOUT COMMANDS =====

#[command]
pub fn get_planner_layouts() -> Result<Vec<PlannerLayout>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let layouts = get_all_planner_layouts(&conn).map_err(|e| e.to_string())?;
    Ok(layouts)
}

#[command]
pub fn get_planner_layout_by_id_command(id: String) -> Result<Option<PlannerLayout>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    get_planner_layout_by_id(&conn, &id).map_err(|e| e.to_string())
}

#[command]
pub fn create_planner_layout(request: CreatePlannerLayoutRequest) -> Result<PlannerLayout, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let layout = PlannerLayout::new(request.name, request.room_size);
    if let Some(_metadata) = request.metadata {
        // Note: We would need to update the PlannerLayout struct to have a mutable metadata field
        // For now, we'll create the layout and then update it if needed
    }
    
    insert_planner_layout(&conn, &layout).map_err(|e| e.to_string())?;
    Ok(layout)
}

#[command]
pub fn update_planner_layout_command(id: String, request: serde_json::Value) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut update_request = UpdatePlannerLayoutRequest {
        name: None,
        room_size: None,
        metadata: None,
    };
    
    if let Some(name) = request.get("name").and_then(|v| v.as_str()) {
        update_request.name = Some(name.to_string());
    }
    
    if let Some(room_size_obj) = request.get("room_size") {
        if let (Some(width), Some(height), Some(depth)) = (
            room_size_obj.get("width").and_then(|v| v.as_f64()),
            room_size_obj.get("height").and_then(|v| v.as_f64()),
            room_size_obj.get("depth").and_then(|v| v.as_f64()),
        ) {
            update_request.room_size = Some(RoomSize { width, height, depth });
        }
    }
    
    if let Some(metadata) = request.get("metadata").and_then(|v| v.as_str()) {
        update_request.metadata = Some(metadata.to_string());
    }
    
    update_planner_layout(&conn, &id, &update_request).map_err(|e| e.to_string())
}

#[command]
pub fn delete_planner_layout_command(id: String) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    delete_planner_layout(&conn, &id).map_err(|e| e.to_string())
}

#[command]
pub fn get_planner_layout_with_items_command(id: String) -> Result<Option<PlannerLayoutWithItems>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    get_planner_layout_with_items(&conn, &id).map_err(|e| e.to_string())
}

// ===== ITEM COMMANDS =====

#[command]
pub fn get_planner_items_by_layout_id_command(layout_id: String) -> Result<Vec<PlannerItem>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let items = get_planner_items_by_layout_id(&conn, &layout_id).map_err(|e| e.to_string())?;
    Ok(items)
}

#[command]
pub fn create_planner_item(request: CreatePlannerItemRequest) -> Result<PlannerItem, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let item = PlannerItem::new(
        request.layout_id,
        request.object_type,
        request.name,
        request.position,
        request.size,
        request.rotation,
        request.color,
        request.metadata, // Ajout des métadonnées
    );
    
    insert_planner_item(&conn, &item).map_err(|e| e.to_string())?;
    Ok(item)
}

#[command]
pub fn update_planner_item_command(id: String, request: serde_json::Value) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut update_request = UpdatePlannerItemRequest {
        name: None,
        position: None,
        size: None,
        rotation: None,
        color: None,
        metadata: None,
    };
    
    if let Some(name) = request.get("name").and_then(|v| v.as_str()) {
        update_request.name = Some(name.to_string());
    }
    
    if let Some(position_obj) = request.get("position") {
        if let (Some(x), Some(y), Some(z)) = (
            position_obj.get("x").and_then(|v| v.as_f64()),
            position_obj.get("y").and_then(|v| v.as_f64()),
            position_obj.get("z").and_then(|v| v.as_f64()),
        ) {
            update_request.position = Some(Position { x, y, z });
        }
    }
    
    if let Some(size_obj) = request.get("size") {
        if let (Some(width), Some(height), Some(depth)) = (
            size_obj.get("width").and_then(|v| v.as_f64()),
            size_obj.get("height").and_then(|v| v.as_f64()),
            size_obj.get("depth").and_then(|v| v.as_f64()),
        ) {
            update_request.size = Some(Size { width, height, depth });
        }
    }
    
    if let Some(rotation) = request.get("rotation").and_then(|v| v.as_f64()) {
        update_request.rotation = Some(rotation);
    }
    
    if let Some(color) = request.get("color").and_then(|v| v.as_str()) {
        update_request.color = Some(color.to_string());
    }
    
    if let Some(metadata) = request.get("metadata").and_then(|v| v.as_str()) {
        update_request.metadata = Some(metadata.to_string());
    }
    

    
    update_planner_item(&conn, &id, &update_request).map_err(|e| e.to_string())
}

#[command]
pub fn delete_planner_item_command(id: String) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    delete_planner_item(&conn, &id).map_err(|e| e.to_string())
}

// ===== CATALOG COMMANDS =====

#[command]
pub fn get_planner_catalog_items() -> Result<Vec<CatalogItem>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let items = get_all_catalog_items(&conn).map_err(|e| e.to_string())?;
    Ok(items)
}

#[command]
pub fn create_planner_catalog_item(request: serde_json::Value) -> Result<CatalogItem, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let object_type_str = request.get("object_type")
        .and_then(|v| v.as_str())
        .ok_or("object_type is required")?;
    
    let object_type = match object_type_str {
        "table" => ObjectType::Table,
        "chair" => ObjectType::Chair,
        "bar" => ObjectType::Bar,
        "kitchen" => ObjectType::Kitchen,
        "bathroom" => ObjectType::Bathroom,
        "entrance" => ObjectType::Entrance,
        "wall" => ObjectType::Wall,
        "decoration" => ObjectType::Decoration,
        "test" => ObjectType::Test,
        _ => return Err(format!("Invalid object_type: {}", object_type_str)),
    };
    
    let name = request.get("name")
        .and_then(|v| v.as_str())
        .ok_or("name is required")?
        .to_string();
    
    let icon = request.get("icon")
        .and_then(|v| v.as_str())
        .ok_or("icon is required")?
        .to_string();
    
    let size_obj = request.get("size").ok_or("size is required")?;
    let size = Size {
        width: size_obj.get("width").and_then(|v| v.as_f64()).ok_or("size.width is required")?,
        height: size_obj.get("height").and_then(|v| v.as_f64()).ok_or("size.height is required")?,
        depth: size_obj.get("depth").and_then(|v| v.as_f64()).ok_or("size.depth is required")?,
    };
    
    let color = request.get("color")
        .and_then(|v| v.as_str())
        .ok_or("color is required")?
        .to_string();
    
    let category = request.get("category")
        .and_then(|v| v.as_str())
        .ok_or("category is required")?
        .to_string();
    
    let _description = request.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
    
    let item = CatalogItem::new(object_type, name, icon, size, color, category);
    // Note: We would need to update the CatalogItem struct to have a mutable description field
    // For now, we'll create the item without description
    
    insert_catalog_item(&conn, &item).map_err(|e| e.to_string())?;
    Ok(item)
}



#[command]
pub fn sync_planner_layout_with_tables(layout_id: String) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    // Get all tables from the database
    let tables = crate::database::get_all_tables(&conn).map_err(|e| e.to_string())?;
    
    // Get planner items for this layout
    let planner_items = get_planner_items_by_layout_id(&conn, &layout_id).map_err(|e| e.to_string())?;
    
    // For each table, create or update a corresponding planner item
    for table in tables {
        // Check if a planner item already exists for this table
        let existing_item = planner_items.iter().find(|item| {
            if let Some(metadata) = &item.metadata {
                if let Ok(metadata_obj) = serde_json::from_str::<serde_json::Value>(metadata) {
                    if let Some(table_id) = metadata_obj.get("tableId").and_then(|v| v.as_str()) {
                        return table_id == table.id;
                    }
                }
            }
            false
        });
        
        if existing_item.is_none() {
            // Create a new planner item for this table
            let position = Position {
                x: table.position_x as f64,
                y: table.position_y as f64,
                z: 0.0,
            };
            
            let size = Size {
                width: 80.0, // Default table size
                height: 80.0,
                depth: 80.0,
            };
            
            let metadata = serde_json::json!({
                "tableId": table.id,
                "tableNumber": table.number,
                "capacity": table.capacity
            }).to_string();
            
            let item = PlannerItem::new(
                layout_id.clone(),
                ObjectType::Table,
                format!("Table {}", table.number),
                position,
                size,
                0.0, // No rotation
                "#8B4513".to_string(), // Brown color
                Some(metadata), // Ajout des métadonnées
            );
            
            // Insert the item into the database
            insert_planner_item(&conn, &item).map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

#[command]
pub fn import_tables_to_planner_layout(layout_id: String) -> Result<Vec<PlannerItem>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    // Get all tables from the database
    let tables = crate::database::get_all_tables(&conn).map_err(|e| e.to_string())?;
    
    let mut created_items = Vec::new();
    
    // Create planner items for each table
    for table in tables {
        let position = Position {
            x: table.position_x as f64,
            y: table.position_y as f64,
            z: 0.0,
        };
        
        let size = Size {
            width: 80.0, // Default table size
            height: 80.0,
            depth: 80.0,
        };
        
        let item = PlannerItem::new(
            layout_id.clone(),
            ObjectType::Table,
            format!("Table {}", table.number),
            position,
            size,
            0.0, // No rotation
            "#8B4513".to_string(), // Brown color
            None, // Pas de métadonnées pour l'import de tables
        );
        
        insert_planner_item(&conn, &item).map_err(|e| e.to_string())?;
        created_items.push(item);
    }
    
    Ok(created_items)
}
