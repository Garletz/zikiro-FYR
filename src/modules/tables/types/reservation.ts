export interface Reservation {
    id: string
    table_id: string
    customer_name: string
    customer_phone?: string
    reservation_date: string
    reservation_time: string
    duration_minutes: number
    party_size: number
    special_requests?: string
    status: ReservationStatus
    created_at: string
    updated_at: string
    // Champs calculés
    table_number?: number
    table_name?: string
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'arrived'

export interface CreateReservationRequest {
    table_id: string
    customer_name: string
    customer_phone?: string
    customer_email?: string
    reservation_date: string
    reservation_time: string
    duration_minutes?: number
    party_size: number
    special_requests?: string
}

export interface UpdateReservationRequest {
    id: string
    customer_name?: string
    customer_phone?: string
    customer_email?: string
    reservation_date?: string
    reservation_time?: string
    duration_minutes?: number
    party_size?: number
    special_requests?: string
    status?: ReservationStatus
}

export interface ReservationWithTable extends Reservation {
    table_number: number
    table_name: string
    table_capacity: number
}

export interface ReservationTimeSlot {
    time: string
    available: boolean
    reservation?: Reservation
}

export interface ReservationFilters {
    date?: string
    status?: ReservationStatus
    table_id?: string
    customer_name?: string
}

export interface ReservationStats {
    total: number
    confirmed: number
    cancelled: number
    completed: number
    no_show: number
    today: number
    upcoming: number
}
