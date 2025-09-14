import { useState } from 'react'
import POSIntegration from '../components/POSIntegration'

// Example usage in POS
export default function POSExample() {
    const [selectedTable] = useState({
        id: '5',
        name: 'Table 5',
        customerPhone: '+33612345678',
        customerName: 'John Doe'
    })

    const [currentOrder] = useState({
        id: 'ORD-123',
        total: 25.50,
        items: [
            { name: 'Pizza Margherita', quantity: 1, price: 12.50 },
            { name: 'Coca Cola', quantity: 2, price: 6.50 },
            { name: 'Tiramisu', quantity: 1, price: 6.50 }
        ]
    })

    const handlePaymentComplete = () => {
        console.log('Payment completed!')
        // Payment completion logic
    }

    return (
        <div className="h-screen bg-gray-100 flex">
            {/* Products Zone (simulated) */}
            <div className="w-1/3 p-4">
                <h2 className="text-lg font-semibold mb-4">Products</h2>
                <div className="space-y-2">
                    <button className="w-full p-3 bg-white rounded border text-left">
                        Pizza Margherita - 12.50€
                    </button>
                    <button className="w-full p-3 bg-white rounded border text-left">
                        Coca Cola - 3.25€
                    </button>
                    <button className="w-full p-3 bg-white rounded border text-left">
                        Tiramisu - 6.50€
                    </button>
                </div>
            </div>

            {/* Cart Zone (simulated) */}
            <div className="w-1/3 p-4">
                <h2 className="text-lg font-semibold mb-4">Cart - Table 5</h2>
                <div className="space-y-2">
                    {currentOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between p-2 bg-white rounded">
                            <span>{item.name} x{item.quantity}</span>
                            <span>{item.price.toFixed(2)}€</span>
                        </div>
                    ))}
                    <div className="border-t pt-2 font-semibold">
                        Total: {currentOrder.total.toFixed(2)}€
                    </div>
                </div>
            </div>

            {/* Zone SMS Chat */}
            <div className="w-1/3 p-4">
                <POSIntegration
                    selectedTable={selectedTable}
                    currentOrder={currentOrder}
                    onPaymentComplete={handlePaymentComplete}
                />
            </div>
        </div>
    )
}
