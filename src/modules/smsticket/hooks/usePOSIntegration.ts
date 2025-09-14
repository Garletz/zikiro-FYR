import { useState } from 'react'
import { useSMS } from './useSMS'

interface OrderData {
    id?: string
    tableId?: string
    tableName?: string
    customerPhone?: string
    customerName?: string
    total?: number
    items?: Array<{
        name: string
        quantity: number
        price: number
    }>
}

export const usePOSIntegration = () => {
    const [currentOrder, setCurrentOrder] = useState<OrderData | null>(null)
    const [isPaymentMode, setIsPaymentMode] = useState(false)

    const { sendSMS, getMessagesByPhone } = useSMS()

    // Generate ticket message
    const generateTicketMessage = (orderData: OrderData) => {
        let message = `🍽️ Zikiro\n\n`

        if (orderData.id) {
            message += `Order #${orderData.id}\n`
        }

        if (orderData.tableId) {
            message += `Table #${orderData.tableId}${orderData.tableName ? ` (${orderData.tableName})` : ''}\n`
        }

        message += `\n📋 Order details:\n`

        orderData.items?.forEach(item => {
            message += `• ${item.name} x${item.quantity} - ${item.price.toFixed(2)}€\n`
        })

        if (orderData.total) {
            message += `\n💰 Total: ${orderData.total.toFixed(2)}€\n`
        }

        message += `\nThank you for your visit!`

        return message
    }

    // Trigger payment mode
    const triggerPayment = (orderData: OrderData) => {
        setCurrentOrder(orderData)
        setIsPaymentMode(true)
    }

    // Send ticket SMS
    const sendTicketSMS = async (phoneNumber: string, customerName?: string) => {
        if (!currentOrder || !phoneNumber) return

        try {
            const message = generateTicketMessage(currentOrder)

            await sendSMS({
                phone_number: phoneNumber,
                message,
                customer_name: customerName,
                order_id: currentOrder.id,
                table_id: currentOrder.tableId
            })

            // Exit payment mode
            setIsPaymentMode(false)
            setCurrentOrder(null)

            return true
        } catch (error) {
            console.error('Error sending ticket SMS:', error)
            return false
        }
    }

    // Cancel payment
    const cancelPayment = () => {
        setIsPaymentMode(false)
        setCurrentOrder(null)
    }

    // Get messages for current table
    const getTableMessages = () => {
        if (!currentOrder?.customerPhone) return []
        return getMessagesByPhone(currentOrder.customerPhone)
    }

    return {
        currentOrder,
        isPaymentMode,
        triggerPayment,
        sendTicketSMS,
        cancelPayment,
        getTableMessages,
        generateTicketMessage
    }
}
