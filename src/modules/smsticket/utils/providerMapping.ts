// Mapping between frontend provider names and backend provider names
// Backend uses lowercase without underscores due to serde(rename_all = "lowercase")

export const FRONTEND_TO_BACKEND_PROVIDER = {
    'none': 'none',
    'sms_gateway_android': 'smsgatewayandroid',
    'infobip': 'infobip',
    'sim800_900': 'sim800900',
    'twilio': 'twilio',
    'messagebird': 'messagebird',
    'sim800c': 'sim800c',
    'sim900a': 'sim900a',
    'custom': 'custom'
} as const

export const BACKEND_TO_FRONTEND_PROVIDER = {
    'none': 'none',
    'smsgatewayandroid': 'sms_gateway_android',
    'infobip': 'infobip',
    'sim800900': 'sim800_900',
    'twilio': 'twilio',
    'messagebird': 'messagebird',
    'sim800c': 'sim800c',
    'sim900a': 'sim900a',
    'custom': 'custom'
} as const

export type FrontendProvider = keyof typeof FRONTEND_TO_BACKEND_PROVIDER
export type BackendProvider = keyof typeof BACKEND_TO_FRONTEND_PROVIDER

export function toBackendProvider(frontendProvider: FrontendProvider): BackendProvider {
    return FRONTEND_TO_BACKEND_PROVIDER[frontendProvider] as BackendProvider
}

export function toFrontendProvider(backendProvider: BackendProvider): FrontendProvider {
    return BACKEND_TO_FRONTEND_PROVIDER[backendProvider] as FrontendProvider
}
