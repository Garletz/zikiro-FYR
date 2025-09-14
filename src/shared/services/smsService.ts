import { invoke } from '@tauri-apps/api/core'

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
    provider: 'none' | 'twilio' | 'messagebird' | 'sim800c' | 'sim900a' | 'custom'
    cost: number
    created_at: string
    updated_at: string
}

export const smsService = {
    // Send SMS
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
            return await invoke('send_sms', { request })
        } catch (error) {
            console.error('Error sending SMS:', error)
            throw error
        }
    },

    // Send ticket notification
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

    // Send order notification
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

    // Generate ticket message
    generateTicketMessage(data: {
        orderId?: string
        tableId?: string
        tableName?: string
        orderTotal?: number
        orderItems?: Array<{
            name: string
            quantity: number
            price: number
        }>
        businessName?: string
    }): string {
        const { orderId, tableId, tableName, orderTotal, orderItems = [], businessName = 'Zikiro' } = data

        let message = `🍽️ ${businessName}\n\n`

        if (orderId) {
            message += `Commande #${orderId}\n`
        }

        if (tableId) {
            message += `Table #${tableId}${tableName ? ` (${tableName})` : ''}\n`
        }

        message += `\n📋 Détails de la commande:\n`

        orderItems.forEach(item => {
            message += `• ${item.name} x${item.quantity} - ${item.price.toFixed(2)}€\n`
        })

        if (orderTotal) {
            message += `\n💰 Total: ${orderTotal.toFixed(2)}€\n`
        }

        message += `\nMerci pour votre visite !`

        return message
    }
}
