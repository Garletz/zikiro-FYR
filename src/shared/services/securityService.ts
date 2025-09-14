import { invoke } from '@tauri-apps/api/core'
import {
    Anomaly,
    AnomalyDetectionRequest,
    AppClock,
    ComplianceReport,
    ComplianceReportRequest,
    CreateSecureLogRequest,
    SecureLogEntry,
    SecurityAlert,
    SecurityConfig,
    SecurityStats
} from '../types/security'

export const securityService = {
    // Initialisation du système de sécurité
    initSecuritySystem: async (): Promise<void> => {
        return invoke('init_security_system')
    },

    // Gestion des logs sécurisés
    createSecureLogEntry: async (request: CreateSecureLogRequest): Promise<SecureLogEntry> => {
        return invoke('create_secure_log_entry', { request })
    },

    getSecureLogs: async (limit?: number): Promise<SecureLogEntry[]> => {
        return invoke('get_secure_logs_command', { limit })
    },

    // Gestion de l'horloge interne
    createAppClock: async (sessionId: string): Promise<AppClock> => {
        return invoke('create_app_clock', { sessionId })
    },

    getAppClock: async (sessionId: string): Promise<AppClock | null> => {
        return invoke('get_app_clock_command', { sessionId })
    },

    updateAppClock: async (sessionId: string, duration: number): Promise<void> => {
        return invoke('update_app_clock', { sessionId, duration })
    },

    // Détection d'anomalies
    detectAnomalies: async (request: AnomalyDetectionRequest): Promise<Anomaly[]> => {
        return invoke('detect_anomalies', { request })
    },

    getAnomalies: async (limit?: number): Promise<Anomaly[]> => {
        return invoke('get_anomalies_command', { limit })
    },

    getUnresolvedAnomalies: async (): Promise<Anomaly[]> => {
        return invoke('get_unresolved_anomalies_command')
    },

    resolveAnomaly: async (anomalyId: string, resolvedBy: string): Promise<void> => {
        return invoke('resolve_anomaly_command', { anomalyId, resolvedBy })
    },

    // Rapports de conformité
    generateComplianceReport: async (request: ComplianceReportRequest): Promise<ComplianceReport> => {
        return invoke('generate_compliance_report', { request })
    },

    // Configuration de sécurité
    getSecurityConfig: async (): Promise<SecurityConfig | null> => {
        return invoke('get_security_config_command')
    },

    saveSecurityConfig: async (config: SecurityConfig): Promise<void> => {
        return invoke('save_security_config_command', { config })
    },

    // Fonctions utilitaires
    generateUserSignature: (userId: string, timestamp: number): string => {
        // Générer une signature simple pour l'utilisateur
        const data = `${userId}-${timestamp}-${Math.random()}`
        return btoa(data).replace(/[^a-zA-Z0-9]/g, '')
    },

    generateSessionId: (): string => {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    // Surveillance en temps réel
    startRealTimeMonitoring: async (sessionId: string, config: SecurityConfig): Promise<void> => {
        if (!config.enable_real_time_monitoring) return

        // Démarrer la surveillance périodique
        setInterval(async () => {
            try {
                const request: AnomalyDetectionRequest = {
                    session_id: sessionId,
                    enable_chain_validation: config.enable_chain_validation,
                    enable_time_validation: config.enable_time_validation,
                    max_time_drift: config.max_time_drift,
                    suspicious_amount_threshold: config.suspicious_amount_threshold,
                }

                const anomalies = await securityService.detectAnomalies(request)

                // Émettre des alertes pour les nouvelles anomalies
                anomalies.forEach(anomaly => {
                    if (!anomaly.resolved) {
                        securityService.emitSecurityAlert(anomaly)
                    }
                })
            } catch (error) {
                console.error('Erreur lors de la surveillance en temps réel:', error)
            }
        }, 30000) // Vérification toutes les 30 secondes
    },

    // Système d'alertes
    emitSecurityAlert: (anomaly: Anomaly): void => {
        const alert: SecurityAlert = {
            id: anomaly.id,
            type: mapAnomalyTypeToAlertType(anomaly.anomaly_type),
            severity: anomaly.severity,
            title: `Anomalie détectée: ${anomaly.anomaly_type}`,
            message: anomaly.description,
            timestamp: anomaly.timestamp,
            acknowledged: false,
        }

        // Émettre l'alerte (peut être connecté à un système de notifications)
        window.dispatchEvent(new CustomEvent('security-alert', { detail: alert }))
    },

    // Statistiques de sécurité
    getSecurityStats: async (): Promise<SecurityStats> => {
        const [secureLogs, anomalies, unresolvedAnomalies] = await Promise.all([
            securityService.getSecureLogs(),
            securityService.getAnomalies(),
            securityService.getUnresolvedAnomalies(),
        ])

        // Vérifier l'intégrité de la chaîne
        const chainIntegrity = verifyChainIntegrity(secureLogs)

        // Vérifier la cohérence temporelle
        const timeConsistency = verifyTimeConsistency(secureLogs)

        return {
            total_secure_logs: secureLogs.length,
            total_anomalies: anomalies.length,
            unresolved_anomalies: unresolvedAnomalies.length,
            chain_integrity: chainIntegrity,
            time_consistency: timeConsistency,
            last_anomaly_detection: anomalies.length > 0 ? anomalies[0].timestamp : '',
            system_uptime: Date.now() - (secureLogs.length > 0 ? new Date(secureLogs[0].created_at).getTime() : Date.now()),
        }
    },

    // Validation de l'intégrité de la chaîne
    verifyChainIntegrity: (logs: SecureLogEntry[]): boolean => {
        for (let i = 1; i < logs.length; i++) {
            const current = logs[i]
            const previous = logs[i - 1]

            if (current.previous_hash !== previous.current_hash) {
                return false
            }
        }
        return true
    },

    // Validation de la cohérence temporelle
    verifyTimeConsistency: (logs: SecureLogEntry[]): boolean => {
        if (logs.length === 0) return true

        let lastTimestamp = new Date(logs[0].created_at).getTime()
        for (let i = 1; i < logs.length; i++) {
            const currentTimestamp = new Date(logs[i].created_at).getTime()
            if (currentTimestamp < lastTimestamp) {
                return false
            }
            lastTimestamp = currentTimestamp
        }
        return true
    },

    // Export des données de sécurité
    exportSecurityData: async (format: 'json' | 'csv'): Promise<string> => {
        const [secureLogs, anomalies, config] = await Promise.all([
            securityService.getSecureLogs(),
            securityService.getAnomalies(),
            securityService.getSecurityConfig(),
        ])

        const data = {
            export_date: new Date().toISOString(),
            secure_logs: secureLogs,
            anomalies: anomalies,
            security_config: config,
            chain_integrity: securityService.verifyChainIntegrity(secureLogs),
            time_consistency: securityService.verifyTimeConsistency(secureLogs),
        }

        if (format === 'json') {
            return JSON.stringify(data, null, 2)
        } else {
            // Format CSV simplifié
            const csvHeaders = ['ID', 'Type', 'Catégorie', 'Titre', 'Montant', 'Timestamp', 'Hash']
            const csvRows = secureLogs.map(log => [
                log.id,
                log.log_type,
                log.category,
                log.title,
                log.amount || 0,
                log.created_at,
                log.current_hash
            ])

            return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')
        }
    },
}

// Fonctions utilitaires
function mapAnomalyTypeToAlertType(anomalyType: string): SecurityAlert['type'] {
    switch (anomalyType) {
        case 'chain_break':
            return 'chain_break'
        case 'time_drift':
            return 'time_drift'
        case 'system_tampering':
        case 'clock_manipulation':
            return 'system_tampering'
        default:
            return 'anomaly'
    }
}

function verifyChainIntegrity(logs: SecureLogEntry[]): boolean {
    return securityService.verifyChainIntegrity(logs)
}

function verifyTimeConsistency(logs: SecureLogEntry[]): boolean {
    return securityService.verifyTimeConsistency(logs)
}
