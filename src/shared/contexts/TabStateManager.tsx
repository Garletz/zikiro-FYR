import { createContext, ReactNode, useCallback, useContext, useRef } from 'react'

interface TabState {
    [key: string]: any
}

interface TabStateManagerType {
    setState: (tabId: string, key: string, value: any) => void
    getState: (tabId: string, key: string) => any
    getFullState: (tabId: string) => TabState
    clearTab: (tabId: string) => void
    subscribe: (tabId: string, callback: (state: TabState) => void) => () => void
}

class TabStateManagerClass {
    private states = new Map<string, TabState>()
    private subscribers = new Map<string, Set<(state: TabState) => void>>()

    setState(tabId: string, key: string, value: any) {
        if (!this.states.has(tabId)) {
            this.states.set(tabId, {})
        }

        const tabState = this.states.get(tabId)!
        tabState[key] = value

        // Notifier les subscribers
        this.notifySubscribers(tabId, tabState)
    }

    getState(tabId: string, key: string) {
        return this.states.get(tabId)?.[key]
    }

    getFullState(tabId: string): TabState {
        return this.states.get(tabId) || {}
    }

    clearTab(tabId: string) {
        this.states.delete(tabId)
        this.subscribers.delete(tabId)
    }

    subscribe(tabId: string, callback: (state: TabState) => void) {
        if (!this.subscribers.has(tabId)) {
            this.subscribers.set(tabId, new Set())
        }

        this.subscribers.get(tabId)!.add(callback)

        // Retourner une fonction pour se désabonner
        return () => {
            this.subscribers.get(tabId)?.delete(callback)
        }
    }

    private notifySubscribers(tabId: string, state: TabState) {
        this.subscribers.get(tabId)?.forEach(callback => {
            try {
                callback(state)
            } catch (error) {
                // Error handled silently in tab state subscriber
            }
        })
    }
}

// Instance globale du gestionnaire d'état
const tabStateManager = new TabStateManagerClass()

// Contexte React
const TabStateContext = createContext<TabStateManagerType | undefined>(undefined)

// Provider
export function TabStateProvider({ children }: { children: ReactNode }) {
    const managerRef = useRef(tabStateManager)

    const contextValue: TabStateManagerType = {
        setState: useCallback((tabId: string, key: string, value: any) => {
            managerRef.current.setState(tabId, key, value)
        }, []),

        getState: useCallback((tabId: string, key: string) => {
            return managerRef.current.getState(tabId, key)
        }, []),

        getFullState: useCallback((tabId: string) => {
            return managerRef.current.getFullState(tabId)
        }, []),

        clearTab: useCallback((tabId: string) => {
            managerRef.current.clearTab(tabId)
        }, []),

        subscribe: useCallback((tabId: string, callback: (state: TabState) => void) => {
            return managerRef.current.subscribe(tabId, callback)
        }, [])
    }

    return (
        <TabStateContext.Provider value={contextValue}>
            {children}
        </TabStateContext.Provider>
    )
}

// Hook personnalisé
export function useTabState() {
    const context = useContext(TabStateContext)
    if (context === undefined) {
        throw new Error('useTabState must be used within a TabStateProvider')
    }
    return context
}

// Hook pour un onglet spécifique
export function useTabStateForTab(tabId: string) {
    const { setState, getState, getFullState, subscribe } = useTabState()

    const setTabState = useCallback((key: string, value: any) => {
        setState(tabId, key, value)
    }, [tabId, setState])

    const getTabState = useCallback((key: string) => {
        return getState(tabId, key)
    }, [tabId, getState])

    const getTabFullState = useCallback(() => {
        return getFullState(tabId)
    }, [tabId, getFullState])

    const subscribeToTab = useCallback((callback: (state: TabState) => void) => {
        return subscribe(tabId, callback)
    }, [tabId, subscribe])

    return {
        setTabState,
        getTabState,
        getTabFullState,
        subscribeToTab
    }
}

