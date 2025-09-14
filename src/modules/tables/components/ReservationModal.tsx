import { AlertCircle, Calendar, CheckCircle, Clock, MessageSquare, Phone, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { reservationService } from '../services/reservationService'
import { CreateReservationRequest, Reservation } from '../types/reservation'
import { TableData } from '../types/table'

interface ReservationModalProps {
    table: TableData
    isOpen: boolean
    onClose: () => void
    onReservationCreated: (reservation: Reservation) => void
}

export default function ReservationModal({
    table,
    isOpen,
    onClose,
    onReservationCreated
}: ReservationModalProps) {
    const [formData, setFormData] = useState<CreateReservationRequest>({
        table_id: table.id,
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '19:00',
        duration_minutes: 120,
        party_size: Math.min(table.capacity, 4),
        special_requests: ''
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const [showSuccess, setShowSuccess] = useState(false)

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                table_id: table.id,
                customer_name: '',
                customer_phone: '',
                customer_email: '',
                reservation_date: new Date().toISOString().split('T')[0],
                reservation_time: '19:00',
                duration_minutes: 120,
                party_size: Math.min(table.capacity, 4),
                special_requests: ''
            })
            setErrors([])
            setShowSuccess(false)
        }
    }, [isOpen, table])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors([])
        setIsSubmitting(true)

        try {
            // Validation
            const validation = reservationService.validateReservation(formData)
            if (!validation.valid) {
                setErrors(validation.errors)
                setIsSubmitting(false)
                return
            }

            // Créer la réservation
            const reservation = await reservationService.createReservation(formData)

            setShowSuccess(true)
            setTimeout(() => {
                onReservationCreated(reservation)
                onClose()
            }, 1500)

        } catch (error) {
            setErrors([error instanceof Error ? error.message : 'Erreur lors de la création de la réservation'])
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInputChange = (field: keyof CreateReservationRequest, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear errors when user starts typing
        if (errors.length > 0) {
            setErrors([])
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header avec design Apple */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">New Reservation</h2>
                            <p className="text-blue-100 text-sm">Table {table.number} - {table.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Contenu du formulaire */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {showSuccess ? (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reservation Created!</h3>
                            <p className="text-gray-600">The reservation has been successfully saved.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Erreurs */}
                            {errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                    <div className="flex items-start">
                                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800 mb-1">Validation Errors</h4>
                                            <ul className="text-sm text-red-700 space-y-1">
                                                {errors.map((error, index) => (
                                                    <li key={index}>• {error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Informations client */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-blue-500" />
                                    Customer Information
                                </h3>

                                {/* Customer Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Customer Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.customer_name}
                                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                        placeholder="Full name"
                                        required
                                    />
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Phone className="w-4 h-4 inline mr-1" />
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.customer_phone}
                                        onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                            </div>

                            {/* Reservation Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                                    Reservation Details
                                </h3>

                                {/* Date and Time */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.reservation_date}
                                            onChange={(e) => handleInputChange('reservation_date', e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.reservation_time}
                                            onChange={(e) => handleInputChange('reservation_time', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Party Size and Duration */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Party Size *
                                        </label>
                                        <select
                                            value={formData.party_size}
                                            onChange={(e) => handleInputChange('party_size', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                            required
                                        >
                                            {Array.from({ length: table.capacity }, (_, i) => i + 1).map(num => (
                                                <option key={num} value={num}>{num} person{num > 1 ? 's' : ''}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Duration (min)
                                        </label>
                                        <select
                                            value={formData.duration_minutes}
                                            onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                        >
                                            <option value={60}>1h</option>
                                            <option value={90}>1h30</option>
                                            <option value={120}>2h</option>
                                            <option value={150}>2h30</option>
                                            <option value={180}>3h</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Special Requests */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MessageSquare className="w-4 h-4 inline mr-1" />
                                        Special Requests
                                    </label>
                                    <textarea
                                        value={formData.special_requests}
                                        onChange={(e) => handleInputChange('special_requests', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
                                        placeholder="Allergies, birthday, etc."
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Reservation'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
