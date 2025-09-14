import { usePOSIntegration } from '../hooks/usePOSIntegration'
import POSSMSChat from './POSSMSChat'

interface POSIntegrationProps {
    // Props du POS
    selectedTable?: {
        id: string
        name: string
        customerPhone?: string
        customerName?: string
    }
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
    className?: string
}

export default function POSIntegration({
    selectedTable,
    currentOrder,
    className = ''
}: POSIntegrationProps) {
    const {
        triggerPayment,
    } = usePOSIntegration()

    // Déclencher le paiement quand on clique sur "Payer"
    const handlePaymentClick = () => {
        if (!selectedTable || !currentOrder) return

        const orderData = {
            id: currentOrder.id,
            tableId: selectedTable.id,
            tableName: selectedTable.name,
            customerPhone: selectedTable.customerPhone,
            customerName: selectedTable.customerName,
            total: currentOrder.total,
            items: currentOrder.items
        }

        triggerPayment(orderData)
    }


    return (
        <div className={`h-full ${className}`}>
            <POSSMSChat
                tableId={selectedTable?.id}
                tableName={selectedTable?.name}
                customerPhone={selectedTable?.customerPhone}
                customerName={selectedTable?.customerName}
                orderId={currentOrder?.id}
                orderTotal={currentOrder?.total}
                orderItems={currentOrder?.items}
                onPaymentClick={handlePaymentClick}
            />
        </div>
    )
}
