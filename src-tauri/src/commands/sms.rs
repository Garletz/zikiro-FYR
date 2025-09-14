use crate::{database, models::*};
use rusqlite::{Connection, Result};
use tracing::info;
use chrono::Utc;

// ===== SMS MESSAGES COMMANDS =====

#[tauri::command]
pub async fn send_sms(
    _app_handle: tauri::AppHandle,
    request: CreateSMSMessageRequest,
) -> Result<SMSMessage, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let sms_message = SMSMessage::new(
        request.phone_number,
        request.message,
        request.template_id,
        request.ticket_id,
        request.order_id,
        request.table_id,
        request.customer_name,
    );
    
    // Insert message into database
    database::insert_sms_message(&conn, &sms_message).map_err(|e| e.to_string())?;
    
    // Check provider selection and send via configured provider
    let provider_selection = database::get_provider_selection(&conn).map_err(|e| e.to_string())?;
    
    info!("SMS sending - Provider: {}, Simulation mode: {}", provider_selection.default_provider, provider_selection.simulation_mode);
    
    if provider_selection.simulation_mode {
        // Simulation mode - just mark as sent but don't actually send
        let mut simulated_message = sms_message.clone();
        simulated_message.status = SMSStatus::Sent;
        simulated_message.sent_at = Some(Utc::now());
        simulated_message.updated_at = Utc::now();
        database::update_sms_message(&conn, &simulated_message).map_err(|e| e.to_string())?;
        info!("SMS simulated (simulation mode): {}", sms_message.id);
        Ok(simulated_message)
    } else {
        // Real sending - get the active provider configuration
        match provider_selection.default_provider.as_str() {
            "sms_gateway_android" | "smsgatewayandroid" => {
                info!("Attempting to send via SMS Gateway Android");
                if let Some(config) = database::get_sms_gateway_android_config(&conn).map_err(|e| e.to_string())? {
                    info!("SMS Gateway config found - IP: {}, Port: {}, Enabled: {}", config.device_ip, config.port, config.is_enabled);
                    if config.is_enabled {
                        match send_via_sms_gateway_android_real(&sms_message, &config).await {
                            Ok(updated_message) => {
                                info!("SMS sent successfully via SMS Gateway Android");
                                database::update_sms_message(&conn, &updated_message).map_err(|e| e.to_string())?;
                                Ok(updated_message)
                            }
                            Err(e) => {
                                info!("SMS Gateway Android send failed: {}", e);
                                // Marquer le message comme échoué dans la base de données
                                let mut failed_message = sms_message.clone();
                                failed_message.status = SMSStatus::Failed;
                                failed_message.error_message = Some(e.clone());
                                failed_message.updated_at = Utc::now();
                                database::update_sms_message(&conn, &failed_message).map_err(|e| e.to_string())?;
                                Err(format!("Failed to send SMS via SMS Gateway Android: {}", e))
                            }
                        }
                    } else {
                        info!("SMS saved but not sent (SMS Gateway Android disabled): {}", sms_message.id);
                        Ok(sms_message)
                    }
                } else {
                    let mut failed_message = sms_message.clone();
                    failed_message.status = SMSStatus::Failed;
                    failed_message.error_message = Some("SMS Gateway Android not configured".to_string());
                    failed_message.updated_at = Utc::now();
                    database::update_sms_message(&conn, &failed_message).map_err(|e| e.to_string())?;
                    Err("SMS Gateway Android not configured".to_string())
                }
            }
            "infobip" => {
                if let Some(config) = database::get_infobip_config(&conn).map_err(|e| e.to_string())? {
    if config.is_enabled {
                        match send_via_infobip_real(&sms_message, &config).await {
            Ok(updated_message) => {
                database::update_sms_message(&conn, &updated_message).map_err(|e| e.to_string())?;
                Ok(updated_message)
            }
            Err(e) => {
                                // Marquer le message comme échoué dans la base de données
                                let mut failed_message = sms_message.clone();
                                failed_message.status = SMSStatus::Failed;
                                failed_message.error_message = Some(e.clone());
                                failed_message.updated_at = Utc::now();
                                database::update_sms_message(&conn, &failed_message).map_err(|e| e.to_string())?;
                                Err(format!("Failed to send SMS via Infobip: {}", e))
                            }
                        }
                    } else {
                        info!("SMS saved but not sent (Infobip disabled): {}", sms_message.id);
                        Ok(sms_message)
                    }
                } else {
                    let mut failed_message = sms_message.clone();
                    failed_message.status = SMSStatus::Failed;
                    failed_message.error_message = Some("Infobip not configured".to_string());
                    failed_message.updated_at = Utc::now();
                    database::update_sms_message(&conn, &failed_message).map_err(|e| e.to_string())?;
                    Err("Infobip not configured".to_string())
                }
            }
            "sim800_900" => {
                if let Some(config) = database::get_sim800_900_config(&conn).map_err(|e| e.to_string())? {
                    if config.is_enabled {
                        match send_via_sim800900_real(&sms_message, &config).await {
                            Ok(updated_message) => {
                                database::update_sms_message(&conn, &updated_message).map_err(|e| e.to_string())?;
                                Ok(updated_message)
                            }
                            Err(e) => {
                                // Marquer le message comme échoué dans la base de données
                let mut failed_message = sms_message.clone();
                failed_message.status = SMSStatus::Failed;
                failed_message.error_message = Some(e.clone());
                failed_message.updated_at = Utc::now();
                database::update_sms_message(&conn, &failed_message).map_err(|e| e.to_string())?;
                                Err(format!("Failed to send SMS via SIM 800/900: {}", e))
                            }
                        }
                    } else {
                        info!("SMS saved but not sent (SIM 800/900 disabled): {}", sms_message.id);
                        Ok(sms_message)
                    }
                } else {
                    let mut failed_message = sms_message.clone();
                    failed_message.status = SMSStatus::Failed;
                    failed_message.error_message = Some("SIM 800/900 not configured".to_string());
                    failed_message.updated_at = Utc::now();
                    database::update_sms_message(&conn, &failed_message).map_err(|e| e.to_string())?;
                    Err("SIM 800/900 not configured".to_string())
                }
            }
            _ => {
                // No provider or unknown provider - just simulate
                let mut simulated_message = sms_message.clone();
                simulated_message.status = SMSStatus::Sent;
                simulated_message.sent_at = Some(Utc::now());
                simulated_message.updated_at = Utc::now();
                database::update_sms_message(&conn, &simulated_message).map_err(|e| e.to_string())?;
                info!("SMS simulated (no provider configured): {}", sms_message.id);
                Ok(simulated_message)
            }
        }
    }
}

#[tauri::command]
pub async fn get_sms_messages(
    _app_handle: tauri::AppHandle,
    limit: Option<i32>,
) -> Result<Vec<SMSMessage>, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_sms_messages(&conn, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_sms_message_by_id(
    _app_handle: tauri::AppHandle,
    id: String,
) -> Result<Option<SMSMessage>, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_sms_message_by_id(&conn, &id).map_err(|e| e.to_string())
}

// ===== SMS TEMPLATES COMMANDS =====

#[tauri::command]
pub async fn get_sms_templates(
    _app_handle: tauri::AppHandle,
) -> Result<Vec<SMSTemplate>, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_sms_templates(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_sms_template(
    _app_handle: tauri::AppHandle,
    request: CreateSMSTemplateRequest,
) -> Result<SMSTemplate, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let template = SMSTemplate::new(
        request.name,
        request.content,
        request.variables,
        request.category,
    );
    
    database::insert_sms_template(&conn, &template).map_err(|e| e.to_string())?;
    
    info!("SMS template created: {}", template.name);
    Ok(template)
}

#[tauri::command]
pub async fn update_sms_template(
    _app_handle: tauri::AppHandle,
    id: String,
    request: UpdateSMSTemplateRequest,
) -> Result<SMSTemplate, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut template = database::get_sms_template_by_id(&conn, &id)
        .map_err(|e| e.to_string())?
        .ok_or("Template not found")?;
    
    // Update fields if provided
    if let Some(name) = request.name {
        template.name = name;
    }
    if let Some(content) = request.content {
        template.content = content;
    }
    if let Some(variables) = request.variables {
        template.variables = Some(variables);
    }
    if let Some(category) = request.category {
        template.category = category;
    }
    if let Some(is_active) = request.is_active {
        template.is_active = is_active;
    }
    
    template.updated_at = Utc::now();
    
    database::update_sms_template(&conn, &id, &template).map_err(|e| e.to_string())?;
    
    info!("SMS template updated: {}", template.name);
    Ok(template)
}

#[tauri::command]
pub async fn delete_sms_template(
    _app_handle: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::delete_sms_template(&conn, &id).map_err(|e| e.to_string())?;
    
    info!("SMS template deleted: {}", id);
    Ok(())
}

// ===== SMS CONTACTS COMMANDS =====

#[tauri::command]
pub async fn get_sms_contacts(
    _app_handle: tauri::AppHandle,
) -> Result<Vec<SMSContact>, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_sms_contacts(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_sms_contact(
    _app_handle: tauri::AppHandle,
    request: CreateSMSContactRequest,
) -> Result<SMSContact, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let contact = SMSContact::new(
        request.name,
        request.phone_number,
        request.email,
        request.company,
        request.tags,
    );
    
    database::insert_sms_contact(&conn, &contact).map_err(|e| e.to_string())?;
    
    info!("SMS contact created: {}", contact.name);
    Ok(contact)
}

#[tauri::command]
pub async fn update_sms_contact(
    _app_handle: tauri::AppHandle,
    id: String,
    request: UpdateSMSContactRequest,
) -> Result<SMSContact, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut contact = database::get_sms_contact_by_id(&conn, &id)
        .map_err(|e| e.to_string())?
        .ok_or("Contact not found")?;
    
    // Update fields if provided
    if let Some(name) = request.name {
        contact.name = name;
    }
    if let Some(phone_number) = request.phone_number {
        contact.phone_number = phone_number;
    }
    if let Some(email) = request.email {
        contact.email = Some(email);
    }
    if let Some(company) = request.company {
        contact.company = Some(company);
    }
    if let Some(tags) = request.tags {
        contact.tags = Some(tags);
    }
    if let Some(is_active) = request.is_active {
        contact.is_active = is_active;
    }
    
    contact.updated_at = Utc::now();
    
    database::update_sms_contact(&conn, &id, &contact).map_err(|e| e.to_string())?;
    
    info!("SMS contact updated: {}", contact.name);
    Ok(contact)
}

#[tauri::command]
pub async fn delete_sms_contact(
    _app_handle: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::delete_sms_contact(&conn, &id).map_err(|e| e.to_string())?;
    
    info!("SMS contact deleted: {}", id);
    Ok(())
}

// ===== SMS CONFIGURATION COMMANDS =====

#[tauri::command]
pub async fn get_sms_config(
    _app_handle: tauri::AppHandle,
) -> Result<SMSConfig, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_sms_config(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_sms_config(
    _app_handle: tauri::AppHandle,
    request: UpdateSMSConfigRequest,
) -> Result<SMSConfig, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut config = database::get_sms_config(&conn).map_err(|e| e.to_string())?;
    
    // Update fields if provided
    if let Some(provider) = request.provider {
        config.provider = provider;
    }
    if let Some(api_key) = request.api_key {
        config.api_key = Some(api_key);
    }
    if let Some(api_secret) = request.api_secret {
        config.api_secret = Some(api_secret);
    }
    if let Some(sender_name) = request.sender_name {
        config.sender_name = Some(sender_name);
    }
    if let Some(webhook_url) = request.webhook_url {
        config.webhook_url = Some(webhook_url);
    }
    if let Some(sim_port) = request.sim_port {
        config.sim_port = Some(sim_port);
    }
    if let Some(sim_baud_rate) = request.sim_baud_rate {
        config.sim_baud_rate = Some(sim_baud_rate);
    }
    if let Some(is_enabled) = request.is_enabled {
        config.is_enabled = is_enabled;
    }
    
    config.updated_at = Utc::now();
    
    database::update_sms_config(&conn, &config).map_err(|e| e.to_string())?;
    
    info!("SMS config updated");
    Ok(config)
}

// ===== SMS CONVERSATIONS COMMANDS =====

#[tauri::command]
pub async fn get_sms_conversations(
    _app_handle: tauri::AppHandle,
) -> Result<Vec<SMSConversation>, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_sms_conversations(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_sms_conversation_messages(
    _app_handle: tauri::AppHandle,
    conversation_id: String,
) -> Result<Vec<SMSMessage>, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_sms_conversation_messages(&conn, &conversation_id).map_err(|e| e.to_string())
}

// ===== HELPER FUNCTIONS =====
// (Old helper functions removed as they are no longer used)

// ===== SMS PROVIDER TESTING COMMANDS =====

#[tauri::command]
pub async fn test_sms_gateway_android(
    _app_handle: tauri::AppHandle,
    config: TestSMSGatewayAndroidRequest,
) -> Result<bool, String> {
    use crate::providers::sms_gateway::{SMSGatewayConfig, test_sms_gateway_connection};
    
    let sms_gateway_config = SMSGatewayConfig {
        android_ip: config.device_ip,
        port: config.port,
        username: config.username,
        password: config.password,
    };
    
    test_sms_gateway_connection(&sms_gateway_config, Some(&config.test_phone)).await
}

#[tauri::command]
pub async fn test_infobip(
    _app_handle: tauri::AppHandle,
    config: TestInfobipRequest,
) -> Result<bool, String> {
    use crate::providers::infobip::{InfobipConfig, test_infobip_connection};
    
    let infobip_config = InfobipConfig {
        api_key: config.api_key,
        base_url: config.base_url,
        sender_name: config.sender_name,
    };
    
    test_infobip_connection(&infobip_config).await
}

// ===== NEW PROVIDER CONFIGURATION COMMANDS =====

// Provider Selection Commands
#[tauri::command]
pub async fn get_provider_selection(
    _app_handle: tauri::AppHandle,
) -> Result<ProviderSelection, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_provider_selection(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_provider_selection(
    _app_handle: tauri::AppHandle,
    request: ProviderSelection,
) -> Result<ProviderSelection, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut selection = request;
    selection.updated_at = Utc::now();
    
    database::update_provider_selection(&conn, &selection).map_err(|e| e.to_string())?;
    
    info!("Provider selection updated: {:?}", selection.default_provider);
    Ok(selection)
}

// SMS Gateway Android Configuration Commands
#[tauri::command]
pub async fn get_sms_gateway_android_config(
    _app_handle: tauri::AppHandle,
) -> Result<Option<SMSGatewayAndroidConfig>, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_sms_gateway_android_config(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_sms_gateway_android_config(
    _app_handle: tauri::AppHandle,
    request: SMSGatewayAndroidConfig,
) -> Result<SMSGatewayAndroidConfig, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut config = request;
    config.updated_at = Utc::now();
    
    // Check if config exists, if not insert, otherwise update
    match database::get_sms_gateway_android_config(&conn).map_err(|e| e.to_string())? {
        Some(_) => {
            database::update_sms_gateway_android_config(&conn, &config).map_err(|e| e.to_string())?;
        }
        None => {
            config.id = 1; // Set ID for first config
            config.created_at = Utc::now();
            database::insert_sms_gateway_android_config(&conn, &config).map_err(|e| e.to_string())?;
        }
    }
    
    info!("SMS Gateway Android config updated");
    Ok(config)
}

// Infobip Configuration Commands
#[tauri::command]
pub async fn get_infobip_config(
    _app_handle: tauri::AppHandle,
) -> Result<Option<InfobipConfig>, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_infobip_config(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_infobip_config(
    _app_handle: tauri::AppHandle,
    request: InfobipConfig,
) -> Result<InfobipConfig, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut config = request;
    config.updated_at = Utc::now();
    
    // Check if config exists, if not insert, otherwise update
    match database::get_infobip_config(&conn).map_err(|e| e.to_string())? {
        Some(_) => {
            database::update_infobip_config(&conn, &config).map_err(|e| e.to_string())?;
        }
        None => {
            config.id = 1; // Set ID for first config
            config.created_at = Utc::now();
            database::insert_infobip_config(&conn, &config).map_err(|e| e.to_string())?;
        }
    }
    
    info!("Infobip config updated");
    Ok(config)
}

// SIM 800/900 Configuration Commands
#[tauri::command]
pub async fn get_sim800_900_config(
    _app_handle: tauri::AppHandle,
) -> Result<Option<SIM800900Config>, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    database::get_sim800_900_config(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_sim800_900_config(
    _app_handle: tauri::AppHandle,
    request: SIM800900Config,
) -> Result<SIM800900Config, String> {
    let db_path = database::get_sms_db_path().map_err(|e| e.to_string())?;
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    
    let mut config = request;
    config.updated_at = Utc::now();
    
    // Check if config exists, if not insert, otherwise update
    match database::get_sim800_900_config(&conn).map_err(|e| e.to_string())? {
        Some(_) => {
            database::update_sim800_900_config(&conn, &config).map_err(|e| e.to_string())?;
        }
        None => {
            config.id = 1; // Set ID for first config
            config.created_at = Utc::now();
            database::insert_sim800_900_config(&conn, &config).map_err(|e| e.to_string())?;
        }
    }
    
    info!("SIM 800/900 config updated");
    Ok(config)
}

// ===== REAL SMS SENDING FUNCTIONS =====

async fn send_via_sms_gateway_android_real(
    message: &SMSMessage, 
    config: &SMSGatewayAndroidConfig
) -> Result<SMSMessage, String> {
    use crate::providers::sms_gateway::{SMSGatewayConfig, send_sms_via_sms_gateway};
    
    let sms_gateway_config = SMSGatewayConfig {
        android_ip: config.device_ip.clone(),
        port: config.port as u16,
        username: config.username.clone(),
        password: config.password.clone(),
    };
    
    match send_sms_via_sms_gateway(message, &sms_gateway_config).await {
        Ok(mut updated_message) => {
            updated_message.provider = SMSProvider::SmsGatewayAndroid;
            updated_message.updated_at = Utc::now();
            info!("SMS sent successfully via SMS Gateway Android: {}", message.id);
            Ok(updated_message)
        }
        Err(e) => {
            let mut failed_message = message.clone();
            failed_message.status = SMSStatus::Failed;
            failed_message.error_message = Some(e.clone());
            failed_message.updated_at = Utc::now();
            Err(format!("Failed to send SMS via SMS Gateway Android: {}", e))
        }
    }
}

async fn send_via_infobip_real(
    message: &SMSMessage, 
    config: &InfobipConfig
) -> Result<SMSMessage, String> {
    use crate::providers::infobip::{InfobipConfig as ProviderConfig, send_sms_via_infobip};
    
    let infobip_config = ProviderConfig {
        api_key: config.api_key.clone(),
        base_url: config.base_url.clone(),
        sender_name: config.sender_name.clone(),
    };
    
    match send_sms_via_infobip(message, &infobip_config).await {
        Ok(mut updated_message) => {
            updated_message.provider = SMSProvider::Infobip;
            updated_message.updated_at = Utc::now();
            info!("SMS sent successfully via Infobip: {}", message.id);
    Ok(updated_message)
}
        Err(e) => {
            let mut failed_message = message.clone();
            failed_message.status = SMSStatus::Failed;
            failed_message.error_message = Some(e.clone());
            failed_message.updated_at = Utc::now();
            Err(format!("Failed to send SMS via Infobip: {}", e))
        }
    }
}

async fn send_via_sim800900_real(
    message: &SMSMessage, 
    _config: &SIM800900Config
) -> Result<SMSMessage, String> {
    // TODO: Implement real SIM 800/900 sending
    let mut updated_message = message.clone();
    updated_message.status = SMSStatus::Sent;
    updated_message.provider = SMSProvider::Sim800900;
    updated_message.sent_at = Some(Utc::now());
    updated_message.updated_at = Utc::now();
    updated_message.cost = 0.0; // No cost for SIM
    info!("SMS sent via SIM 800/900: {}", message.id);
    Ok(updated_message)
}
