import { Package, Save, X } from 'lucide-react'
import { useState } from 'react'
import { masterStocksService } from '../services/masterStocksService'
import { CreateIngredientRequest } from '../types/masterStocks'

interface AddIngredientModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AddIngredientModal({ isOpen, onClose, onSuccess }: AddIngredientModalProps) {
    const [formData, setFormData] = useState<CreateIngredientRequest>({
        name: '',
        category: 'Imported',
        unit: 'kg',
        min_stock: 0,
        max_stock: 100,
        cost_per_unit: 0,
        description: '',
        supplier_id: undefined,
        expiration_date: undefined
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Validate form
            if (!formData.name.trim()) {
                throw new Error('Name is required')
            }
            if (formData.min_stock < 0 || formData.max_stock < 0) {
                throw new Error('Stock values must be positive')
            }
            if (formData.min_stock >= formData.max_stock) {
                throw new Error('Min stock must be less than max stock')
            }
            if (formData.cost_per_unit < 0) {
                throw new Error('Cost must be positive')
            }

            await masterStocksService.createIngredient(formData)
            onSuccess()
            onClose()
            // Reset form
            setFormData({
                name: '',
                category: 'Imported',
                unit: 'kg',
                min_stock: 0,
                max_stock: 100,
                cost_per_unit: 0,
                description: '',
                supplier_id: undefined,
                expiration_date: undefined
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error creating ingredient')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: keyof CreateIngredientRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Add New Ingredient</h2>
                            <p className="text-sm text-gray-500">Create a new ingredient manually</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Enter ingredient name"
                                required
                            />
                        </div>

                        {/* Unit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit
                            </label>
                            <select
                                value={formData.unit}
                                onChange={(e) => handleInputChange('unit', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="L">L</option>
                                <option value="ml">ml</option>
                                <option value="piece">piece</option>
                                <option value="box">box</option>
                                <option value="bag">bag</option>
                                <option value="bottle">bottle</option>
                            </select>
                        </div>

                        {/* Stock Levels */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Min Stock
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.min_stock}
                                    onChange={(e) => handleInputChange('min_stock', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Stock
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.max_stock}
                                    onChange={(e) => handleInputChange('max_stock', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Cost and Initial Stock */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cost per Unit ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.cost_per_unit}
                                    onChange={(e) => handleInputChange('cost_per_unit', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Initial Stock
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.min_stock}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0
                                        handleInputChange('min_stock', value)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                rows={3}
                                placeholder="Enter description..."
                            />
                        </div>

                        {/* Expiration Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiration Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={formData.expiration_date ? new Date(formData.expiration_date).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleInputChange('expiration_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Create Ingredient</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
