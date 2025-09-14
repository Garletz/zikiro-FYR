export interface BusinessInfo {
    id?: number;
    business_name: string;
    business_address: string;
    business_phone: string;
    business_email: string;
    business_website?: string;
    business_logo?: string;
    business_description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface TaxSettings {
    id?: number;
    selected_country: string;
    auto_calculate: boolean;
    show_tax_details: boolean;
    round_tax: boolean;
    tax_inclusive: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface UserPreferences {
    id?: number;
    theme: string;
    language: string;
    currency: string;
    date_format: string;
    time_format: string;
    created_at?: string;
    updated_at?: string;
}

export interface SystemConfig {
    id?: number;
    app_version: string;
    last_backup?: string;
    auto_backup: boolean;
    backup_frequency: string;
    created_at?: string;
    updated_at?: string;
}

export interface BusinessSettings {
    business_info: BusinessInfo;
    tax_settings: TaxSettings;
    user_preferences: UserPreferences;
    system_config: SystemConfig;
}

// Default values
export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    business_website: '',
    business_logo: '',
    business_description: '',
};

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
    selected_country: 'FR',
    auto_calculate: true,
    show_tax_details: true,
    round_tax: true,
    tax_inclusive: false,
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
    theme: 'light',
    language: 'fr',
    currency: 'EUR',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
};

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
    app_version: '1.0.0',
    last_backup: '',
    auto_backup: false,
    backup_frequency: 'daily',
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
    business_info: DEFAULT_BUSINESS_INFO,
    tax_settings: DEFAULT_TAX_SETTINGS,
    user_preferences: DEFAULT_USER_PREFERENCES,
    system_config: DEFAULT_SYSTEM_CONFIG,
};
