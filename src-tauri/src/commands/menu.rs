// Menu analysis commands for Gemini API integration
use crate::models::{Product, Category, CreateProductRequest};
use crate::database::{get_db_path, get_connection, insert_product, insert_category, get_all_categories};
use serde::{Deserialize, Serialize};
// Remove unused import
use tracing::info;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct MenuItem {
    pub name: String,
    pub price: String,
    pub category: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MenuAnalysisRequest {
    pub image_data: String,
    pub mime_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MenuAnalysisResponse {
    pub success: bool,
    pub items: Vec<MenuItem>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportMenuRequest {
    pub items: Vec<MenuItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportMenuResponse {
    pub success: bool,
    pub imported_products: Vec<Product>,
    pub created_categories: Vec<Category>,
    pub error: Option<String>,
}

// Removed hardcoded API keys - now using AI config from database

#[tauri::command]
pub async fn analyze_menu_image(request: MenuAnalysisRequest) -> Result<MenuAnalysisResponse, String> {
    info!("Starting menu analysis");
    
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
                    "text": "Analyze this restaurant menu image and extract all dishes/drinks with their prices. Respond ONLY with a valid JSON in this exact format: {\"items\": [{\"name\": \"Dish/Drink Name\", \"price\": \"Price (e.g., 12.50€, $8.00, etc.)\", \"category\": \"Category name (optional)\"}]} If you cannot see a menu or the image is unclear, respond with: {\"error\": \"Unable to analyze this image. Please provide a clearer menu image.\"} Important: Keep the original language of the menu in your response. Do not translate names or prices."
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
        .map_err(|e| format!("Failed to parse menu data: {}", e))?;

    if let Some(error_msg) = parsed_data["error"].as_str() {
        return Ok(MenuAnalysisResponse {
            success: false,
            items: vec![],
            error: Some(error_msg.to_string()),
        });
    }

    let items_array = parsed_data["items"]
        .as_array()
        .ok_or("Invalid items format in response")?;

    let mut items = Vec::new();
    for item in items_array {
        let name = item["name"]
            .as_str()
            .ok_or("Missing name in menu item")?
            .to_string();
        let price = item["price"]
            .as_str()
            .ok_or("Missing price in menu item")?
            .to_string();
        let category = item["category"].as_str().map(|s| s.to_string());

        items.push(MenuItem { name, price, category });
    }

    info!("Successfully analyzed menu with {} items", items.len());

    Ok(MenuAnalysisResponse {
        success: true,
        items,
        error: None,
    })
}

#[tauri::command]
pub async fn import_menu_items(request: ImportMenuRequest) -> Result<ImportMenuResponse, String> {
    info!("Starting menu import with {} items", request.items.len());
    
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut imported_products = Vec::new();
    let mut created_categories = Vec::new();
    let mut category_map = HashMap::new();
    
    let existing_categories = get_all_categories(&conn).map_err(|e| e.to_string())?;
    for category in &existing_categories {
        category_map.insert(category.name.to_lowercase(), category.id.clone());
    }
    
    for item in request.items {
        let category_id = if let Some(category_name) = item.category {
            let category_lower = category_name.to_lowercase();
            
            if let Some(existing_id) = category_map.get(&category_lower) {
                existing_id.clone()
            } else {
                let new_category = Category::new(category_name.clone());
                insert_category(&conn, &new_category).map_err(|e| e.to_string())?;
                category_map.insert(category_lower, new_category.id.clone());
                created_categories.push(new_category.clone());
                new_category.id
            }
        } else {
            if let Some(default_id) = category_map.get("autres") {
                default_id.clone()
            } else {
                let default_category = Category::new("Autres".to_string());
                insert_category(&conn, &default_category).map_err(|e| e.to_string())?;
                category_map.insert("autres".to_string(), default_category.id.clone());
                created_categories.push(default_category.clone());
                default_category.id
            }
        };
        
        let price = parse_price(&item.price)?;
        
        let product_request = CreateProductRequest {
            name: item.name,
            price,
            cost: Some(price * 0.6),
            category_id,
            description: None,
            barcode: None,
            sku: None,
            stock_quantity: Some(0),
            min_stock: Some(0),
            image_url: None,
        };
        
        let product = Product::new(
            product_request.name.clone(),
            product_request.price,
            product_request.cost,
            product_request.category_id.clone(),
            product_request.stock_quantity,
        );
        
        insert_product(&conn, &product).map_err(|e| e.to_string())?;
        imported_products.push(product);
    }
    
    info!("Successfully imported {} products and created {} categories", 
          imported_products.len(), created_categories.len());
    
    Ok(ImportMenuResponse {
        success: true,
        imported_products,
        created_categories,
        error: None,
    })
}

fn parse_price(price_str: &str) -> Result<f64, String> {
    let cleaned = price_str
        .replace(['€', '$', '£', '¥', '₹', '₽', '₩', '₪', '₦', '₨', '₴', '₸', '₺', '₼', '₾', '₿'], "")
        .trim()
        .replace(',', ".");
    
    cleaned.parse::<f64>()
        .map_err(|_| format!("Invalid price format: {}", price_str))
}
