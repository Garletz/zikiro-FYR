// Types pour le système de gestion de TVA avancé

export type CountryCode = 'FR' | 'BE' | 'DE' | 'IT' | 'ES' | 'GB' | 'US' | 'CA' | 'CH' | 'CN' | 'IN' | 'DUTY_FREE'

export type TaxMode = 'fixed' | 'category_based' | 'product_based'

export interface TaxRate {
    id: string
    name: string
    rate: number // Pourcentage (ex: 20.0 pour 20%)
    description?: string
    is_default?: boolean
}

export interface TaxCategory {
    id: string
    name: string
    description?: string
    tax_rate_id: string
    color?: string
}

export interface CountryTaxConfig {
    country_code: CountryCode
    country_name: string
    tax_mode: TaxMode
    default_tax_rate: number
    tax_rates: TaxRate[]
    tax_categories?: TaxCategory[]
    currency: string
    tax_name: string // "TVA", "GST", "VAT", etc.
    tax_inclusive: boolean
}

export interface TaxSettings {
    selected_country: CountryCode
    countries: Record<CountryCode, CountryTaxConfig>
    auto_calculate: boolean
    show_tax_details: boolean
    round_tax: boolean
}

export interface TaxCalculation {
    subtotal: number
    tax_amount: number
    total: number
    tax_breakdown: TaxBreakdown[]
}

export interface TaxBreakdown {
    tax_rate_id: string
    tax_rate_name: string
    rate: number
    taxable_amount: number
    tax_amount: number
}

// Configuration par défaut pour différents pays
export const DEFAULT_COUNTRY_CONFIGS: Record<CountryCode, CountryTaxConfig> = {
    FR: {
        country_code: 'FR',
        country_name: 'France',
        tax_mode: 'category_based',
        default_tax_rate: 20.0,
        currency: 'EUR',
        tax_name: 'TVA',
        tax_inclusive: false,
        tax_rates: [
            { id: 'fr-standard', name: 'TVA Standard', rate: 20.0, is_default: true },
            { id: 'fr-reduced', name: 'TVA Réduite', rate: 10.0 },
            { id: 'fr-super-reduced', name: 'TVA Super Réduite', rate: 5.5 },
            { id: 'fr-zero', name: 'TVA Zéro', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restauration', tax_rate_id: 'fr-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcool', tax_rate_id: 'fr-standard', color: '#EF4444' },
            { id: 'soft-drinks', name: 'Boissons sans alcool', tax_rate_id: 'fr-reduced', color: '#10B981' },
            { id: 'takeaway', name: 'Vente à emporter', tax_rate_id: 'fr-reduced', color: '#F59E0B' }
        ]
    },
    BE: {
        country_code: 'BE',
        country_name: 'Belgique',
        tax_mode: 'category_based',
        default_tax_rate: 21.0,
        currency: 'EUR',
        tax_name: 'TVA',
        tax_inclusive: false,
        tax_rates: [
            { id: 'be-standard', name: 'TVA Standard', rate: 21.0, is_default: true },
            { id: 'be-reduced', name: 'TVA Réduite', rate: 12.0 },
            { id: 'be-super-reduced', name: 'TVA Super Réduite', rate: 6.0 },
            { id: 'be-zero', name: 'TVA Zéro', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restauration', tax_rate_id: 'be-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcool', tax_rate_id: 'be-standard', color: '#EF4444' },
            { id: 'soft-drinks', name: 'Boissons sans alcool', tax_rate_id: 'be-reduced', color: '#10B981' }
        ]
    },
    DE: {
        country_code: 'DE',
        country_name: 'Allemagne',
        tax_mode: 'category_based',
        default_tax_rate: 19.0,
        currency: 'EUR',
        tax_name: 'MwSt',
        tax_inclusive: false,
        tax_rates: [
            { id: 'de-standard', name: 'MwSt Standard', rate: 19.0, is_default: true },
            { id: 'de-reduced', name: 'MwSt Réduite', rate: 7.0 },
            { id: 'de-zero', name: 'MwSt Zéro', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Gastronomie', tax_rate_id: 'de-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alkohol', tax_rate_id: 'de-standard', color: '#EF4444' },
            { id: 'food', name: 'Lebensmittel', tax_rate_id: 'de-reduced', color: '#10B981' }
        ]
    },
    US: {
        country_code: 'US',
        country_name: 'États-Unis',
        tax_mode: 'fixed',
        default_tax_rate: 8.5,
        currency: 'USD',
        tax_name: 'Sales Tax',
        tax_inclusive: false,
        tax_rates: [
            { id: 'us-standard', name: 'Sales Tax', rate: 8.5, is_default: true }
        ]
    },
    GB: {
        country_code: 'GB',
        country_name: 'Royaume-Uni',
        tax_mode: 'category_based',
        default_tax_rate: 20.0,
        currency: 'GBP',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'gb-standard', name: 'VAT Standard', rate: 20.0, is_default: true },
            { id: 'gb-reduced', name: 'VAT Reduced', rate: 5.0 },
            { id: 'gb-zero', name: 'VAT Zero', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant', tax_rate_id: 'gb-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'gb-standard', color: '#EF4444' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'gb-standard', color: '#F59E0B' }
        ]
    },
    CA: {
        country_code: 'CA',
        country_name: 'Canada',
        tax_mode: 'category_based',
        default_tax_rate: 13.0,
        currency: 'CAD',
        tax_name: 'GST/HST',
        tax_inclusive: false,
        tax_rates: [
            { id: 'ca-gst', name: 'GST', rate: 5.0 },
            { id: 'ca-hst', name: 'HST', rate: 13.0, is_default: true },
            { id: 'ca-pst', name: 'PST', rate: 8.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant', tax_rate_id: 'ca-hst', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'ca-hst', color: '#EF4444' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'ca-gst', color: '#F59E0B' }
        ]
    },
    CH: {
        country_code: 'CH',
        country_name: 'Suisse',
        tax_mode: 'fixed',
        default_tax_rate: 7.7,
        currency: 'CHF',
        tax_name: 'TVA',
        tax_inclusive: false,
        tax_rates: [
            { id: 'ch-standard', name: 'TVA Standard', rate: 7.7, is_default: true },
            { id: 'ch-reduced', name: 'TVA Réduite', rate: 2.5 },
            { id: 'ch-special', name: 'TVA Spéciale', rate: 3.7 }
        ]
    },
    IT: {
        country_code: 'IT',
        country_name: 'Italie',
        tax_mode: 'category_based',
        default_tax_rate: 22.0,
        currency: 'EUR',
        tax_name: 'IVA',
        tax_inclusive: false,
        tax_rates: [
            { id: 'it-standard', name: 'IVA Standard', rate: 22.0, is_default: true },
            { id: 'it-reduced', name: 'IVA Ridotta', rate: 10.0 },
            { id: 'it-super-reduced', name: 'IVA Super Ridotta', rate: 4.0 },
            { id: 'it-zero', name: 'IVA Zero', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Ristorazione', tax_rate_id: 'it-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcolici', tax_rate_id: 'it-standard', color: '#EF4444' },
            { id: 'food', name: 'Alimenti', tax_rate_id: 'it-reduced', color: '#10B981' }
        ]
    },
    ES: {
        country_code: 'ES',
        country_name: 'Espagne',
        tax_mode: 'category_based',
        default_tax_rate: 21.0,
        currency: 'EUR',
        tax_name: 'IVA',
        tax_inclusive: false,
        tax_rates: [
            { id: 'es-standard', name: 'IVA General', rate: 21.0, is_default: true },
            { id: 'es-reduced', name: 'IVA Reducido', rate: 10.0 },
            { id: 'es-super-reduced', name: 'IVA Super Reducido', rate: 4.0 },
            { id: 'es-zero', name: 'IVA Cero', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restauración', tax_rate_id: 'es-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'es-standard', color: '#EF4444' },
            { id: 'food', name: 'Alimentos', tax_rate_id: 'es-reduced', color: '#10B981' }
        ]
    },
    CN: {
        country_code: 'CN',
        country_name: 'Chine',
        tax_mode: 'category_based',
        default_tax_rate: 13.0,
        currency: 'CNY',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'cn-standard', name: 'VAT Standard', rate: 13.0, is_default: true },
            { id: 'cn-reduced', name: 'VAT Reduced', rate: 9.0 },
            { id: 'cn-super-reduced', name: 'VAT Super Reduced', rate: 6.0 },
            { id: 'cn-zero', name: 'VAT Zero', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: '餐饮服务', tax_rate_id: 'cn-standard', color: '#3B82F6' },
            { id: 'alcohol', name: '酒类', tax_rate_id: 'cn-standard', color: '#EF4444' },
            { id: 'food', name: '食品', tax_rate_id: 'cn-reduced', color: '#10B981' },
            { id: 'takeaway', name: '外卖', tax_rate_id: 'cn-reduced', color: '#F59E0B' },
            { id: 'beverages', name: '饮料', tax_rate_id: 'cn-reduced', color: '#06B6D4' }
        ]
    },
    IN: {
        country_code: 'IN',
        country_name: 'Inde',
        tax_mode: 'category_based',
        default_tax_rate: 18.0,
        currency: 'INR',
        tax_name: 'GST',
        tax_inclusive: false,
        tax_rates: [
            { id: 'in-standard', name: 'GST Standard', rate: 18.0, is_default: true },
            { id: 'in-reduced', name: 'GST Reduced', rate: 12.0 },
            { id: 'in-super-reduced', name: 'GST Super Reduced', rate: 5.0 },
            { id: 'in-zero', name: 'GST Zero', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant Services', tax_rate_id: 'in-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'in-standard', color: '#EF4444' },
            { id: 'food', name: 'Food Items', tax_rate_id: 'in-reduced', color: '#10B981' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'in-reduced', color: '#F59E0B' },
            { id: 'beverages', name: 'Beverages', tax_rate_id: 'in-reduced', color: '#06B6D4' }
        ]
    },
    DUTY_FREE: {
        country_code: 'DUTY_FREE',
        country_name: 'Duty Free (Aéroport)',
        tax_mode: 'fixed',
        default_tax_rate: 0.0,
        currency: 'EUR',
        tax_name: 'Aucune Taxe',
        tax_inclusive: false,
        tax_rates: [
            { id: 'duty-free-zero', name: 'Duty Free', rate: 0.0, is_default: true }
        ],
        tax_categories: [
            { id: 'perfumes', name: 'Parfums & Cosmétiques', tax_rate_id: 'duty-free-zero', color: '#8B5CF6' },
            { id: 'alcohol', name: 'Alcools & Spiritueux', tax_rate_id: 'duty-free-zero', color: '#EF4444' },
            { id: 'tobacco', name: 'Tabac', tax_rate_id: 'duty-free-zero', color: '#6B7280' },
            { id: 'electronics', name: 'Électronique', tax_rate_id: 'duty-free-zero', color: '#3B82F6' },
            { id: 'fashion', name: 'Mode & Accessoires', tax_rate_id: 'duty-free-zero', color: '#EC4899' },
            { id: 'food', name: 'Alimentation', tax_rate_id: 'duty-free-zero', color: '#10B981' }
        ]
    }
}
