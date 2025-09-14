import { useCallback, useEffect, useState } from 'react'
import { taxService } from '../services/taxService'
import {
    CountryCode,
    CountryTaxConfig,
    DEFAULT_COUNTRY_CONFIGS,
    TaxSettings
} from '../types/tax'

interface UseTaxSettingsReturn {
    // État actuel
    selectedCountry: CountryCode
    currentConfig: CountryTaxConfig
    taxSettings: TaxSettings

    // Actions
    setSelectedCountry: (country: CountryCode) => void
    updateTaxSettings: (settings: Partial<TaxSettings>) => void
    resetToDefaults: () => void

    // Utilitaires
    getTaxRateForCategory: (categoryId?: string, categories?: any[]) => number
    calculateTax: (amount: number, categoryId?: string, categories?: any[]) => number
    formatAmount: (amount: number) => string
    getTaxName: () => string
}

const DEFAULT_TAX_SETTINGS: TaxSettings = {
    selected_country: 'FR',
    countries: DEFAULT_COUNTRY_CONFIGS,
    auto_calculate: true,
    show_tax_details: true,
    round_tax: true
}

export function useTaxSettings(): UseTaxSettingsReturn {
    // État persistant des paramètres de TVA - stockage global
    const [taxSettings, setTaxSettings] = useState<TaxSettings>(() => {
        const saved = localStorage.getItem('taxSettings')
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch {
                return DEFAULT_TAX_SETTINGS
            }
        }
        return DEFAULT_TAX_SETTINGS
    })

    // État local pour la réactivité - toujours synchronisé avec taxSettings
    const selectedCountry = taxSettings.selected_country

    // État réactif pour la configuration actuelle
    const [currentConfig, setCurrentConfig] = useState<CountryTaxConfig>(() => {
        taxService.setCountryConfig(selectedCountry)
        return taxService.getCurrentConfig()
    })

    // Synchroniser avec le service de TVA et mettre à jour la configuration
    useEffect(() => {
        taxService.setCountryConfig(selectedCountry)
        setCurrentConfig(taxService.getCurrentConfig())
    }, [selectedCountry])

    // Mettre à jour le pays sélectionné
    const setSelectedCountry = useCallback((country: CountryCode) => {
        const newSettings = {
            ...taxSettings,
            selected_country: country
        }
        setTaxSettings(newSettings)
        localStorage.setItem('taxSettings', JSON.stringify(newSettings))
    }, [taxSettings])

    // Mettre à jour les paramètres de TVA
    const updateTaxSettings = useCallback((settings: Partial<TaxSettings>) => {
        const newSettings = {
            ...taxSettings,
            ...settings
        }
        setTaxSettings(newSettings)
        localStorage.setItem('taxSettings', JSON.stringify(newSettings))
    }, [taxSettings])

    // Réinitialiser aux valeurs par défaut
    const resetToDefaults = useCallback(() => {
        setTaxSettings(DEFAULT_TAX_SETTINGS)
        localStorage.setItem('taxSettings', JSON.stringify(DEFAULT_TAX_SETTINGS))
    }, [])

    // Obtenir le taux de TVA pour une catégorie
    const getTaxRateForCategory = useCallback((categoryId?: string, categories?: any[]): number => {
        const config = taxService.getCurrentConfig()

        if (config.tax_mode === 'fixed') {
            return config.default_tax_rate
        }

        if (config.tax_mode === 'category_based' && categoryId) {
            // D'abord chercher dans les catégories de la base de données
            if (categories) {
                const dbCategory = categories.find(cat => cat.id === categoryId)
                if (dbCategory && dbCategory.tax_rate_id) {
                    const taxRate = config.tax_rates.find(rate => rate.id === dbCategory.tax_rate_id)
                    if (taxRate) {
                        return taxRate.rate
                    }
                }
            }

            // Sinon chercher dans les catégories prédéfinies
            const category = config.tax_categories?.find(cat => cat.id === categoryId)
            if (category) {
                const taxRate = config.tax_rates.find(rate => rate.id === category.tax_rate_id)
                if (taxRate) {
                    return taxRate.rate
                }
            }
        }

        return config.default_tax_rate
    }, [])

    // Calculer la TVA pour un montant
    const calculateTax = useCallback((amount: number, categoryId?: string, categories?: any[]): number => {
        const rate = getTaxRateForCategory(categoryId, categories)
        return Math.round(amount * (rate / 100) * 100) / 100
    }, [getTaxRateForCategory])

    // Formater un montant avec la devise
    const formatAmount = useCallback((amount: number): string => {
        return taxService.formatAmount(amount)
    }, [])

    // Obtenir le nom de la taxe
    const getTaxName = useCallback((): string => {
        return taxService.getTaxName()
    }, [])

    return {
        selectedCountry,
        currentConfig,
        taxSettings,
        setSelectedCountry,
        updateTaxSettings,
        resetToDefaults,
        getTaxRateForCategory,
        calculateTax,
        formatAmount,
        getTaxName
    }
}
