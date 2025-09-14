// Icons removed as requested
import { useEffect, useRef, useState } from 'react'
import { useBusinessSettings } from '../../../shared/hooks/useBusinessSettings'
import { smsTicketService } from '../../smsticket/services/smsTicketService'
import { normalizePhoneNumber } from '../../smsticket/utils/phoneNormalization'
import { reservationService } from '../../tables/services/reservationService'
import { ReservationStatus } from '../../tables/types/reservation'
import { timelineService } from '../services/timelineService'
import { ReservationEvent, TimelineEvent, TimelineFilters } from '../types/timeline'
import ReservationWidget from './ReservationWidget'

interface SimpleSMSChatProps {
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
    className?: string
    // New prop to trigger auto-fill
    shouldGenerateTicket?: boolean
}

interface SMSMessage {
    id: string
    message: string
    phone_number: string
    status: string
    provider: string
    created_at: string
    customer_name?: string
}

export default function SimpleSMSChat({
    tableId,
    tableName,
    customerPhone = '',
    customerName = '',
    orderId,
    orderTotal,
    orderItems = [],
    className = '',
    shouldGenerateTicket = false
}: SimpleSMSChatProps) {
    const [phoneNumber, setPhoneNumber] = useState(customerPhone)
    const [customer, setCustomer] = useState(customerName)
    const [message, setMessage] = useState('')
    const [isExpanded, setIsExpanded] = useState(true)
    const [messages, setMessages] = useState<SMSMessage[]>([])
    const [isSendingSMS, setIsSendingSMS] = useState(false)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Get business info for ticket generation
    const { businessInfo } = useBusinessSettings()

    // États pour la timeline
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(false)
    const [timelineFilters, setTimelineFilters] = useState<TimelineFilters>({
        timeFilter: 'all',
        eventType: 'all',
        priority: 'all'
    })

    // Auto-fill message ONLY during payment
    useEffect(() => {
        if (shouldGenerateTicket && orderId && orderTotal && orderItems.length > 0) {
            generateTicketMessage()
        }
    }, [shouldGenerateTicket, orderId, orderTotal, orderItems])

    // Load messages from database (global history)
    const loadMessages = async () => {
        setIsLoadingMessages(true)
        try {
            const allMessages = await smsTicketService.getSMSMessages(20) // Last 20 SMS
            setMessages(allMessages) // No filter by number
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setIsLoadingMessages(false)
        }
    }

    // Load messages and timeline on component mount
    useEffect(() => {
        loadMessages()
        loadTimelineEvents()
    }, []) // Only triggers on mount

    // Reload messages and timeline when component becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadMessages()
                loadTimelineEvents()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    // Use all messages (no filter by number) and sort by ascending date (oldest at top, newest at bottom)
    const conversationMessages = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // Load timeline events
    const loadTimelineEvents = async () => {
        setIsLoadingTimeline(true)
        try {
            const events = await timelineService.getFilteredTimelineEvents(timelineFilters)
            setTimelineEvents(events)
        } catch (error) {
            console.error('Error loading timeline events:', error)
        } finally {
            setIsLoadingTimeline(false)
        }
    }

    // Load timeline on mount and when filters change
    useEffect(() => {
        loadTimelineEvents()
    }, [timelineFilters])

    // Handlers for reservation actions
    const handleConfirmArrival = async (reservationId: string) => {
        try {
            await reservationService.updateReservationStatus(reservationId, 'completed')
            loadTimelineEvents()
        } catch (error) {
            console.error('Error confirming arrival:', error)
        }
    }

    const handleModifyReservation = (reservation: ReservationEvent) => {
        // Ouvrir le modal de modification
        console.log('Modify reservation:', reservation)
    }

    const handleReservationStatusChange = async (reservationId: string, status: ReservationStatus) => {
        try {
            await reservationService.updateReservationStatus(reservationId, status)
            loadTimelineEvents()
        } catch (error) {
            console.error('Error updating reservation status:', error)
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [conversationMessages])

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            })
        }
    }

    const generateTicketMessage = () => {
        // Use business name if available, otherwise default to "Zikiro"
        const businessName = businessInfo?.business_name || 'Zikiro'
        let ticketMessage = `${businessName}\n\n`

        if (orderId) {
            ticketMessage += `Order #${orderId}\n`
        }

        if (tableId) {
            ticketMessage += `Table #${tableId}${tableName ? ` (${tableName})` : ''}\n`
        }

        ticketMessage += `\nOrder Details:\n`

        if (orderItems && orderItems.length > 0) {
            orderItems.forEach(item => {
                const price = item.price || 0
                const quantity = item.quantity || 1
                const name = item.name || 'Product'
                ticketMessage += `• ${name} x${quantity} - ${price.toFixed(2)}€\n`
            })
        } else {
            ticketMessage += `• No items in order\n`
        }

        if (orderTotal) {
            ticketMessage += `\nTotal: ${(orderTotal || 0).toFixed(2)}€\n`
        }

        ticketMessage += `\nThank you for your visit!`

        setMessage(ticketMessage)
    }

    const handleSendSMS = async () => {
        if (!phoneNumber || !message) return

        setIsSendingSMS(true)

        try {
            // Auto-create contact if customer name is provided
            if (customer) {
                await smsTicketService.ensureContactExists(phoneNumber, customer)
            }


            // Normaliser le numéro de téléphone avant l'envoi
            const normalizedPhone = normalizePhoneNumber(phoneNumber)

            // Envoyer le SMS via le service réel
            await smsTicketService.sendSMS({
                phone_number: normalizedPhone,
                message,
                customer_name: customer || undefined,
                order_id: orderId,
                table_id: tableId
            })

            setMessage('')
            // Recharger les messages depuis la base de données
            await loadMessages()
            // Recharger aussi la timeline pour afficher le nouveau SMS
            await loadTimelineEvents()
        } catch (error) {
            console.error('Error sending SMS:', error)
            // En cas d'erreur, ajouter quand même le message avec statut failed
            const failedMessage: SMSMessage = {
                id: Date.now().toString(),
                message,
                phone_number: phoneNumber,
                status: 'failed',
                provider: 'unknown',
                created_at: new Date().toISOString()
            }
            setMessages(prev => [...prev, failedMessage])
        } finally {
            setIsSendingSMS(false)
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return '✓'
            case 'failed':
                return '✗'
            default:
                return '⏳'
        }
    }

    const getProviderText = (provider: string) => {
        switch (provider) {
            case 'twilio':
            case 'messagebird':
                return 'Cloud'
            case 'sim800c':
            case 'sim900a':
                return 'SIM'
            default:
                return 'Unknown'
        }
    }


    return (
        <div
            className={`bg-white rounded-lg border border-gray-200 flex flex-col h-full ${className}`}
            onScroll={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div>
                        <h3 className="font-semibold text-gray-900">SMS Ticket</h3>
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
                    <div
                        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[300px]"
                        onScroll={(e) => e.stopPropagation()}
                    >
                        {isLoadingMessages ? (
                            <div className="text-center text-gray-500 py-8">
                                <p className="text-sm">Loading messages...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Filtres de timeline */}
                                <div className="flex gap-2 mb-4">
                                    <select
                                        value={timelineFilters.timeFilter}
                                        onChange={(e) => setTimelineFilters(prev => ({ ...prev, timeFilter: e.target.value as any }))}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">All</option>
                                        <option value="today">Today</option>
                                        <option value="next2hours">±2 Hours</option>
                                        <option value="next4hours">±4 Hours</option>
                                    </select>

                                    <select
                                        value={timelineFilters.eventType}
                                        onChange={(e) => setTimelineFilters(prev => ({ ...prev, eventType: e.target.value as any }))}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">SMS + Reservations</option>
                                        <option value="sms">SMS Only</option>
                                        <option value="reservation">Reservations Only</option>
                                    </select>
                                </div>

                                {/* Timeline Events */}
                                {isLoadingTimeline ? (
                                    <div className="text-center text-gray-500 py-4">
                                        <p className="text-sm">Loading timeline...</p>
                                    </div>
                                ) : timelineEvents.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <p className="text-sm">No events found</p>
                                    </div>
                                ) : (
                                    timelineEvents.map((event) => {
                                        if (event.type === 'sms') {
                                            const msg = event.data as SMSMessage
                                            return (
                                                <div key={event.id} className="flex flex-col">
                                                    <div className="bg-gray-100 rounded-lg p-3 max-w-[85%]">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium text-blue-600">{msg.phone_number}</span>
                                                                {msg.customer_name && (
                                                                    <span className="text-xs font-medium text-green-600">({msg.customer_name})</span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-gray-500">
                                                                {timelineService.formatEventTime(event.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-900 whitespace-pre-line">{msg.message}</p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs">{getStatusText(msg.status)}</span>
                                                                <span className="text-xs text-gray-500">{getProviderText(msg.provider)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        } else if (event.type === 'reservation') {
                                            const reservation = event.data as ReservationEvent
                                            return (
                                                <ReservationWidget
                                                    key={event.id}
                                                    reservation={reservation}
                                                    priority={event.priority}
                                                    onConfirmArrival={handleConfirmArrival}
                                                    onModifyReservation={handleModifyReservation}
                                                    onStatusChange={handleReservationStatusChange}
                                                    compact={true}
                                                />
                                            )
                                        }
                                        return null
                                    })
                                )}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Form */}
                    <div className="p-4 border-t border-gray-200 space-y-3">
                        {/* Customer Info */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+33 6 12 34 56 78"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    onFocus={(e) => e.preventDefault()}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Customer name"
                                    value={customer}
                                    onChange={(e) => setCustomer(e.target.value)}
                                    onFocus={(e) => e.preventDefault()}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
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
                                onFocus={(e) => e.preventDefault()}
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
                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                Generate Ticket
                            </button>
                            <button
                                onClick={async () => {
                                    await loadMessages()
                                    await loadTimelineEvents()
                                }}
                                disabled={isLoadingMessages || isLoadingTimeline}
                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                {(isLoadingMessages || isLoadingTimeline) ? 'Loading...' : 'Refresh'}
                            </button>
                            <button
                                onClick={handleSendSMS}
                                disabled={!phoneNumber || !message || isSendingSMS}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                {isSendingSMS ? 'Sending...' : 'Send SMS'}
                            </button>
                        </div>

                        {/* Payment Button removed as requested */}
                    </div>
                </>
            )}
        </div>
    )
}
