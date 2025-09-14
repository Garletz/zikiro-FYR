import { createContext, ReactNode, useContext, useReducer } from 'react';
import { AppState, Module, Tab } from '../types/app';

// Available modules
export const MODULES: Module[] = [
    {
        id: 'pos',
        title: 'Point of Sale',
        icon: 'CreditCard',
        path: '/pos',
        color: 'primary',
        isMain: true,
        description: 'Sales and order management',
        names: {
            french: 'Point de Vente',
            english: 'POS',
            spanish: 'Punto de Venta',
            chinese: '销售点',
            hindi: 'बिक्री बिंदु'
        }
    },
    {
        id: 'tables',
        title: 'Tables',
        icon: 'Table',
        path: '/tables',
        color: 'success',
        description: 'Table management',
        names: {
            french: 'Tables',
            english: 'Tables',
            spanish: 'Mesas',
            chinese: '餐桌',
            hindi: 'मेज़'
        }
    },
    {
        id: 'orders',
        title: 'Orders',
        icon: 'ChefHat',
        path: '/orders',
        color: 'warning',
        description: 'Kitchen order management',
        names: {
            french: 'Commandes',
            english: 'Orders',
            spanish: 'Pedidos',
            chinese: '订单',
            hindi: 'आदेश'
        }
    },
    {
        id: 'planner',
        title: 'Planner',
        icon: 'Layout',
        path: '/planner',
        color: 'info',
        description: 'Floor planning',
        names: {
            french: 'Planificateur',
            english: 'Planner',
            spanish: 'Planificador',
            chinese: '规划',
            hindi: 'योजनाकार'
        }
    },
    {
        id: 'products',
        title: 'Products',
        icon: 'Package',
        path: '/products',
        color: 'warning',
        description: 'Product management',
        names: {
            french: 'Produits',
            english: 'Products',
            spanish: 'Productos',
            chinese: '产品',
            hindi: 'उत्पाद'
        }
    },
    {
        id: 'categories',
        title: 'Categories',
        icon: 'Tags',
        path: '/categories',
        color: 'info',
        description: 'Category management',
        names: {
            french: 'Catégories',
            english: 'Categories',
            spanish: 'Categorías',
            chinese: '分类',
            hindi: 'श्रेणियां'
        }
    },
    {
        id: 'logs',
        title: 'Logs',
        icon: 'FileText',
        path: '/logs',
        color: 'secondary',
        description: 'Event history',
        names: {
            french: 'Journaux',
            english: 'Logs',
            spanish: 'Registros',
            chinese: '日志',
            hindi: 'लॉग'
        }
    },
    {
        id: 'reports',
        title: 'Reports',
        icon: 'BarChart3',
        path: '/reports',
        color: 'secondary',
        description: 'Analytics and statistics',
        names: {
            french: 'Rapports',
            english: 'Reports',
            spanish: 'Reportes',
            chinese: '报告',
            hindi: 'रिपोर्ट'
        }
    },
    {
        id: 'auditguard',
        title: 'AuditGuard',
        icon: 'Shield',
        path: '/auditguard',
        color: 'danger',
        description: 'Fraud detection and compliance',
        names: {
            french: 'AuditGuard',
            english: 'AuditGuard',
            spanish: 'AuditGuard',
            chinese: '审计',
            hindi: 'ऑडिटगार्ड'
        }
    },
    {
        id: 'menugpt',
        title: 'MenuGPT',
        icon: 'Brain',
        path: '/menugpt',
        color: 'purple',
        description: 'Analyze your menus and automatically create your products',
        names: {
            french: 'MenuGPT',
            english: 'MenuGPT',
            spanish: 'MenuGPT',
            chinese: '菜单GPT',
            hindi: 'मेन्यूजीपीटी'
        }
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: 'Settings',
        path: '/settings',
        color: 'danger',
        description: 'System configuration',
        names: {
            french: 'Paramètres',
            english: 'Settings',
            spanish: 'Configuración',
            chinese: '设置',
            hindi: 'सेटिंग्स'
        }
    },
    {
        id: 'masterstocks',
        title: 'MasterStocks',
        icon: 'Warehouse',
        path: '/masterstocks',
        color: 'success',
        description: 'Stock management and inventory control',
        names: {
            french: 'Stocks Maîtres',
            english: 'MasterStocks',
            spanish: 'Stocks Maestros',
            chinese: '主库存',
            hindi: 'मास्टर स्टॉक्स'
        }
    },
    {
        id: 'smsticket',
        title: 'SMSTicket',
        icon: 'MessageSquare',
        path: '/smsticket',
        color: 'info',
        description: 'SMS notifications and ticket management',
        names: {
            french: 'Billet SMS',
            english: 'SMSTicket',
            spanish: 'Boleto SMS',
            chinese: '短信票',
            hindi: 'एसएमएस टिकट'
        }
    }
]

// Types d'actions
type AppAction =
    | { type: 'OPEN_MODULE'; payload: { moduleId: string; params?: any } }
    | { type: 'CLOSE_TAB'; payload: { tabId: string } }
    | { type: 'SWITCH_TAB'; payload: { tabId: string } }
    | { type: 'REORDER_TABS'; payload: { sourceIndex: number; destinationIndex: number } }
    | { type: 'GO_TO_DASHBOARD' }
    | { type: 'SET_TAB_ERROR'; payload: { tabId: string; error: string } }
    | { type: 'CLEAR_TAB_ERROR'; payload: { tabId: string } }

// État initial
const initialState: AppState = {
    isDashboard: true,
    activeTabId: null,
    tabs: [],
    tabHistory: [],
    openModule: () => { },
    closeTab: () => { },
    switchTab: () => { },
    reorderTabs: () => { },
    goToDashboard: () => { },
    setTabError: () => { },
    clearTabError: () => { }
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'OPEN_MODULE': {
            const module = MODULES.find(m => m.id === action.payload.moduleId)
            if (!module) return state

            // Vérifier si un onglet avec les mêmes paramètres existe déjà
            // Note: Pour permettre la duplication, on ne vérifie que les paramètres spécifiques
            const existingTabWithSameParams = state.tabs.find(tab => {
                if (tab.moduleId !== action.payload.moduleId) return false

                // Si on a des paramètres spécifiques, on les compare
                if (action.payload.params && tab.params) {
                    // Pour le cas spécifique de selectedTable, on compare l'ID de la table
                    if (action.payload.params.selectedTable && tab.params.selectedTable) {
                        return action.payload.params.selectedTable.id === tab.params.selectedTable.id
                    }
                    // Pour d'autres paramètres, on peut faire une comparaison plus générale
                    return JSON.stringify(action.payload.params) === JSON.stringify(tab.params)
                }

                // Si pas de paramètres, on ne considère pas qu'il y a un doublon
                // Cela permet la duplication des modules sans paramètres
                return false
            })

            // Si un onglet avec les mêmes paramètres existe, on l'active
            if (existingTabWithSameParams) {
                return {
                    ...state,
                    isDashboard: false,
                    activeTabId: existingTabWithSameParams.id,
                    tabs: state.tabs.map(tab => ({
                        ...tab,
                        isActive: tab.id === existingTabWithSameParams.id
                    })),
                    tabHistory: [
                        ...state.tabHistory.filter(id => id !== existingTabWithSameParams.id),
                        existingTabWithSameParams.id
                    ]
                }
            }

            // Sinon, créer un nouvel onglet
            const existingTabsForModule = state.tabs.filter(tab => tab.moduleId === action.payload.moduleId)
            const tabNumber = existingTabsForModule.length + 1

            // Générer un titre personnalisé si on a des paramètres spécifiques
            let customTitle = module.title
            if (action.payload.params?.selectedTable) {
                customTitle = `${module.title} - ${action.payload.params.selectedTable.name}`
            } else if (tabNumber > 1) {
                customTitle = `${module.title} ${tabNumber}`
            }

            const newTab: Tab = {
                id: `${module.id}-${Date.now()}`,
                moduleId: module.id,
                title: customTitle,
                path: module.path,
                isActive: true,
                canClose: true,
                params: action.payload.params
            }

            return {
                ...state,
                isDashboard: false,
                activeTabId: newTab.id,
                tabs: state.tabs.map(tab => ({ ...tab, isActive: false })).concat(newTab),
                tabHistory: [...state.tabHistory, newTab.id]
            }
        }

        case 'CLOSE_TAB': {
            const tabToClose = state.tabs.find(tab => tab.id === action.payload.tabId)
            if (!tabToClose) return state

            const newTabs = state.tabs.filter(tab => tab.id !== action.payload.tabId)
            const newHistory = state.tabHistory.filter(id => id !== action.payload.tabId)

            // Si on ferme l'onglet actif, activer le dernier onglet de l'historique
            let newActiveTabId = state.activeTabId
            if (tabToClose.isActive) {
                if (newHistory.length > 0) {
                    newActiveTabId = newHistory[newHistory.length - 1]
                    newTabs.forEach(tab => {
                        if (tab.id === newActiveTabId) tab.isActive = true
                        else tab.isActive = false
                    })
                } else {
                    // Retour au dashboard si plus d'onglets
                    return {
                        ...state,
                        isDashboard: true,
                        activeTabId: null,
                        tabs: newTabs,
                        tabHistory: newHistory
                    }
                }
            }

            // Renommer les onglets restants du même module si nécessaire
            const updatedTabs = newTabs.map(tab => {
                if (tab.moduleId === tabToClose.moduleId) {
                    const moduleTabs = newTabs.filter(t => t.moduleId === tabToClose.moduleId)
                    const tabIndex = moduleTabs.findIndex(t => t.id === tab.id)
                    const module = MODULES.find(m => m.id === tabToClose.moduleId)

                    if (module && tabIndex >= 0) {
                        return {
                            ...tab,
                            title: tabIndex === 0 ? module.title : `${module.title} ${tabIndex + 1}`
                        }
                    }
                }
                return tab
            })

            return {
                ...state,
                activeTabId: newActiveTabId,
                tabs: updatedTabs,
                tabHistory: newHistory
            }
        }

        case 'SWITCH_TAB': {
            return {
                ...state,
                isDashboard: false,
                activeTabId: action.payload.tabId,
                tabs: state.tabs.map(tab => ({
                    ...tab,
                    isActive: tab.id === action.payload.tabId
                })),
                tabHistory: [
                    ...state.tabHistory.filter(id => id !== action.payload.tabId),
                    action.payload.tabId
                ]
            }
        }

        case 'REORDER_TABS': {
            const { sourceIndex, destinationIndex } = action.payload
            const newTabs = Array.from(state.tabs)
            const [removed] = newTabs.splice(sourceIndex, 1)
            newTabs.splice(destinationIndex, 0, removed)

            return {
                ...state,
                tabs: newTabs
            }
        }

        case 'GO_TO_DASHBOARD': {
            return {
                ...state,
                isDashboard: true,
                activeTabId: null,
                tabs: state.tabs.map(tab => ({ ...tab, isActive: false }))
            }
        }

        case 'SET_TAB_ERROR': {
            return {
                ...state,
                tabs: state.tabs.map(tab =>
                    tab.id === action.payload.tabId
                        ? { ...tab, error: action.payload.error }
                        : tab
                )
            }
        }

        case 'CLEAR_TAB_ERROR': {
            return {
                ...state,
                tabs: state.tabs.map(tab =>
                    tab.id === action.payload.tabId
                        ? { ...tab, error: undefined }
                        : tab
                )
            }
        }

        default:
            return state
    }
}

// Contexte
const AppContext = createContext<AppState | undefined>(undefined)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState)

    const actions = {
        openModule: (moduleId: string, params?: any) => dispatch({ type: 'OPEN_MODULE', payload: { moduleId, params } }),
        closeTab: (tabId: string) => dispatch({ type: 'CLOSE_TAB', payload: { tabId } }),
        switchTab: (tabId: string) => dispatch({ type: 'SWITCH_TAB', payload: { tabId } }),
        reorderTabs: (sourceIndex: number, destinationIndex: number) =>
            dispatch({ type: 'REORDER_TABS', payload: { sourceIndex, destinationIndex } }),
        goToDashboard: () => dispatch({ type: 'GO_TO_DASHBOARD' }),
        setTabError: (tabId: string, error: string) =>
            dispatch({ type: 'SET_TAB_ERROR', payload: { tabId, error } }),
        clearTabError: (tabId: string) =>
            dispatch({ type: 'CLEAR_TAB_ERROR', payload: { tabId } })
    }

    const contextValue: AppState = {
        ...state,
        ...actions
    }

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    )
}

// Hook personnalisé
export function useApp() {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider')
    }
    return context
}
