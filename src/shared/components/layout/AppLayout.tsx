import Dashboard from '../../../pages/Dashboard'
import { useApp } from '../../contexts/AppContext'
import BottomNav from './BottomNav'
import TabManager from './TabManager'

export default function AppLayout() {
    const { isDashboard } = useApp()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Contenu principal */}
            <div className={`${isDashboard ? '' : 'pb-40'}`}>
                {isDashboard ? (
                    <Dashboard />
                ) : (
                    <div className="h-screen">
                        <TabManager />
                    </div>
                )}
            </div>

            {/* Barre de navigation du bas */}
            <BottomNav />
        </div>
    )
}
