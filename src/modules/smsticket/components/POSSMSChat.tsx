import {
    CheckCircle,
    Clock,
    CreditCard,
    MessageSquare,
    Phone,
    Send,
    User,
    Wifi,
    WifiOff,
    XCircle
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSMS } from '../hooks/useSMS'
import { normalizePhoneNumber } from '../utils/phoneNormalization'

interface POSSMSChatProps {
    tableId?: string
    tableName?: string
    customerPhone?: string
    customerName?: string
    orderId?: string
    orderTotal?: number
    orderItems?: Array<{
        name: string
        quantity: number
        price: number
    }>
    onPaymentClick?: () => void
    className?: string
}

export default function POSSMSChat({
    tableId,
    tableName,
    customerPhone = '',
    customerName = '',
    orderId,
    orderTotal,
    orderItems = [],
    onPaymentClick,
    className = ''
}: POSSMSChatProps) {
    const [phoneNumber, setPhoneNumber] = useState(customerPhone)
    const [customer, setCustomer] = useState(customerName)
    const [message, setMessage] = useState('')
    const [isExpanded, setIsExpanded] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const {
        sendSMS,
        isSendingSMS,
        getMessagesByPhone
    } = useSMS()

    // Auto-remplir le message lors du paiement
    useEffect(() => {
        if (orderId && orderTotal && orderItems.length > 0) {
            generateTicketMessage()
        }
    }, [orderId, orderTotal, orderItems])

    // Récupérer les messages pour ce numéro
    const conversationMessages = phoneNumber ? getMessagesByPhone(phoneNumber) : []

    useEffect(() => {
        scrollToBottom()
    }, [conversationMessages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const generateTicketMessage = () => {
        let ticketMessage = `🍽️ HUNGERBLISS\n\n`

        if (orderId) {
            ticketMessage += `Order #${orderId}\n`
        }

        if (tableId) {
            ticketMessage += `Table #${tableId}${tableName ? ` (${tableName})` : ''}\n`
        }

        ticketMessage += `\n📋 Order details:\n`

        orderItems.forEach(item => {
            ticketMessage += `• ${item.name} x${item.quantity} - ${item.price.toFixed(2)}€\n`
        })

        if (orderTotal) {
            ticketMessage += `\n💰 Total: ${orderTotal.toFixed(2)}€\n`
        }

        ticketMessage += `\nThank you for your visit!`

        setMessage(ticketMessage)
    }

    const handleSendSMS = async () => {
        if (!phoneNumber || !message) return

        try {
            // Normaliser le numéro de téléphone avant l'envoi
            const normalizedPhone = normalizePhoneNumber(phoneNumber)

            await sendSMS({
                phone_number: normalizedPhone,
                message,
                customer_name: customer,
                order_id: orderId,
                table_id: tableId
            })

            // Vider le message après envoi
            setMessage('')
        } catch (error) {
            console.error('Error sending SMS:', error)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return <CheckCircle className="text-green-500" size={12} />
            case 'failed':
                return <XCircle className="text-red-500" size={12} />
            default:
                return <Clock className="text-yellow-500" size={12} />
        }
    }

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'twilio':
            case 'messagebird':
                return <Wifi className="text-blue-500" size={12} />
            case 'sim800c':
            case 'sim900a':
                return <Phone className="text-green-500" size={12} />
            default:
                return <WifiOff className="text-gray-500" size={12} />
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className={`bg-white rounded-lg border border-gray-200 flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <MessageSquare className="text-blue-600" size={20} />
                    <div>
                        <h3 className="font-semibold text-gray-900">SMS Chat</h3>
                        <p className="text-sm text-gray-600">
                            {tableId ? `Table ${tableId}` : 'No table selected'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    {isExpanded ? '−' : '+'}
                </button>
            </div>

            {isExpanded && (
                <>
                    {/* Messages History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[300px]">
                        {conversationMessages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Aucun SMS envoyé</p>
                            </div>
                        ) : (
                            conversationMessages.map((msg) => (
                                <div key={msg.id} className="flex flex-col">
                                    <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
                                        <p className="text-sm text-gray-900 whitespace-pre-line">{msg.message}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1">
                                                {getStatusIcon(msg.status)}
                                                {getProviderIcon(msg.provider)}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {formatTime(msg.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Form */}
                    <div className="p-4 border-t border-gray-200 space-y-3">
                        {/* Customer Info */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Numéro de téléphone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="tel"
                                        placeholder="+33 6 12 34 56 78"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Nom du client
                                </label>
                                <div className="relative">
                                    <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Nom du client"
                                        value={customer}
                                        onChange={(e) => setCustomer(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            />
                            <div className="flex justify-between items-center mt-1">
                                <div className="text-xs text-gray-500">
                                    {message.length}/160 characters
                                </div>
                                <div className="text-xs text-gray-500">
                                    {Math.ceil(message.length / 160)} SMS
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={generateTicketMessage}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                <CreditCard size={14} />
                                Generate ticket
                            </button>
                            <button
                                onClick={handleSendSMS}
                                disabled={!phoneNumber || !message || isSendingSMS}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                <Send size={14} />
                                {isSendingSMS ? 'Sending...' : 'Send SMS'}
                            </button>
                        </div>

                        {/* Payment Button */}
                        {onPaymentClick && (
                            <button
                                onClick={onPaymentClick}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                <CreditCard size={16} />
                                Complete payment
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
