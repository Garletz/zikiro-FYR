// MasterStocks commands for ingredient and stock management
use crate::models::*;
use crate::database::{
    get_masterstock_db_path, init_masterstock_database, get_connection,
    insert_ingredient, get_all_ingredients, get_ingredient_by_id, update_ingredient, delete_ingredient,
    insert_supplier, get_all_suppliers,
    insert_stock_movement, get_stock_movements_by_ingredient,
    insert_stock_alert, get_unread_stock_alerts, mark_alert_as_read
};
use rusqlite::Connection;
use tracing::info;
use chrono::{DateTime, Utc};

// ===== INGREDIENTS COMMANDS =====

#[tauri::command]
pub async fn get_ingredients() -> Result<Vec<Ingredient>, String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    info!("MasterStocks DB path: {:?}", db_path);
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let ingredients = get_all_ingredients(&conn).map_err(|e| e.to_string())?;
    info!("Retrieved {} ingredients from database", ingredients.len());
    Ok(ingredients)
}

#[tauri::command]
pub async fn create_ingredient(request: CreateIngredientRequest) -> Result<Ingredient, String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let ingredient = Ingredient::new(
        request.name,
        request.category,
        request.unit,
        request.min_stock,
        request.max_stock,
        request.cost_per_unit,
    );
    
    // Set additional fields
    let mut ingredient = ingredient;
    ingredient.description = request.description;
    ingredient.supplier_id = request.supplier_id;
    ingredient.barcode = request.barcode;
    ingredient.image_url = request.image_url;
    ingredient.expiration_date = request.expiration_date;
    
    insert_ingredient(&conn, &ingredient).map_err(|e| e.to_string())?;
    
    info!("Ingredient created: {}", ingredient.name);
    Ok(ingredient)
}

#[tauri::command]
pub async fn update_ingredient_command(id: String, request: UpdateIngredientRequest) -> Result<Ingredient, String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut ingredient = get_ingredient_by_id(&conn, &id)
        .map_err(|e| e.to_string())?
        .ok_or("Ingredient not found")?;
    
    // Update fields if provided
    if let Some(name) = request.name {
        ingredient.name = name;
    }
    if let Some(description) = request.description {
        ingredient.description = Some(description);
    }
    if let Some(category) = request.category {
        ingredient.category = category;
    }
    if let Some(unit) = request.unit {
        ingredient.unit = unit;
    }
    if let Some(current_stock) = request.current_stock {
        ingredient.current_stock = current_stock;
    }
    if let Some(min_stock) = request.min_stock {
        ingredient.min_stock = min_stock;
    }
    if let Some(max_stock) = request.max_stock {
        ingredient.max_stock = max_stock;
    }
    if let Some(cost_per_unit) = request.cost_per_unit {
        ingredient.cost_per_unit = cost_per_unit;
    }
    if let Some(supplier_id) = request.supplier_id {
        ingredient.supplier_id = Some(supplier_id);
    }
    if let Some(barcode) = request.barcode {
        ingredient.barcode = Some(barcode);
    }
    if let Some(image_url) = request.image_url {
        ingredient.image_url = Some(image_url);
    }
    if let Some(expiration_date) = request.expiration_date {
        ingredient.expiration_date = Some(expiration_date);
    }
    if let Some(is_active) = request.is_active {
        ingredient.is_active = is_active;
    }
    
    ingredient.updated_at = chrono::Utc::now();
    
    update_ingredient(&conn, &id, &ingredient).map_err(|e| e.to_string())?;
    
    info!("Ingredient updated: {}", ingredient.name);
    Ok(ingredient)
}

#[tauri::command]
pub async fn delete_ingredient_command(id: String) -> Result<(), String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let mut conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    delete_ingredient(&mut conn, &id).map_err(|e| e.to_string())?;
    
    info!("Ingredient deleted: {}", id);
    Ok(())
}

#[tauri::command]
pub async fn update_stock_quantity(ingredient_id: String, quantity: f64, reason: String) -> Result<(), String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut ingredient = get_ingredient_by_id(&conn, &ingredient_id)
        .map_err(|e| e.to_string())?
        .ok_or("Ingredient not found")?;
    
    let old_stock = ingredient.current_stock;
    ingredient.current_stock = quantity;
    ingredient.updated_at = chrono::Utc::now();
    
    update_ingredient(&conn, &ingredient_id, &ingredient).map_err(|e| e.to_string())?;
    
    // Create stock movement record
    let movement_type = if quantity > old_stock {
        StockMovementType::In
    } else if quantity < old_stock {
        StockMovementType::Out
    } else {
        StockMovementType::Adjustment
    };
    
    let movement = StockMovement::new(
        ingredient_id.clone(),
        movement_type,
        (quantity - old_stock).abs(),
        ingredient.unit.clone(),
        reason,
        None,
        None,
    );
    
    insert_stock_movement(&conn, &movement).map_err(|e| e.to_string())?;
    
    // Check for stock alerts
    check_stock_alerts(&conn, &ingredient).map_err(|e| e.to_string())?;
    
    info!("Stock updated for ingredient {}: {} -> {}", ingredient.name, old_stock, quantity);
    Ok(())
}

// ===== SUPPLIERS COMMANDS =====

#[tauri::command]
pub async fn get_suppliers() -> Result<Vec<Supplier>, String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    get_all_suppliers(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_supplier(request: CreateSupplierRequest) -> Result<Supplier, String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut supplier = Supplier::new(request.name);
    supplier.contact_person = request.contact_person;
    supplier.email = request.email;
    supplier.phone = request.phone;
    supplier.address = request.address;
    supplier.payment_terms = request.payment_terms;
    
    insert_supplier(&conn, &supplier).map_err(|e| e.to_string())?;
    
    info!("Supplier created: {}", supplier.name);
    Ok(supplier)
}

// ===== STOCK ALERTS COMMANDS =====

#[tauri::command]
pub async fn get_stock_alerts() -> Result<Vec<StockAlert>, String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    get_unread_stock_alerts(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mark_alert_as_read_command(alert_id: String) -> Result<(), String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    mark_alert_as_read(&conn, &alert_id).map_err(|e| e.to_string())?;
    
    info!("Alert marked as read: {}", alert_id);
    Ok(())
}

// ===== STOCK MOVEMENTS COMMANDS =====

#[tauri::command]
pub async fn get_stock_movements(ingredient_id: String) -> Result<Vec<StockMovement>, String> {
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    if ingredient_id.is_empty() {
        // Get all movements
        let mut stmt = conn.prepare(
            "SELECT id, ingredient_id, movement_type, quantity, unit, reason, reference_id, created_by, created_at FROM stock_movements ORDER BY created_at DESC"
        ).map_err(|e| e.to_string())?;
        
        let movement_iter = stmt.query_map([], |row| {
            let movement_type_str: String = row.get(2)?;
            let movement_type = match movement_type_str.as_str() {
                "in" => StockMovementType::In,
                "out" => StockMovementType::Out,
                "adjustment" => StockMovementType::Adjustment,
                "expired" => StockMovementType::Expired,
                _ => StockMovementType::Adjustment,
            };

            Ok(StockMovement {
                id: row.get(0)?,
                ingredient_id: row.get(1)?,
                movement_type,
                quantity: row.get(3)?,
                unit: row.get(4)?,
                reason: row.get(5)?,
                reference_id: row.get(6)?,
                created_by: row.get(7)?,
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(8)?).unwrap().with_timezone(&Utc),
            })
        }).map_err(|e| e.to_string())?;

        let mut movements = Vec::new();
        for movement in movement_iter {
            movements.push(movement.map_err(|e| e.to_string())?);
        }
        Ok(movements)
    } else {
        get_stock_movements_by_ingredient(&conn, &ingredient_id).map_err(|e| e.to_string())
    }
}

// ===== AI INVOICE ANALYSIS COMMANDS =====

// Removed hardcoded API keys - now using AI config from database

#[tauri::command]
pub async fn analyze_invoice_image(request: InvoiceAnalysisRequest) -> Result<InvoiceAnalysisResponse, String> {
    info!("Starting invoice analysis");
    
    // Get AI configuration from database
    let ai_config = crate::commands::ai_config::get_ai_config().await
        .map_err(|e| format!("Failed to get AI config: {}", e))?
        .ok_or("No AI configuration found. Please configure your AI provider in the AI Settings.")?;
    
    if !ai_config.is_active {
        return Err("AI configuration is not active. Please activate it in the AI Settings.".to_string());
    }
    
    let request_body = serde_json::json!({
        "contents": [{
            "parts": [
                {
                    "text": "Analyze this invoice/receipt image and extract all the information. Respond ONLY with a valid JSON in this exact format: {\"supplier_name\": \"Supplier Name\", \"invoice_number\": \"Invoice Number\", \"invoice_date\": \"YYYY-MM-DD\", \"total_amount\": 123.45, \"items\": [{\"name\": \"Product Name\", \"quantity\": 2.5, \"unit\": \"kg\", \"unit_price\": 10.50, \"total_price\": 26.25, \"expiration_date\": \"YYYY-MM-DD\" (optional), \"barcode\": \"123456789\" (optional)}]} If you cannot see an invoice or the image is unclear, respond with: {\"error\": \"Unable to analyze this image. Please provide a clearer invoice image.\"} Important: Keep the original language of the invoice in your response. Do not translate product names."
                },
                {
                    "inline_data": {
                        "mime_type": request.mime_type,
                        "data": request.image_data
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "topP": 0.8,
            "topK": 40
        }
    });

    let client = reqwest::Client::new();
    let response = if ai_config.provider == "gemini" {
        client
            .post(&format!("{}?key={}", ai_config.api_url, ai_config.api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?
    } else {
        return Err(format!("Only Gemini provider is supported, got: {}", ai_config.provider));
    };

    let status = response.status();
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_default();
        info!("AI API error: {}", error_text);
        return Err(format!("AI API error: {}", status));
    }

    let data: serde_json::Value = response.json().await
        .map_err(|e| format!("Failed to parse AI response: {}", e))?;

    // Parse Gemini response
    let text_value = data["candidates"][0]["content"]["parts"][0]["text"].clone();
    
    let text_response = text_value
        .as_str()
        .ok_or("Invalid response format from AI provider")?;

    info!("Raw AI response: {}", text_response);

    // Clean the response - remove markdown code blocks if present
    let cleaned_response = text_response
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    let parsed_data: serde_json::Value = serde_json::from_str(cleaned_response)
        .map_err(|e| format!("Failed to parse invoice data: {}", e))?;

    if let Some(error_msg) = parsed_data["error"].as_str() {
        return Ok(InvoiceAnalysisResponse {
            success: false,
            invoice_data: None,
            error: Some(error_msg.to_string()),
        });
    }

    let supplier_name = parsed_data["supplier_name"]
        .as_str()
        .ok_or("Missing supplier_name in response")?
        .to_string();
    
    let invoice_number = parsed_data["invoice_number"]
        .as_str()
        .ok_or("Missing invoice_number in response")?
        .to_string();
    
    let invoice_date = parsed_data["invoice_date"]
        .as_str()
        .ok_or("Missing invoice_date in response")?
        .to_string();
    
    let total_amount = parsed_data["total_amount"]
        .as_f64()
        .ok_or("Missing total_amount in response")?;

    let items_array = parsed_data["items"]
        .as_array()
        .ok_or("Invalid items format in response")?;

    let mut items = Vec::new();
    for item in items_array {
        let name = item["name"]
            .as_str()
            .ok_or("Missing name in invoice item")?
            .to_string();
        let quantity = item["quantity"]
            .as_f64()
            .ok_or("Missing quantity in invoice item")?;
        let unit = item["unit"]
            .as_str()
            .unwrap_or("pièce") // Default to "pièce" if null or missing
            .to_string();
        let unit_price = item["unit_price"]
            .as_f64()
            .unwrap_or(0.0); // Default to 0.0 if null or missing
        let total_price = item["total_price"]
            .as_f64()
            .ok_or("Missing total_price in invoice item")?;
        let expiration_date = item["expiration_date"].as_str().map(|s| s.to_string());
        let barcode = item["barcode"].as_str().map(|s| s.to_string());

        items.push(InvoiceItemData {
            name,
            quantity,
            unit,
            unit_price,
            total_price,
            expiration_date,
            barcode,
        });
    }

    let invoice_data = InvoiceData {
        supplier_name,
        invoice_number,
        invoice_date,
        total_amount,
        items,
    };

    info!("Successfully analyzed invoice with {} items", invoice_data.items.len());

    Ok(InvoiceAnalysisResponse {
        success: true,
        invoice_data: Some(invoice_data),
        error: None,
    })
}

#[tauri::command]
pub async fn import_invoice_data(invoice_data: InvoiceData) -> Result<String, String> {
    info!("Starting invoice data import");
    
    let db_path = get_masterstock_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    // Create or find supplier
    let supplier = match get_all_suppliers(&conn).map_err(|e| e.to_string())?
        .iter()
        .find(|s| s.name.to_lowercase() == invoice_data.supplier_name.to_lowercase()) {
        Some(existing_supplier) => existing_supplier.clone(),
        None => {
            let new_supplier = Supplier::new(invoice_data.supplier_name.clone());
            insert_supplier(&conn, &new_supplier).map_err(|e| e.to_string())?;
            new_supplier
        }
    };
    
    let mut imported_count = 0;
    
    // Import each item as an ingredient
    for item in &invoice_data.items {
        // Check if ingredient already exists
        let existing_ingredients = get_all_ingredients(&conn).map_err(|e| e.to_string())?;
        let existing_ingredient = existing_ingredients.iter()
            .find(|ing| ing.name.to_lowercase() == item.name.to_lowercase());
        
        if let Some(existing) = existing_ingredient {
            // Update existing ingredient stock
            let new_stock = existing.current_stock + item.quantity;
            let updated_ingredient = Ingredient {
                current_stock: new_stock,
                ..existing.clone()
            };
            update_ingredient(&conn, &existing.id, &updated_ingredient).map_err(|e| e.to_string())?;
            
            // Create stock movement
            let movement = StockMovement::new(
                existing.id.clone(),
                StockMovementType::In,
                item.quantity,
                item.unit.clone(),
                format!("Import from invoice {}", invoice_data.invoice_number),
                Some(invoice_data.invoice_number.clone()),
                None, // created_by
            );
            insert_stock_movement(&conn, &movement).map_err(|e| e.to_string())?;
        } else {
            // Create new ingredient
            let mut ingredient = Ingredient::new(
                item.name.clone(),
                "Imported".to_string(),
                item.unit.clone(),
                item.quantity * 0.1, // min_stock (10% of imported quantity)
                item.quantity * 2.0, // max_stock (200% of imported quantity)
                item.unit_price,
            );
            
            // Set the current stock to the imported quantity
            ingredient.current_stock = item.quantity;
            ingredient.supplier_id = Some(supplier.id.clone());
            ingredient.description = Some(format!("Imported from invoice {}", invoice_data.invoice_number));
            
            insert_ingredient(&conn, &ingredient).map_err(|e| e.to_string())?;
            
            // Create stock movement
            let movement = StockMovement::new(
                ingredient.id.clone(),
                StockMovementType::In,
                item.quantity,
                item.unit.clone(),
                format!("Initial import from invoice {}", invoice_data.invoice_number),
                Some(invoice_data.invoice_number.clone()),
                None, // created_by
            );
            insert_stock_movement(&conn, &movement).map_err(|e| e.to_string())?;
        }
        
        imported_count += 1;
    }
    
    info!("Successfully imported {} items from invoice", imported_count);
    Ok(format!("Facture importée avec succès ! {} ingrédients ajoutés/mis à jour.", imported_count))
}

// ===== HELPER FUNCTIONS =====

fn check_stock_alerts(conn: &Connection, ingredient: &Ingredient) -> Result<(), Box<dyn std::error::Error>> {
    let stock_level = ingredient.get_stock_level();
    
    match stock_level {
        StockLevel::OutOfStock => {
            let alert = StockAlert::new(
                ingredient.id.clone(),
                StockAlertType::OutOfStock,
                format!("{} is out of stock", ingredient.name),
            );
            insert_stock_alert(conn, &alert)?;
        }
        StockLevel::LowStock => {
            let alert = StockAlert::new(
                ingredient.id.clone(),
                StockAlertType::LowStock,
                format!("{} is running low ({} {})", ingredient.name, ingredient.current_stock, ingredient.unit),
            );
            insert_stock_alert(conn, &alert)?;
        }
        _ => {}
    }
    
    // Check expiration date
    if let Some(expiration_date) = ingredient.expiration_date {
        let days_until_expiry = (expiration_date - chrono::Utc::now()).num_days();
        if days_until_expiry <= 3 && days_until_expiry >= 0 {
            let alert = StockAlert::new(
                ingredient.id.clone(),
                StockAlertType::ExpiringSoon,
                format!("{} expires in {} days", ingredient.name, days_until_expiry),
            );
            insert_stock_alert(conn, &alert)?;
        } else if days_until_expiry < 0 {
            let alert = StockAlert::new(
                ingredient.id.clone(),
                StockAlertType::Expired,
                format!("{} has expired", ingredient.name),
            );
            insert_stock_alert(conn, &alert)?;
        }
    }
    
    Ok(())
}

// ===== INITIALIZATION COMMAND =====

#[tauri::command]
pub async fn init_masterstocks_database() -> Result<(), String> {
    init_masterstock_database().map_err(|e| e.to_string())?;
    info!("MasterStocks database initialized");
    Ok(())
}