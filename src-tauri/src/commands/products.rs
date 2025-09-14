use crate::{database, models::*};
use tracing::info;

#[tauri::command]
pub async fn get_products(
    _app_handle: tauri::AppHandle,
) -> Result<Vec<Product>, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::get_all_products(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_product(
    _app_handle: tauri::AppHandle,
    request: CreateProductRequest,
) -> Result<Product, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let product = Product::new(
        request.name,
        request.price,
        request.cost,
        request.category_id,
        request.stock_quantity,
    );
    
    // Set additional fields
    let mut product = product;
    product.description = request.description;
    product.barcode = request.barcode;
    product.sku = request.sku;
    product.min_stock = request.min_stock.unwrap_or(0);
    product.image_url = request.image_url;
    
    database::insert_product(&conn, &product).map_err(|e| e.to_string())?;
    
    info!("Product created: {}", product.name);
    Ok(product)
}

#[tauri::command]
pub async fn update_product(
    _app_handle: tauri::AppHandle,
    id: String,
    request: UpdateProductRequest,
) -> Result<Product, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut product = database::get_product_by_id(&conn, &id)
        .map_err(|e| e.to_string())?
        .ok_or("Product not found")?;
    
    // Update fields if provided
    if let Some(name) = request.name {
        product.name = name;
    }
    if let Some(description) = request.description {
        product.description = Some(description);
    }
    if let Some(price) = request.price {
        product.price = price;
    }
    if let Some(cost) = request.cost {
        product.cost = cost;
    }
    if let Some(stock_quantity) = request.stock_quantity {
        product.stock_quantity = stock_quantity;
    }
    if let Some(category_id) = request.category_id {
        product.category_id = category_id;
    }
    if let Some(barcode) = request.barcode {
        product.barcode = Some(barcode);
    }
    if let Some(sku) = request.sku {
        product.sku = Some(sku);
    }
    if let Some(stock_quantity) = request.stock_quantity {
        product.stock_quantity = stock_quantity;
    }
    if let Some(min_stock) = request.min_stock {
        product.min_stock = min_stock;
    }
    if let Some(image_url) = request.image_url {
        product.image_url = Some(image_url);
    }
    if let Some(is_active) = request.is_active {
        product.is_active = is_active;
    }
    
    product.updated_at = chrono::Utc::now();
    
    database::update_product(&conn, &id, &product).map_err(|e| e.to_string())?;
    
    info!("Product updated: {}", product.name);
    Ok(product)
}

#[tauri::command]
pub async fn delete_product(
    _app_handle: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::delete_product(&conn, &id).map_err(|e| e.to_string())?;
    
    info!("Product deleted: {}", id);
    Ok(())
}

