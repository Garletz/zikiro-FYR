use crate::database::{
    get_logs_db_path, init_security_database, insert_secure_log_entry, get_secure_logs,
    get_last_secure_log, get_next_chain_index, save_app_clock, get_app_clock,
    insert_anomaly, get_anomalies, get_unresolved_anomalies, resolve_anomaly,
    save_compliance_report, get_security_config, save_security_config
};
use crate::models::{
    SecureLogEntry, AppClock, Anomaly, AnomalyType, AnomalySeverity,
    ComplianceReport, SecurityConfig, LogType, LogCategory
};
use rusqlite::Connection;
use tracing::info;
use chrono::{Utc, DateTime};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSecureLogRequest {
    pub log_type: LogType,
    pub category: LogCategory,
    pub title: String,
    pub description: String,
    pub amount: Option<f64>,
    pub session_id: String,
    pub user_signature: String,
    pub table_id: Option<String>,
    pub table_name: Option<String>,
    pub product_id: Option<String>,
    pub product_name: Option<String>,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnomalyDetectionRequest {
    pub session_id: String,
    pub enable_chain_validation: bool,
    pub enable_time_validation: bool,
    pub max_time_drift: i64,
    pub suspicious_amount_threshold: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComplianceReportRequest {
    pub period_start: String,
    pub period_end: String,
    pub country_code: String,
}

#[command]
pub async fn init_security_system() -> Result<(), String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    init_security_database(&db_path).map_err(|e| e.to_string())?;
    
    info!("Security system initialized successfully");
    Ok(())
}

#[command]
pub async fn create_secure_log_entry(request: CreateSecureLogRequest) -> Result<SecureLogEntry, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    // Obtenir le prochain index de chaîne
    let chain_index = get_next_chain_index(&conn).map_err(|e| e.to_string())?;
    
    // Obtenir le hash du log précédent
    let previous_hash = get_last_secure_log(&conn)
        .map_err(|e| e.to_string())?
        .map(|log| log.current_hash);
    
    // Obtenir l'horloge de l'application
    let app_clock = get_app_clock(&conn, &request.session_id)
        .map_err(|e| e.to_string())?
        .unwrap_or_else(|| AppClock::new(request.session_id.clone()));
    
    let app_clock_time = app_clock.get_total_usage_time();
    
    let secure_log = SecureLogEntry::new(
        request.log_type,
        request.category,
        request.title,
        request.description,
        request.amount,
        previous_hash,
        app_clock_time,
        request.session_id,
        request.user_signature,
        chain_index,
        request.table_id,
        request.table_name,
        request.product_id,
        request.product_name,
        request.user_id,
        request.user_name,
        request.metadata,
    );
    
    insert_secure_log_entry(&conn, &secure_log).map_err(|e| e.to_string())?;
    
    info!("Secure log entry created: {} (chain_index: {})", secure_log.title, chain_index);
    Ok(secure_log)
}

#[command]
pub async fn get_secure_logs_command(limit: Option<i32>) -> Result<Vec<SecureLogEntry>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_secure_logs(&conn, limit).map_err(|e| e.to_string())
}

#[command]
pub async fn create_app_clock(session_id: String) -> Result<AppClock, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let app_clock = AppClock::new(session_id.clone());
    save_app_clock(&conn, &app_clock).map_err(|e| e.to_string())?;
    
    info!("App clock created for session: {}", session_id);
    Ok(app_clock)
}

#[command]
pub async fn get_app_clock_command(session_id: String) -> Result<Option<AppClock>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_app_clock(&conn, &session_id).map_err(|e| e.to_string())
}

#[command]
pub async fn update_app_clock(session_id: String, duration: i64) -> Result<(), String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut app_clock = get_app_clock(&conn, &session_id)
        .map_err(|e| e.to_string())?
        .unwrap_or_else(|| AppClock::new(session_id.clone()));
    
    app_clock.increment_usage_time(duration);
    save_app_clock(&conn, &app_clock).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[command]
pub async fn detect_anomalies(request: AnomalyDetectionRequest) -> Result<Vec<Anomaly>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut anomalies = Vec::new();
    
    // Vérifier l'intégrité de la chaîne si activée
    if request.enable_chain_validation {
        let chain_anomalies = detect_chain_anomalies(&conn).map_err(|e| e.to_string())?;
        anomalies.extend(chain_anomalies);
    }
    
    // Vérifier la cohérence temporelle si activée
    if request.enable_time_validation {
        let time_anomalies = detect_time_anomalies(&conn, &request.session_id, request.max_time_drift)
            .map_err(|e| e.to_string())?;
        anomalies.extend(time_anomalies);
    }
    
    // Détecter les montants suspects
    let amount_anomalies = detect_amount_anomalies(&conn, request.suspicious_amount_threshold)
        .map_err(|e| e.to_string())?;
    anomalies.extend(amount_anomalies);
    
    // Sauvegarder les anomalies détectées
    for anomaly in &anomalies {
        insert_anomaly(&conn, anomaly).map_err(|e| e.to_string())?;
    }
    
    info!("Detected {} anomalies", anomalies.len());
    Ok(anomalies)
}

#[command]
pub async fn get_anomalies_command(limit: Option<i32>) -> Result<Vec<Anomaly>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_anomalies(&conn, limit).map_err(|e| e.to_string())
}

#[command]
pub async fn get_unresolved_anomalies_command() -> Result<Vec<Anomaly>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_unresolved_anomalies(&conn).map_err(|e| e.to_string())
}

#[command]
pub async fn resolve_anomaly_command(anomaly_id: String, resolved_by: String) -> Result<(), String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    resolve_anomaly(&conn, &anomaly_id, &resolved_by).map_err(|e| e.to_string())?;
    
    info!("Anomaly {} resolved by {}", anomaly_id, resolved_by);
    Ok(())
}

#[command]
pub async fn generate_compliance_report(request: ComplianceReportRequest) -> Result<ComplianceReport, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let period_start = DateTime::parse_from_rfc3339(&request.period_start)
        .map_err(|e| e.to_string())?
        .with_timezone(&Utc);
    
    let period_end = DateTime::parse_from_rfc3339(&request.period_end)
        .map_err(|e| e.to_string())?
        .with_timezone(&Utc);
    
    // Obtenir les logs de la période
    let logs = get_secure_logs(&conn, None).map_err(|e| e.to_string())?;
    let period_logs: Vec<_> = logs
        .into_iter()
        .filter(|log| log.created_at >= period_start && log.created_at <= period_end)
        .collect();
    
    // Calculer les statistiques
    let total_transactions = period_logs.len() as i64;
    let total_amount: f64 = period_logs
        .iter()
        .filter_map(|log| log.amount)
        .sum();
    
    // Vérifier l'intégrité de la chaîne
    let chain_integrity = verify_chain_integrity(&period_logs);
    
    // Vérifier la cohérence temporelle
    let time_consistency = verify_time_consistency(&period_logs);
    
    // Compter les anomalies
    let anomalies = get_anomalies(&conn, None).map_err(|e| e.to_string())?;
    let period_anomalies: Vec<_> = anomalies
        .into_iter()
        .filter(|anomaly| anomaly.timestamp >= period_start && anomaly.timestamp <= period_end)
        .collect();
    
    let anomalies_count = period_anomalies.len() as i64;
    
    // Générer la signature du rapport
    let report_data = format!(
        "{}{}{}{}{}{}{}{}",
        period_start.to_rfc3339(),
        period_end.to_rfc3339(),
        request.country_code,
        total_transactions,
        total_amount,
        anomalies_count,
        chain_integrity,
        time_consistency
    );
    
    let report_signature = generate_signature(&report_data);
    
    let report = ComplianceReport {
        id: Uuid::new_v4().to_string(),
        period_start,
        period_end,
        country_code: request.country_code,
        total_transactions,
        total_amount,
        anomalies_count,
        chain_integrity,
        time_consistency,
        generated_at: Utc::now(),
        report_signature,
    };
    
    save_compliance_report(&conn, &report).map_err(|e| e.to_string())?;
    
    info!("Compliance report generated for period: {} to {}", 
          period_start.to_rfc3339(), period_end.to_rfc3339());
    Ok(report)
}

#[command]
pub async fn get_security_config_command() -> Result<Option<SecurityConfig>, String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    get_security_config(&conn).map_err(|e| e.to_string())
}

#[command]
pub async fn save_security_config_command(config: SecurityConfig) -> Result<(), String> {
    let db_path = get_logs_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    save_security_config(&conn, &config).map_err(|e| e.to_string())?;
    
    info!("Security configuration saved");
    Ok(())
}

// Fonctions utilitaires pour la détection d'anomalies
fn detect_chain_anomalies(conn: &Connection) -> Result<Vec<Anomaly>, rusqlite::Error> {
    let logs = get_secure_logs(conn, None)?;
    let mut anomalies = Vec::new();
    
    for i in 1..logs.len() {
        let current = &logs[i];
        let previous = &logs[i - 1];
        
        if current.previous_hash.as_deref() != Some(&previous.current_hash) {
            let anomaly = Anomaly::new(
                AnomalyType::ChainBreak,
                AnomalySeverity::Critical,
                format!("Rupture dans la chaîne de transactions à l'index {}", current.chain_index),
                serde_json::to_string(&serde_json::json!({
                    "current_index": current.chain_index,
                    "current_hash": current.current_hash,
                    "expected_previous_hash": previous.current_hash,
                    "actual_previous_hash": current.previous_hash
                })).unwrap(),
                vec![
                    "Vérifier l'intégrité de la base de données".to_string(),
                    "Contacter l'administrateur système".to_string(),
                    "Analyser les logs système".to_string()
                ]
            );
            anomalies.push(anomaly);
        }
    }
    
    Ok(anomalies)
}

fn detect_time_anomalies(conn: &Connection, session_id: &str, max_drift: i64) -> Result<Vec<Anomaly>, rusqlite::Error> {
    let app_clock = get_app_clock(conn, session_id)?;
    let mut anomalies = Vec::new();
    
    if let Some(clock) = app_clock {
        if !clock.validate_time_consistency(max_drift) {
            let anomaly = Anomaly::new(
                AnomalyType::TimeDrift,
                AnomalySeverity::High,
                "Dérive temporelle détectée dans l'horloge interne".to_string(),
                serde_json::to_string(&serde_json::json!({
                    "session_id": session_id,
                    "app_clock_time": clock.get_total_usage_time(),
                    "system_time": Utc::now().timestamp(),
                    "max_drift": max_drift
                })).unwrap(),
                vec![
                    "Vérifier la synchronisation de l'horloge".to_string(),
                    "Redémarrer l'application si nécessaire".to_string(),
                    "Contacter le support technique".to_string()
                ]
            );
            anomalies.push(anomaly);
        }
    }
    
    Ok(anomalies)
}

fn detect_amount_anomalies(conn: &Connection, threshold: f64) -> Result<Vec<Anomaly>, rusqlite::Error> {
    let logs = get_secure_logs(conn, None)?;
    let mut anomalies = Vec::new();
    
    for log in logs {
        if let Some(amount) = log.amount {
            if amount > threshold {
                let anomaly = Anomaly::new(
                    AnomalyType::SuspiciousAmount,
                    AnomalySeverity::Medium,
                    format!("Montant suspect détecté: {}€", amount),
                    serde_json::to_string(&serde_json::json!({
                        "amount": amount,
                        "threshold": threshold,
                        "transaction_id": log.id,
                        "timestamp": log.created_at.to_rfc3339()
                    })).unwrap(),
                    vec![
                        "Vérifier la transaction manuellement".to_string(),
                        "Contacter le client si nécessaire".to_string(),
                        "Documenter la justification".to_string()
                    ]
                );
                anomalies.push(anomaly);
            }
        }
    }
    
    Ok(anomalies)
}

fn verify_chain_integrity(logs: &[SecureLogEntry]) -> bool {
    for i in 1..logs.len() {
        let current = &logs[i];
        let previous = &logs[i - 1];
        
        if current.previous_hash.as_deref() != Some(&previous.current_hash) {
            return false;
        }
    }
    true
}

fn verify_time_consistency(logs: &[SecureLogEntry]) -> bool {
    if logs.is_empty() {
        return true;
    }
    
    let mut last_timestamp = logs[0].created_at;
    for log in logs.iter().skip(1) {
        if log.created_at < last_timestamp {
            return false;
        }
        last_timestamp = log.created_at;
    }
    true
}

fn generate_signature(data: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    format!("{:x}", hasher.finalize())
}
