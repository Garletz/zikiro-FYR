import { Filter, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { cn } from '../../../shared/utils/cn'
import { catalogItems, categories, getItemsByCategory } from '../data/plannerCatalog'
import { tablePlannerIntegrationService } from '../services/tablePlannerIntegration'
import { usePlannerStore } from '../store/plannerStore'
import type { CatalogItem } from '../types/planner'

const Catalog: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [restaurantTables, setRestaurantTables] = useState<any[]>([])
    const [isLoadingTables, setIsLoadingTables] = useState(false)
    const { startPlacing } = usePlannerStore()

    // Load restaurant tables
    useEffect(() => {
        const loadRestaurantTables = async () => {
            setIsLoadingTables(true)
            try {
                const tables = await tablePlannerIntegrationService.getAvailableTablesForAssociation()
                setRestaurantTables(tables)
            } catch (error) {
                console.error('Error loading restaurant tables:', error)
            } finally {
                setIsLoadingTables(false)
            }
        }

        loadRestaurantTables()

        // Reload every 5 seconds to see new tables
        const interval = setInterval(loadRestaurantTables, 5000)
        return () => clearInterval(interval)
    }, [])

    // Filter objects by category and search
    const filteredItems = React.useMemo(() => {
        // If we're in the "Restaurant Tables" tab, return the tables
        if (selectedCategory === 'restaurant-tables') {
            return restaurantTables.filter(table =>
                table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `Table ${table.number}`.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Otherwise, filter normal catalog objects
        let items = selectedCategory === 'all'
            ? catalogItems
            : getItemsByCategory(selectedCategory)

        if (searchTerm) {
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        return items
    }, [selectedCategory, searchTerm, restaurantTables])

    const handleItemClick = (item: CatalogItem | any) => {
        // Si c'est une table du restaurant, créer un item spécial
        if (selectedCategory === 'restaurant-tables') {
            const tableItem: CatalogItem = {
                id: `table-${item.id}`,
                type: 'table',
                name: `Table ${item.number} - ${item.name}`,
                icon: '🍽️',
                size: { width: 1, height: 1, depth: 1 }, // Même taille que table-with-chairs
                color: '#8B4513',
                category: 'Tables Restaurant',
                description: `${item.capacity} places - ${item.status}`,
                metadata: {
                    tableId: item.id,
                    tableNumber: item.number,
                    isRestaurantTable: true,
                    capacity: item.capacity,
                    status: item.status
                }
            }
            startPlacing(tableItem)
        } else {
            startPlacing(item)
        }
    }

    return (
        <div className="w-80 bg-white border-r border-gray-200 p-4 space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Catalog</h3>

                {/* Search bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search an object..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === category.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <span className="mr-1">{category.icon}</span>
                            {category.name}
                        </button>
                    ))}

                    {/* Restaurant Tables tab */}
                    <button
                        onClick={() => setSelectedCategory('restaurant-tables')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCategory === 'restaurant-tables'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <span className="mr-1">🍽️</span>
                        Restaurant Tables
                    </button>
                </div>

                {/* Objects list */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedCategory === 'restaurant-tables' && isLoadingTables ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                            <p className="text-sm">Loading tables...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Filter className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">
                                {selectedCategory === 'restaurant-tables'
                                    ? 'No tables available'
                                    : 'No objects found'
                                }
                            </p>
                        </div>
                    ) : (
                        filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    'cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border border-gray-200 rounded-lg p-3 hover:border-blue-300',
                                    selectedCategory === 'restaurant-tables' && 'hover:border-green-300'
                                )}
                                onClick={() => handleItemClick(item)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-2xl">
                                            {selectedCategory === 'restaurant-tables' ? '🍽️' : item.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 text-sm">
                                                {selectedCategory === 'restaurant-tables'
                                                    ? `Table ${item.number} - ${item.name}`
                                                    : item.name
                                                }
                                            </h4>
                                            {selectedCategory === 'restaurant-tables' ? (
                                                <p className="text-xs text-gray-500">
                                                    {item.capacity} seats - {item.status}
                                                </p>
                                            ) : item.description && (
                                                <p className="text-xs text-gray-500">{item.description}</p>
                                            )}
                                            <div className="flex items-center space-x-2 mt-1">
                                                {selectedCategory === 'restaurant-tables' ? (
                                                    <>
                                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {item.capacity} seats
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded font-medium ${item.status === 'free' ? 'bg-green-100 text-green-800' :
                                                            item.status === 'occupied' ? 'bg-orange-100 text-orange-800' :
                                                                item.status === 'reserved' ? 'bg-red-100 text-red-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                                                            ✅ Disponible
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {item.size.width}×{item.size.depth}
                                                        </span>
                                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {item.category}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div
                                            className={`w-4 h-4 rounded border-2 border-gray-300 ${selectedCategory === 'restaurant-tables' ? 'bg-green-500' : ''
                                                }`}
                                            style={{
                                                backgroundColor: selectedCategory === 'restaurant-tables'
                                                    ? '#22c55e'
                                                    : item.color
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Statistiques */}
                {filteredItems.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{filteredItems.length} objet(s) trouvé(s)</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Catalog
