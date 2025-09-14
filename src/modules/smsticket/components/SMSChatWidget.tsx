import {
    CheckCircle,
    Clock,
    MessageSquare,
    Phone,
    Send,
    Wifi,
    WifiOff,
    X,
    XCircle
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SMSMessage, smsTicketService } from '../services/smsTicketService'

interface SMSChatWidgetProps {
    isOpen: boolean
    onClose: () => void
    customerPhone?: string
    customerName?: string
    orderId?: string
    tableId?: string
}

export default function SMSChatWidget({
    isOpen,
    onClose,
    customerPhone = '',
    customerName = '',
    orderId,
    tableId
}: SMSChatWidgetProps) {
    const [messages, setMessages] = useState<SMSMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState(customerPhone)
    const [customer, setCustomer] = useState(customerName)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen && phoneNumber) {
            loadMessages()
        }
    }, [isOpen, phoneNumber])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const loadMessages = async () => {
        if (!phoneNumber) return

        try {
            setIsLoading(true)
            // For now, we'll get all messages and filter by phone number
            // In a real implementation, we'd have a specific endpoint for conversation messages
            const allMessages = await smsTicketService.getSMSMessages(50)
            const conversationMessages = allMessages.filter(msg => msg.phone_number === phoneNumber)
            setMessages(conversationMessages)
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !phoneNumber) return

        try {
            setIsLoading(true)
            await smsTicketService.sendSMS({
                phone_number: phoneNumber,
                message: newMessage,
                customer_name: customer,
                order_id: orderId,
                table_id: tableId
            })

            setNewMessage('')
            await loadMessages()
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsLoading(false)
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="text-blue-600" size={20} />
                        <div>
                            <h3 className="font-semibold text-gray-900">SMS Chat</h3>
                            <p className="text-sm text-gray-600">
                                {customer || phoneNumber}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Phone Number Input */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Phone className="text-gray-400" size={16} />
                        <input
                            type="tel"
                            placeholder="Numéro de téléphone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <input
                            type="text"
                            placeholder="Nom du client"
                            value={customer}
                            onChange={(e) => setCustomer(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading && messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2">Chargement des messages...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>Aucun message</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id} className="flex flex-col">
                                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                                    <p className="text-sm text-gray-900">{message.message}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-1">
                                            {getStatusIcon(message.status)}
                                            {getProviderIcon(message.provider)}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {formatTime(message.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Tapez votre message..."
                            rows={2}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || !phoneNumber || isLoading}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {newMessage.length}/160 caractères
                    </div>
                </div>
            </div>
        </div>
    )
}
