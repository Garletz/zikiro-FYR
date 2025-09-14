import SimpleSMSChat from './SimpleSMSChat'

interface SMSChatSectionProps {
    compact?: boolean
    // POS props
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
    // Prop to trigger auto-fill
    shouldGenerateTicket?: boolean
}

export default function SMSChatSection({
    compact = false,
    selectedTable,
    currentOrder,
    shouldGenerateTicket = false
}: SMSChatSectionProps) {
    const padding = compact ? 'p-2' : 'p-3 lg:p-4'

    return (
        <div className="w-full h-full bg-white flex flex-col">
            <div className={`${padding} flex-1`}>
                <SimpleSMSChat
                    tableId={selectedTable?.id}
                    tableName={selectedTable?.name}
                    customerPhone={selectedTable?.customerPhone}
                    customerName={selectedTable?.customerName}
                    orderId={currentOrder?.id}
                    orderTotal={currentOrder?.total}
                    orderItems={currentOrder?.items}
                    className="h-full"
                    shouldGenerateTicket={shouldGenerateTicket}
                />
            </div>
        </div>
    )
}
