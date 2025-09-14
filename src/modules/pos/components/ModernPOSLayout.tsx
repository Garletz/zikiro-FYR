import { Maximize2, Minimize2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Category } from '../services/categoriesService'
import { CartItemDisplay, ProductDisplay, TableData } from '../types'
import ModernCartSection from './ModernCartSection'
import ModernProductsSection from './ModernProductsSection'
import ModernSMSChatSection from './ModernSMSChatSection'
import ModernTablesSection from './ModernTablesSection'

interface ModernPOSLayoutProps {
    // Tables
    tables: TableData[]
    selectedTable: TableData | null
    onTableSelect: (table: TableData | null) => void

    // Cart
    cartItems: CartItemDisplay[]
    cartTotal: number
    customerName: string
    setCustomerName: (name: string) => void
    paymentMethod: string
    setPaymentMethod: (method: string) => void
    onRemove: (productId: string) => void
    onUpdateQuantity: (productId: string, quantity: number) => void
    onPayment: () => void
    onSendToKitchen: () => void
    onClearCart: () => void
    onSplitTicket: () => void
    isSendingToKitchen: boolean
    showSuccessMessage: string | null
    showErrorMessage: string | null
    getCartTax: () => number
    getCartTotalWithTax: () => number
    getCartTaxBreakdown: () => any[]
    getCategoryColor: (categoryId: string) => string

    // Products
    products: ProductDisplay[]
    categories: Category[]
    searchTerm: string
    selectedCategory: string
    onSearchChange: (term: string) => void
    onCategoryChange: (categoryId: string) => void
    onProductSelect: (product: ProductDisplay) => void

    // Layout
    leftHandedMode: boolean
    isFullscreen?: boolean
    onToggleFullscreen?: () => void

    // SMS Chat
    currentOrder?: {
        id: string
        total: number
        items: Array<{
            name: string
            quantity: number
            price: number
        }>
    }
    onPaymentComplete?: () => void
    shouldGenerateTicket?: boolean
}

export default function ModernPOSLayout({
    // Tables
    tables,
    selectedTable,
    onTableSelect,

    // Cart
    cartItems,
    cartTotal,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    onRemove,
    onUpdateQuantity,
    onPayment,
    onSendToKitchen,
    onClearCart,
    onSplitTicket,
    isSendingToKitchen,
    showSuccessMessage,
    showErrorMessage,
    getCartTax,
    getCartTotalWithTax,
    getCartTaxBreakdown,
    getCategoryColor,

    // Products
    products,
    categories,
    searchTerm,
    selectedCategory,
    onSearchChange,
    onCategoryChange,
    onProductSelect,

    // Layout
    leftHandedMode,
    isFullscreen = false,
    onToggleFullscreen,

    // SMS Chat
    currentOrder,
    shouldGenerateTicket = false
}: ModernPOSLayoutProps) {
    const productFilters = {
        searchTerm,
        selectedCategory,
        onSearchChange,
        onCategoryChange
    }

    // State to hide/show sections with modern design
    const [showChat, setShowChat] = useState(() => {
        const saved = localStorage.getItem('modern-pos-show-chat')
        return saved ? JSON.parse(saved) : true
    })

    const [showTables, setShowTables] = useState(() => {
        const saved = localStorage.getItem('modern-pos-show-tables')
        return saved ? JSON.parse(saved) : true
    })

    // Save preferences
    useEffect(() => {
        localStorage.setItem('modern-pos-show-chat', JSON.stringify(showChat))
    }, [showChat])

    useEffect(() => {
        localStorage.setItem('modern-pos-show-tables', JSON.stringify(showTables))
    }, [showTables])

    // Persistent resizing management
    const handlePanelResize = (sizes: number[]) => {
        localStorage.setItem('modern-pos-panel-sizes', JSON.stringify(sizes))
    }

    const getDefaultSizes = () => {
        const saved = localStorage.getItem('modern-pos-panel-sizes')
        if (saved) {
            return JSON.parse(saved)
        }
        // Optimized default sizes for modern layout
        return leftHandedMode ? [28, 48, 24] : [24, 48, 28]
    }

    const defaultSizes = getDefaultSizes()

    return (
        <div className="h-full w-full flex flex-col bg-slate-900 overflow-hidden">
            {/* Modern Header with Cursor-inspired design */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700 shadow-sm flex-shrink-0">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Z</span>
                        </div>
                        <h1 className="text-xl font-semibold text-white">Zikiro POS</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Modern Toggle Buttons */}
                        <button
                            onClick={() => setShowTables(!showTables)}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${showTables
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            <span className="text-sm">🏠</span>
                            <span>Tables</span>
                        </button>

                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${showChat
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            <span className="text-sm">💬</span>
                            <span>SMS</span>
                        </button>

                        {/* Fullscreen Toggle Button */}
                        {onToggleFullscreen && (
                            <button
                                onClick={onToggleFullscreen}
                                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600"
                                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="w-4 h-4" />
                                ) : (
                                    <Maximize2 className="w-4 h-4" />
                                )}
                                <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="text-sm text-slate-400">
                        Mode: {leftHandedMode ? 'Left-handed' : 'Right-handed'}
                    </div>
                    {selectedTable && (
                        <div className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium">
                            Table {selectedTable.number}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Layout Container - Full Height, No Scroll */}
            <div className="flex-1 bg-slate-800 overflow-hidden min-h-0">
                <PanelGroup
                    direction="horizontal"
                    className="h-full w-full"
                    onLayout={handlePanelResize}
                    style={{ userSelect: 'none', touchAction: 'none', pointerEvents: 'auto' }}
                >
                    {leftHandedMode ? (
                        // Left-handed mode: SMS | Products+Tables | Cart
                        <>
                            {/* SMS Chat on the left - Conditional */}
                            {showChat && (
                                <Panel
                                    defaultSize={defaultSizes[0]}
                                    minSize={20}
                                    maxSize={40}
                                    className="h-full w-full min-h-0"
                                    style={{ userSelect: 'none', touchAction: 'none' }}
                                >
                                    <ModernSMSChatSection
                                        selectedTable={selectedTable}
                                        currentOrder={currentOrder}
                                        shouldGenerateTicket={shouldGenerateTicket}
                                    />
                                </Panel>
                            )}

                            {/* Modern separator */}
                            {showChat && (
                                <PanelResizeHandle className="w-1 bg-slate-600 hover:bg-emerald-500 transition-all duration-200 cursor-col-resize" />
                            )}

                            {/* Center section with Products and Tables */}
                            <Panel
                                defaultSize={defaultSizes[1]}
                                minSize={30}
                                maxSize={70}
                                className="h-full w-full min-h-0"
                                style={{ userSelect: 'none', touchAction: 'none' }}
                            >
                                <PanelGroup direction="vertical" className="h-full w-full">
                                    {/* Products on top */}
                                    <Panel
                                        defaultSize={75}
                                        minSize={40}
                                        maxSize={90}
                                        className="h-full w-full min-h-0"
                                        style={{ userSelect: 'none', touchAction: 'none' }}
                                    >
                                        <ModernProductsSection
                                            products={products}
                                            categories={categories}
                                            filters={productFilters}
                                            onProductSelect={onProductSelect}
                                            getCategoryColor={getCategoryColor}
                                        />
                                    </Panel>

                                    {/* Modern horizontal separator */}
                                    <PanelResizeHandle className="h-1 bg-slate-600 hover:bg-emerald-500 transition-all duration-200 cursor-row-resize" />

                                    {/* Tables at bottom - Conditional */}
                                    {showTables && (
                                        <Panel
                                            defaultSize={25}
                                            minSize={10}
                                            maxSize={60}
                                            className="h-full w-full min-h-0"
                                            style={{ userSelect: 'none', touchAction: 'none' }}
                                        >
                                            <ModernTablesSection
                                                tables={tables}
                                                selectedTable={selectedTable}
                                                onTableSelect={onTableSelect}
                                            />
                                        </Panel>
                                    )}
                                </PanelGroup>
                            </Panel>

                            {/* Modern separator */}
                            <PanelResizeHandle className="w-1 bg-slate-600 hover:bg-emerald-500 transition-all duration-200 cursor-col-resize" />

                            {/* Cart on the right */}
                            <Panel
                                defaultSize={defaultSizes[2]}
                                minSize={20}
                                maxSize={40}
                                className="h-full w-full min-h-0"
                                style={{ userSelect: 'none', touchAction: 'none' }}
                            >
                                <ModernCartSection
                                    selectedTable={selectedTable}
                                    cartItems={cartItems}
                                    cartTotal={cartTotal}
                                    customerName={customerName}
                                    setCustomerName={setCustomerName}
                                    paymentMethod={paymentMethod}
                                    setPaymentMethod={setPaymentMethod}
                                    onRemove={onRemove}
                                    onUpdateQuantity={onUpdateQuantity}
                                    onPayment={onPayment}
                                    onSendToKitchen={onSendToKitchen}
                                    onClearCart={onClearCart}
                                    onSplitTicket={onSplitTicket}
                                    isSendingToKitchen={isSendingToKitchen}
                                    showSuccessMessage={showSuccessMessage}
                                    showErrorMessage={showErrorMessage}
                                    getCartTax={getCartTax}
                                    getCartTotalWithTax={getCartTotalWithTax}
                                    getCartTaxBreakdown={getCartTaxBreakdown}
                                    getCategoryColor={getCategoryColor}
                                    compact={false}
                                />
                            </Panel>
                        </>
                    ) : (
                        // Right-handed mode: Cart | Products+Tables | SMS
                        <>
                            {/* Cart on the left */}
                            <Panel
                                defaultSize={defaultSizes[0]}
                                minSize={20}
                                maxSize={40}
                                className="h-full w-full min-h-0"
                                style={{ userSelect: 'none', touchAction: 'none' }}
                            >
                                <ModernCartSection
                                    selectedTable={selectedTable}
                                    cartItems={cartItems}
                                    cartTotal={cartTotal}
                                    customerName={customerName}
                                    setCustomerName={setCustomerName}
                                    paymentMethod={paymentMethod}
                                    setPaymentMethod={setPaymentMethod}
                                    onRemove={onRemove}
                                    onUpdateQuantity={onUpdateQuantity}
                                    onPayment={onPayment}
                                    onSendToKitchen={onSendToKitchen}
                                    onClearCart={onClearCart}
                                    onSplitTicket={onSplitTicket}
                                    isSendingToKitchen={isSendingToKitchen}
                                    showSuccessMessage={showSuccessMessage}
                                    showErrorMessage={showErrorMessage}
                                    getCartTax={getCartTax}
                                    getCartTotalWithTax={getCartTotalWithTax}
                                    getCartTaxBreakdown={getCartTaxBreakdown}
                                    getCategoryColor={getCategoryColor}
                                    compact={false}
                                />
                            </Panel>

                            {/* Modern separator */}
                            <PanelResizeHandle className="w-1 bg-slate-600 hover:bg-emerald-500 transition-all duration-200 cursor-col-resize" />

                            {/* Center section with Products and Tables */}
                            <Panel
                                defaultSize={defaultSizes[1]}
                                minSize={30}
                                maxSize={70}
                                className="h-full w-full min-h-0"
                                style={{ userSelect: 'none', touchAction: 'none' }}
                            >
                                <PanelGroup direction="vertical" className="h-full w-full">
                                    {/* Products on top */}
                                    <Panel
                                        defaultSize={75}
                                        minSize={40}
                                        maxSize={90}
                                        className="h-full w-full min-h-0"
                                        style={{ userSelect: 'none', touchAction: 'none' }}
                                    >
                                        <ModernProductsSection
                                            products={products}
                                            categories={categories}
                                            filters={productFilters}
                                            onProductSelect={onProductSelect}
                                            getCategoryColor={getCategoryColor}
                                        />
                                    </Panel>

                                    {/* Modern horizontal separator */}
                                    <PanelResizeHandle className="h-1 bg-slate-600 hover:bg-emerald-500 transition-all duration-200 cursor-row-resize" />

                                    {/* Tables at bottom - Conditional */}
                                    {showTables && (
                                        <Panel
                                            defaultSize={25}
                                            minSize={10}
                                            maxSize={60}
                                            className="h-full w-full min-h-0"
                                            style={{ userSelect: 'none', touchAction: 'none' }}
                                        >
                                            <ModernTablesSection
                                                tables={tables}
                                                selectedTable={selectedTable}
                                                onTableSelect={onTableSelect}
                                            />
                                        </Panel>
                                    )}
                                </PanelGroup>
                            </Panel>

                            {/* Modern separator */}
                            {showChat && (
                                <PanelResizeHandle className="w-1 bg-slate-600 hover:bg-emerald-500 transition-all duration-200 cursor-col-resize" />
                            )}

                            {/* SMS Chat on the right - Conditional */}
                            {showChat && (
                                <Panel
                                    defaultSize={defaultSizes[2]}
                                    minSize={20}
                                    maxSize={40}
                                    className="h-full w-full min-h-0"
                                    style={{ userSelect: 'none', touchAction: 'none' }}
                                >
                                    <ModernSMSChatSection
                                        selectedTable={selectedTable}
                                        currentOrder={currentOrder}
                                        shouldGenerateTicket={shouldGenerateTicket}
                                    />
                                </Panel>
                            )}
                        </>
                    )}
                </PanelGroup>
            </div>

            {/* Bottom Delimiter Line - Shows alignment of all three blocks */}
            <div className="h-0.5 bg-black"></div>
        </div>
    )
}
