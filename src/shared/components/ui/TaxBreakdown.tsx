import { TaxBreakdown as TaxBreakdownType } from '../../types/tax'

interface TaxBreakdownProps {
    breakdowns: TaxBreakdownType[]
    showDetails?: boolean
    className?: string
}

export default function TaxBreakdown({ breakdowns, showDetails = false, className = '' }: TaxBreakdownProps) {
    if (breakdowns.length === 0) {
        return null
    }

    const totalTax = breakdowns.reduce((sum, breakdown) => sum + breakdown.tax_amount, 0)

    return (
        <div className={`space-y-2 ${className}`}>
            {showDetails && breakdowns.length > 1 ? (
                // Detailed display for multiple rates
                <div className="space-y-1">
                    {breakdowns.map((breakdown) => (
                        <div key={breakdown.tax_rate_id} className="flex justify-between text-xs text-gray-600">
                            <span>{breakdown.tax_rate_name} ({breakdown.rate}%)</span>
                            <span>{breakdown.tax_amount.toFixed(2)} €</span>
                        </div>
                    ))}
                    <div className="border-t border-gray-200 pt-1">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Total VAT</span>
                            <span>{totalTax.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>
            ) : (
                // Simple display for single rate
                <div className="flex justify-between text-sm text-gray-600">
                    <span>{breakdowns[0].tax_rate_name} ({breakdowns[0].rate}%)</span>
                    <span>{totalTax.toFixed(2)} €</span>
                </div>
            )}
        </div>
    )
}
