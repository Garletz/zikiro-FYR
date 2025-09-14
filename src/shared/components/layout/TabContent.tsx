import { Suspense, lazy } from 'react'
import TabErrorBoundary from '../ui/TabErrorBoundary'

// Lazy load pages
const Dashboard = lazy(() => import('../../../pages/Dashboard'))
const POS = lazy(() => import('../../../modules/pos/POS'))
const Tables = lazy(() => import('../../../modules/tables/Tables'))
const Orders = lazy(() => import('../../../modules/orders/Orders'))
const Products = lazy(() => import('../../../modules/products/Products'))
const Categories = lazy(() => import('../../../modules/categories/Categories'))
const Planner = lazy(() => import('../../../modules/planner/Planner'))
const Reports = lazy(() => import('../../../modules/reports/Reports'))
const AuditGuard = lazy(() => import('../../../modules/auditguard/AuditGuard'))
const Settings = lazy(() => import('../../../modules/settings/Settings'))
const Logs = lazy(() => import('../../../modules/logs/Logs'))
const MenuGPT = lazy(() => import('../../../modules/menugpt/MenuGPT'))
const MasterStocks = lazy(() => import('../../../modules/masterstocks/MasterStocks'))
const SMSTicket = lazy(() => import('../../../modules/smsticket/SMSTicket'))

interface TabContentProps {
    tab: any
    isActive: boolean
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export default function TabContent({ tab, isActive, onError }: TabContentProps) {
    // Ne rendre que si l'onglet est actif
    if (!isActive) {
        return null
    }

    const renderContent = () => {
        switch (tab.moduleId) {
            case 'pos':
                return <POS />
            case 'tables':
                return <Tables />
            case 'orders':
                return <Orders />
            case 'products':
                return <Products />
            case 'categories':
                return <Categories />
            case 'planner':
                return <Planner />
            case 'logs':
                return <Logs />
            case 'reports':
                return <Reports />
            case 'auditguard':
                return <AuditGuard />
            case 'menugpt':
                return <MenuGPT />
            case 'settings':
                return <Settings />
            case 'masterstocks':
                return <MasterStocks />
            case 'smsticket':
                return <SMSTicket />
            default:
                return <Dashboard />
        }
    }

    return (
        <TabErrorBoundary tabId={tab.id} onError={onError}>
            <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            }>
                {renderContent()}
            </Suspense>
        </TabErrorBoundary>
    )
}
