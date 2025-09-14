import {
    Edit,
    Minus,
    Package,
    Plus,
    Save,
    Trash2,
    X
} from 'lucide-react'
import { useState } from 'react'
import { masterStocksService } from '../services/masterStocksService'
import { Ingredient, getStockColor, getStockIcon, getStockLevel, getStockPercentage } from '../types/masterStocks'

interface IngredientListProps {
    ingredients: Ingredient[]
    loading: boolean
    error: string | null
    onRefresh: () => void
}

export default function IngredientList({ ingredients, loading, error, onRefresh }: IngredientListProps) {
    const [editingStock, setEditingStock] = useState<string | null>(null)
    const [newStockValue, setNewStockValue] = useState(0)
    const [editingThresholds, setEditingThresholds] = useState<string | null>(null)
    const [newMinStock, setNewMinStock] = useState(0)
    const [newMaxStock, setNewMaxStock] = useState(0)

    // Stock editing functions with tactile controls
    const handleStockEdit = (ingredient: Ingredient) => {
        setEditingStock(ingredient.id)
        setNewStockValue(ingredient.current_stock)
    }

    const handleStockSave = async (ingredientId: string) => {
        try {
            await masterStocksService.updateStockQuantity(ingredientId, newStockValue, 'Manual adjustment')
            setEditingStock(null)
            setNewStockValue(0)
            onRefresh()
        } catch (error) {
            console.error('Error updating stock:', error)
            alert('Error updating stock')
        }
    }

    const handleStockCancel = () => {
        setEditingStock(null)
        setNewStockValue(0)
    }

    // Quick stock adjustment with +/- buttons
    const adjustStock = (_ingredientId: string, currentValue: number, delta: number) => {
        const newValue = Math.max(0, currentValue + delta)
        setNewStockValue(newValue)
    }

    // Threshold editing functions
    const handleThresholdsEdit = (ingredient: Ingredient) => {
        setEditingThresholds(ingredient.id)
        setNewMinStock(ingredient.min_stock)
        setNewMaxStock(ingredient.max_stock)
    }

    const handleThresholdsSave = async (ingredientId: string) => {
        try {
            if (newMinStock < 0 || newMaxStock < 0 || newMinStock >= newMaxStock) {
                alert('Please enter valid thresholds (min < max and >= 0)')
                return
            }

            await masterStocksService.updateIngredient(ingredientId, {
                min_stock: newMinStock,
                max_stock: newMaxStock
            })

            setEditingThresholds(null)
            setNewMinStock(0)
            setNewMaxStock(0)
            onRefresh()
        } catch (error) {
            console.error('Error updating thresholds:', error)
            alert('Error updating thresholds')
        }
    }

    const handleThresholdsCancel = () => {
        setEditingThresholds(null)
        setNewMinStock(0)
        setNewMaxStock(0)
    }

    // Delete function
    const handleDeleteIngredient = async (ingredientId: string, ingredientName: string) => {
        if (confirm(`Are you sure you want to delete "${ingredientName}"?`)) {
            try {
                await masterStocksService.deleteIngredient(ingredientId)
                onRefresh()
            } catch (error) {
                console.error('Error deleting ingredient:', error)
                alert('Error deleting ingredient')
            }
        }
    }

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Package className="w-8 h-8 animate-pulse mx-auto mb-4 text-green-600" />
                    <p className="text-lg text-gray-600">Loading ingredients...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center text-red-600">
                    <Package className="w-8 h-8 mx-auto mb-4" />
                    <p className="text-lg font-medium">Error loading ingredients</p>
                    <p className="text-sm mt-2">{error}</p>
                </div>
            </div>
        )
    }

    if (ingredients.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-xl font-medium">No ingredients found</p>
                    <p className="text-sm mt-2">Import some ingredients using the invoice scanner</p>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {ingredients.map((ingredient) => {
                const stockLevel = getStockLevel(ingredient)
                const stockPercentage = getStockPercentage(ingredient)
                const stockColor = getStockColor(stockLevel)
                const stockIcon = getStockIcon(stockLevel)

                return (
                    <div key={ingredient.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">{ingredient.name}</h3>
                                <p className="text-sm text-gray-500">{ingredient.category}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleStockEdit(ingredient)}
                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Edit stock"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteIngredient(ingredient.id, ingredient.name)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete ingredient"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Stock Information */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Current Stock</p>
                                {editingStock === ingredient.id ? (
                                    <div className="space-y-2">
                                        {/* Compact Slider */}
                                        <div className="space-y-1">
                                            <input
                                                type="range"
                                                min="0"
                                                max={Math.max(ingredient.max_stock * 2, 100)}
                                                step="0.1"
                                                value={newStockValue}
                                                onChange={(e) => setNewStockValue(parseFloat(e.target.value))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                                style={{
                                                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(newStockValue / Math.max(ingredient.max_stock * 2, 100)) * 100}%, #e5e7eb ${(newStockValue / Math.max(ingredient.max_stock * 2, 100)) * 100}%, #e5e7eb 100%)`
                                                }}
                                            />
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>0</span>
                                                <span className="font-bold text-green-600">{newStockValue.toFixed(1)}</span>
                                                <span>{Math.max(ingredient.max_stock * 2, 100)}</span>
                                            </div>
                                        </div>

                                        {/* Quick +/- Buttons */}
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => adjustStock(ingredient.id, newStockValue, -1)}
                                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => adjustStock(ingredient.id, newStockValue, -0.1)}
                                                className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                                            >
                                                <Minus className="w-2 h-2" />
                                            </button>
                                            <button
                                                onClick={() => adjustStock(ingredient.id, newStockValue, 0.1)}
                                                className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                                            >
                                                <Plus className="w-2 h-2" />
                                            </button>
                                            <button
                                                onClick={() => adjustStock(ingredient.id, newStockValue, 1)}
                                                className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleStockSave(ingredient.id)}
                                                className="flex-1 p-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                            >
                                                <Save className="w-3 h-3 inline mr-1" />
                                                Save
                                            </button>
                                            <button
                                                onClick={handleStockCancel}
                                                className="flex-1 p-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                                            >
                                                <X className="w-3 h-3 inline mr-1" />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-lg font-bold text-gray-900">
                                        {ingredient.current_stock} {ingredient.unit}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Unit Price</p>
                                <p className="text-lg font-bold text-gray-900">
                                    ${ingredient.cost_per_unit.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Stock Barometer */}
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Stock Level</span>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${stockColor}`}>
                                    {stockIcon} {stockLevel.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${stockLevel === 'out_of_stock' ? 'bg-red-500' :
                                        stockLevel === 'low_stock' ? 'bg-orange-500' :
                                            stockLevel === 'normal_stock' ? 'bg-yellow-500' :
                                                'bg-green-500'
                                        }`}
                                    style={{ width: `${Math.max(5, stockPercentage)}%` }}
                                />
                            </div>

                            {/* Thresholds */}
                            {editingThresholds === ingredient.id ? (
                                <div className="mt-2 p-2 bg-gray-50 rounded">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Min Stock
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={newMinStock}
                                                onChange={(e) => setNewMinStock(parseFloat(e.target.value))}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Max Stock
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={newMaxStock}
                                                onChange={(e) => setNewMaxStock(parseFloat(e.target.value))}
                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => handleThresholdsSave(ingredient.id)}
                                            className="flex-1 p-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={handleThresholdsCancel}
                                            className="flex-1 p-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>Min: {ingredient.min_stock} {ingredient.unit}</span>
                                    <span>Max: {ingredient.max_stock} {ingredient.unit}</span>
                                    <button
                                        onClick={() => handleThresholdsEdit(ingredient)}
                                        className="text-green-600 hover:text-green-700 font-medium text-xs"
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0 {ingredient.unit}</span>
                                <span>{ingredient.max_stock} {ingredient.unit}</span>
                            </div>
                        </div>

                        {/* Expiration Date */}
                        {ingredient.expiration_date && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                                <p className="text-xs text-yellow-800">
                                    <strong>Expires:</strong> {new Date(ingredient.expiration_date).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}