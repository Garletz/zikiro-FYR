import {
    AlertCircle,
    Brain,
    Camera,
    CheckCircle,
    FileText,
    Loader2,
    Sparkles,
    Upload,
    X
} from 'lucide-react'
import { useRef, useState } from 'react'
import { masterStocksService } from '../services/masterStocksService'
import { InvoiceAnalysisResponse } from '../types/masterStocks'

interface InvoiceScannerProps {
    onClose: () => void
    onImportSuccess?: () => void
}

export default function InvoiceScanner({ onClose, onImportSuccess }: InvoiceScannerProps) {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<InvoiceAnalysisResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file
        const validation = masterStocksService.validateImageFile(file)
        if (!validation.valid) {
            setError(validation.error || 'Invalid file')
            return
        }

        // Display preview
        const reader = new FileReader()
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string
            setUploadedImage(imageUrl)
        }
        reader.readAsDataURL(file)

        // Analyze image
        setIsAnalyzing(true)
        setError(null)
        setAnalysisResult(null)
        setSelectedItems(new Set())

        try {
            const base64Data = await masterStocksService.fileToBase64(file)
            const response = await masterStocksService.analyzeInvoiceImage({
                image_data: base64Data,
                mime_type: file.type
            })

            setAnalysisResult(response)
            // Select all items by default
            if (response.success && response.invoice_data?.items) {
                setSelectedItems(new Set(response.invoice_data.items.map((_, index) => index)))
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error during analysis')
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleImportInvoice = async () => {
        if (!analysisResult?.invoice_data) return

        try {
            // Filter selected items only
            const selectedItemsData = analysisResult.invoice_data.items.filter((_, index) => selectedItems.has(index))
            const filteredInvoiceData = {
                ...analysisResult.invoice_data,
                items: selectedItemsData
            }

            const result = await masterStocksService.importInvoiceData(filteredInvoiceData)
            alert(result)
            // Refresh data in parent component
            if (onImportSuccess) {
                onImportSuccess()
            }
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error during import')
        }
    }

    const toggleItemSelection = (index: number) => {
        const newSelected = new Set(selectedItems)
        if (newSelected.has(index)) {
            newSelected.delete(index)
        } else {
            newSelected.add(index)
        }
        setSelectedItems(newSelected)
    }

    const selectAllItems = () => {
        if (analysisResult?.invoice_data?.items) {
            setSelectedItems(new Set(analysisResult.invoice_data.items.map((_, index) => index)))
        }
    }

    const deselectAllItems = () => {
        setSelectedItems(new Set())
    }

    const resetScanner = () => {
        setUploadedImage(null)
        setAnalysisResult(null)
        setError(null)
        setIsAnalyzing(false)
        setSelectedItems(new Set())
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">AI Invoice Scanner</h2>
                        <p className="text-sm text-gray-500">Automatic supplier invoice analysis</p>
                    </div>
                    <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-700 text-sm font-medium">AI</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Upload & Analysis */}
                <div className="w-1/2 flex flex-col bg-white border-r border-gray-200">
                    {/* Upload Section */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-2 mb-4">
                            <Camera className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Invoice Analysis</h3>
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
                                                Take a photo of your invoice
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
                                        alt="Scanned invoice"
                                        className="w-full max-h-64 object-contain rounded-lg border border-gray-200 shadow-sm"
                                    />
                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                            <div className="text-center text-white">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                                                <p className="font-medium">IA en cours d'analyse...</p>
                                                <p className="text-sm text-gray-300 mt-1">Extraction des données de la facture</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-2">
                                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                            <span className="text-red-700">{error}</span>
                                        </div>
                                    </div>
                                )}

                                {analysisResult?.success && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-2">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <span className="text-green-700 font-medium">
                                                Invoice analyzed successfully
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Help Section */}
                    <div className="flex-1 p-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                                <Sparkles className="w-4 h-4" />
                                <span>How it works</span>
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600">1.</span>
                                    <span>Take a clear photo of your invoice</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600">2.</span>
                                    <span>AI automatically extracts the information</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600">3.</span>
                                    <span>Review and adjust the data if necessary</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-blue-600">4.</span>
                                    <span>Import directly into your stocks</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Analysis Results */}
                <div className="w-1/2 flex flex-col bg-gray-50">
                    <div className="p-6 border-b border-gray-200 bg-white">
                        <div className="flex items-center space-x-2 mb-1">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
                        </div>
                        <p className="text-gray-600 text-sm">Data extracted from invoice</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {!analysisResult ? (
                            <div className="text-center text-gray-500 py-12">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium">No invoice analyzed</p>
                                <p className="text-sm">
                                    Take a photo of your invoice to analyze it
                                </p>
                            </div>
                        ) : analysisResult.success && analysisResult.invoice_data ? (
                            <div className="space-y-6">
                                {/* Invoice Summary */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span>Invoice Information</span>
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Supplier:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {analysisResult.invoice_data.supplier_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Number:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {analysisResult.invoice_data.invoice_number}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Date:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {analysisResult.invoice_data.invoice_date}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Total:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                €{analysisResult.invoice_data.total_amount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-900">
                                            Items ({analysisResult.invoice_data.items.length})
                                        </h4>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={selectAllItems}
                                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                onClick={deselectAllItems}
                                                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {analysisResult.invoice_data.items.map((item, index) => (
                                            <div key={index} className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${selectedItems.has(index)
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(index)}
                                                        onChange={() => toggleItemSelection(index)}
                                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{item.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {item.quantity} {item.unit} × €{item.unit_price.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">
                                                        €{item.total_price.toFixed(2)}
                                                    </p>
                                                    {item.expiration_date && (
                                                        <p className="text-xs text-gray-500">
                                                            Exp: {item.expiration_date}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Import Actions */}
                                <div className="space-y-3">
                                    <button
                                        onClick={handleImportInvoice}
                                        disabled={selectedItems.size === 0}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">
                                            Import {selectedItems.size} Selected Items
                                        </span>
                                    </button>
                                    <button
                                        onClick={resetScanner}
                                        className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Analyze Another Invoice
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <span className="text-red-700">{analysisResult.error}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
