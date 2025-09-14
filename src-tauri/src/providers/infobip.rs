use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InfobipConfig {
    pub api_key: String,
    pub base_url: String,
    pub sender_name: String,
}

#[derive(Debug, Serialize)]
struct InfobipSMSRequest {
    messages: Vec<InfobipMessage>,
}

#[derive(Debug, Serialize)]
struct InfobipMessage {
    destinations: Vec<InfobipDestination>,
    from: String,
    text: String,
}

#[derive(Debug, Serialize)]
struct InfobipDestination {
    to: String,
}

pub async fn send_sms_via_infobip(
    message: &crate::models::SMSMessage,
    config: &InfobipConfig,
) -> Result<crate::models::SMSMessage, String> {
    let client = reqwest::Client::new();
    
    // S'assurer que l'URL commence par https://
    let base_url = if config.base_url.starts_with("http://") || config.base_url.starts_with("https://") {
        config.base_url.clone()
    } else {
        format!("https://{}", config.base_url)
    };
    
    let sms_request = InfobipSMSRequest {
        messages: vec![InfobipMessage {
            destinations: vec![InfobipDestination {
                to: message.phone_number.clone(),
            }],
            from: config.sender_name.clone(),
            text: message.message.clone(),
        }],
    };
    
    let url = format!("{}/sms/2/text/advanced", base_url);
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("Authorization", format!("App {}", config.api_key))
        .json(&sms_request)
        .send()
        .await
        .map_err(|e| format!("Erreur Infobip: {}", e))?;
    
    let status = response.status();
    if status.is_success() {
        let mut updated_message = message.clone();
        updated_message.status = crate::models::SMSStatus::Sent;
        updated_message.sent_at = Some(chrono::Utc::now());
        updated_message.cost = 0.01; // Approximate Infobip cost
        Ok(updated_message)
    } else {
        let error_text = response.text().await.unwrap_or_default();
        Err(format!("Erreur Infobip ({}): {}", status, error_text))
    }
}

pub async fn test_infobip_connection(config: &InfobipConfig) -> Result<bool, String> {
    let client = reqwest::Client::new();
    
    // S'assurer que l'URL commence par https://
    let base_url = if config.base_url.starts_with("http://") || config.base_url.starts_with("https://") {
        config.base_url.clone()
    } else {
        format!("https://{}", config.base_url)
    };
    
    // Test avec un message simple
    let test_request = InfobipSMSRequest {
        messages: vec![InfobipMessage {
            destinations: vec![InfobipDestination {
                to: "33628782725".to_string(), // Numéro de test par défaut
            }],
            from: config.sender_name.clone(),
            text: "Test de connexion Infobip".to_string(),
        }],
    };
    
    let url = format!("{}/sms/2/text/advanced", base_url);
    
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .header("Authorization", format!("App {}", config.api_key))
        .json(&test_request)
        .send()
        .await
        .map_err(|e| format!("Erreur de connexion Infobip: {}", e))?;
    
    let status = response.status();
    
    if status.is_success() {
        Ok(true)
    } else {
        let response_text = response.text().await.unwrap_or_default();
        Err(format!("Erreur Infobip ({}): {}", status, response_text))
    }
}
