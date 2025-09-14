import { CountryTaxConfig } from '../../types/tax'

interface TaxInfoBannerProps {
    config: CountryTaxConfig
    className?: string
}

export default function TaxInfoBanner({ config, className = '' }: TaxInfoBannerProps) {
    const getModeLabel = (mode: string) => {
        switch (mode) {
            case 'fixed':
                return 'Fixed rate'
            case 'category_based':
                return 'By category'
            case 'product_based':
                return 'By product'
            default:
                return mode
        }
    }

    return (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-blue-900">
                            {config.country_name}
                        </span>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {config.tax_name}
                        </span>
                    </div>

                    <div className="text-xs text-blue-700">
                        <span className="font-medium">Mode:</span> {getModeLabel(config.tax_mode)}
                    </div>

                    {config.tax_mode === 'fixed' && (
                        <div className="text-xs text-blue-700">
                            <span className="font-medium">Rate:</span> {config.default_tax_rate}%
                        </div>
                    )}

                    {config.tax_mode === 'category_based' && (
                        <div className="text-xs text-blue-700">
                            <span className="font-medium">Default rate:</span> {config.default_tax_rate}%
                        </div>
                    )}
                </div>

                <div className="text-xs text-blue-600">
                    {config.currency}
                </div>
            </div>

            {config.tax_mode === 'category_based' && config.tax_categories && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="text-xs text-blue-700 font-medium mb-1">Catégories disponibles:</div>
                    <div className="flex flex-wrap gap-1">
                        {config.tax_categories.slice(0, 3).map(category => {
                            const taxRate = config.tax_rates.find(r => r.id === category.tax_rate_id)
                            return (
                                <span
                                    key={category.id}
                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                                    style={{ borderLeft: `3px solid ${category.color || '#3B82F6'}` }}
                                >
                                    {category.name} ({taxRate?.rate}%)
                                </span>
                            )
                        })}
                        {config.tax_categories.length > 3 && (
                            <span className="text-xs text-blue-600">
                                +{config.tax_categories.length - 3} autres
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
