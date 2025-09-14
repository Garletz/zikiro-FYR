import { invoke } from '@tauri-apps/api/core'
import {
    CreateReservationRequest,
    Reservation,
    ReservationFilters,
    ReservationStats,
    ReservationWithTable
} from '../types/reservation'

export const reservationService = {
    async createReservation(reservation: CreateReservationRequest): Promise<Reservation> {
        return invoke('create_reservation', { reservation })
    },

    async getReservationsByDate(date: string): Promise<Reservation[]> {
        return invoke('get_reservations_by_date', { date })
    },

    async getTodayReservations(): Promise<Reservation[]> {
        return invoke('get_today_reservations')
    },

    async updateReservationStatus(id: string, status: string): Promise<void> {
        return invoke('update_reservation_status', { id, status })
    },

    async deleteReservation(id: string): Promise<void> {
        return invoke('delete_reservation', { id })
    },

    async getReservationsByTable(tableId: string): Promise<Reservation[]> {
        return invoke('get_reservations_by_table', { tableId })
    },

    // Fonctions utilitaires
    async getReservationsWithTableInfo(date: string): Promise<ReservationWithTable[]> {
        const reservations = await this.getReservationsByDate(date)

        // Enrichir avec les informations de table
        const reservationsWithTable: ReservationWithTable[] = []

        for (const reservation of reservations) {
            try {
                // Récupérer les informations de la table
                const table = await invoke('get_table_by_id_command', { id: reservation.table_id })

                if (table) {
                    reservationsWithTable.push({
                        ...reservation,
                        table_number: (table as any).number,
                        table_name: (table as any).name,
                        table_capacity: (table as any).capacity
                    })
                }
            } catch (error) {
                console.error('Error fetching table info for reservation:', error)
                // Ajouter quand même la réservation sans les infos de table
                reservationsWithTable.push({
                    ...reservation,
                    table_number: 0,
                    table_name: 'Unknown Table',
                    table_capacity: 0
                })
            }
        }

        return reservationsWithTable
    },

    async getReservationStats(): Promise<ReservationStats> {
        const today = new Date().toISOString().split('T')[0]
        const reservations = await this.getReservationsByDate(today)

        const stats: ReservationStats = {
            total: reservations.length,
            confirmed: reservations.filter(r => r.status === 'confirmed').length,
            cancelled: reservations.filter(r => r.status === 'cancelled').length,
            completed: reservations.filter(r => r.status === 'completed').length,
            no_show: reservations.filter(r => r.status === 'no_show').length,
            today: reservations.length,
            upcoming: reservations.filter(r => {
                const now = new Date()
                const reservationTime = new Date(`${r.reservation_date}T${r.reservation_time}`)
                return reservationTime > now && r.status === 'confirmed'
            }).length
        }

        return stats
    },

    async getUpcomingReservations(hours: number = 2): Promise<ReservationWithTable[]> {
        const today = new Date().toISOString().split('T')[0]
        const reservations = await this.getReservationsWithTableInfo(today)

        const now = new Date()
        const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000)

        return reservations.filter(reservation => {
            const reservationTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
            return reservationTime >= now &&
                reservationTime <= futureTime &&
                reservation.status === 'confirmed'
        })
    },

    async getReservationsByFilters(filters: ReservationFilters): Promise<ReservationWithTable[]> {
        let reservations: ReservationWithTable[] = []

        if (filters.date) {
            reservations = await this.getReservationsWithTableInfo(filters.date)
        } else {
            reservations = await this.getReservationsWithTableInfo(new Date().toISOString().split('T')[0])
        }

        // Appliquer les filtres
        if (filters.status) {
            reservations = reservations.filter(r => r.status === filters.status)
        }

        if (filters.table_id) {
            reservations = reservations.filter(r => r.table_id === filters.table_id)
        }

        if (filters.customer_name) {
            reservations = reservations.filter(r =>
                r.customer_name.toLowerCase().includes(filters.customer_name!.toLowerCase())
            )
        }

        return reservations
    },

    // Validation des réservations
    validateReservation(reservation: CreateReservationRequest): { valid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!reservation.customer_name.trim()) {
            errors.push('Customer name is required')
        }

        if (!reservation.reservation_date) {
            errors.push('Reservation date is required')
        }

        if (!reservation.reservation_time) {
            errors.push('Reservation time is required')
        }

        if (reservation.party_size < 1) {
            errors.push('Party size must be at least 1')
        }

        if (reservation.customer_phone && !/^[\+]?[0-9\s\-\(\)]+$/.test(reservation.customer_phone)) {
            errors.push('Invalid phone number format')
        }

        if (reservation.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reservation.customer_email)) {
            errors.push('Invalid email format')
        }

        // Vérifier que la date n'est pas dans le passé
        const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`)
        if (reservationDateTime < new Date()) {
            errors.push('Reservation cannot be in the past')
        }

        return {
            valid: errors.length === 0,
            errors
        }
    },

    // Formatage des données
    formatReservationTime(time: string): string {
        const [hours, minutes] = time.split(':')
        return `${hours}:${minutes}`
    },

    formatReservationDate(date: string): string {
        return new Date(date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    },

    getReservationStatusColor(status: string): string {
        switch (status) {
            case 'confirmed':
                return 'text-blue-600 bg-blue-100'
            case 'cancelled':
                return 'text-red-600 bg-red-100'
            case 'completed':
                return 'text-green-600 bg-green-100'
            case 'no_show':
                return 'text-orange-600 bg-orange-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    },

    getReservationStatusLabel(status: string): string {
        switch (status) {
            case 'confirmed':
                return 'Confirmée'
            case 'cancelled':
                return 'Annulée'
            case 'completed':
                return 'Terminée'
            case 'no_show':
                return 'Absent'
            default:
                return 'Inconnu'
        }
    }
}
