import { createContext, ReactNode, useContext, useReducer } from 'react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
    id: string
    type: NotificationType
    title: string
    message: string
    duration?: number
    timestamp: number
}

interface ErrorState {
    notifications: Notification[]
    globalError: string | null
}

type ErrorAction =
    | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
    | { type: 'REMOVE_NOTIFICATION'; payload: string }
    | { type: 'CLEAR_NOTIFICATIONS' }
    | { type: 'SET_GLOBAL_ERROR'; payload: string | null }
    | { type: 'CLEAR_GLOBAL_ERROR' }

const initialState: ErrorState = {
    notifications: [],
    globalError: null
}

function errorReducer(state: ErrorState, action: ErrorAction): ErrorState {
    switch (action.type) {
        case 'ADD_NOTIFICATION':
            const newNotification: Notification = {
                ...action.payload,
                id: Date.now().toString(),
                timestamp: Date.now()
            }
            return {
                ...state,
                notifications: [...state.notifications, newNotification]
            }

        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload)
            }

        case 'CLEAR_NOTIFICATIONS':
            return {
                ...state,
                notifications: []
            }

        case 'SET_GLOBAL_ERROR':
            return {
                ...state,
                globalError: action.payload
            }

        case 'CLEAR_GLOBAL_ERROR':
            return {
                ...state,
                globalError: null
            }

        default:
            return state
    }
}

interface ErrorContextType {
    state: ErrorState
    showNotification: (type: NotificationType, title: string, message: string, duration?: number) => void
    removeNotification: (id: string) => void
    clearNotifications: () => void
    setGlobalError: (error: string | null) => void
    clearGlobalError: () => void
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(errorReducer, initialState)

    const showNotification = (type: NotificationType, title: string, message: string, duration = 5000) => {
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: { type, title, message, duration }
        })

        // Auto-remove notification after duration
        if (duration > 0) {
            setTimeout(() => {
                dispatch({ type: 'REMOVE_NOTIFICATION', payload: Date.now().toString() })
            }, duration)
        }
    }

    const removeNotification = (id: string) => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
    }

    const clearNotifications = () => {
        dispatch({ type: 'CLEAR_NOTIFICATIONS' })
    }

    const setGlobalError = (error: string | null) => {
        dispatch({ type: 'SET_GLOBAL_ERROR', payload: error })
    }

    const clearGlobalError = () => {
        dispatch({ type: 'CLEAR_GLOBAL_ERROR' })
    }

    return (
        <ErrorContext.Provider value={{
            state,
            showNotification,
            removeNotification,
            clearNotifications,
            setGlobalError,
            clearGlobalError
        }}>
            {children}
        </ErrorContext.Provider>
    )
}

export function useError() {
    const context = useContext(ErrorContext)
    if (context === undefined) {
        throw new Error('useError must be used within an ErrorProvider')
    }
    return context
}
