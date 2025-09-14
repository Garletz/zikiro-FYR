import { smsTicketService } from '../../smsticket/services/smsTicketService'
import { reservationService } from '../../tables/services/reservationService'
import { Reservation } from '../../tables/types/reservation'
import { ReservationEvent, TimelineEvent, TimelineFilters, TimelineGroup, TimelineStats } from '../types/timeline'

export const timelineService = {
    async getTimelineEvents(limit: number = 50): Promise<TimelineEvent[]> {
        try {
            const [smsMessages, todayReservations] = await Promise.all([
                smsTicketService.getSMSMessages(limit * 2), // Récupérer plus de SMS
                reservationService.getReservationsWithTableInfo(new Date().toISOString().split('T')[0])
            ])

            // Créer les événements de réservation (exclure les annulées)
            const reservationEvents = todayReservations
                .filter(reservation => reservation.status !== 'cancelled')
                .map(reservation => ({
                    id: `res-${reservation.id}`,
                    type: 'reservation' as const,
                    timestamp: `${reservation.reservation_date}T${reservation.reservation_time}`,
                    data: reservation,
                    priority: this.calculateReservationPriority(reservation)
                }))

            // Créer les événements SMS
            const smsEvents = smsMessages.map(sms => ({
                id: `sms-${sms.id}`,
                type: 'sms' as const,
                timestamp: sms.created_at,
                data: sms,
                priority: 'low' as const
            }))

            // Trier intelligemment : messages récents en bas, événements futurs dans l'ordre chronologique
            const now = new Date()
            const allEvents = [...smsEvents, ...reservationEvents]

            return allEvents.sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime()
                const timeB = new Date(b.timestamp).getTime()
                const nowTime = now.getTime()

                // Si les deux événements sont dans le passé, trier par ordre décroissant (plus récent en bas)
                if (timeA <= nowTime && timeB <= nowTime) {
                    return timeA - timeB // Plus ancien en haut, plus récent en bas
                }

                // Si les deux événements sont dans le futur, trier par ordre croissant (plus proche en haut)
                if (timeA > nowTime && timeB > nowTime) {
                    return timeA - timeB // Plus proche en haut
                }

                // Si un est dans le passé et l'autre dans le futur, le passé va en haut
                if (timeA <= nowTime && timeB > nowTime) {
                    return -1 // A (passé) avant B (futur)
                }
                if (timeA > nowTime && timeB <= nowTime) {
                    return 1 // B (passé) avant A (futur)
                }

                return 0
            })
        } catch (error) {
            console.error('Error loading timeline events:', error)
            return []
        }
    },

    calculateReservationPriority(reservation: any): 'low' | 'medium' | 'high' | 'urgent' {
        const now = new Date()
        const reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
        const minutesUntil = Math.floor((reservationTime.getTime() - now.getTime()) / (1000 * 60))

        if (minutesUntil < 0) return 'low' // Passé
        if (minutesUntil < 15) return 'urgent' // Arrive dans 15min
        if (minutesUntil < 60) return 'high' // Arrive dans 1h
        return 'medium' // Plus tard
    },

    async getFilteredTimelineEvents(filters: TimelineFilters): Promise<TimelineEvent[]> {
        const allEvents = await this.getTimelineEvents(100)

        let filteredEvents = allEvents

        // Filtre temporel
        if (filters.timeFilter !== 'all') {
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            filteredEvents = filteredEvents.filter(event => {
                const eventTime = new Date(event.timestamp)

                switch (filters.timeFilter) {
                    case 'today':
                        return eventTime >= today
                    case 'next2hours':
                        const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
                        const past2Hours = new Date(now.getTime() - 2 * 60 * 60 * 1000)
                        return eventTime >= past2Hours && eventTime <= in2Hours
                    case 'next4hours':
                        const in4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000)
                        const past4Hours = new Date(now.getTime() - 4 * 60 * 60 * 1000)
                        return eventTime >= past4Hours && eventTime <= in4Hours
                    default:
                        return true
                }
            })
        }

        // Filtre par type d'événement
        if (filters.eventType && filters.eventType !== 'all') {
            filteredEvents = filteredEvents.filter(event => event.type === filters.eventType)
        }

        // Filtre par priorité
        if (filters.priority && filters.priority !== 'all') {
            filteredEvents = filteredEvents.filter(event => event.priority === filters.priority)
        }

        return filteredEvents
    },

    async getTimelineStats(): Promise<TimelineStats> {
        const events = await this.getTimelineEvents(100)

        const smsCount = events.filter(e => e.type === 'sms').length
        const reservationCount = events.filter(e => e.type === 'reservation').length

        const upcomingReservations = events.filter(e =>
            e.type === 'reservation' &&
            e.priority === 'high' || e.priority === 'urgent'
        ).length

        const urgentReservations = events.filter(e =>
            e.type === 'reservation' &&
            e.priority === 'urgent'
        ).length

        return {
            totalEvents: events.length,
            smsCount,
            reservationCount,
            upcomingReservations,
            urgentReservations
        }
    },

    groupEventsByTime(events: TimelineEvent[]): TimelineGroup[] {
        const groups: { [key: string]: TimelineEvent[] } = {}

        events.forEach(event => {
            const eventTime = new Date(event.timestamp)
            const timeKey = eventTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            })

            if (!groups[timeKey]) {
                groups[timeKey] = []
            }
            groups[timeKey].push(event)
        })

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        return Object.entries(groups)
            .map(([time, events]) => ({
                time,
                events: events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
                isToday: new Date(events[0].timestamp) >= today,
                isUpcoming: new Date(events[0].timestamp) > now
            }))
            .sort((a, b) => a.time.localeCompare(b.time))
    },

    enrichReservationEvent(reservation: any): ReservationEvent {
        const now = new Date()
        const reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
        const minutesUntil = Math.floor((reservationTime.getTime() - now.getTime()) / (1000 * 60))

        return {
            ...reservation,
            minutesUntil,
            isUpcoming: minutesUntil > 0,
            isOverdue: minutesUntil < 0
        }
    },

    getReservationStatusText(reservation: ReservationEvent): string {
        if (reservation.isOverdue) {
            return 'EN RETARD'
        }

        if (reservation.minutesUntil < 15) {
            return `ARRIVE DANS ${reservation.minutesUntil}min`
        }

        if (reservation.minutesUntil < 60) {
            return `ARRIVE DANS ${reservation.minutesUntil}min`
        }

        return `RÉSERVÉ POUR ${reservation.reservation_time}`
    },

    getReservationStatusColor(reservation: ReservationEvent): string {
        if (reservation.isOverdue) {
            return 'bg-red-100 border-red-300 text-red-800'
        }

        if (reservation.minutesUntil < 15) {
            return 'bg-orange-100 border-orange-300 text-orange-800'
        }

        if (reservation.minutesUntil < 60) {
            return 'bg-blue-100 border-blue-300 text-blue-800'
        }

        return 'bg-gray-100 border-gray-300 text-gray-800'
    },

    formatEventTime(timestamp: string): string {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))

        if (diffMins < 1) {
            return 'À l\'instant'
        }

        if (diffMins < 60) {
            return `Il y a ${diffMins}min`
        }

        if (diffMins < 1440) { // Moins de 24h
            const hours = Math.floor(diffMins / 60)
            return `Il y a ${hours}h`
        }

        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    },

    // Fonctions utilitaires pour l'affichage
    shouldShowReservation(reservation: Reservation): boolean {
        const now = new Date()
        const reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
        const hoursUntil = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60)

        // Afficher les réservations des 4 prochaines heures
        return hoursUntil >= -1 && hoursUntil <= 4
    },

    getNextReservation(events: TimelineEvent[]): Reservation | null {
        const now = new Date()
        const upcomingReservations = events
            .filter(e => e.type === 'reservation')
            .map(e => e.data as Reservation)
            .filter(r => {
                const reservationTime = new Date(`${r.reservation_date}T${r.reservation_time}`)
                return reservationTime > now && r.status === 'confirmed'
            })
            .sort((a, b) => {
                const timeA = new Date(`${a.reservation_date}T${a.reservation_time}`)
                const timeB = new Date(`${b.reservation_date}T${b.reservation_time}`)
                return timeA.getTime() - timeB.getTime()
            })

        return upcomingReservations[0] || null
    }
}
