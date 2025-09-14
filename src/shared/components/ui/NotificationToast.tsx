import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'
import { Notification, useError } from '../../contexts/ErrorContext'

interface NotificationToastProps {
    notification: Notification
}

const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
}

const colorClasses = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-danger-50 border-danger-200 text-danger-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    info: 'bg-info-50 border-info-200 text-info-800'
}

const iconColorClasses = {
    success: 'text-success-600',
    error: 'text-danger-600',
    warning: 'text-warning-600',
    info: 'text-info-600'
}

export default function NotificationToast({ notification }: NotificationToastProps) {
    const { removeNotification } = useError()
    const IconComponent = iconMap[notification.type]

    useEffect(() => {
        if (notification.duration && notification.duration > 0) {
            const timer = setTimeout(() => {
                removeNotification(notification.id)
            }, notification.duration)

            return () => clearTimeout(timer)
        }
    }, [notification.id, notification.duration, removeNotification])

    return (
        <div className={`
      flex items-start p-4 border rounded-lg shadow-lg max-w-sm w-full
      ${colorClasses[notification.type]}
      animate-in slide-in-from-right-full duration-300
    `}>
            <IconComponent className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${iconColorClasses[notification.type]}`} />

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium mb-1">
                    {notification.title}
                </h4>
                <p className="text-sm opacity-90">
                    {notification.message}
                </p>
            </div>

            <button
                onClick={() => removeNotification(notification.id)}
                className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
