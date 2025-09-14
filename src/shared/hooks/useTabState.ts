import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useTabStateForTab } from '../contexts/TabStateManager'

interface UseTabStateOptions {
    tabId: string
    key: string
    defaultValue?: any
    persist?: boolean
}

/**
 * Hook pour gérer l'état local d'un onglet avec persistance automatique
 * 
 * @param options - Options de configuration
 * @param options.tabId - ID de l'onglet
 * @param options.key - Clé de l'état
 * @param options.defaultValue - Valeur par défaut
 * @param options.persist - Si true, l'état est persisté entre les changements d'onglet
 * 
 * @returns [state, setState] - État et fonction de mise à jour
 */
export function useTabState<T = any>({
    tabId,
    key,
    defaultValue,
    persist = true
}: UseTabStateOptions): [T, (value: T | ((prev: T) => T)) => void] {
    const { setTabState, getTabState } = useTabStateForTab(tabId)
    const [localState, setLocalState] = useState<T>(() => {
        // Essayer de récupérer l'état sauvegardé
        if (persist) {
            const saved = getTabState(key)
            if (saved !== undefined) {
                return saved
            }
        }
        return defaultValue
    })

    // Sauvegarder l'état quand il change
    const setState = useCallback((value: T | ((prev: T) => T)) => {
        setLocalState(prevState => {
            const newState = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value

            // Sauvegarder dans le cache si persist est activé
            if (persist) {
                setTabState(key, newState)
            }

            return newState
        })
    }, [key, persist, setTabState])

    // Restaurer l'état depuis le cache si nécessaire
    useEffect(() => {
        if (persist) {
            const saved = getTabState(key)
            if (saved !== undefined && saved !== localState) {
                setLocalState(saved)
            }
        }
    }, [key, persist, getTabState, localState])

    return [localState, setState]
}

/**
 * Hook pour gérer plusieurs états dans un onglet
 */
export function useTabStates<T extends Record<string, any>>(
    tabId: string,
    initialState: T,
    persist = true
): [T, (updates: Partial<T>) => void, (key: keyof T) => (value: T[keyof T]) => void] {
    const { setTabState, getTabState } = useTabStateForTab(tabId)
    const [state, setState] = useState<T>(() => {
        if (persist) {
            const saved = getTabState('multipleStates')
            if (saved) {
                return { ...initialState, ...saved }
            }
        }
        return initialState
    })

    const updateState = useCallback((updates: Partial<T>) => {
        setState(prev => {
            const newState = { ...prev, ...updates }
            if (persist) {
                setTabState('multipleStates', newState)
            }
            return newState
        })
    }, [persist, setTabState])

    const setStateForKey = useCallback((key: keyof T) => (value: T[keyof T]) => {
        updateState({ [key]: value } as Partial<T>)
    }, [updateState])

    return [state, updateState, setStateForKey]
}

/**
 * Hook pour nettoyer l'état d'un onglet
 */
export function useTabCleanup(_tabId: string) {
    // clearTab functionality removed as it's not implemented

    return useCallback(() => {
        // clearTab functionality not implemented
    }, [])
}

/**
 * Hook utilitaire pour utiliser le système de cache avec l'onglet actif
 * Utilise automatiquement l'ID de l'onglet actif depuis AppContext
 */
export function useActiveTabState<T = any>(
    key: string,
    defaultValue?: T,
    persist = true
): [T, (value: T | ((prev: T) => T)) => void] {
    const { activeTabId } = useApp()

    return useTabState({
        tabId: activeTabId || 'default',
        key,
        defaultValue,
        persist
    })
}

/**
 * Hook pour obtenir l'ID de l'onglet actif
 */
export function useActiveTabId(): string | null {
    const { activeTabId } = useApp()
    return activeTabId
}

