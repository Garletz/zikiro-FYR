import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BusinessService } from '../services/businessService';
import {
    DEFAULT_BUSINESS_INFO,
    DEFAULT_SYSTEM_CONFIG,
    DEFAULT_TAX_SETTINGS,
    DEFAULT_USER_PREFERENCES
} from '../types/business';

export const useBusinessSettings = () => {
    const queryClient = useQueryClient();

    // Business Info
    const {
        data: businessInfo,
        isLoading: isLoadingBusinessInfo,
        error: businessInfoError,
    } = useQuery({
        queryKey: ['business-info'],
        queryFn: BusinessService.getBusinessInfo,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });

    const saveBusinessInfoMutation = useMutation({
        mutationFn: BusinessService.saveBusinessInfo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-info'] });
        },
    });

    // Tax Settings
    const {
        data: taxSettings,
        isLoading: isLoadingTaxSettings,
        error: taxSettingsError,
    } = useQuery({
        queryKey: ['tax-settings'],
        queryFn: BusinessService.getTaxSettings,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });

    const saveTaxSettingsMutation = useMutation({
        mutationFn: BusinessService.saveTaxSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax-settings'] });
        },
    });

    // User Preferences
    const {
        data: userPreferences,
        isLoading: isLoadingUserPreferences,
        error: userPreferencesError,
    } = useQuery({
        queryKey: ['user-preferences'],
        queryFn: BusinessService.getUserPreferences,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });

    const saveUserPreferencesMutation = useMutation({
        mutationFn: BusinessService.saveUserPreferences,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
        },
    });

    // System Config
    const {
        data: systemConfig,
        isLoading: isLoadingSystemConfig,
        error: systemConfigError,
    } = useQuery({
        queryKey: ['system-config'],
        queryFn: BusinessService.getSystemConfig,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });

    const saveSystemConfigMutation = useMutation({
        mutationFn: BusinessService.saveSystemConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-config'] });
        },
    });

    // Combined loading state
    const isLoading = isLoadingBusinessInfo || isLoadingTaxSettings ||
        isLoadingUserPreferences || isLoadingSystemConfig;

    // Combined error state
    const error = businessInfoError || taxSettingsError ||
        userPreferencesError || systemConfigError;

    // Save all settings
    const saveAllSettingsMutation = useMutation({
        mutationFn: BusinessService.saveAllSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-info'] });
            queryClient.invalidateQueries({ queryKey: ['tax-settings'] });
            queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
            queryClient.invalidateQueries({ queryKey: ['system-config'] });
        },
    });

    return {
        // Data
        businessInfo: businessInfo || DEFAULT_BUSINESS_INFO,
        taxSettings: taxSettings || DEFAULT_TAX_SETTINGS,
        userPreferences: userPreferences || DEFAULT_USER_PREFERENCES,
        systemConfig: systemConfig || DEFAULT_SYSTEM_CONFIG,

        // Loading states
        isLoading,
        isLoadingBusinessInfo,
        isLoadingTaxSettings,
        isLoadingUserPreferences,
        isLoadingSystemConfig,

        // Error states
        error,
        businessInfoError,
        taxSettingsError,
        userPreferencesError,
        systemConfigError,

        // Mutations
        saveBusinessInfo: saveBusinessInfoMutation.mutateAsync,
        saveTaxSettings: saveTaxSettingsMutation.mutateAsync,
        saveUserPreferences: saveUserPreferencesMutation.mutateAsync,
        saveSystemConfig: saveSystemConfigMutation.mutateAsync,
        saveAllSettings: saveAllSettingsMutation.mutateAsync,

        // Mutation states
        isSavingBusinessInfo: saveBusinessInfoMutation.isPending,
        isSavingTaxSettings: saveTaxSettingsMutation.isPending,
        isSavingUserPreferences: saveUserPreferencesMutation.isPending,
        isSavingSystemConfig: saveSystemConfigMutation.isPending,
        isSavingAll: saveAllSettingsMutation.isPending,
    };
};
