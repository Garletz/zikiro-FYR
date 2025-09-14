import { CheckCircle, Clock, MessageSquare, Phone, RefreshCw, Send, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useBusinessSettings } from '../../../shared/hooks/useBusinessSettings'
import { smsTicketService } from '../../smsticket/services/smsTicketService'
import { normalizePhoneNumber } from '../../smsticket/utils/phoneNormalization'
import { reservationService } from '../../tables/services/reservationService'
import { ReservationStatus } from '../../tables/types/reservation'
import { timelineService } from '../services/timelineService'
import { ReservationEvent, TimelineEvent, TimelineFilters } from '../types/timeline'
import ReservationWidget from './ReservationWidget'

interface ModernSMSChatSectionProps {
    selectedTable: any
    currentOrder?: {
        id: string
        total: number
        items: Array<{
            name: string
            quantity: number
            price: number
        }>
    }
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

export default function ModernSMSChatSection({
    selectedTable,
    currentOrder,
    shouldGenerateTicket = false
}: ModernSMSChatSectionProps) {
    const [phoneNumber, setPhoneNumber] = useState('')
    const [customer, setCustomer] = useState('')
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
        if (shouldGenerateTicket && currentOrder?.id && currentOrder?.total && currentOrder?.items.length > 0) {
            generateTicketMessage()
        }
    }, [shouldGenerateTicket, currentOrder])

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
    }, [])

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

        if (currentOrder?.id) {
            ticketMessage += `Order #${currentOrder.id}\n`
        }

        if (selectedTable) {
            ticketMessage += `Table #${selectedTable.id}${selectedTable.name ? ` (${selectedTable.name})` : ''}\n`
        }

        ticketMessage += `\nOrder Details:\n`

        if (currentOrder?.items && currentOrder.items.length > 0) {
            currentOrder.items.forEach(item => {
                const price = item.price || 0
                const quantity = item.quantity || 1
                const name = item.name || 'Product'
                ticketMessage += `• ${name} x${quantity} - ${price.toFixed(2)}€\n`
            })
        } else {
            ticketMessage += `• No items in order\n`
        }

        if (currentOrder?.total) {
            ticketMessage += `\nTotal: ${(currentOrder.total || 0).toFixed(2)}€\n`
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

            // Normalize phone number before sending
            const normalizedPhone = normalizePhoneNumber(phoneNumber)

            // Send SMS via real service
            await smsTicketService.sendSMS({
                phone_number: normalizedPhone,
                message,
                customer_name: customer || undefined,
                order_id: currentOrder?.id,
                table_id: selectedTable?.id
            })

            setMessage('')
            // Reload messages from database
            await loadMessages()
            // Reload timeline to show the new SMS
            await loadTimelineEvents()
        } catch (error) {
            console.error('Error sending SMS:', error)
            // In case of error, still add the message with failed status
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return <CheckCircle className="w-4 h-4 text-emerald-500" />
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-500" />
            default:
                return <Clock className="w-4 h-4 text-orange-500" />
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
        <div className="h-full w-full bg-slate-800 flex flex-col border-l border-slate-700 min-h-0">
            {/* Compact SMS Header */}
            <div className="px-3 py-2 border-b border-slate-700 bg-slate-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-slate-300" />
                        <h2 className="text-sm font-semibold text-white">SMS Ticket</h2>
                        {selectedTable && (
                            <span className="text-xs text-violet-400 font-medium">
                                Table {selectedTable.number}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
                    >
                        {isExpanded ? '−' : '+'}
                    </button>
                </div>

                {/* Filters - Always visible */}
                <div className="flex gap-2 mt-2">
                    <select
                        value={timelineFilters.eventType}
                        onChange={(e) => setTimelineFilters(prev => ({ ...prev, eventType: e.target.value as any }))}
                        className="flex-1 px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white"
                    >
                        <option value="all">All</option>
                        <option value="sms">SMS</option>
                        <option value="reservation">Reservations</option>
                    </select>
                    <select
                        value={timelineFilters.timeFilter}
                        onChange={(e) => setTimelineFilters(prev => ({ ...prev, timeFilter: e.target.value as any }))}
                        className="flex-1 px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="next2hours">±2 Hours</option>
                        <option value="next4hours">±4 Hours</option>
                    </select>
                </div>
            </div>

            {isExpanded && (
                <>
                    {/* Messages History */}
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
                        {isLoadingMessages ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                                <span className="ml-2 text-sm text-slate-500">Loading messages...</span>
                            </div>
                        ) : (
                            <div className="space-y-3">

                                {/* Timeline Events */}
                                {isLoadingTimeline ? (
                                    <div className="flex items-center justify-center py-4">
                                        <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                                        <span className="ml-2 text-sm text-slate-500">Loading timeline...</span>
                                    </div>
                                ) : timelineEvents.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm text-slate-500">No events found</p>
                                    </div>
                                ) : (
                                    timelineEvents.map((event) => {
                                        if (event.type === 'sms') {
                                            const msg = event.data as SMSMessage
                                            return (
                                                <div key={event.id} className="flex flex-col">
                                                    <div className="bg-slate-50 rounded-xl p-4 max-w-[85%] border border-slate-200/60">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="w-3 h-3 text-slate-400" />
                                                                <span className="text-xs font-medium text-violet-600">{msg.phone_number}</span>
                                                                {msg.customer_name && (
                                                                    <span className="text-xs font-medium text-emerald-600">({msg.customer_name})</span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-slate-400">
                                                                {timelineService.formatEventTime(event.timestamp)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-800 whitespace-pre-line mb-2">{msg.message}</p>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {getStatusIcon(msg.status)}
                                                                <span className="text-xs text-slate-500">{getProviderText(msg.provider)}</span>
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

                    {/* SMS Form */}
                    <div className="p-3 border-t border-slate-700 bg-slate-800 space-y-2 flex-shrink-0">
                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+33 6 12 34 56 78"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full px-2 py-1.5 border border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-xs bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Customer name"
                                    value={customer}
                                    onChange={(e) => setCustomer(e.target.value)}
                                    className="w-full px-2 py-1.5 border border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-xs bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                                Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                rows={4}
                                className="w-full px-2 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none text-xs bg-slate-700 text-white placeholder-slate-400 transition-all duration-200"
                            />
                            <div className="flex justify-between items-center mt-1">
                                <div className="text-xs text-slate-400">
                                    {message.length}/160 characters
                                </div>
                                <div className="text-xs text-slate-400">
                                    {Math.ceil(message.length / 160)} SMS
                                </div>
                            </div>
                        </div>

                        {/* Actions - Cursor style */}
                        <div className="flex gap-1 flex-shrink-0">
                            <button
                                onClick={async () => {
                                    await loadMessages()
                                    await loadTimelineEvents()
                                }}
                                disabled={isLoadingMessages || isLoadingTimeline}
                                className="p-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${(isLoadingMessages || isLoadingTimeline) ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleSendSMS}
                                disabled={!phoneNumber || !message || isSendingSMS}
                                className="flex-1 p-2 bg-violet-600 text-white rounded hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                                title={isSendingSMS ? 'Sending...' : 'Send SMS'}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
