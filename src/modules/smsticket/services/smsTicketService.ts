import { invoke } from '@tauri-apps/api/core'
import { toBackendProvider, toFrontendProvider } from '../utils/providerMapping'

export interface SMSMessage {
    id: string
    phone_number: string
    message: string
    status: 'pending' | 'sent' | 'delivered' | 'failed'
    sent_at?: string
    delivered_at?: string
    error_message?: string
    template_id?: string
    ticket_id?: string
    order_id?: string
    table_id?: string
    customer_name?: string
    provider: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900' | 'twilio' | 'messagebird' | 'sim800c' | 'sim900a' | 'custom'
    cost: number
    created_at: string
    updated_at: string
}

export interface SMSTemplate {
    id: string
    name: string
    content: string
    variables?: string[]
    is_active: boolean
    category: string
    created_at: string
    updated_at: string
}

export interface SMSContact {
    id: string
    name: string
    phone_number: string
    email?: string
    company?: string
    tags?: string[]
    is_active: boolean
    last_contact?: string
    created_at: string
    updated_at: string
}

export interface SMSConfig {
    id: number
    provider: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900' | 'twilio' | 'messagebird' | 'sim800c' | 'sim900a' | 'custom'
    api_key?: string
    api_secret?: string
    sender_name?: string
    webhook_url?: string
    sim_port?: string
    sim_baud_rate?: number
    is_enabled: boolean
    created_at: string
    updated_at: string
}

// SMS Gateway Android Configuration
export interface SMSGatewayAndroidConfig {
    id?: number
    device_ip: string
    port: number
    username: string
    password: string
    is_enabled: boolean
    created_at?: string
    updated_at?: string
}

// Infobip Configuration
export interface InfobipConfig {
    id?: number
    api_key: string
    base_url: string
    sender_name: string
    is_enabled: boolean
    created_at?: string
    updated_at?: string
}

// SIM 800/900 Configuration
export interface SIM800900Config {
    id?: number
    port: string
    baud_rate: number
    pin_code?: string
    is_enabled: boolean
    created_at?: string
    updated_at?: string
}

// Provider Selection
export interface ProviderSelection {
    default_provider: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900'
    simulation_mode: boolean
}

export interface SMSConversation {
    id: string
    contact_id: string
    phone_number: string
    last_message?: string
    last_message_at?: string
    unread_count: number
    is_archived: boolean
    created_at: string
    updated_at: string
}

export const smsTicketService = {
    // SMS Messages
    async sendSMS(request: {
        phone_number: string
        message: string
        template_id?: string
        ticket_id?: string
        order_id?: string
        table_id?: string
        customer_name?: string
    }): Promise<SMSMessage> {
        try {
            console.log('smsTicketService.sendSMS - Calling Tauri command with:', request)
            const result = await invoke('send_sms', { request })
            console.log('smsTicketService.sendSMS - Tauri command result:', result)
            return result as SMSMessage
        } catch (error) {
            console.error('smsTicketService.sendSMS - Error:', error)
            throw error
        }
    },

    async getSMSMessages(limit?: number): Promise<SMSMessage[]> {
        try {
            return await invoke('get_sms_messages', { limit })
        } catch (error) {
            console.error('Error fetching SMS messages:', error)
            throw error
        }
    },

    async getSMSMessageById(id: string): Promise<SMSMessage | null> {
        try {
            return await invoke('get_sms_message_by_id', { id })
        } catch (error) {
            console.error('Error fetching SMS message:', error)
            throw error
        }
    },

    // SMS Templates
    async getSMSTemplates(): Promise<SMSTemplate[]> {
        try {
            return await invoke('get_sms_templates')
        } catch (error) {
            console.error('Error fetching SMS templates:', error)
            throw error
        }
    },

    async createSMSTemplate(template: {
        name: string
        content: string
        variables?: string[]
        category: string
    }): Promise<SMSTemplate> {
        try {
            return await invoke('create_sms_template', { request: template })
        } catch (error) {
            console.error('Error creating SMS template:', error)
            throw error
        }
    },

    async updateSMSTemplate(id: string, template: {
        name?: string
        content?: string
        variables?: string[]
        category?: string
        is_active?: boolean
    }): Promise<SMSTemplate> {
        try {
            return await invoke('update_sms_template', { id, request: template })
        } catch (error) {
            console.error('Error updating SMS template:', error)
            throw error
        }
    },

    async deleteSMSTemplate(id: string): Promise<void> {
        try {
            return await invoke('delete_sms_template', { id })
        } catch (error) {
            console.error('Error deleting SMS template:', error)
            throw error
        }
    },

    // SMS Contacts
    async getSMSContacts(): Promise<SMSContact[]> {
        try {
            return await invoke('get_sms_contacts')
        } catch (error) {
            console.error('Error fetching SMS contacts:', error)
            throw error
        }
    },

    async createSMSContact(contact: {
        name: string
        phone_number: string
        email?: string
        company?: string
        tags?: string[]
    }): Promise<SMSContact> {
        try {
            return await invoke('create_sms_contact', { request: contact })
        } catch (error) {
            console.error('Error creating SMS contact:', error)
            throw error
        }
    },

    async updateSMSContact(id: string, contact: {
        name?: string
        phone_number?: string
        email?: string
        company?: string
        tags?: string[]
        is_active?: boolean
    }): Promise<SMSContact> {
        try {
            return await invoke('update_sms_contact', { id, request: contact })
        } catch (error) {
            console.error('Error updating SMS contact:', error)
            throw error
        }
    },

    async deleteSMSContact(id: string): Promise<void> {
        try {
            return await invoke('delete_sms_contact', { id })
        } catch (error) {
            console.error('Error deleting SMS contact:', error)
            throw error
        }
    },

    // SMS Configuration
    async getSMSConfig(): Promise<SMSConfig> {
        try {
            return await invoke('get_sms_config')
        } catch (error) {
            console.error('Error fetching SMS config:', error)
            throw error
        }
    },

    async updateSMSConfig(config: {
        provider?: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900' | 'twilio' | 'messagebird' | 'sim800c' | 'sim900a' | 'custom'
        api_key?: string
        api_secret?: string
        sender_name?: string
        webhook_url?: string
        sim_port?: string
        sim_baud_rate?: number
        is_enabled?: boolean
    }): Promise<SMSConfig> {
        try {
            return await invoke('update_sms_config', { request: config })
        } catch (error) {
            console.error('Error updating SMS config:', error)
            throw error
        }
    },

    // Provider Selection
    async getProviderSelection(): Promise<ProviderSelection> {
        try {
            const selection = await invoke('get_provider_selection')
            return {
                default_provider: toFrontendProvider((selection as any).default_provider as any) as any,
                simulation_mode: (selection as any).simulation_mode
            }
        } catch (error) {
            console.error('Error fetching provider selection:', error)
            return {
                default_provider: 'none',
                simulation_mode: true
            }
        }
    },

    async updateProviderSelection(selection: ProviderSelection): Promise<ProviderSelection> {
        try {
            const updatedSelection = await invoke('update_provider_selection', {
                request: {
                    id: 1,
                    default_provider: toBackendProvider(selection.default_provider as any),
                    simulation_mode: selection.simulation_mode,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            })
            return {
                default_provider: toFrontendProvider((updatedSelection as any).default_provider as any) as any,
                simulation_mode: (updatedSelection as any).simulation_mode
            }
        } catch (error) {
            console.error('Error updating provider selection:', error)
            throw error
        }
    },

    // SMS Gateway Android Configuration
    async getSMSGatewayAndroidConfig(): Promise<SMSGatewayAndroidConfig | null> {
        try {
            const config = await invoke('get_sms_gateway_android_config')
            return config as SMSGatewayAndroidConfig | null
        } catch (error) {
            console.error('Error fetching SMS Gateway Android config:', error)
            return null
        }
    },

    async updateSMSGatewayAndroidConfig(config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'>): Promise<SMSGatewayAndroidConfig> {
        try {
            const updatedConfig = await invoke('update_sms_gateway_android_config', {
                request: {
                    id: 1,
                    device_ip: config.device_ip,
                    port: config.port,
                    username: config.username,
                    password: config.password,
                    is_enabled: config.is_enabled,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            })
            return updatedConfig as SMSGatewayAndroidConfig
        } catch (error) {
            console.error('Error updating SMS Gateway Android config:', error)
            throw error
        }
    },

    async testSMSGatewayAndroidConnection(config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'> & { test_phone?: string; test_message?: string }): Promise<boolean> {
        try {
            console.log('Testing SMS Gateway Android connection:', config)

            // Vérifier que nous avons les paramètres nécessaires
            if (!config.device_ip || !config.port || !config.username || !config.password) {
                throw new Error('Configuration SMS Gateway Android incomplète')
            }

            if (!config.test_phone || !config.test_message) {
                throw new Error('Numéro de test et message requis')
            }

            // Utiliser la commande Tauri pour éviter les problèmes CORS
            const result = await invoke('test_sms_gateway_android', {
                config: {
                    device_ip: config.device_ip,
                    port: config.port,
                    username: config.username,
                    password: config.password,
                    test_phone: config.test_phone,
                    test_message: config.test_message
                }
            })

            console.log('SMS Gateway Android test result:', result)
            return result as boolean
        } catch (error) {
            console.error('Error testing SMS Gateway Android connection:', error)
            throw error
        }
    },

    // Infobip Configuration
    async getInfobipConfig(): Promise<InfobipConfig | null> {
        try {
            const config = await invoke('get_infobip_config')
            return config as InfobipConfig | null
        } catch (error) {
            console.error('Error fetching Infobip config:', error)
            return null
        }
    },

    async updateInfobipConfig(config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'>): Promise<InfobipConfig> {
        try {
            const updatedConfig = await invoke('update_infobip_config', {
                request: {
                    id: 1,
                    api_key: config.api_key,
                    base_url: config.base_url,
                    sender_name: config.sender_name,
                    is_enabled: config.is_enabled,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            })
            return updatedConfig as InfobipConfig
        } catch (error) {
            console.error('Error updating Infobip config:', error)
            throw error
        }
    },

    async testInfobipConnection(config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'> & { test_phone?: string; test_message?: string }): Promise<boolean> {
        try {
            console.log('Testing Infobip connection:', config)

            // Vérifier que nous avons les paramètres nécessaires
            if (!config.api_key || !config.base_url || !config.sender_name) {
                throw new Error('Configuration Infobip incomplète')
            }

            if (!config.test_phone || !config.test_message) {
                throw new Error('Numéro de test et message requis')
            }

            // Utiliser la commande Tauri pour éviter les problèmes CORS
            const result = await invoke('test_infobip', {
                config: {
                    api_key: config.api_key,
                    base_url: config.base_url,
                    sender_name: config.sender_name,
                    test_phone: config.test_phone,
                    test_message: config.test_message
                }
            })

            console.log('Infobip test result:', result)
            return result as boolean
        } catch (error) {
            console.error('Error testing Infobip connection:', error)
            throw error
        }
    },

    // SIM 800/900 Configuration
    async getSIM800900Config(): Promise<SIM800900Config | null> {
        try {
            const config = await invoke('get_sim800_900_config')
            return config as SIM800900Config | null
        } catch (error) {
            console.error('Error fetching SIM 800/900 config:', error)
            return null
        }
    },

    async updateSIM800900Config(config: Omit<SIM800900Config, 'id' | 'created_at' | 'updated_at'>): Promise<SIM800900Config> {
        try {
            const updatedConfig = await invoke('update_sim800_900_config', {
                request: {
                    id: 1,
                    port: config.port,
                    baud_rate: config.baud_rate,
                    pin_code: config.pin_code,
                    is_enabled: config.is_enabled,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            })
            return updatedConfig as SIM800900Config
        } catch (error) {
            console.error('Error updating SIM 800/900 config:', error)
            throw error
        }
    },

    async scanSerialPorts(): Promise<string[]> {
        try {
            // Simulation du scan des ports - à remplacer par l'implémentation réelle
            console.log('Scanning serial ports...')
            return ['COM1', 'COM3', 'USB1', 'USB2']
        } catch (error) {
            console.error('Error scanning serial ports:', error)
            return []
        }
    },

    // SMS Conversations
    async getSMSConversations(): Promise<SMSConversation[]> {
        try {
            return await invoke('get_sms_conversations')
        } catch (error) {
            console.error('Error fetching SMS conversations:', error)
            throw error
        }
    },

    async getSMSConversationMessages(conversationId: string): Promise<SMSMessage[]> {
        try {
            return await invoke('get_sms_conversation_messages', { conversation_id: conversationId })
        } catch (error) {
            console.error('Error fetching conversation messages:', error)
            throw error
        }
    },

    // Helper functions
    async sendTicketNotification(ticketId: string, customerPhone: string, message: string): Promise<void> {
        try {
            await this.sendSMS({
                phone_number: customerPhone,
                message,
                ticket_id: ticketId
            })
        } catch (error) {
            console.error('Error sending ticket notification:', error)
            throw error
        }
    },

    async sendOrderNotification(orderId: string, tableId: string, customerPhone: string, message: string): Promise<void> {
        try {
            await this.sendSMS({
                phone_number: customerPhone,
                message,
                order_id: orderId,
                table_id: tableId
            })
        } catch (error) {
            console.error('Error sending order notification:', error)
            throw error
        }
    },

    // Auto-create contact if it doesn't exist
    async ensureContactExists(phoneNumber: string, customerName?: string): Promise<SMSContact | null> {
        try {
            // First, try to find existing contact
            const contacts = await this.getSMSContacts()
            const existingContact = contacts.find(c => c.phone_number === phoneNumber)

            if (existingContact) {
                return existingContact
            }

            // If no existing contact and we have a customer name, create one
            if (customerName) {
                return await this.createSMSContact({
                    name: customerName,
                    phone_number: phoneNumber,
                    tags: ['auto-created']
                })
            }

            return null
        } catch (error) {
            console.error('Error ensuring contact exists:', error)
            return null
        }
    }
}
