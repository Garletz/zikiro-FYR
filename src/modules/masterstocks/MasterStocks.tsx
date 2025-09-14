import {
    AlertTriangle,
    Brain,
    Camera,
    Package,
    Plus,
    Search,
    Settings,
    Warehouse
} from 'lucide-react'
import { useEffect, useState } from 'react'
import AddIngredientModal from './components/AddIngredientModal'
import AISettings from './components/AISettings'
import IngredientList from './components/IngredientList'
import InvoiceScanner from './components/InvoiceScanner'
import StockAlerts from './components/StockAlerts'
import { useIngredients } from './hooks/useIngredients'
import { useStockLevels } from './hooks/useStockLevels'
import { masterStocksService } from './services/masterStocksService'

export default function MasterStocks() {
    const [activeTab, setActiveTab] = useState<'ingredients' | 'alerts' | 'scanner' | 'ai-settings'>('ingredients')
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [showScanner, setShowScanner] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)

    const { ingredients, loading: ingredientsLoading, error: ingredientsError, refetch: refetchIngredients } = useIngredients()
    const { alerts, refreshData } = useStockLevels()

    // Simple refresh function
    const handleRefresh = () => {
        refetchIngredients()
        refreshData()
    }

    // Initialize database on component mount
    useEffect(() => {
        const initDatabase = async () => {
            try {
                await masterStocksService.initDatabase()
            } catch (error) {
                console.error('Failed to initialize MasterStocks database:', error)
            }
        }
        initDatabase()
    }, [])

    // Filter ingredients based on search and category
    const filteredIngredients = ingredients.filter(ingredient => {
        const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ingredient.category.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = filterCategory === 'all' || ingredient.category === filterCategory
        return matchesSearch && matchesCategory
    })

    const tabs = [
        { id: 'ingredients', label: 'Ingredients', icon: Package },
        { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
        { id: 'scanner', label: 'AI Scanner', icon: Brain },
        { id: 'ai-settings', label: 'AI Settings', icon: Settings },
    ]

    return (
        <div className="h-full bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Warehouse className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">MasterStocks</h1>
                            <p className="text-sm text-gray-500">Intelligent stock management</p>
                        </div>
                        <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full">
                            <Brain className="w-4 h-4 text-green-600" />
                            <span className="text-green-700 text-sm font-medium">IA</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowScanner(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Camera className="w-4 h-4" />
                            <span>Scan Invoice</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                                {tab.id === 'alerts' && alerts.length > 0 && (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                        {alerts.length}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Search and Filters */}
            {activeTab === 'ingredients' && (
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search ingredients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="all">All categories</option>
                                <option value="Meats">Meats</option>
                                <option value="Vegetables">Vegetables</option>
                                <option value="Spices">Spices</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Supplies">Supplies</option>
                            </select>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Plus size={20} />
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'ingredients' && (
                    <IngredientList
                        ingredients={filteredIngredients}
                        loading={ingredientsLoading}
                        error={ingredientsError}
                        onRefresh={handleRefresh}
                    />
                )}

                {activeTab === 'alerts' && (
                    <StockAlerts
                        alerts={alerts}
                        onMarkAsRead={(_alertId) => {
                            // Handle mark as read
                        }}
                    />
                )}

                {activeTab === 'scanner' && (
                    <InvoiceScanner
                        onClose={() => setShowScanner(false)}
                        onImportSuccess={handleRefresh}
                    />
                )}

                {activeTab === 'ai-settings' && (
                    <AISettings />
                )}
            </div>

            {/* Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden">
                        <InvoiceScanner
                            onClose={() => setShowScanner(false)}
                            onImportSuccess={handleRefresh}
                        />
                    </div>
                </div>
            )}

            {/* Add Ingredient Modal */}
            <AddIngredientModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleRefresh}
            />
        </div>
    )
}
