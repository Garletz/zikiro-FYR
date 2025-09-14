use crate::database::{get_logs_db_path, insert_log_entry, get_all_logs, get_logs_with_filter, get_financial_logs, get_logs_by_category, delete_old_logs, get_logs_count};
use crate::models::{LogEntry, CreateLogEntryRequest, LogFilter, LogType, LogCategory};
use rusqlite::Connection;
use tracing::info;

#[tauri::command]
pub async fn create_log_entry(request: CreateLogEntryRequest) -> Result<LogEntry, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let log_entry = LogEntry::new(
        request.log_type,
        request.category,
        request.title,
        request.description,
        request.amount,
        request.table_id,
        request.table_name,
        request.product_id,
        request.product_name,
        request.user_id,
        request.user_name,
        request.metadata,
    );
    
    insert_log_entry(&conn, &log_entry).map_err(|e| e.to_string())?;
    
    info!("Log entry created: {}", log_entry.title);
    Ok(log_entry)
}

#[tauri::command]
pub async fn get_logs_command(limit: Option<i32>) -> Result<Vec<LogEntry>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_all_logs(&conn, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_logs_with_filter_command(filter: LogFilter, limit: Option<i32>) -> Result<Vec<LogEntry>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_logs_with_filter(&conn, &filter, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_financial_logs_command(start_date: Option<String>, end_date: Option<String>) -> Result<Vec<LogEntry>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let start: Option<chrono::DateTime<chrono::Utc>> = if let Some(date_str) = start_date {
        Some(chrono::DateTime::parse_from_rfc3339(&date_str)
            .map_err(|e| e.to_string())?
            .with_timezone(&chrono::Utc))
    } else {
        None
    };
    
    let end: Option<chrono::DateTime<chrono::Utc>> = if let Some(date_str) = end_date {
        Some(chrono::DateTime::parse_from_rfc3339(&date_str)
            .map_err(|e| e.to_string())?
            .with_timezone(&chrono::Utc))
    } else {
        None
    };
    
    get_financial_logs(&conn, start, end).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_logs_by_category_command(category: LogCategory, limit: Option<i32>) -> Result<Vec<LogEntry>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_logs_by_category(&conn, &category, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_old_logs_command(days_to_keep: i32) -> Result<usize, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let deleted_count = delete_old_logs(&conn, days_to_keep).map_err(|e| e.to_string())?;
    info!("Deleted {} old log entries", deleted_count);
    Ok(deleted_count)
}

#[tauri::command]
pub async fn get_logs_count_command() -> Result<i32, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_logs_count(&conn).map_err(|e| e.to_string())
}

// Helper function to log common events
#[tauri::command]
pub async fn log_sale_event(
    table_id: Option<String>, 
    table_name: Option<String>, 
    amount: f64, 
    items_count: i32,
    payment_method: Option<String>,
    customer_name: Option<String>,
    items: Option<String>
) -> Result<(), String> {
    let mut description = format!("Vente de {} articles pour un total de {:.2}€", items_count, amount);
    
    if let Some(table_name) = &table_name {
        description = format!("{} - Table: {}", description, table_name);
    }
    
    if let Some(payment_method) = &payment_method {
        description = format!("{} - Paiement: {}", description, payment_method);
    }
    
    if let Some(customer_name) = &customer_name {
        description = format!("{} - Client: {}", description, customer_name);
    }
    
    let mut metadata = format!("{{\"items_count\": {}", items_count);
    if let Some(payment_method) = payment_method {
        metadata = format!("{}, \"payment_method\": \"{}\"", metadata, payment_method);
    }
    if let Some(customer_name) = customer_name {
        metadata = format!("{}, \"customer_name\": \"{}\"", metadata, customer_name);
    }
    if let Some(items) = items {
        metadata = format!("{}, \"items\": {}", metadata, items);
    }
    metadata = format!("{}}}", metadata);
    
    let request = CreateLogEntryRequest {
        log_type: LogType::Financial,
        category: LogCategory::Sale,
        title: "Vente effectuée".to_string(),
        description,
        amount: Some(amount),
        table_id,
        table_name,
        product_id: None,
        product_name: None,
        user_id: None,
        user_name: None,
        metadata: Some(metadata),
    };
    
    create_log_entry(request).await?;
    Ok(())
}

#[tauri::command]
pub async fn log_table_status_change(table_id: String, table_name: String, old_status: String, new_status: String) -> Result<(), String> {
    let request = CreateLogEntryRequest {
        log_type: LogType::System,
        category: LogCategory::TableStatus,
        title: "Changement de statut de table".to_string(),
        description: format!("Table {} : {} → {}", table_name, old_status, new_status),
        amount: None,
        table_id: Some(table_id),
        table_name: Some(table_name),
        product_id: None,
        product_name: None,
        user_id: None,
        user_name: None,
        metadata: Some(format!("{{\"old_status\": \"{}\", \"new_status\": \"{}\"}}", old_status, new_status)),
    };
    
    create_log_entry(request).await?;
    Ok(())
}

#[tauri::command]
pub async fn log_product_event(category: LogCategory, product_id: String, product_name: String, action: String) -> Result<(), String> {
    let request = CreateLogEntryRequest {
        log_type: LogType::System,
        category,
        title: format!("{} - {}", action, product_name),
        description: format!("Produit {} : {}", product_name, action),
        amount: None,
        table_id: None,
        table_name: None,
        product_id: Some(product_id),
        product_name: Some(product_name),
        user_id: None,
        user_name: None,
        metadata: Some(format!("{{\"action\": \"{}\"}}", action)),
    };
    
    create_log_entry(request).await?;
    Ok(())
}
