use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SMSGatewayConfig {
    pub android_ip: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
struct SMSRequest {
    #[serde(rename = "textMessage")]
    text_message: TextMessage,
    #[serde(rename = "phoneNumbers")]
    phone_numbers: Vec<String>,
}

#[derive(Debug, Serialize)]
struct TextMessage {
    text: String,
}

pub async fn send_sms_via_sms_gateway(
    message: &crate::models::SMSMessage,
    config: &SMSGatewayConfig,
) -> Result<crate::models::SMSMessage, String> {
    use tracing::info;
    
    let client = reqwest::Client::new();
    
    let sms_request = SMSRequest {
        text_message: TextMessage {
            text: message.message.clone(),
        },
        phone_numbers: vec![message.phone_number.clone()],
    };
    
    let url = format!("http://{}:{}/message", config.android_ip, config.port);
    
    info!("Sending SMS to {} - Phone: {}, Message: {}", url, message.phone_number, message.message);
    
    info!("SMS Gateway request payload: {:?}", sms_request);
    
    let response = client
        .post(&url)
        .basic_auth(&config.username, Some(&config.password))
        .header("Content-Type", "application/json")
        .timeout(std::time::Duration::from_secs(120)) // Timeout de 2 minutes
        .json(&sms_request)
        .send()
        .await
        .map_err(|e| {
            info!("SMS Gateway HTTP request failed: {}", e);
            format!("Erreur SMS Gateway: {}", e)
        })?;
    
    info!("SMS Gateway HTTP response received, status: {}", response.status());
    
    let status = response.status();
    if status.is_success() {
        info!("SMS Gateway response: SUCCESS");
        let mut updated_message = message.clone();
        updated_message.status = crate::models::SMSStatus::Sent;
        updated_message.sent_at = Some(chrono::Utc::now());
        Ok(updated_message)
    } else {
        let error_text = response.text().await.unwrap_or_default();
        info!("SMS Gateway response: FAILED - Status: {}, Error: {}", status, error_text);
        Err(format!("Erreur SMS Gateway ({}): {}", status, error_text))
    }
}

pub async fn test_sms_gateway_connection(config: &SMSGatewayConfig, test_phone: Option<&str>) -> Result<bool, String> {
    let client = reqwest::Client::new();
    
    // Utiliser le numéro fourni ou un numéro par défaut
    let phone_number = test_phone.unwrap_or("33628782725");
    
    // Test avec un message simple
    let test_request = SMSRequest {
        text_message: TextMessage {
            text: "Test de connexion SMS Gateway".to_string(),
        },
        phone_numbers: vec![phone_number.to_string()],
    };
    
    let url = format!("http://{}:{}/message", config.android_ip, config.port);
    
    let response = client
        .post(&url)
        .basic_auth(&config.username, Some(&config.password))
        .header("Content-Type", "application/json")
        .timeout(std::time::Duration::from_secs(120)) // Timeout de 2 minutes
        .json(&test_request)
        .send()
        .await
        .map_err(|e| format!("Erreur de connexion SMS Gateway: {}", e))?;
    
    let status = response.status();
    
    if status.is_success() {
        Ok(true)
    } else {
        let response_text = response.text().await.unwrap_or_default();
        Err(format!("Erreur SMS Gateway ({}): {}", status, response_text))
    }
}
