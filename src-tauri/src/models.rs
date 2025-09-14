use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub price: f64,
    pub cost: f64,
    pub category_id: String,
    pub barcode: Option<String>,
    pub sku: Option<String>,
    pub stock_quantity: i32,
    pub min_stock: i32,
    pub image_url: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub tax_rate_id: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Table {
    pub id: String,
    pub number: i32,
    pub name: String,
    pub capacity: i32,
    pub status: TableStatus,
    pub position_x: i32,
    pub position_y: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum TableStatus {
    Free,
    Occupied,
    Reserved,
    Cleaning,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TableReservation {
    pub id: String,
    pub table_id: String,
    pub customer_name: String,
    pub customer_phone: Option<String>,
    pub customer_email: Option<String>,
    pub reservation_date: String,
    pub reservation_time: String,
    pub duration_minutes: i32,
    pub party_size: i32,
    pub special_requests: Option<String>,
    pub status: ReservationStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ReservationStatus {
    Confirmed,
    Cancelled,
    Completed,
    NoShow,
    Arrived,
}

impl std::fmt::Display for ReservationStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ReservationStatus::Confirmed => write!(f, "confirmed"),
            ReservationStatus::Cancelled => write!(f, "cancelled"),
            ReservationStatus::Completed => write!(f, "completed"),
            ReservationStatus::NoShow => write!(f, "no_show"),
            ReservationStatus::Arrived => write!(f, "arrived"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateReservationRequest {
    pub table_id: String,
    pub customer_name: String,
    pub customer_phone: Option<String>,
    pub customer_email: Option<String>,
    pub reservation_date: String,
    pub reservation_time: String,
    pub duration_minutes: Option<i32>,
    pub party_size: i32,
    pub special_requests: Option<String>,
}

impl std::fmt::Display for TableStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TableStatus::Free => write!(f, "free"),
            TableStatus::Occupied => write!(f, "occupied"),
            TableStatus::Reserved => write!(f, "reserved"),
            TableStatus::Cleaning => write!(f, "cleaning"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProductRequest {
    pub name: String,
    pub description: Option<String>,
    pub price: f64,
    pub cost: Option<f64>,
    pub category_id: String,
    pub barcode: Option<String>,
    pub sku: Option<String>,
    pub stock_quantity: Option<i32>,
    pub min_stock: Option<i32>,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProductRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub price: Option<f64>,
    pub cost: Option<f64>,
    pub category_id: Option<String>,
    pub barcode: Option<String>,
    pub sku: Option<String>,
    pub stock_quantity: Option<i32>,
    pub min_stock: Option<i32>,
    pub image_url: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub tax_rate_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub tax_rate_id: Option<String>,
    pub is_active: Option<bool>,
}

impl Product {
    pub fn new(
        name: String,
        price: f64,
        cost: Option<f64>,
        category_id: String,
        stock_quantity: Option<i32>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description: None,
            price,
            cost: cost.unwrap_or(0.0),
            category_id,
            barcode: None,
            sku: None,
            stock_quantity: stock_quantity.unwrap_or(0),
            min_stock: 0,
            image_url: None,
            is_active: true,
            created_at: now,
            updated_at: now,
        }
    }
}

impl Category {
    pub fn new(name: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description: None,
            color: None,
            tax_rate_id: Some("fr-standard".to_string()), // TVA standard par défaut
            is_active: true,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTableRequest {
    pub number: i32,
    pub name: String,
    pub capacity: i32,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UpdateTableRequest {
    pub number: Option<i32>,
    pub name: Option<String>,
    pub capacity: Option<i32>,
    pub status: Option<TableStatus>,
    pub position_x: Option<i32>,
    pub position_y: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CartItem {
    pub product_id: String,
    pub product_name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub total_price: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TableCart {
    pub id: String,
    pub table_id: String,
    pub items: Vec<CartItem>,
    pub total_amount: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateCartItemRequest {
    pub product_id: String,
    pub product_name: String,
    pub quantity: i32,
    pub unit_price: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCartItemRequest {
    pub quantity: i32,
}

impl Table {
    pub fn new(number: i32, name: String, capacity: i32) -> Self {
        let now = Utc::now();
        // Position simple basée sur le numéro de table (côte à côte)
        let position_x = 100 + (number - 1) * 150; // 150px d'espacement entre les tables
        let position_y = 100;
        Self {
            id: Uuid::new_v4().to_string(),
            number,
            name,
            capacity,
            status: TableStatus::Free,
            position_x,
            position_y,
            created_at: now,
            updated_at: now,
        }
    }
}

// ===== PLANNER MODULE MODELS =====

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Size {
    pub width: f64,
    pub height: f64,
    pub depth: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RoomSize {
    pub width: f64,
    pub height: f64,
    pub depth: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ObjectType {
    Table,
    Chair,
    Bar,
    Kitchen,
    Bathroom,
    Entrance,
    Wall,
    Decoration,
    Test,
}

impl std::fmt::Display for ObjectType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ObjectType::Table => write!(f, "table"),
            ObjectType::Chair => write!(f, "chair"),
            ObjectType::Bar => write!(f, "bar"),
            ObjectType::Kitchen => write!(f, "kitchen"),
            ObjectType::Bathroom => write!(f, "bathroom"),
            ObjectType::Entrance => write!(f, "entrance"),
            ObjectType::Wall => write!(f, "wall"),
            ObjectType::Decoration => write!(f, "decoration"),
            ObjectType::Test => write!(f, "test"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CatalogItem {
    pub id: String,
    pub object_type: ObjectType,
    pub name: String,
    pub icon: String,
    pub size: Size,
    pub color: String,
    pub category: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlannerItem {
    pub id: String,
    pub layout_id: String,
    pub object_type: ObjectType,
    pub name: String,
    pub position: Position,
    pub size: Size,
    pub rotation: f64,
    pub color: String,
    pub metadata: Option<String>, // JSON string
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlannerLayout {
    pub id: String,
    pub name: String,
    pub room_size: RoomSize,
    pub metadata: Option<String>, // JSON string
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlannerLayoutRequest {
    pub name: String,
    pub room_size: RoomSize,
    pub metadata: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlannerLayoutRequest {
    pub name: Option<String>,
    pub room_size: Option<RoomSize>,
    pub metadata: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlannerItemRequest {
    pub layout_id: String,
    pub object_type: ObjectType,
    pub name: String,
    pub position: Position,
    pub size: Size,
    pub rotation: f64,
    pub color: String,
    pub metadata: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlannerItemRequest {
    pub name: Option<String>,
    pub position: Option<Position>,
    pub size: Option<Size>,
    pub rotation: Option<f64>,
    pub color: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlannerLayoutWithItems {
    pub layout: PlannerLayout,
    pub items: Vec<PlannerItem>,
}

impl CatalogItem {
    pub fn new(
        object_type: ObjectType,
        name: String,
        icon: String,
        size: Size,
        color: String,
        category: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            object_type,
            name,
            icon,
            size,
            color,
            category,
            description: None,
        }
    }
}

impl PlannerItem {
    pub fn new(
        layout_id: String,
        object_type: ObjectType,
        name: String,
        position: Position,
        size: Size,
        rotation: f64,
        color: String,
        metadata: Option<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            layout_id,
            object_type,
            name,
            position,
            size,
            rotation,
            color,
            metadata,
            created_at: now,
            updated_at: now,
        }
    }
}

impl PlannerLayout {
    pub fn new(name: String, room_size: RoomSize) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            room_size,
            metadata: None,
            created_at: now,
            updated_at: now,
        }
    }
}

// ===== ORDERS MODULE MODELS =====

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Order {
    pub id: String,
    pub order_number: String,
    pub table_id: String,
    pub table_name: String,
    pub items: Vec<OrderItem>,
    pub total_amount: f64,
    pub status: String,   // "pending", "in_kitchen", "ready", "completed"
    pub is_deleted: bool, // Pour la corbeille
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderItem {
    pub product_id: String,
    pub product_name: String,
    pub quantity: i32,
    pub unit_price: f64,
    pub total_price: f64,
    pub status: String, // "active", "cancelled"
}

impl Order {
    pub fn new(
        order_number: String,
        table_id: String,
        table_name: String,
        items: Vec<OrderItem>,
    ) -> Self {
        let total_amount = items.iter().map(|item| item.total_price).sum();
        Self {
            id: Uuid::new_v4().to_string(),
            order_number,
            table_id,
            table_name,
            items,
            total_amount,
            status: "pending".to_string(),
            is_deleted: false,
            created_at: Utc::now(),
        }
    }
}

// ===== LOGS MODULE MODELS =====

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum LogType {
    Financial,
    System,
    User,
    Error,
    Warning,
    Info,
}

impl std::fmt::Display for LogType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogType::Financial => write!(f, "financial"),
            LogType::System => write!(f, "system"),
            LogType::User => write!(f, "user"),
            LogType::Error => write!(f, "error"),
            LogType::Warning => write!(f, "warning"),
            LogType::Info => write!(f, "info"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum LogCategory {
    Sale,
    Refund,
    TableStatus,
    Product,
    Category,
    User,
    System,
    Error,
    Other,
}

impl std::fmt::Display for LogCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LogCategory::Sale => write!(f, "sale"),
            LogCategory::Refund => write!(f, "refund"),
            LogCategory::TableStatus => write!(f, "table_status"),
            LogCategory::Product => write!(f, "product"),
            LogCategory::Category => write!(f, "category"),
            LogCategory::User => write!(f, "user"),
            LogCategory::System => write!(f, "system"),
            LogCategory::Error => write!(f, "error"),
            LogCategory::Other => write!(f, "other"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogEntry {
    pub id: String,
    pub log_type: LogType,
    pub category: LogCategory,
    pub title: String,
    pub description: String,
    pub amount: Option<f64>,
    pub table_id: Option<String>,
    pub table_name: Option<String>,
    pub product_id: Option<String>,
    pub product_name: Option<String>,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub metadata: Option<String>, // JSON string for additional data
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateLogEntryRequest {
    pub log_type: LogType,
    pub category: LogCategory,
    pub title: String,
    pub description: String,
    pub amount: Option<f64>,
    pub table_id: Option<String>,
    pub table_name: Option<String>,
    pub product_id: Option<String>,
    pub product_name: Option<String>,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LogFilter {
    pub log_type: Option<LogType>,
    pub category: Option<LogCategory>,
    pub table_id: Option<String>,
    pub product_id: Option<String>,
    pub user_id: Option<String>,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub min_amount: Option<f64>,
    pub max_amount: Option<f64>,
}

impl LogEntry {
    pub fn new(
        log_type: LogType,
        category: LogCategory,
        title: String,
        description: String,
        amount: Option<f64>,
        table_id: Option<String>,
        table_name: Option<String>,
        product_id: Option<String>,
        product_name: Option<String>,
        user_id: Option<String>,
        user_name: Option<String>,
        metadata: Option<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            log_type,
            category,
            title,
            description,
            amount,
            table_id,
            table_name,
            product_name,
            product_id,
            user_id,
            user_name,
            metadata,
            created_at: now,
        }
    }
}

// ===== SECURITY & AUDIT MODELS =====

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecureLogEntry {
    pub id: String,
    pub log_type: LogType,
    pub category: LogCategory,
    pub title: String,
    pub description: String,
    pub amount: Option<f64>,

    // Sécurité renforcée
    pub previous_hash: Option<String>,
    pub current_hash: String,
    pub app_clock: i64,
    pub system_clock: i64,
    pub session_id: String,
    pub user_signature: String,
    pub chain_index: i64,

    // Données transactionnelles
    pub table_id: Option<String>,
    pub table_name: Option<String>,
    pub product_id: Option<String>,
    pub product_name: Option<String>,
    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub metadata: Option<String>,

    // Horodatage sécurisé
    pub created_at: DateTime<Utc>,
    pub secure_timestamp: String, // Timestamp signé
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppClock {
    pub session_id: String,
    pub start_time: i64,
    pub total_usage_time: i64,
    pub last_activity: i64,
    pub system_start_time: i64,
    pub clock_signature: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Anomaly {
    pub id: String,
    pub anomaly_type: AnomalyType,
    pub severity: AnomalySeverity,
    pub description: String,
    pub timestamp: DateTime<Utc>,
    pub evidence: String, // JSON string
    pub recommendations: Vec<String>,
    pub resolved: bool,
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolved_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum AnomalyType {
    TimeDrift,
    MissingTransaction,
    ChainBreak,
    SuspiciousAmount,
    RapidTransactions,
    UserAnomaly,
    SystemTampering,
    ClockManipulation,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum AnomalySeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComplianceReport {
    pub id: String,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub country_code: String,
    pub total_transactions: i64,
    pub total_amount: f64,
    pub anomalies_count: i64,
    pub chain_integrity: bool,
    pub time_consistency: bool,
    pub generated_at: DateTime<Utc>,
    pub report_signature: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecurityConfig {
    pub enable_chain_validation: bool,
    pub enable_time_validation: bool,
    pub enable_anomaly_detection: bool,
    pub max_time_drift: i64,           // en secondes
    pub min_transaction_interval: i64, // en millisecondes
    pub suspicious_amount_threshold: f64,
    pub compliance_country: String,
    pub retention_period: i64, // en jours
    pub enable_real_time_monitoring: bool,
}

impl SecureLogEntry {
    pub fn new(
        log_type: LogType,
        category: LogCategory,
        title: String,
        description: String,
        amount: Option<f64>,
        previous_hash: Option<String>,
        app_clock: i64,
        session_id: String,
        user_signature: String,
        chain_index: i64,
        table_id: Option<String>,
        table_name: Option<String>,
        product_id: Option<String>,
        product_name: Option<String>,
        user_id: Option<String>,
        user_name: Option<String>,
        metadata: Option<String>,
    ) -> Self {
        let now = Utc::now();
        let system_clock = now.timestamp();

        // Calculer le hash de la transaction
        let data_to_hash = format!(
            "{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}{}",
            log_type.to_string(),
            category.to_string(),
            title,
            description,
            amount.unwrap_or(0.0),
            app_clock,
            system_clock,
            session_id,
            user_signature,
            chain_index,
            table_id.as_deref().unwrap_or(""),
            table_name.as_deref().unwrap_or(""),
            product_id.as_deref().unwrap_or(""),
            product_name.as_deref().unwrap_or(""),
            user_id.as_deref().unwrap_or(""),
            user_name.as_deref().unwrap_or(""),
            metadata.as_deref().unwrap_or("")
        );

        let current_hash = Self::calculate_hash(&data_to_hash, previous_hash.as_deref());
        let secure_timestamp = Self::generate_secure_timestamp(&now);

        Self {
            id: Uuid::new_v4().to_string(),
            log_type,
            category,
            title,
            description,
            amount,
            previous_hash,
            current_hash,
            app_clock,
            system_clock,
            session_id,
            user_signature,
            chain_index,
            table_id,
            table_name,
            product_id,
            product_name,
            user_id,
            user_name,
            metadata,
            created_at: now,
            secure_timestamp,
        }
    }

    fn calculate_hash(data: &str, previous_hash: Option<&str>) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        if let Some(prev_hash) = previous_hash {
            hasher.update(prev_hash.as_bytes());
        }
        format!("{:x}", hasher.finalize())
    }

    fn generate_secure_timestamp(timestamp: &DateTime<Utc>) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(timestamp.to_rfc3339().as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

impl AppClock {
    pub fn new(session_id: String) -> Self {
        let now = Utc::now();
        let system_start_time = now.timestamp();
        let clock_signature = Self::generate_clock_signature(&now, &session_id);

        Self {
            session_id,
            start_time: system_start_time,
            total_usage_time: 0,
            last_activity: system_start_time,
            system_start_time,
            clock_signature,
        }
    }

    fn generate_clock_signature(timestamp: &DateTime<Utc>, session_id: &str) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(timestamp.to_rfc3339().as_bytes());
        hasher.update(session_id.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub fn increment_usage_time(&mut self, duration: i64) {
        self.total_usage_time += duration;
        self.last_activity = Utc::now().timestamp();
    }

    pub fn get_total_usage_time(&self) -> i64 {
        let current_time = Utc::now().timestamp();
        self.total_usage_time + (current_time - self.start_time)
    }

    pub fn validate_time_consistency(&self, max_drift: i64) -> bool {
        let system_time = Utc::now().timestamp();
        let app_time = self.get_total_usage_time();
        let drift = (system_time - app_time).abs();
        drift <= max_drift
    }
}

impl Anomaly {
    pub fn new(
        anomaly_type: AnomalyType,
        severity: AnomalySeverity,
        description: String,
        evidence: String,
        recommendations: Vec<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            anomaly_type,
            severity,
            description,
            timestamp: Utc::now(),
            evidence,
            recommendations,
            resolved: false,
            resolved_at: None,
            resolved_by: None,
        }
    }
}

impl std::fmt::Display for AnomalyType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AnomalyType::TimeDrift => write!(f, "time_drift"),
            AnomalyType::MissingTransaction => write!(f, "missing_transaction"),
            AnomalyType::ChainBreak => write!(f, "chain_break"),
            AnomalyType::SuspiciousAmount => write!(f, "suspicious_amount"),
            AnomalyType::RapidTransactions => write!(f, "rapid_transactions"),
            AnomalyType::UserAnomaly => write!(f, "user_anomaly"),
            AnomalyType::SystemTampering => write!(f, "system_tampering"),
            AnomalyType::ClockManipulation => write!(f, "clock_manipulation"),
        }
    }
}

impl std::fmt::Display for AnomalySeverity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AnomalySeverity::Low => write!(f, "low"),
            AnomalySeverity::Medium => write!(f, "medium"),
            AnomalySeverity::High => write!(f, "high"),
            AnomalySeverity::Critical => write!(f, "critical"),
        }
    }
}

// ===== PRINTER CONFIGURATION MODELS =====

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterConfig {
    pub id: String,
    pub name: String,
    pub port: Option<String>,
    pub driver: Option<String>,
    pub status: String,
    pub is_default: bool,
    pub paper_sizes: Vec<String>,
    pub capabilities: PrinterCapabilities,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterCapabilities {
    pub supports_escpos: bool,
    pub supports_raw: bool,
    pub max_width: i32,
    pub supports_graphics: bool,
}

impl Default for PrinterCapabilities {
    fn default() -> Self {
        Self {
            supports_escpos: false,
            supports_raw: false,
            max_width: 80,
            supports_graphics: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrinterLog {
    pub id: String,
    pub printer_id: String,
    pub printer_name: String,
    pub action: String,
    pub success: bool,
    pub error_message: Option<String>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

impl PrinterConfig {
    pub fn new(name: String, port: Option<String>, driver: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            port,
            driver,
            status: "active".to_string(),
            is_default: false,
            paper_sizes: vec!["80mm".to_string(), "58mm".to_string()],
            capabilities: PrinterCapabilities::default(),
            created_at: now,
            updated_at: now,
        }
    }

    pub fn set_as_default(&mut self) {
        self.is_default = true;
        self.updated_at = Utc::now();
    }


}

impl PrinterLog {
    pub fn new(printer_id: String, printer_name: String, action: String, success: bool) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            printer_id,
            printer_name,
            action,
            success,
            error_message: None,
            metadata: serde_json::json!({}),
            created_at: Utc::now(),
        }
    }
}

// ===== MASTER STOCKS MODULE MODELS =====

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Ingredient {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub unit: String, // kg, L, pièces, etc.
    pub current_stock: f64,
    pub min_stock: f64,
    pub max_stock: f64,
    pub cost_per_unit: f64,
    pub supplier_id: Option<String>,
    pub barcode: Option<String>,
    pub image_url: Option<String>,
    pub expiration_date: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Supplier {
    pub id: String,
    pub name: String,
    pub contact_person: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub payment_terms: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Invoice {
    pub id: String,
    pub invoice_number: String,
    pub supplier_id: String,
    pub supplier_name: String,
    pub invoice_date: DateTime<Utc>,
    pub total_amount: f64,
    pub image_url: Option<String>,
    pub status: InvoiceStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum InvoiceStatus {
    Pending,
    Processed,
    Error,
}

impl std::fmt::Display for InvoiceStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            InvoiceStatus::Pending => write!(f, "pending"),
            InvoiceStatus::Processed => write!(f, "processed"),
            InvoiceStatus::Error => write!(f, "error"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InvoiceItem {
    pub id: String,
    pub invoice_id: String,
    pub ingredient_id: Option<String>,
    pub ingredient_name: String,
    pub quantity: f64,
    pub unit: String,
    pub unit_price: f64,
    pub total_price: f64,
    pub expiration_date: Option<DateTime<Utc>>,
    pub barcode: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockMovement {
    pub id: String,
    pub ingredient_id: String,
    pub movement_type: StockMovementType,
    pub quantity: f64,
    pub unit: String,
    pub reason: String,
    pub reference_id: Option<String>, // invoice_id, order_id, etc.
    pub created_by: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum StockMovementType {
    In,
    Out,
    Adjustment,
    Expired,
}

impl std::fmt::Display for StockMovementType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StockMovementType::In => write!(f, "in"),
            StockMovementType::Out => write!(f, "out"),
            StockMovementType::Adjustment => write!(f, "adjustment"),
            StockMovementType::Expired => write!(f, "expired"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockAlert {
    pub id: String,
    pub ingredient_id: String,
    pub alert_type: StockAlertType,
    pub message: String,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum StockAlertType {
    LowStock,
    OutOfStock,
    ExpiringSoon,
    Expired,
}

impl std::fmt::Display for StockAlertType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StockAlertType::LowStock => write!(f, "low_stock"),
            StockAlertType::OutOfStock => write!(f, "out_of_stock"),
            StockAlertType::ExpiringSoon => write!(f, "expiring_soon"),
            StockAlertType::Expired => write!(f, "expired"),
        }
    }
}

// Request/Response models for API
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateIngredientRequest {
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub unit: String,
    pub min_stock: f64,
    pub max_stock: f64,
    pub cost_per_unit: f64,
    pub supplier_id: Option<String>,
    pub barcode: Option<String>,
    pub image_url: Option<String>,
    pub expiration_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateIngredientRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub unit: Option<String>,
    pub current_stock: Option<f64>,
    pub min_stock: Option<f64>,
    pub max_stock: Option<f64>,
    pub cost_per_unit: Option<f64>,
    pub supplier_id: Option<String>,
    pub barcode: Option<String>,
    pub image_url: Option<String>,
    pub expiration_date: Option<DateTime<Utc>>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSupplierRequest {
    pub name: String,
    pub contact_person: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub payment_terms: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateSupplierRequest {
    pub name: Option<String>,
    pub contact_person: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub payment_terms: Option<String>,
    pub is_active: Option<bool>,
}

// AI Invoice Analysis models
#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceAnalysisRequest {
    pub image_data: String,
    pub mime_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceAnalysisResponse {
    pub success: bool,
    pub invoice_data: Option<InvoiceData>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceData {
    pub supplier_name: String,
    pub invoice_number: String,
    pub invoice_date: String,
    pub total_amount: f64,
    pub items: Vec<InvoiceItemData>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceItemData {
    pub name: String,
    pub quantity: f64,
    pub unit: String,
    pub unit_price: f64,
    pub total_price: f64,
    pub expiration_date: Option<String>,
    pub barcode: Option<String>,
}

// Implementations
impl Ingredient {
    pub fn new(
        name: String,
        category: String,
        unit: String,
        min_stock: f64,
        max_stock: f64,
        cost_per_unit: f64,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description: None,
            category,
            unit,
            current_stock: 0.0,
            min_stock,
            max_stock,
            cost_per_unit,
            supplier_id: None,
            barcode: None,
            image_url: None,
            expiration_date: None,
            is_active: true,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn get_stock_level(&self) -> StockLevel {
        if self.current_stock <= 0.0 {
            StockLevel::OutOfStock
        } else if self.current_stock <= self.min_stock {
            StockLevel::LowStock
        } else if self.current_stock >= self.max_stock * 0.75 {
            StockLevel::HighStock
        } else {
            StockLevel::NormalStock
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum StockLevel {
    OutOfStock,
    LowStock,
    NormalStock,
    HighStock,
}

impl std::fmt::Display for StockLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StockLevel::OutOfStock => write!(f, "out_of_stock"),
            StockLevel::LowStock => write!(f, "low_stock"),
            StockLevel::NormalStock => write!(f, "normal_stock"),
            StockLevel::HighStock => write!(f, "high_stock"),
        }
    }
}

impl Supplier {
    pub fn new(name: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            contact_person: None,
            email: None,
            phone: None,
            address: None,
            payment_terms: None,
            is_active: true,
            created_at: now,
            updated_at: now,
        }
    }
}

impl Invoice {
    // Constructor will be added when needed for invoice creation
}

impl InvoiceItem {
    // Constructor will be added when needed for invoice item creation
}

impl StockMovement {
    pub fn new(
        ingredient_id: String,
        movement_type: StockMovementType,
        quantity: f64,
        unit: String,
        reason: String,
        reference_id: Option<String>,
        created_by: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            ingredient_id,
            movement_type,
            quantity,
            unit,
            reason,
            reference_id,
            created_by,
            created_at: Utc::now(),
        }
    }
}

impl StockAlert {
    pub fn new(
        ingredient_id: String,
        alert_type: StockAlertType,
        message: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            ingredient_id,
            alert_type,
            message,
            is_read: false,
            created_at: Utc::now(),
        }
    }
}

// ===== SMS MODELS =====

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SMSMessage {
    pub id: String,
    pub phone_number: String,
    pub message: String,
    pub status: SMSStatus,
    pub sent_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
    pub template_id: Option<String>,
    pub ticket_id: Option<String>,
    pub order_id: Option<String>,
    pub table_id: Option<String>,
    pub customer_name: Option<String>,
    pub provider: SMSProvider,
    pub cost: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum SMSStatus {
    Pending,
    Sent,
    Delivered,
    Failed,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum SMSProvider {
    None,
    SmsGatewayAndroid,
    Infobip,
    Sim800900,
    Twilio,
    MessageBird,
    SIM800C,
    SIM900A,
    Custom,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SMSTemplate {
    pub id: String,
    pub name: String,
    pub content: String,
    pub variables: Option<Vec<String>>,
    pub is_active: bool,
    pub category: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SMSContact {
    pub id: String,
    pub name: String,
    pub phone_number: String,
    pub email: Option<String>,
    pub company: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_active: bool,
    pub last_contact: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SMSConfig {
    pub id: i32,
    pub provider: SMSProvider,
    pub api_key: Option<String>,
    pub api_secret: Option<String>,
    pub sender_name: Option<String>,
    pub webhook_url: Option<String>,
    pub sim_port: Option<String>,
    pub sim_baud_rate: Option<i32>,
    pub is_enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// SMS Gateway Android Configuration
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SMSGatewayAndroidConfig {
    pub id: i32,
    pub device_ip: String,
    pub port: i32,
    pub username: String,
    pub password: String,
    pub is_enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Infobip Configuration
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InfobipConfig {
    pub id: i32,
    pub api_key: String,
    pub base_url: String,
    pub sender_name: String,
    pub is_enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// SIM 800/900 Configuration
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SIM800900Config {
    pub id: i32,
    pub port: String,
    pub baud_rate: i32,
    pub pin_code: Option<String>,
    pub is_enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Provider Selection
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProviderSelection {
    pub id: i32,
    pub default_provider: String,
    pub simulation_mode: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SMSConversation {
    pub id: String,
    pub contact_id: String,
    pub phone_number: String,
    pub last_message: Option<String>,
    pub last_message_at: Option<DateTime<Utc>>,
    pub unread_count: i32,
    pub is_archived: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Request/Response models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateSMSMessageRequest {
    pub phone_number: String,
    pub message: String,
    pub template_id: Option<String>,
    pub ticket_id: Option<String>,
    pub order_id: Option<String>,
    pub table_id: Option<String>,
    pub customer_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateSMSTemplateRequest {
    pub name: String,
    pub content: String,
    pub variables: Option<Vec<String>>,
    pub category: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateSMSTemplateRequest {
    pub name: Option<String>,
    pub content: Option<String>,
    pub variables: Option<Vec<String>>,
    pub category: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateSMSContactRequest {
    pub name: String,
    pub phone_number: String,
    pub email: Option<String>,
    pub company: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateSMSContactRequest {
    pub name: Option<String>,
    pub phone_number: Option<String>,
    pub email: Option<String>,
    pub company: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateSMSConfigRequest {
    pub provider: Option<SMSProvider>,
    pub api_key: Option<String>,
    pub api_secret: Option<String>,
    pub sender_name: Option<String>,
    pub webhook_url: Option<String>,
    pub sim_port: Option<String>,
    pub sim_baud_rate: Option<i32>,
    pub is_enabled: Option<bool>,
}

impl SMSMessage {
    pub fn new(
        phone_number: String,
        message: String,
        template_id: Option<String>,
        ticket_id: Option<String>,
        order_id: Option<String>,
        table_id: Option<String>,
        customer_name: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            phone_number,
            message,
            status: SMSStatus::Pending,
            sent_at: None,
            delivered_at: None,
            error_message: None,
            template_id,
            ticket_id,
            order_id,
            table_id,
            customer_name,
            provider: SMSProvider::None,
            cost: 0.0,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

impl SMSTemplate {
    pub fn new(
        name: String,
        content: String,
        variables: Option<Vec<String>>,
        category: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            content,
            variables,
            is_active: true,
            category,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

impl SMSContact {
    pub fn new(
        name: String,
        phone_number: String,
        email: Option<String>,
        company: Option<String>,
        tags: Option<Vec<String>>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            phone_number,
            email,
            company,
            tags,
            is_active: true,
            last_contact: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

// Test request models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TestSMSGatewayAndroidRequest {
    pub device_ip: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub test_phone: String,
    pub test_message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TestInfobipRequest {
    pub api_key: String,
    pub base_url: String,
    pub sender_name: String,
    pub test_phone: String,
    pub test_message: String,
}

// AI Configuration Models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AIConfig {
    pub id: String,
    pub provider: String,
    pub api_key: String,
    pub api_url: String,
    pub model: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIConfigRequest {
    pub provider: String,
    pub api_key: String,
    pub api_url: Option<String>,
    pub model: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIConfigResponse {
    pub success: bool,
    pub config: Option<AIConfig>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AITestRequest {
    pub provider: String,
    pub api_key: String,
    pub api_url: Option<String>,
    pub model: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AITestResponse {
    pub success: bool,
    pub message: String,
    pub error: Option<String>,
}

impl AIConfig {
    pub fn new(request: AIConfigRequest) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            provider: request.provider,
            api_key: request.api_key,
            api_url: request.api_url.unwrap_or_default(),
            model: request.model,
            is_active: request.is_active.unwrap_or(true),
            created_at: now,
            updated_at: now,
        }
    }
}
