import { useError } from '../../contexts/ErrorContext'
import NotificationToast from './NotificationToast'

export default function NotificationContainer() {
    const { state } = useError()

    if (state.notifications.length === 0) {
        return null
    }

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {state.notifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                />
            ))}
        </div>
    )
}
