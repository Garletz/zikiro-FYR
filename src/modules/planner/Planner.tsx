import { Eye, EyeOff, Grid, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import Catalog from './components/Catalog'
import View2D from './components/View2D'
import View3D from './components/View3D'

import { usePlannerStore } from './store/plannerStore'

export default function Planner() {
    const {
        viewMode,
        setViewMode,
        currentLayout,
        isLoading,
        error,
        loadLayoutFromDatabase,
        createNewLayout,
        loadCatalogItems,
        loadDefaultLayout,
        getLayouts,
        updateLayoutName,
        deleteLayout,
        clearError
    } = usePlannerStore()

    const [layouts, setLayouts] = useState<any[]>([])
    const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null)
    const [editingLayoutName, setEditingLayoutName] = useState('')

    // Load layouts on component mount
    useEffect(() => {
        loadLayouts()
        loadCatalogItems()
        loadDefaultLayout() // Auto-load default layout
    }, [])

    const loadLayouts = async () => {
        try {
            const layoutsData = await getLayouts()
            setLayouts(layoutsData)
        } catch (error) {
            console.error('Error loading layouts:', error)
        }
    }

    const handleLoadLayout = async (layoutId: string) => {
        await loadLayoutFromDatabase(layoutId)
    }

    const handleCreateNewLayout = async () => {
        const newLayoutNumber = layouts.length + 1
        const name = `Layout ${newLayoutNumber}`
        await createNewLayout(name)
        await loadLayouts() // Refresh layouts list
    }

    const handleUpdateLayoutName = async (layoutId: string, newName: string) => {
        await updateLayoutName(layoutId, newName)
        setEditingLayoutId(null)
        setEditingLayoutName('')
        await loadLayouts() // Refresh layouts list
    }

    const handleDeleteLayout = async (layoutId: string) => {
        if (confirm('Are you sure you want to delete this layout?')) {
            await deleteLayout(layoutId)
            await loadLayouts() // Refresh layouts list
        }
    }

    const startEditingLayout = (layout: any) => {
        setEditingLayoutId(layout.id)
        setEditingLayoutName(layout.name)
    }

    const cancelEditingLayout = () => {
        setEditingLayoutId(null)
        setEditingLayoutName('')
    }

    return (
        <div className="flex h-full bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-semibold text-gray-900">Planner</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {currentLayout ? currentLayout.name : 'No layout selected'}
                    </p>
                </div>

                {/* Layout Selector - Mobile Friendly */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">Layouts</h3>
                        <button
                            onClick={handleCreateNewLayout}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Plus size={12} />
                            New
                        </button>
                    </div>

                    {/* Layouts List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {layouts.map((layout) => (
                            <div
                                key={layout.id}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${currentLayout?.id === layout.id
                                    ? 'bg-blue-100 border border-blue-300'
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                {/* Layout Name - Editable */}
                                {editingLayoutId === layout.id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="text"
                                            value={editingLayoutName}
                                            onChange={(e) => setEditingLayoutName(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleUpdateLayoutName(layout.id, editingLayoutName)
                                                }
                                            }}
                                            onBlur={() => handleUpdateLayoutName(layout.id, editingLayoutName)}
                                            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => cancelEditingLayout()}
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="flex-1 text-sm font-medium"
                                        onClick={() => handleLoadLayout(layout.id)}
                                    >
                                        {layout.name}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    {editingLayoutId !== layout.id && (
                                        <button
                                            onClick={() => startEditingLayout(layout)}
                                            className="p-1 text-xs text-gray-500 hover:text-gray-700"
                                            title="Edit name"
                                        >
                                            ✏️
                                        </button>
                                    )}
                                    {layout.name !== 'Layout 1' && (
                                        <button
                                            onClick={() => handleDeleteLayout(layout.id)}
                                            className="p-1 text-xs text-red-500 hover:text-red-700"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Auto-save indicator */}
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Auto-save
                    </div>
                </div>



                {/* Error display */}
                {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-400">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                                <button
                                    onClick={clearError}
                                    className="mt-1 text-sm text-red-600 hover:text-red-500"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Catalog */}
                <div className="flex-1 overflow-hidden">
                    <Catalog />
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setViewMode('2D')}
                                className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === '2D'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Grid size={16} />
                                2D
                            </button>
                            <button
                                onClick={() => setViewMode('3D')}
                                className={`flex items-center gap-2 px-3 py-2 rounded ${viewMode === '3D'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {viewMode === '3D' ? <Eye size={16} /> : <EyeOff size={16} />}
                                3D
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Items in layout: {currentLayout.items.length}</span>
                            {isLoading && <span className="text-blue-600">Loading...</span>}
                        </div>
                    </div>
                </div>

                {/* View */}
                <div className="flex-1 relative">
                    {viewMode === '2D' ? (
                        <View2D />
                    ) : (
                        <View3D />
                    )}
                </div>
            </div>
        </div>
    )
}
