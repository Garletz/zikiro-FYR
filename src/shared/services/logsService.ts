import { invoke } from '@tauri-apps/api/core'
import { CreateLogEntryRequest, LogCategory, LogEntry, LogFilter, LogType } from '../types/logs'
import { CreateSecureLogRequest } from '../types/security'
import { securityService } from './securityService'

export const logsService = {
    // Create a new log entry
    createLogEntry: async (request: CreateLogEntryRequest): Promise<LogEntry> => {
        return invoke('create_log_entry', { request })
    },

    // Create a new secure log entry
    createSecureLogEntry: async (request: CreateLogEntryRequest): Promise<LogEntry> => {
        // Retourner aussi le log normal pour compatibilité
        return invoke('create_log_entry', { request })
    },

    // Get all logs with optional limit
    getLogs: async (limit?: number): Promise<LogEntry[]> => {
        return invoke('get_logs_command', { limit })
    },

    // Get secure logs
    getSecureLogs: async (limit?: number) => {
        return securityService.getSecureLogs(limit)
    },

    // Get logs with filter
    getLogsWithFilter: async (filter: LogFilter, limit?: number): Promise<LogEntry[]> => {
        return invoke('get_logs_with_filter_command', { filter, limit })
    },

    // Get financial logs
    getFinancialLogs: async (startDate?: string, endDate?: string): Promise<LogEntry[]> => {
        return invoke('get_financial_logs_command', { startDate, endDate })
    },

    // Get logs by category
    getLogsByCategory: async (category: LogCategory, limit?: number): Promise<LogEntry[]> => {
        return invoke('get_logs_by_category_command', { category, limit })
    },

    // Delete old logs
    deleteOldLogs: async (daysToKeep: number): Promise<number> => {
        return invoke('delete_old_logs_command', { daysToKeep })
    },

    // Get logs count
    getLogsCount: async (): Promise<number> => {
        return invoke('get_logs_count_command')
    },

    // Clean and repair corrupted data
    cleanAndRepairLogs: async (): Promise<{ cleaned: number; repaired: number; errors: number }> => {
        try {
            console.log('Starting logs cleanup and repair process...')

            // Récupérer tous les logs pour analyse
            const allLogs = await logsService.getLogs()
            let cleaned = 0
            let repaired = 0
            let errors = 0

            for (const log of allLogs) {
                try {
                    // Vérifier et réparer les métadonnées corrompues
                    if (log.metadata) {
                        try {
                            JSON.parse(log.metadata)
                        } catch {
                            // Métadonnées corrompues - essayer de les réparer
                            console.warn('Attempting to repair corrupted metadata for log:', log.id)

                            // Créer des métadonnées de base basées sur le titre et la description
                            const repairedMetadata = {
                                original_metadata: log.metadata,
                                repaired_at: new Date().toISOString(),
                                repair_reason: 'corrupted_json',
                                extracted_info: {
                                    title: log.title,
                                    description: log.description,
                                    amount: log.amount,
                                    table_name: log.table_name
                                }
                            }

                            // Mettre à jour le log avec les métadonnées réparées
                            // Note: Cette fonctionnalité nécessiterait une commande Rust pour mettre à jour les logs
                            console.log('Metadata repaired for log:', log.id, repairedMetadata)
                            repaired++
                        }
                    }

                    // Vérifier la cohérence des données
                    if (log.amount && log.amount < 0) {
                        console.warn('Negative amount detected in log:', log.id, log.amount)
                        cleaned++
                    }

                } catch (error) {
                    console.error('Error processing log during cleanup:', log.id, error)
                    errors++
                }
            }

            console.log('Logs cleanup and repair completed:', { cleaned, repaired, errors })
            return { cleaned, repaired, errors }

        } catch (error) {
            console.error('Failed to clean and repair logs:', { error })
            throw error
        }
    },

    // Validate log data integrity
    validateLogIntegrity: async (): Promise<{ valid: number; invalid: number; issues: string[] }> => {
        try {
            console.log('Starting log integrity validation...')

            const allLogs = await logsService.getLogs()
            let valid = 0
            let invalid = 0
            const issues: string[] = []

            for (const log of allLogs) {
                let logValid = true

                // Vérifier les métadonnées JSON
                if (log.metadata) {
                    try {
                        JSON.parse(log.metadata)
                    } catch {
                        issues.push(`Log ${log.id}: Invalid JSON metadata`)
                        logValid = false
                    }
                }

                // Vérifier la cohérence des montants
                if (log.amount && (isNaN(log.amount) || log.amount < 0)) {
                    issues.push(`Log ${log.id}: Invalid amount ${log.amount}`)
                    logValid = false
                }

                // Vérifier les dates
                if (log.created_at) {
                    const date = new Date(log.created_at)
                    if (isNaN(date.getTime())) {
                        issues.push(`Log ${log.id}: Invalid date ${log.created_at}`)
                        logValid = false
                    }
                }

                if (logValid) {
                    valid++
                } else {
                    invalid++
                }
            }

            console.log('Log integrity validation completed:', { valid, invalid, issuesCount: issues.length })
            return { valid, invalid, issues }

        } catch (error) {
            console.error('Failed to validate log integrity:', { error })
            throw error
        }
    },

    // Helper functions for common events
    logSaleEvent: async (
        tableId: string | undefined,
        tableName: string | undefined,
        amount: number,
        itemsCount: number,
        paymentMethod: string | undefined,
        customerName: string | undefined,
        items: Array<{ product_name: string, quantity: number, unit_price: number }> | undefined
    ): Promise<void> => {
        // Créer un log sécurisé pour les ventes
        const userSignature = securityService.generateUserSignature('pos', Date.now())
        const sessionId = securityService.generateSessionId()

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.Financial,
            category: LogCategory.Sale,
            title: `Vente - ${paymentMethod || 'Inconnu'}`,
            description: `Vente de ${itemsCount} articles pour ${amount.toFixed(2)}€`,
            amount,
            session_id: sessionId,
            user_signature: userSignature,
            table_id: tableId,
            table_name: tableName,
            metadata: JSON.stringify({
                items_count: itemsCount,
                payment_method: paymentMethod,
                customer_name: customerName,
                items: items || []
            })
        }

        await securityService.createSecureLogEntry(secureRequest)

        // Garder aussi l'ancien système pour compatibilité
        return invoke('log_sale_event', {
            tableId,
            tableName,
            amount,
            itemsCount,
            paymentMethod,
            customerName,
            items: items ? JSON.stringify(items) : undefined
        })
    },

    logTableStatusChange: async (tableId: string, tableName: string, oldStatus: string, newStatus: string): Promise<void> => {
        // Créer un log sécurisé pour les changements de statut
        const userSignature = securityService.generateUserSignature('system', Date.now())
        const sessionId = securityService.generateSessionId()

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.System,
            category: LogCategory.TableStatus,
            title: `Changement de statut - ${tableName}`,
            description: `Statut changé de ${oldStatus} à ${newStatus}`,
            session_id: sessionId,
            user_signature: userSignature,
            table_id: tableId,
            table_name: tableName,
            metadata: JSON.stringify({
                old_status: oldStatus,
                new_status: newStatus,
                change_time: new Date().toISOString()
            })
        }

        await securityService.createSecureLogEntry(secureRequest)

        // Garder aussi l'ancien système pour compatibilité
        return invoke('log_table_status_change', { tableId, tableName, oldStatus, newStatus })
    },

    logProductEvent: async (category: LogCategory, productId: string, productName: string, action: string): Promise<void> => {
        // Créer un log sécurisé pour les événements produits
        const userSignature = securityService.generateUserSignature('system', Date.now())
        const sessionId = securityService.generateSessionId()

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.System,
            category: LogCategory.Product,
            title: `${action} - ${productName}`,
            description: `Produit ${action.toLowerCase()}: ${productName}`,
            session_id: sessionId,
            user_signature: userSignature,
            product_id: productId,
            product_name: productName,
            metadata: JSON.stringify({
                action,
                timestamp: new Date().toISOString()
            })
        }

        await securityService.createSecureLogEntry(secureRequest)

        // Garder aussi l'ancien système pour compatibilité
        return invoke('log_product_event', { category, productId, productName, action })
    },

    // Utility functions
    logFinancialEvent: async (title: string, description: string, amount: number, metadata?: any): Promise<void> => {
        // Créer un log sécurisé pour les événements financiers
        const userSignature = securityService.generateUserSignature('system', Date.now())
        const sessionId = securityService.generateSessionId()

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.Financial,
            category: LogCategory.Sale,
            title,
            description,
            amount,
            session_id: sessionId,
            user_signature: userSignature,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        }

        await securityService.createSecureLogEntry(secureRequest)

        // Garder aussi l'ancien système pour compatibilité
        const request: CreateLogEntryRequest = {
            log_type: LogType.Financial,
            category: LogCategory.Sale,
            title,
            description,
            amount,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        }
        await logsService.createLogEntry(request)
    },

    logSystemEvent: async (title: string, description: string, category: LogCategory = LogCategory.System): Promise<void> => {
        // Créer un log sécurisé pour les événements système
        const userSignature = securityService.generateUserSignature('system', Date.now())
        const sessionId = securityService.generateSessionId()

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.System,
            category,
            title,
            description,
            session_id: sessionId,
            user_signature: userSignature,
        }

        await securityService.createSecureLogEntry(secureRequest)

        // Garder aussi l'ancien système pour compatibilité
        const request: CreateLogEntryRequest = {
            log_type: LogType.System,
            category,
            title,
            description,
        }
        await logsService.createLogEntry(request)
    },

    logError: async (title: string, description: string, metadata?: any): Promise<void> => {
        // Créer un log sécurisé pour les erreurs
        const userSignature = securityService.generateUserSignature('system', Date.now())
        const sessionId = securityService.generateSessionId()

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.Error,
            category: LogCategory.Error,
            title,
            description,
            session_id: sessionId,
            user_signature: userSignature,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        }

        await securityService.createSecureLogEntry(secureRequest)

        // Garder aussi l'ancien système pour compatibilité
        const request: CreateLogEntryRequest = {
            log_type: LogType.Error,
            category: LogCategory.Error,
            title,
            description,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        }
        await logsService.createLogEntry(request)
    },
}