import { invoke } from '@tauri-apps/api/core';
import { BusinessInfo, SystemConfig, TaxSettings, UserPreferences } from '../types/business';

export class BusinessService {
    // Business Info
    static async getBusinessInfo(): Promise<BusinessInfo> {
        try {
            return await invoke('get_business_info');
        } catch (error) {
            console.error('Error getting business info:', error);
            throw error;
        }
    }

    static async saveBusinessInfo(info: BusinessInfo): Promise<void> {
        try {
            await invoke('save_business_info', { info });
        } catch (error) {
            console.error('Error saving business info:', error);
            throw error;
        }
    }

    // Tax Settings
    static async getTaxSettings(): Promise<TaxSettings> {
        try {
            return await invoke('get_tax_settings');
        } catch (error) {
            console.error('Error getting tax settings:', error);
            throw error;
        }
    }

    static async saveTaxSettings(settings: TaxSettings): Promise<void> {
        try {
            await invoke('save_tax_settings', { settings });
        } catch (error) {
            console.error('Error saving tax settings:', error);
            throw error;
        }
    }

    // User Preferences
    static async getUserPreferences(): Promise<UserPreferences> {
        try {
            return await invoke('get_user_preferences');
        } catch (error) {
            console.error('Error getting user preferences:', error);
            throw error;
        }
    }

    static async saveUserPreferences(preferences: UserPreferences): Promise<void> {
        try {
            await invoke('save_user_preferences', { preferences });
        } catch (error) {
            console.error('Error saving user preferences:', error);
            throw error;
        }
    }

    // System Config
    static async getSystemConfig(): Promise<SystemConfig> {
        try {
            return await invoke('get_system_config');
        } catch (error) {
            console.error('Error getting system config:', error);
            throw error;
        }
    }

    static async saveSystemConfig(config: SystemConfig): Promise<void> {
        try {
            await invoke('save_system_config', { config });
        } catch (error) {
            console.error('Error saving system config:', error);
            throw error;
        }
    }

    // Utility methods
    static async getAllSettings() {
        try {
            const [businessInfo, taxSettings, userPreferences, systemConfig] = await Promise.all([
                this.getBusinessInfo(),
                this.getTaxSettings(),
                this.getUserPreferences(),
                this.getSystemConfig(),
            ]);

            return {
                business_info: businessInfo,
                tax_settings: taxSettings,
                user_preferences: userPreferences,
                system_config: systemConfig,
            };
        } catch (error) {
            console.error('Error getting all settings:', error);
            throw error;
        }
    }

    static async saveAllSettings(settings: {
        business_info: BusinessInfo;
        tax_settings: TaxSettings;
        user_preferences: UserPreferences;
        system_config: SystemConfig;
    }) {
        try {
            await Promise.all([
                this.saveBusinessInfo(settings.business_info),
                this.saveTaxSettings(settings.tax_settings),
                this.saveUserPreferences(settings.user_preferences),
                this.saveSystemConfig(settings.system_config),
            ]);
        } catch (error) {
            console.error('Error saving all settings:', error);
            throw error;
        }
    }
}
