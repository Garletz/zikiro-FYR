use crate::database;
use crate::models::*;
use tauri::command;

#[command]
pub async fn create_order_from_cart(
    table_id: String,
    table_name: String,
    cart_items: Vec<CartItem>,
) -> Result<Order, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;

    // Générer un numéro de commande
    let order_number = database::generate_order_number(&conn).map_err(|e| e.to_string())?;

    // Convertir les items du panier en items de commande
    let order_items: Vec<OrderItem> = cart_items
        .into_iter()
        .map(|cart_item| OrderItem {
            product_id: cart_item.product_id,
            product_name: cart_item.product_name,
            quantity: cart_item.quantity,
            unit_price: cart_item.unit_price,
            total_price: cart_item.total_price,
            status: "active".to_string(),
        })
        .collect();

    // Créer la commande
    let order = Order::new(order_number, table_id, table_name, order_items);

    // Insérer en base
    database::insert_order(&conn, &order).map_err(|e| e.to_string())?;

    Ok(order)
}

#[command]
pub async fn get_all_orders() -> Result<Vec<Order>, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::get_all_orders(&conn).map_err(|e| e.to_string())
}

#[command]
pub async fn get_kitchen_orders() -> Result<Vec<Order>, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::get_orders_by_status(&conn, "pending").map_err(|e| e.to_string())
}

#[command]
pub async fn update_order_status(order_id: String, status: String) -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::update_order_status(&conn, &order_id, &status).map_err(|e| e.to_string())
}

#[command]
pub async fn delete_order(order_id: String) -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::delete_order(&conn, &order_id).map_err(|e| e.to_string())
}

#[command]
pub async fn get_order_by_table(table_id: String) -> Result<Option<Order>, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::get_order_by_table_id(&conn, &table_id).map_err(|e| e.to_string())
}

#[command]
pub async fn update_order_items_command(order_id: String, items_json: String) -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let items: Vec<OrderItem> = serde_json::from_str(&items_json)
        .map_err(|e| format!("Failed to parse items: {}", e))?;
    
    database::update_order_items(&conn, &order_id, &items).map_err(|e| e.to_string())
}

#[command]
pub async fn cancel_order_item(order_id: String, product_id: String) -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    // Récupérer la commande
    let mut stmt = conn.prepare(
        "SELECT items FROM orders WHERE id = ?"
    ).map_err(|e| e.to_string())?;
    
    let items_json: String = stmt.query_row([&order_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    
    let mut items: Vec<OrderItem> = serde_json::from_str(&items_json)
        .map_err(|e| format!("Failed to parse items: {}", e))?;
    
    // Marquer l'item comme annulé
    for item in &mut items {
        if item.product_id == product_id {
            item.status = "cancelled".to_string();
        }
    }
    
    database::update_order_items(&conn, &order_id, &items).map_err(|e| e.to_string())
}

// ===== COMMANDES CORBEILLE =====

#[command]
pub async fn get_trash_orders() -> Result<Vec<Order>, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::get_trash_orders(&conn).map_err(|e| e.to_string())
}

#[command]
pub async fn move_order_to_trash(order_id: String) -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::move_order_to_trash(&conn, &order_id).map_err(|e| e.to_string())
}

#[command]
pub async fn restore_order_from_trash(order_id: String) -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::restore_order_from_trash(&conn, &order_id).map_err(|e| e.to_string())
}

#[command]
pub async fn delete_order_permanently(order_id: String) -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::delete_order_permanently(&conn, &order_id).map_err(|e| e.to_string())
}

#[command]
pub async fn clear_trash() -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::clear_trash(&conn).map_err(|e| e.to_string())
}
