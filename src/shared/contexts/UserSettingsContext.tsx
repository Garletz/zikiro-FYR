import { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';

interface UserSettings {
    leftHandedMode: boolean
    // Autres paramètres utilisateur peuvent être ajoutés ici
}

type UserSettingsAction =
    | { type: 'SET_LEFT_HANDED_MODE'; payload: boolean }
    | { type: 'LOAD_SETTINGS'; payload: UserSettings }

interface UserSettingsContextType {
    settings: UserSettings
    setLeftHandedMode: (enabled: boolean) => void
    loadSettings: () => void
}

const defaultSettings: UserSettings = {
    leftHandedMode: false,
}

function userSettingsReducer(state: UserSettings, action: UserSettingsAction): UserSettings {
    switch (action.type) {
        case 'SET_LEFT_HANDED_MODE':
            const newSettings = { ...state, leftHandedMode: action.payload }
            // Sauvegarder dans localStorage
            localStorage.setItem('userSettings', JSON.stringify(newSettings))
            return newSettings
        case 'LOAD_SETTINGS':
            return action.payload
        default:
            return state
    }
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

export function UserSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, dispatch] = useReducer(userSettingsReducer, defaultSettings)

    const setLeftHandedMode = (enabled: boolean) => {
        dispatch({ type: 'SET_LEFT_HANDED_MODE', payload: enabled })
    }

    const loadSettings = () => {
        try {
            const savedSettings = localStorage.getItem('userSettings')
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings)
                dispatch({ type: 'LOAD_SETTINGS', payload: parsedSettings })
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error)
        }
    }

    useEffect(() => {
        loadSettings()
    }, [])

    const contextValue: UserSettingsContextType = {
        settings,
        setLeftHandedMode,
        loadSettings,
    }

    return (
        <UserSettingsContext.Provider value={contextValue}>
            {children}
        </UserSettingsContext.Provider>
    )
}

export function useUserSettings() {
    const context = useContext(UserSettingsContext)
    if (context === undefined) {
        throw new Error('useUserSettings must be used within a UserSettingsProvider')
    }
    return context
}
