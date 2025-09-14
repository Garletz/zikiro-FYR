use crate::database::{get_db_path, get_connection, get_all_tables, get_table_by_id, insert_table, update_table, delete_table, get_next_table_number as db_get_next_table_number, is_table_number_taken};
use crate::models::{Table, CreateTableRequest, UpdateTableRequest, TableStatus, TableReservation, CreateReservationRequest, ReservationStatus};
use tauri::command;
use serde_json;

#[command]
pub fn get_tables() -> Result<Vec<Table>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let tables = get_all_tables(&conn).map_err(|e| e.to_string())?;
    Ok(tables)
}

#[command]
pub fn get_table_by_id_command(id: String) -> Result<Option<Table>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    get_table_by_id(&conn, &id).map_err(|e| e.to_string())
}

#[command]
pub fn create_table(request: CreateTableRequest) -> Result<Table, String> {
    
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    // Vérifier si le numéro de table est déjà pris
    if is_table_number_taken(&conn, request.number, None).map_err(|e| e.to_string())? {
        return Err(format!("Le numéro de table {} est déjà utilisé", request.number));
    }
    
    let table = Table::new(request.number, request.name, request.capacity);
    insert_table(&conn, &table).map_err(|e| e.to_string())?;
    
    Ok(table)
}

#[command]
pub fn get_next_table_number_command() -> Result<i32, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    db_get_next_table_number(&conn).map_err(|e| e.to_string())
}

#[command]
pub fn check_table_number(number: i32, exclude_id: Option<String>) -> Result<bool, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    is_table_number_taken(&conn, number, exclude_id.as_deref()).map_err(|e| e.to_string())
}

#[command]
pub fn update_table_command(id: String, request: serde_json::Value) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    // Convertir la requête JSON en UpdateTableRequest
    let mut update_request = UpdateTableRequest {
        number: None,
        name: None,
        capacity: None,
        status: None,
        position_x: None,
        position_y: None,

    };
    
    // Traiter les champs optionnels
    if let Some(number) = request.get("number").and_then(|v| v.as_i64()) {
        update_request.number = Some(number as i32);
    }
    
    if let Some(name) = request.get("name").and_then(|v| v.as_str()) {
        update_request.name = Some(name.to_string());
    }
    
    if let Some(capacity) = request.get("capacity").and_then(|v| v.as_i64()) {
        update_request.capacity = Some(capacity as i32);
    }
    
    if let Some(status_str) = request.get("status").and_then(|v| v.as_str()) {
        let status = match status_str {
            "free" => TableStatus::Free,
            "occupied" => TableStatus::Occupied,
            "reserved" => TableStatus::Reserved,
            "cleaning" => TableStatus::Cleaning,
            _ => return Err(format!("Statut invalide: {}", status_str)),
        };
        update_request.status = Some(status);
    }
    
    if let Some(position_x) = request.get("position_x").and_then(|v| v.as_i64()) {
        update_request.position_x = Some(position_x as i32);
    }
    
    if let Some(position_y) = request.get("position_y").and_then(|v| v.as_i64()) {
        update_request.position_y = Some(position_y as i32);
    }
    

    
    update_table(&conn, &id, &update_request).map_err(|e| e.to_string())
}

#[command]
pub fn delete_table_command(id: String) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    delete_table(&conn, &id).map_err(|e| e.to_string())
}

// ===== RESERVATION COMMANDS =====

#[command]
pub fn create_reservation(reservation: CreateReservationRequest) -> Result<TableReservation, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    // Vérifier que la table existe
    let table = get_table_by_id(&conn, &reservation.table_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Table not found".to_string())?;
    
    // Vérifier la capacité
    if reservation.party_size > table.capacity {
        return Err(format!("Party size ({}) exceeds table capacity ({})", reservation.party_size, table.capacity));
    }
    
    // Créer la réservation
    let reservation_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();
    let duration = reservation.duration_minutes.unwrap_or(120);
    
    let new_reservation = TableReservation {
        id: reservation_id.clone(),
        table_id: reservation.table_id,
        customer_name: reservation.customer_name,
        customer_phone: reservation.customer_phone,
        customer_email: reservation.customer_email,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        duration_minutes: duration,
        party_size: reservation.party_size,
        special_requests: reservation.special_requests,
        status: ReservationStatus::Confirmed,
        created_at: now,
        updated_at: now,
    };
    
    // Insérer en base
    crate::database::insert_reservation(&conn, &new_reservation).map_err(|e| e.to_string())?;
    
    Ok(new_reservation)
}

#[command]
pub fn get_reservations_by_date(date: String) -> Result<Vec<TableReservation>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    crate::database::get_reservations_by_date(&conn, &date).map_err(|e| e.to_string())
}

#[command]
pub fn get_today_reservations() -> Result<Vec<TableReservation>, String> {
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
    get_reservations_by_date(today)
}

#[command]
pub fn update_reservation_status(id: String, status: String) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    
    let reservation_status = match status.as_str() {
        "confirmed" => ReservationStatus::Confirmed,
        "cancelled" => ReservationStatus::Cancelled,
        "completed" => ReservationStatus::Completed,
        "no_show" => ReservationStatus::NoShow,
        _ => return Err("Invalid status".to_string()),
    };
    
    crate::database::update_reservation_status(&conn, &id, reservation_status).map_err(|e| e.to_string())
}

#[command]
pub fn delete_reservation(id: String) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    crate::database::delete_reservation(&conn, &id).map_err(|e| e.to_string())
}

#[command]
pub fn get_reservations_by_table(table_id: String) -> Result<Vec<TableReservation>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let conn = get_connection(&db_path).map_err(|e| e.to_string())?;
    crate::database::get_reservations_by_table(&conn, &table_id).map_err(|e| e.to_string())
}
