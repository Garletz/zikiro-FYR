import {
    CountryCode,
    CountryTaxConfig,
    DEFAULT_COUNTRY_CONFIGS,
    TaxBreakdown,
    TaxCalculation,
    TaxMode
} from '../types/tax'

export class TaxService {
    private static instance: TaxService
    private currentConfig: CountryTaxConfig

    private constructor() {
        // Par défaut, utiliser la configuration française
        this.currentConfig = DEFAULT_COUNTRY_CONFIGS.FR
    }

    static getInstance(): TaxService {
        if (!TaxService.instance) {
            TaxService.instance = new TaxService()
        }
        return TaxService.instance
    }

    /**
     * Définir la configuration de TVA pour un pays
     */
    setCountryConfig(countryCode: CountryCode): void {
        this.currentConfig = DEFAULT_COUNTRY_CONFIGS[countryCode]
    }

    /**
     * Obtenir la configuration actuelle
     */
    getCurrentConfig(): CountryTaxConfig {
        return this.currentConfig
    }

    /**
     * Calculer la TVA pour un montant donné
     */
    calculateTax(subtotal: number, categoryId?: string): TaxCalculation {
        const taxRate = this.getTaxRateForCategory(categoryId)
        const taxAmount = this.calculateTaxAmount(subtotal, taxRate)

        return {
            subtotal,
            tax_amount: taxAmount,
            total: subtotal + taxAmount,
            tax_breakdown: [{
                tax_rate_id: taxRate.id,
                tax_rate_name: taxRate.name,
                rate: taxRate.rate,
                taxable_amount: subtotal,
                tax_amount: taxAmount
            }]
        }
    }

    /**
     * Calculer la TVA pour un panier avec plusieurs articles
     */
    calculateCartTax(items: Array<{
        subtotal: number,
        category_id?: string,
        product_id?: string
    }>): TaxCalculation {
        const taxBreakdowns = new Map<string, TaxBreakdown>()
        let totalSubtotal = 0

        // Grouper par taux de TVA
        items.forEach(item => {
            const taxRate = this.getTaxRateForCategory(item.category_id)
            const existingBreakdown = taxBreakdowns.get(taxRate.id)

            if (existingBreakdown) {
                existingBreakdown.taxable_amount += item.subtotal
                existingBreakdown.tax_amount += this.calculateTaxAmount(item.subtotal, taxRate)
            } else {
                taxBreakdowns.set(taxRate.id, {
                    tax_rate_id: taxRate.id,
                    tax_rate_name: taxRate.name,
                    rate: taxRate.rate,
                    taxable_amount: item.subtotal,
                    tax_amount: this.calculateTaxAmount(item.subtotal, taxRate)
                })
            }

            totalSubtotal += item.subtotal
        })

        const totalTaxAmount = Array.from(taxBreakdowns.values())
            .reduce((sum, breakdown) => sum + breakdown.tax_amount, 0)

        return {
            subtotal: totalSubtotal,
            tax_amount: totalTaxAmount,
            total: totalSubtotal + totalTaxAmount,
            tax_breakdown: Array.from(taxBreakdowns.values())
        }
    }

    /**
     * Obtenir le taux de TVA pour une catégorie
     */
    private getTaxRateForCategory(categoryId?: string) {
        if (this.currentConfig.tax_mode === 'fixed') {
            // Mode fixe : utiliser le taux par défaut
            return this.currentConfig.tax_rates.find(rate => rate.is_default) ||
                this.currentConfig.tax_rates[0]
        }

        if (this.currentConfig.tax_mode === 'category_based' && categoryId) {
            // Mode par catégorie : chercher la catégorie et son taux
            const category = this.currentConfig.tax_categories?.find(cat => cat.id === categoryId)
            if (category) {
                const taxRate = this.currentConfig.tax_rates.find(rate => rate.id === category.tax_rate_id)
                if (taxRate) {
                    return taxRate
                }
            }
        }

        // Fallback : taux par défaut
        return this.currentConfig.tax_rates.find(rate => rate.is_default) ||
            this.currentConfig.tax_rates[0]
    }

    /**
     * Calculer le montant de TVA pour un montant et un taux donnés
     */
    private calculateTaxAmount(amount: number, taxRate: { rate: number }): number {
        const taxAmount = amount * (taxRate.rate / 100)

        // Arrondir selon la configuration
        if (this.currentConfig.tax_inclusive) {
            // Si les prix incluent déjà la TVA, calculer la TVA à partir du prix TTC
            return taxAmount
        } else {
            // Prix HT, ajouter la TVA
            return Math.round(taxAmount * 100) / 100 // Arrondir à 2 décimales
        }
    }

    /**
     * Obtenir le symbole de la devise
     */
    getCurrencySymbol(): string {
        const currencyMap: Record<string, string> = {
            'EUR': '€',
            'USD': '$',
            'GBP': '£',
            'CAD': 'C$',
            'CHF': 'CHF',
            'CNY': '¥',
            'INR': '₹'
        }
        return currencyMap[this.currentConfig.currency] || this.currentConfig.currency
    }

    /**
     * Formater un montant avec la devise
     */
    formatAmount(amount: number): string {
        return `${amount.toFixed(2)} ${this.getCurrencySymbol()}`
    }

    /**
     * Obtenir le nom de la taxe pour le pays actuel
     */
    getTaxName(): string {
        return this.currentConfig.tax_name
    }

    /**
     * Vérifier si les prix incluent déjà la TVA
     */
    isTaxInclusive(): boolean {
        return this.currentConfig.tax_inclusive
    }

    /**
     * Obtenir tous les taux de TVA disponibles
     */
    getAvailableTaxRates() {
        return this.currentConfig.tax_rates
    }

    /**
     * Obtenir toutes les catégories de TVA
     */
    getTaxCategories() {
        return this.currentConfig.tax_categories || []
    }

    /**
     * Obtenir le mode de TVA actuel
     */
    getTaxMode(): TaxMode {
        return this.currentConfig.tax_mode
    }
}

// Instance singleton
export const taxService = TaxService.getInstance()
