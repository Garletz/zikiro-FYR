export interface AIConfig {
    id: string
    provider: AIProvider
    api_key: string
    api_url: string
    model: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export type AIProvider = 'gemini'

export interface AIConfigRequest {
    provider: AIProvider
    api_key: string
    api_url?: string
    model?: string
    is_active?: boolean
}

export interface AIConfigResponse {
    success: boolean
    config?: AIConfig
    error?: string
}

export interface AITestRequest {
    provider: AIProvider
    api_key: string
    api_url?: string
    model?: string
}

export interface AITestResponse {
    success: boolean
    message: string
    error?: string
}

// Configuration par défaut pour Gemini
export const DEFAULT_AI_CONFIGS: Record<AIProvider, Partial<AIConfig>> = {
    gemini: {
        provider: 'gemini',
        api_url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        model: 'gemini-2.0-flash'
    }
}

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
    gemini: 'Google Gemini'
}

export const AI_PROVIDER_DESCRIPTIONS: Record<AIProvider, string> = {
    gemini: 'Google\'s advanced AI model for text and image analysis'
}
