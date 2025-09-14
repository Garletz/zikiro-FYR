import { LogCategory, LogType } from './logs'

// Types pour le système de sécurité
export interface SecureLogEntry {
    id: string
    log_type: LogType
    category: LogCategory
    title: string
    description: string
    amount?: number

    // Sécurité renforcée
    previous_hash?: string
    current_hash: string
    app_clock: number
    system_clock: number
    session_id: string
    user_signature: string
    chain_index: number

    // Données transactionnelles
    table_id?: string
    table_name?: string
    product_id?: string
    product_name?: string
    user_id?: string
    user_name?: string
    metadata?: string

    // Horodatage sécurisé
    created_at: string
    secure_timestamp: string
}

export interface AppClock {
    session_id: string
    start_time: number
    total_usage_time: number
    last_activity: number
    system_start_time: number
    clock_signature: string
}

export enum AnomalyType {
    TimeDrift = 'time_drift',
    MissingTransaction = 'missing_transaction',
    ChainBreak = 'chain_break',
    SuspiciousAmount = 'suspicious_amount',
    RapidTransactions = 'rapid_transactions',
    UserAnomaly = 'user_anomaly',
    SystemTampering = 'system_tampering',
    ClockManipulation = 'clock_manipulation',
}

export enum AnomalySeverity {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Critical = 'critical',
}

export interface Anomaly {
    id: string
    anomaly_type: AnomalyType
    severity: AnomalySeverity
    description: string
    timestamp: string
    evidence: string
    recommendations: string[]
    resolved: boolean
    resolved_at?: string
    resolved_by?: string
}

export interface ComplianceReport {
    id: string
    period_start: string
    period_end: string
    country_code: string
    total_transactions: number
    total_amount: number
    anomalies_count: number
    chain_integrity: boolean
    time_consistency: boolean
    generated_at: string
    report_signature: string
}

export interface SecurityConfig {
    enable_chain_validation: boolean
    enable_time_validation: boolean
    enable_anomaly_detection: boolean
    max_time_drift: number // en secondes
    min_transaction_interval: number // en millisecondes
    suspicious_amount_threshold: number
    compliance_country: string
    retention_period: number // en jours
    enable_real_time_monitoring: boolean
}

// Types pour les requêtes
export interface CreateSecureLogRequest {
    log_type: LogType
    category: LogCategory
    title: string
    description: string
    amount?: number
    session_id: string
    user_signature: string
    table_id?: string
    table_name?: string
    product_id?: string
    product_name?: string
    user_id?: string
    user_name?: string
    metadata?: string
}

export interface AnomalyDetectionRequest {
    session_id: string
    enable_chain_validation: boolean
    enable_time_validation: boolean
    max_time_drift: number
    suspicious_amount_threshold: number
}

export interface ComplianceReportRequest {
    period_start: string
    period_end: string
    country_code: string
}

// Types pour les statistiques de sécurité
export interface SecurityStats {
    total_secure_logs: number
    total_anomalies: number
    unresolved_anomalies: number
    chain_integrity: boolean
    time_consistency: boolean
    last_anomaly_detection: string
    system_uptime: number
}

// Types pour les alertes
export interface SecurityAlert {
    id: string
    type: 'anomaly' | 'chain_break' | 'time_drift' | 'system_tampering'
    severity: AnomalySeverity
    title: string
    message: string
    timestamp: string
    acknowledged: boolean
    acknowledged_by?: string
    acknowledged_at?: string
}

// Types pour les rapports de conformité par pays
export interface CountryComplianceConfig {
    country_code: string
    country_name: string
    tax_name: string
    retention_period_days: number
    required_fields: string[]
    report_format: 'json' | 'xml' | 'csv'
    submission_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    digital_signature_required: boolean
    audit_trail_required: boolean
}

// Configuration par défaut pour différents pays
export const COUNTRY_COMPLIANCE_CONFIGS: Record<string, CountryComplianceConfig> = {
    FR: {
        country_code: 'FR',
        country_name: 'France',
        tax_name: 'TVA',
        retention_period_days: 2190, // 6 ans
        required_fields: ['transaction_id', 'amount', 'tax_amount', 'timestamp', 'user_signature'],
        report_format: 'json',
        submission_frequency: 'monthly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
    US: {
        country_code: 'US',
        country_name: 'États-Unis',
        tax_name: 'Sales Tax',
        retention_period_days: 2555, // 7 ans
        required_fields: ['transaction_id', 'amount', 'tax_amount', 'timestamp', 'digital_signature'],
        report_format: 'xml',
        submission_frequency: 'quarterly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
    GB: {
        country_code: 'GB',
        country_name: 'Royaume-Uni',
        tax_name: 'VAT',
        retention_period_days: 2190, // 6 ans
        required_fields: ['transaction_id', 'amount', 'vat_amount', 'timestamp', 'user_signature'],
        report_format: 'json',
        submission_frequency: 'monthly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
    CA: {
        country_code: 'CA',
        country_name: 'Canada',
        tax_name: 'GST/HST',
        retention_period_days: 2190, // 6 ans
        required_fields: ['transaction_id', 'amount', 'gst_amount', 'timestamp', 'digital_signature'],
        report_format: 'xml',
        submission_frequency: 'monthly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
    DE: {
        country_code: 'DE',
        country_name: 'Allemagne',
        tax_name: 'MwSt',
        retention_period_days: 2190, // 6 ans
        required_fields: ['transaction_id', 'amount', 'tax_amount', 'timestamp', 'user_signature'],
        report_format: 'json',
        submission_frequency: 'monthly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
}
