import { useEffect, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Category } from '../services/categoriesService'
import { CartItemDisplay, ProductDisplay, TableData } from '../types'
import CartSection from './CartSection'
import ProductsSection from './ProductsSection'
import SMSChatSection from './SMSChatSection'
import TablesSection from './TablesSection'

interface POSLayoutProps {
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

export default function POSLayout({
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

    // SMS Chat
    currentOrder,
    onPaymentComplete,
    shouldGenerateTicket = false
}: POSLayoutProps) {
    const productFilters = {
        searchTerm,
        selectedCategory,
        onSearchChange,
        onCategoryChange
    }

    // State to hide/show sections
    const [showChat, setShowChat] = useState(() => {
        const saved = localStorage.getItem('pos-show-chat')
        return saved ? JSON.parse(saved) : true
    })

    const [showTables, setShowTables] = useState(() => {
        const saved = localStorage.getItem('pos-show-tables')
        return saved ? JSON.parse(saved) : true
    })

    // Save preferences
    useEffect(() => {
        localStorage.setItem('pos-show-chat', JSON.stringify(showChat))
    }, [showChat])

    useEffect(() => {
        localStorage.setItem('pos-show-tables', JSON.stringify(showTables))
    }, [showTables])

    // Persistent resizing management
    const handlePanelResize = (sizes: number[]) => {
        localStorage.setItem('pos-panel-sizes', JSON.stringify(sizes))
    }

    const getDefaultSizes = () => {
        const saved = localStorage.getItem('pos-panel-sizes')
        if (saved) {
            return JSON.parse(saved)
        }
        // Optimized default sizes
        // Left-handed mode: [Chat, Tables+Products, Cart]
        // Right-handed mode: [Cart, Tables+Products, Chat]
        return leftHandedMode ? [30, 45, 25] : [25, 45, 30]
    }

    const defaultSizes = getDefaultSizes()

    return (
        <div className="h-full w-full flex flex-col p-4 bg-gray-50">
            {/* Barre d'outils pour masquer/afficher les sections */}
            <div className="flex items-center justify-between p-3 bg-white rounded-t-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-medium text-gray-700">Affichage :</h3>

                    {/* Toggle Tables */}
                    <button
                        onClick={() => setShowTables(!showTables)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showTables
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                    >
                        <span>🏠 Tables</span>
                    </button>

                    {/* Toggle Chat */}
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${showChat
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                    >
                        <span>💬 Chat</span>
                    </button>
                </div>

                <div className="text-xs text-gray-500">
                    Mode: {leftHandedMode ? 'Left-handed' : 'Right-handed'}
                </div>
            </div>

            {/* Unified global container - LIKE CURSOR */}
            <div className="flex-1 bg-white rounded-b-lg border border-gray-200 shadow-lg overflow-hidden">
                {/* Main Layout with Resizable Panels - 3 COLUMNS with persistence */}
                <PanelGroup
                    direction="horizontal"
                    className="h-full w-full"
                    onLayout={handlePanelResize}
                >
                    {leftHandedMode ? (
                        // Left-handed mode: Chat | Tables+Products | Cart
                        <>
                            {/* Chat on the left - Conditional */}
                            {showChat && (
                                <Panel
                                    defaultSize={defaultSizes[0]}
                                    minSize={15}
                                    maxSize={35}
                                    className="flex-1 w-full"
                                >
                                    <SMSChatSection
                                        compact={false}
                                        selectedTable={selectedTable || undefined}
                                        currentOrder={currentOrder}
                                        onPaymentComplete={onPaymentComplete}
                                        shouldGenerateTicket={shouldGenerateTicket}
                                    />
                                </Panel>
                            )}

                            {/* Vertical separator - MORE VISIBLE LIKE CURSOR */}
                            <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-500 transition-colors cursor-col-resize shadow-sm" />

                            {/* Center section with Tables and Products overlaid */}
                            <Panel
                                defaultSize={defaultSizes[1]}
                                minSize={20}
                                maxSize={70}
                                className="flex-1 w-full"
                            >
                                <PanelGroup direction="vertical" className="h-full w-full">
                                    {/* Products on top (SWAPPED) */}
                                    <Panel
                                        defaultSize={75}
                                        minSize={30}
                                        maxSize={95}
                                        className="flex-1 w-full"
                                    >
                                        <ProductsSection
                                            products={products}
                                            categories={categories}
                                            filters={productFilters}
                                            onProductSelect={onProductSelect}
                                            getCategoryColor={getCategoryColor}
                                            compact={false}
                                        />
                                    </Panel>

                                    {/* Séparateur horizontal */}
                                    <PanelResizeHandle className="h-1 bg-gray-300 hover:bg-blue-500 shadow-sm transition-colors cursor-row-resize" />

                                    {/* Tables en bas (SWAPPÉ) - Conditionnel */}
                                    {showTables && (
                                        <Panel
                                            defaultSize={25}
                                            minSize={15}
                                            maxSize={70}
                                            className="flex-1 w-full"
                                        >
                                            <TablesSection
                                                tables={tables}
                                                selectedTable={selectedTable}
                                                onTableSelect={onTableSelect}
                                                compact={false}
                                            />
                                        </Panel>
                                    )}
                                </PanelGroup>
                            </Panel>

                            {/* Séparateur vertical */}
                            <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-500 shadow-sm transition-colors cursor-col-resize" />

                            {/* Panier à droite - TAILLE RÉDUITE */}
                            <Panel
                                defaultSize={defaultSizes[2]}
                                minSize={18}
                                maxSize={35}
                                className="flex-1 w-full"
                            >
                                <CartSection
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
                        // Mode droitier : Panier | Tables+Produits | Chat
                        <>
                            {/* Panier à gauche - TAILLE RÉDUITE */}
                            <Panel
                                defaultSize={defaultSizes[0]}
                                minSize={18}
                                maxSize={35}
                                className="flex-1 w-full"
                            >
                                <CartSection
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

                            {/* Vertical separator - MORE VISIBLE LIKE CURSOR */}
                            <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-500 transition-colors cursor-col-resize shadow-sm" />

                            {/* Center section with Tables and Products overlaid */}
                            <Panel
                                defaultSize={defaultSizes[1]}
                                minSize={20}
                                maxSize={70}
                                className="flex-1 w-full"
                            >
                                <PanelGroup direction="vertical" className="h-full w-full">
                                    {/* Products on top (SWAPPED) */}
                                    <Panel
                                        defaultSize={75}
                                        minSize={30}
                                        maxSize={95}
                                        className="flex-1 w-full"
                                    >
                                        <ProductsSection
                                            products={products}
                                            categories={categories}
                                            filters={productFilters}
                                            onProductSelect={onProductSelect}
                                            getCategoryColor={getCategoryColor}
                                            compact={false}
                                        />
                                    </Panel>

                                    {/* Séparateur horizontal */}
                                    <PanelResizeHandle className="h-1 bg-gray-300 hover:bg-blue-500 shadow-sm transition-colors cursor-row-resize" />

                                    {/* Tables en bas (SWAPPÉ) - Conditionnel */}
                                    {showTables && (
                                        <Panel
                                            defaultSize={25}
                                            minSize={15}
                                            maxSize={70}
                                            className="flex-1 w-full"
                                        >
                                            <TablesSection
                                                tables={tables}
                                                selectedTable={selectedTable}
                                                onTableSelect={onTableSelect}
                                                compact={false}
                                            />
                                        </Panel>
                                    )}
                                </PanelGroup>
                            </Panel>

                            {/* Séparateur vertical */}
                            <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-500 shadow-sm transition-colors cursor-col-resize" />

                            {/* Chat à droite - Conditionnel */}
                            {showChat && (
                                <Panel
                                    defaultSize={defaultSizes[2]}
                                    minSize={15}
                                    maxSize={35}
                                    className="flex-1 w-full"
                                >
                                    <SMSChatSection
                                        compact={false}
                                        selectedTable={selectedTable || undefined}
                                        currentOrder={currentOrder}
                                        onPaymentComplete={onPaymentComplete}
                                        shouldGenerateTicket={shouldGenerateTicket}
                                    />
                                </Panel>
                            )}
                        </>
                    )}
                </PanelGroup>
            </div>
        </div>
    )
}
