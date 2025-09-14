use crate::models::{AIConfig, AIConfigRequest, AIConfigResponse, AITestRequest, AITestResponse};
use crate::database::{get_business_db_path, get_connection, init_ai_config_database};
use rusqlite::params;
use serde_json::json;
use tracing::info;
use chrono::Utc;

// Récupérer la configuration AI actuelle
#[tauri::command]
pub async fn get_ai_config() -> Result<Option<AIConfig>, String> {
    let db_path = get_business_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, provider, api_key, api_url, model, is_active, created_at, updated_at 
         FROM ai_config 
         WHERE is_active = 1 
         ORDER BY updated_at DESC 
         LIMIT 1"
    ).map_err(|e| e.to_string())?;
    
    let config_result = stmt.query_row([], |row| {
        Ok(AIConfig {
            id: row.get(0)?,
            provider: row.get(1)?,
            api_key: row.get(2)?,
            api_url: row.get(3)?,
            model: row.get(4)?,
            is_active: row.get(5)?,
            created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .unwrap()
                .with_timezone(&Utc),
            updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .unwrap()
                .with_timezone(&Utc),
        })
    });
    
    match config_result {
        Ok(config) => Ok(Some(config)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// Sauvegarder la configuration AI
#[tauri::command]
pub async fn save_ai_config(config: AIConfigRequest) -> Result<AIConfigResponse, String> {
    // Initialiser la base de données si nécessaire
    init_ai_config_database().map_err(|e| e.to_string())?;
    
    let db_path = get_business_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    // Désactiver toutes les configurations existantes
    conn.execute("UPDATE ai_config SET is_active = 0", [])
        .map_err(|e| e.to_string())?;
    
    // Créer la nouvelle configuration
    let new_config = AIConfig::new(config);
    let now = Utc::now().to_rfc3339();
    
    conn.execute(
        "INSERT INTO ai_config (id, provider, api_key, api_url, model, is_active, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            new_config.id,
            new_config.provider,
            new_config.api_key,
            new_config.api_url,
            new_config.model,
            new_config.is_active,
            now,
            now
        ]
    ).map_err(|e| e.to_string())?;
    
    info!("AI configuration saved successfully");
    
    Ok(AIConfigResponse {
        success: true,
        config: Some(new_config),
        error: None,
    })
}

// Tester la configuration AI
#[tauri::command]
pub async fn test_ai_config(test_config: AITestRequest) -> Result<AITestResponse, String> {
    info!("Testing AI configuration for provider: {}", test_config.provider);
    
    let client = reqwest::Client::new();
    let mut response = AITestResponse {
        success: false,
        message: String::new(),
        error: None,
    };
    
    if test_config.provider == "gemini" {
        let test_body = json!({
            "contents": [{
                "parts": [{
                    "text": "Hello, this is a test message. Please respond with 'Test successful' if you can read this."
                }]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "topP": 0.8,
                "topK": 40
            }
        });
        
        let api_url = test_config.api_url.unwrap_or_else(|| {
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent".to_string()
        });
        
        let test_response = client
            .post(&format!("{}?key={}", api_url, test_config.api_key))
            .header("Content-Type", "application/json")
            .json(&test_body)
            .send()
            .await
            .map_err(|e| format!("Network error: {}", e))?;
        
        if test_response.status().is_success() {
            response.success = true;
            response.message = "Gemini API connection successful".to_string();
        } else {
            response.error = Some(format!("API returned status: {}", test_response.status()));
        }
    } else {
        response.error = Some("Only Gemini provider is supported".to_string());
    }
    
    Ok(response)
}

// Supprimer la configuration AI
#[tauri::command]
pub async fn delete_ai_config() -> Result<AIConfigResponse, String> {
    let db_path = get_business_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM ai_config", [])
        .map_err(|e| e.to_string())?;
    
    info!("AI configuration deleted successfully");
    
    Ok(AIConfigResponse {
        success: true,
        config: None,
        error: None,
    })
}
