import { MessageSquare, Phone, Send, X } from 'lucide-react'
import { useState } from 'react'
import { normalizePhoneNumber } from '../../modules/smsticket/utils/phoneNormalization'
import { smsService } from '../../shared/services/smsService'

interface SMSTicketWidgetProps {
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
    className?: string
}

export default function SMSTicketWidget({
    customerPhone = '',
    customerName = '',
    orderId,
    tableId,
    orderTotal,
    orderItems = [],
    onSendTicket,
    className = ''
}: SMSTicketWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState(customerPhone)
    const [customer, setCustomer] = useState(customerName)
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const generateTicketMessage = () => {
        return smsService.generateTicketMessage({
            orderId,
            tableId,
            orderTotal,
            orderItems
        })
    }

    const handleSendTicket = async () => {
        if (!phoneNumber || !message) return

        try {
            setIsLoading(true)
            // Normaliser le numéro de téléphone avant l'envoi
            const normalizedPhone = normalizePhoneNumber(phoneNumber)

            await smsService.sendSMS({
                phone_number: normalizedPhone,
                message,
                customer_name: customer,
                order_id: orderId,
                table_id: tableId
            })

            onSendTicket?.()
            setIsOpen(false)
        } catch (error) {
            console.error('Error sending ticket:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleQuickSend = async () => {
        if (!phoneNumber) {
            setIsOpen(true)
            return
        }

        try {
            setIsLoading(true)
            const ticketMessage = generateTicketMessage()
            // Normaliser le numéro de téléphone avant l'envoi
            const normalizedPhone = normalizePhoneNumber(phoneNumber)

            await smsService.sendSMS({
                phone_number: normalizedPhone,
                message: ticketMessage,
                customer_name: customer,
                order_id: orderId,
                table_id: tableId
            })

            onSendTicket?.()
        } catch (error) {
            console.error('Error sending ticket:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isOpen) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Envoyer un SMS</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Numéro de téléphone
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="tel"
                                    placeholder="+33 6 12 34 56 78"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom du client
                            </label>
                            <input
                                type="text"
                                placeholder="Nom du client"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tapez votre message ici..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {message.length}/160 caractères
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setMessage(generateTicketMessage())}
                                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                Générer ticket
                            </button>
                            <button
                                onClick={handleSendTicket}
                                disabled={!phoneNumber || !message || isLoading}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                <Send size={16} />
                                {isLoading ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex gap-2 ${className}`}>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
                <MessageSquare size={16} />
                SMS
            </button>

            {phoneNumber && (
                <button
                    onClick={handleQuickSend}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                    <Send size={16} />
                    {isLoading ? 'Envoi...' : 'Ticket'}
                </button>
            )}
        </div>
    )
}
