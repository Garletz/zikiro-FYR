use serde::{Deserialize, Serialize};
use rusqlite::{Connection, Result as SqliteResult};
use crate::database;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusinessInfo {
    pub id: Option<i32>,
    pub business_name: String,
    pub business_address: String,
    pub business_phone: String,
    pub business_email: String,
    pub business_website: Option<String>,
    pub business_logo: Option<String>,
    pub business_description: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TaxSettings {
    pub id: Option<i32>,
    pub selected_country: String,
    pub auto_calculate: bool,
    pub show_tax_details: bool,
    pub round_tax: bool,
    pub tax_inclusive: bool,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPreferences {
    pub id: Option<i32>,
    pub theme: String,
    pub language: String,
    pub currency: String,
    pub date_format: String,
    pub time_format: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemConfig {
    pub id: Option<i32>,
    pub app_version: String,
    pub last_backup: Option<String>,
    pub auto_backup: bool,
    pub backup_frequency: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}


// Initialize business database
pub fn init_business_db(db_path: &str) -> SqliteResult<()> {
    let conn = Connection::open(db_path)?;
    
    // Create business_info table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS business_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_name TEXT NOT NULL,
            business_address TEXT NOT NULL,
            business_phone TEXT NOT NULL,
            business_email TEXT NOT NULL,
            business_website TEXT,
            business_logo TEXT,
            business_description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create tax_settings table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tax_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            selected_country TEXT NOT NULL DEFAULT 'FR',
            auto_calculate BOOLEAN NOT NULL DEFAULT 1,
            show_tax_details BOOLEAN NOT NULL DEFAULT 1,
            round_tax BOOLEAN NOT NULL DEFAULT 1,
            tax_inclusive BOOLEAN NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create user_preferences table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS user_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            theme TEXT NOT NULL DEFAULT 'light',
            language TEXT NOT NULL DEFAULT 'fr',
            currency TEXT NOT NULL DEFAULT 'EUR',
            date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
            time_format TEXT NOT NULL DEFAULT '24h',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // Create system_config table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS system_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_version TEXT NOT NULL,
            last_backup TEXT,
            auto_backup BOOLEAN NOT NULL DEFAULT 0,
            backup_frequency TEXT NOT NULL DEFAULT 'daily',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    Ok(())
}

// Tauri commands
#[tauri::command]
pub async fn get_business_info(_app_handle: tauri::AppHandle) -> Result<BusinessInfo, String> {
    let db_path = database::get_business_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT * FROM business_info ORDER BY id DESC LIMIT 1")
        .map_err(|e| e.to_string())?;
    
    // Try to get existing data, return default if none exists
    match stmt.query_row([], |row| {
        Ok(BusinessInfo {
            id: Some(row.get(0)?),
            business_name: row.get(1)?,
            business_address: row.get(2)?,
            business_phone: row.get(3)?,
            business_email: row.get(4)?,
            business_website: row.get(5)?,
            business_logo: row.get(6)?,
            business_description: row.get(7)?,
            created_at: Some(row.get(8)?),
            updated_at: Some(row.get(9)?),
        })
    }) {
        Ok(business_info) => Ok(business_info),
        Err(_) => {
            // Return default values if no data exists
            Ok(BusinessInfo {
                id: None,
                business_name: String::new(),
                business_address: String::new(),
                business_phone: String::new(),
                business_email: String::new(),
                business_website: None,
                business_logo: None,
                business_description: None,
                created_at: None,
                updated_at: None,
            })
        }
    }
}

#[tauri::command]
pub async fn save_business_info(
    _app_handle: tauri::AppHandle,
    info: BusinessInfo,
) -> Result<(), String> {
    let db_path = database::get_business_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    if let Some(id) = info.id {
        // Update existing
        conn.execute(
            "UPDATE business_info SET 
                business_name = ?1, 
                business_address = ?2, 
                business_phone = ?3, 
                business_email = ?4, 
                business_website = ?5, 
                business_logo = ?6, 
                business_description = ?7, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?8",
            [
                &info.business_name,
                &info.business_address,
                &info.business_phone,
                &info.business_email,
                &info.business_website.unwrap_or_default(),
                &info.business_logo.unwrap_or_default(),
                &info.business_description.unwrap_or_default(),
                &id.to_string(),
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        // Insert new
        conn.execute(
            "INSERT INTO business_info (
                business_name, business_address, business_phone, business_email, 
                business_website, business_logo, business_description
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [
                &info.business_name,
                &info.business_address,
                &info.business_phone,
                &info.business_email,
                &info.business_website.unwrap_or_default(),
                &info.business_logo.unwrap_or_default(),
                &info.business_description.unwrap_or_default(),
            ],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_tax_settings(_app_handle: tauri::AppHandle) -> Result<TaxSettings, String> {
    let db_path = database::get_business_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT * FROM tax_settings ORDER BY id DESC LIMIT 1")
        .map_err(|e| e.to_string())?;
    
    // Try to get existing data, return default if none exists
    match stmt.query_row([], |row| {
        Ok(TaxSettings {
            id: Some(row.get(0)?),
            selected_country: row.get(1)?,
            auto_calculate: row.get::<_, i32>(2)? != 0, // Convert INTEGER to boolean
            show_tax_details: row.get::<_, i32>(3)? != 0, // Convert INTEGER to boolean
            round_tax: row.get::<_, i32>(4)? != 0, // Convert INTEGER to boolean
            tax_inclusive: row.get::<_, i32>(5)? != 0, // Convert INTEGER to boolean
            created_at: Some(row.get(6)?),
            updated_at: Some(row.get(7)?),
        })
    }) {
        Ok(tax_settings) => Ok(tax_settings),
        Err(_) => {
            // Return default values if no data exists
            Ok(TaxSettings {
                id: None,
                selected_country: "FR".to_string(),
                auto_calculate: true,
                show_tax_details: true,
                round_tax: true,
                tax_inclusive: false,
                created_at: None,
                updated_at: None,
            })
        }
    }
}

#[tauri::command]
pub async fn save_tax_settings(
    _app_handle: tauri::AppHandle,
    settings: TaxSettings,
) -> Result<(), String> {
    let db_path = database::get_business_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    if let Some(id) = settings.id {
        // Update existing
        conn.execute(
            "UPDATE tax_settings SET 
                selected_country = ?1, 
                auto_calculate = ?2, 
                show_tax_details = ?3, 
                round_tax = ?4, 
                tax_inclusive = ?5, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?6",
            [
                &settings.selected_country,
                &(settings.auto_calculate as i32).to_string(),
                &(settings.show_tax_details as i32).to_string(),
                &(settings.round_tax as i32).to_string(),
                &(settings.tax_inclusive as i32).to_string(),
                &id.to_string(),
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        // Insert new
        conn.execute(
            "INSERT INTO tax_settings (
                selected_country, auto_calculate, show_tax_details, 
                round_tax, tax_inclusive
            ) VALUES (?1, ?2, ?3, ?4, ?5)",
            [
                &settings.selected_country,
                &(settings.auto_calculate as i32).to_string(),
                &(settings.show_tax_details as i32).to_string(),
                &(settings.round_tax as i32).to_string(),
                &(settings.tax_inclusive as i32).to_string(),
            ],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_user_preferences(_app_handle: tauri::AppHandle) -> Result<UserPreferences, String> {
    let db_path = database::get_business_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT * FROM user_preferences ORDER BY id DESC LIMIT 1")
        .map_err(|e| e.to_string())?;
    
    let user_preferences = stmt.query_row([], |row| {
        Ok(UserPreferences {
            id: Some(row.get(0)?),
            theme: row.get(1)?,
            language: row.get(2)?,
            currency: row.get(3)?,
            date_format: row.get(4)?,
            time_format: row.get(5)?,
            created_at: Some(row.get(6)?),
            updated_at: Some(row.get(7)?),
        })
    }).map_err(|e| e.to_string())?;

    Ok(user_preferences)
}

#[tauri::command]
pub async fn save_user_preferences(
    _app_handle: tauri::AppHandle,
    preferences: UserPreferences,
) -> Result<(), String> {
    let db_path = database::get_business_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    if let Some(id) = preferences.id {
        // Update existing
        conn.execute(
            "UPDATE user_preferences SET 
                theme = ?1, 
                language = ?2, 
                currency = ?3, 
                date_format = ?4, 
                time_format = ?5, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?6",
            [
                &preferences.theme,
                &preferences.language,
                &preferences.currency,
                &preferences.date_format,
                &preferences.time_format,
                &id.to_string(),
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        // Insert new
        conn.execute(
            "INSERT INTO user_preferences (
                theme, language, currency, date_format, time_format
            ) VALUES (?1, ?2, ?3, ?4, ?5)",
            [
                &preferences.theme,
                &preferences.language,
                &preferences.currency,
                &preferences.date_format,
                &preferences.time_format,
            ],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_system_config(_app_handle: tauri::AppHandle) -> Result<SystemConfig, String> {
    let db_path = database::get_business_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT * FROM system_config ORDER BY id DESC LIMIT 1")
        .map_err(|e| e.to_string())?;
    
    let system_config = stmt.query_row([], |row| {
        Ok(SystemConfig {
            id: Some(row.get(0)?),
            app_version: row.get(1)?,
            last_backup: row.get(2)?,
            auto_backup: row.get(3)?,
            backup_frequency: row.get(4)?,
            created_at: Some(row.get(5)?),
            updated_at: Some(row.get(6)?),
        })
    }).map_err(|e| e.to_string())?;

    Ok(system_config)
}

#[tauri::command]
pub async fn save_system_config(
    _app_handle: tauri::AppHandle,
    config: SystemConfig,
) -> Result<(), String> {
    let db_path = database::get_business_db_path().map_err(|e| e.to_string())?;
    let conn = database::get_connection(&db_path).map_err(|e| e.to_string())?;
    
    if let Some(id) = config.id {
        // Update existing
        conn.execute(
            "UPDATE system_config SET 
                app_version = ?1, 
                last_backup = ?2, 
                auto_backup = ?3, 
                backup_frequency = ?4, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?5",
            [
                &config.app_version,
                &config.last_backup.unwrap_or_default(),
                &config.auto_backup.to_string(),
                &config.backup_frequency,
                &id.to_string(),
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        // Insert new
        conn.execute(
            "INSERT INTO system_config (
                app_version, last_backup, auto_backup, backup_frequency
            ) VALUES (?1, ?2, ?3, ?4)",
            [
                &config.app_version,
                &config.last_backup.unwrap_or_default(),
                &config.auto_backup.to_string(),
                &config.backup_frequency,
            ],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}
