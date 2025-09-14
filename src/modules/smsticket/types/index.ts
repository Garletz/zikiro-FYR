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

// SMS Gateway Android Test Configuration
export interface SMSGatewayAndroidTestConfig extends Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'> {
    test_phone?: string
    test_message?: string
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

// Infobip Test Configuration
export interface InfobipTestConfig extends Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'> {
    test_phone?: string
    test_message?: string
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

export interface SMSStats {
    total_sent: number
    total_delivered: number
    total_failed: number
    delivery_rate: number
    last_sent: string
    total_cost: number
}

export interface TicketNotification {
    id: string
    ticket_id: string
    customer_phone: string
    message: string
    type: 'order_ready' | 'payment_confirmation' | 'custom'
    status: 'pending' | 'sent' | 'delivered' | 'failed'
    sent_at: string
}

export interface SMSProvider {
    name: string
    type: 'cloud' | 'sim' | 'custom'
    cost_per_sms: number
    is_available: boolean
    features: string[]
}
