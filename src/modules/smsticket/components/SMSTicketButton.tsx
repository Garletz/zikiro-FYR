import { MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'
import SMSChatWidget from './SMSChatWidget'

interface SMSTicketButtonProps {
    customerPhone?: string
    customerName?: string
    orderId?: string
    tableId?: string
    orderTotal?: number
    orderItems?: Array<{
        name: string
        quantity: number
        price: number
    }>
    onSendTicket?: () => void
}

export default function SMSTicketButton({
    customerPhone = '',
    customerName = '',
    orderId,
    tableId,
    onSendTicket
}: SMSTicketButtonProps) {
    const [isChatOpen, setIsChatOpen] = useState(false)


    const handleSendTicket = async () => {
        if (!customerPhone) {
            setIsChatOpen(true)
            return
        }

        try {
            // This would be implemented in the service
            // await smsTicketService.sendSMS({
            //     phone_number: customerPhone,
            //     message,
            //     customer_name: customerName,
            //     order_id: orderId,
            //     table_id: tableId
            // })

            onSendTicket?.()
        } catch (error) {
            console.error('Error sending ticket:', error)
        }
    }

    return (
        <>
            <div className="flex gap-2">
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <MessageSquare size={16} />
                    SMS Chat
                </button>

                {customerPhone && (
                    <button
                        onClick={handleSendTicket}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Send size={16} />
                        Send Ticket
                    </button>
                )}
            </div>

            <SMSChatWidget
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                customerPhone={customerPhone}
                customerName={customerName}
                orderId={orderId}
                tableId={tableId}
            />
        </>
    )
}
