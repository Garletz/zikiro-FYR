use crate::{database, models::*};
use tracing::info;

#[tauri::command]
pub async fn get_categories(
    _app_handle: tauri::AppHandle,
) -> Result<Vec<Category>, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::get_all_categories(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_category(
    _app_handle: tauri::AppHandle,
    request: CreateCategoryRequest,
) -> Result<Category, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut category = Category::new(request.name);
    category.description = request.description;
    category.color = request.color.or(Some("#3B82F6".to_string())); // Couleur par défaut si non fournie
    category.tax_rate_id = request.tax_rate_id.or(Some("fr-standard".to_string())); // TODO: Utiliser le pays actuel depuis les settings
    
    database::insert_category(&conn, &category).map_err(|e| e.to_string())?;
    
    info!("Category created: {} with tax rate id: {:?}", category.name, category.tax_rate_id);
    Ok(category)
}

#[tauri::command]
pub async fn update_category(
    _app_handle: tauri::AppHandle,
    id: String,
    request: UpdateCategoryRequest,
) -> Result<Category, String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    // Récupérer la catégorie existante
    let existing_categories = database::get_all_categories(&conn).map_err(|e| e.to_string())?;
    let existing_category = existing_categories.iter().find(|c| c.id == id)
        .ok_or("Category not found")?;
    
    let mut category = existing_category.clone();
    
    // Mettre à jour seulement les champs fournis
    if let Some(name) = request.name {
        category.name = name;
    }
    if let Some(description) = request.description {
        category.description = Some(description);
    }
    if let Some(color) = request.color {
        category.color = Some(color);
    }
    if let Some(tax_rate_id) = request.tax_rate_id {
        category.tax_rate_id = Some(tax_rate_id);
    }
    if let Some(is_active) = request.is_active {
        category.is_active = is_active;
    }
    
    database::update_category(&conn, &id, &category).map_err(|e| e.to_string())?;
    
    info!("Category updated: {} with tax rate id: {:?}", category.name, category.tax_rate_id);
    Ok(category)
}

#[tauri::command]
pub async fn delete_category(
    _app_handle: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    let db_path = database::get_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    database::delete_category(&conn, &id).map_err(|e| e.to_string())?;
    
    info!("Category deleted: {}", id);
    Ok(())
}

