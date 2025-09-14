import { SMSMessage } from '../../smsticket/types'
import { Reservation } from '../../tables/types/reservation'

export interface TimelineEvent {
    id: string
    type: 'sms' | 'reservation'
    timestamp: string
    data: SMSMessage | Reservation
    priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface ReservationEvent extends Reservation {
    minutesUntil: number
    isUpcoming: boolean
    isOverdue: boolean
    table_number?: number
    table_name?: string
}

export interface TimelineFilters {
    timeFilter: 'all' | 'today' | 'next2hours' | 'next4hours'
    eventType?: 'sms' | 'reservation' | 'all'
    priority?: 'low' | 'medium' | 'high' | 'urgent' | 'all'
}

export interface TimelineStats {
    totalEvents: number
    smsCount: number
    reservationCount: number
    upcomingReservations: number
    urgentReservations: number
}

export interface TimelineGroup {
    time: string
    events: TimelineEvent[]
    isToday: boolean
    isUpcoming: boolean
}
