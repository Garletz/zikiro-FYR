import {
  AlertCircle,
  Brain,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Loader2,
  Plus,
  Settings,
  Sparkles,
  Upload,
  X
} from 'lucide-react'
import { useRef, useState } from 'react'
import AISettings from './components/AISettings'
import { menuAnalysisService, MenuItem } from './services/menuAnalysisService'

interface AnalysisState {
  isAnalyzing: boolean
  items: MenuItem[]
  error?: string
}

interface ImportState {
  isImporting: boolean
  selectedItems: Set<number>
  importedProducts: any[]
  createdCategories: any[]
  error?: string
}

type TabType = 'analyze' | 'ai-settings'

export default function MenuGPT() {
  const [activeTab, setActiveTab] = useState<TabType>('analyze')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    items: []
  })
  const [importState, setImportState] = useState<ImportState>({
    isImporting: false,
    selectedItems: new Set(),
    importedProducts: [],
    createdCategories: []
  })
  const [showCategories, setShowCategories] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // File validation
    const validation = menuAnalysisService.validateImageFile(file)
    if (!validation.valid) {
      setAnalysisState(prev => ({ ...prev, error: validation.error }))
      return
    }

    // Display preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setUploadedImage(imageUrl)
    }
    reader.readAsDataURL(file)

    // Image analysis
    setAnalysisState(prev => ({ ...prev, isAnalyzing: true, error: undefined }))

    try {
      const base64Data = await menuAnalysisService.fileToBase64(file)
      const response = await menuAnalysisService.analyzeMenuImage({
        image_data: base64Data,
        mime_type: file.type
      })

      if (response.success) {
        setAnalysisState({
          isAnalyzing: false,
          items: response.items
        })
        // Select all items by default
        setImportState(prev => ({
          ...prev,
          selectedItems: new Set(response.items.map((_, index) => index))
        }))
      } else {
        setAnalysisState({
          isAnalyzing: false,
          items: [],
          error: response.error || 'Analysis error'
        })
      }
    } catch (error) {
      setAnalysisState({
        isAnalyzing: false,
        items: [],
        error: `Analysis error: ${error}`
      })
    }
  }

  const handleImport = async () => {
    const selectedItems = Array.from(importState.selectedItems)
    if (selectedItems.length === 0) {
      setImportState(prev => ({ ...prev, error: 'No items selected' }))
      return
    }

    setImportState(prev => ({ ...prev, isImporting: true, error: undefined }))

    try {
      const itemsToImport = selectedItems.map(index => analysisState.items[index])
      const response = await menuAnalysisService.importMenuItems({ items: itemsToImport })

      if (response.success) {
        setImportState(prev => ({
          ...prev,
          isImporting: false,
          importedProducts: response.imported_products,
          createdCategories: response.created_categories
        }))
      } else {
        setImportState(prev => ({
          ...prev,
          isImporting: false,
          error: response.error || 'Import error'
        }))
      }
    } catch (error) {
      setImportState(prev => ({
        ...prev,
        isImporting: false,
        error: `Import error: ${error}`
      }))
    }
  }

  const toggleItemSelection = (index: number) => {
    setImportState(prev => {
      const newSelected = new Set(prev.selectedItems)
      if (newSelected.has(index)) {
        newSelected.delete(index)
      } else {
        newSelected.add(index)
      }
      return { ...prev, selectedItems: newSelected }
    })
  }

  const toggleCategory = (category: string) => {
    setShowCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const selectAllItems = () => {
    setImportState(prev => ({
      ...prev,
      selectedItems: new Set(analysisState.items.map((_, index) => index))
    }))
  }

  const deselectAllItems = () => {
    setImportState(prev => ({
      ...prev,
      selectedItems: new Set()
    }))
  }

  const resetAll = () => {
    setUploadedImage(null)
    setAnalysisState({ isAnalyzing: false, items: [] })
    setImportState({
      isImporting: false,
      selectedItems: new Set(),
      importedProducts: [],
      createdCategories: []
    })
    setShowCategories(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Group items by category
  const groupedItems = analysisState.items.reduce((acc, item, index) => {
    const category = item.category || 'Others'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push({ ...item, index })
    return acc
  }, {} as Record<string, Array<MenuItem & { index: number }>>)

  const selectedCount = importState.selectedItems.size
  const totalCount = analysisState.items.length

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MenuGPT</h1>
              <p className="text-sm text-gray-500">Intelligent menu analysis</p>
            </div>
            <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 text-sm font-medium">AI</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={resetAll}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'analyze', name: 'Menu Analysis', icon: Camera },
              { id: 'ai-settings', name: 'AI Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'ai-settings' ? (
          <AISettings />
        ) : (
          <div className="flex h-full">
            {/* Left Panel - Upload & Analysis */}
            <div className="w-1/2 flex flex-col bg-white border-r border-gray-200">
              {/* Upload Section */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Camera className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Menu Analysis</h2>
                </div>

                {!uploadedImage ? (
                  <div className="text-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center space-y-4 w-full"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900">
                            Take a photo of your menu
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Drag and drop or click to select
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative group">
                      <img
                        src={uploadedImage}
                        alt="Uploaded menu"
                        className="w-full max-h-64 object-contain rounded-lg border border-gray-200 shadow-sm"
                      />
                      {analysisState.isAnalyzing && (
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <div className="text-center text-white">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                            <p className="font-medium">MenuGPT analyzing your menu...</p>
                            <p className="text-sm text-gray-300 mt-1">Detecting dishes and prices</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {analysisState.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <span className="text-red-700">{analysisState.error}</span>
                        </div>
                      </div>
                    )}

                    {analysisState.items.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-green-700 font-medium">
                            {analysisState.items.length} items detected successfully
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Results Section */}
              {analysisState.items.length > 0 && (
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Detected Items
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={selectAllItems}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Select all
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={deselectAllItems}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        Deselect all
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(groupedItems).map(([category, items]) => (
                      <div key={category} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{category}</span>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                              {items.length}
                            </span>
                          </div>
                          {showCategories.has(category) ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </button>

                        {showCategories.has(category) && (
                          <div className="bg-white p-4 space-y-2">
                            {items.map(({ index, name, price }) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center space-x-3 flex-1">
                                  <button
                                    onClick={() => toggleItemSelection(index)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${importState.selectedItems.has(index)
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-gray-300 hover:border-blue-400'
                                      }`}
                                  >
                                    {importState.selectedItems.has(index) && (
                                      <Check className="w-3 h-3" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{name}</p>
                                    <p className="text-sm text-gray-500">{price}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Import & Actions */}
            <div className="w-1/2 flex flex-col bg-gray-50">
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-2 mb-1">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Import</h2>
                </div>
                <p className="text-gray-600 text-sm">Manage menu import</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {analysisState.items.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No menu analyzed</p>
                    <p className="text-sm">
                      Take a photo of your menu to analyze it
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Analysis Summary</span>
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
                          <div className="text-sm text-gray-500">Items detected</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedCount}</div>
                          <div className="text-sm text-gray-500">Selected</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{Object.keys(groupedItems).length}</div>
                          <div className="text-sm text-gray-500">Categories</div>
                        </div>
                      </div>
                    </div>

                    {/* Import Actions */}
                    <div className="space-y-3">
                      <button
                        onClick={handleImport}
                        disabled={selectedCount === 0 || importState.isImporting}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {importState.isImporting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">Importing...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            <span className="font-medium">Import {selectedCount} item(s)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Error Display */}
                    {importState.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <span className="text-red-700">{importState.error}</span>
                        </div>
                      </div>
                    )}

                    {/* Success Display */}
                    {importState.importedProducts.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-green-700 font-medium">Import successful!</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className="text-green-700">
                            ✅ {importState.importedProducts.length} products imported
                          </p>
                          {importState.createdCategories.length > 0 && (
                            <p className="text-green-700">
                              📁 {importState.createdCategories.length} new categories created
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Help Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>How it works</span>
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600">1.</span>
                          <span>Take a clear photo of your menu</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600">2.</span>
                          <span>MenuGPT automatically detects dishes and prices</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600">3.</span>
                          <span>Select the items to import</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600">4.</span>
                          <span>Categories are created automatically</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600">5.</span>
                          <span>Import directly into Products and Categories</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
