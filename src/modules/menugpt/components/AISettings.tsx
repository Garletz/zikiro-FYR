import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Brain,
    CheckCircle,
    Copy,
    Eye,
    EyeOff,
    Save,
    TestTube,
    XCircle
} from 'lucide-react'
import { useState } from 'react'
import { aiConfigService } from '../../../shared/services/aiConfigService'
import {
    AIConfig,
    AIConfigRequest,
    AIProvider,
    DEFAULT_AI_CONFIGS
} from '../../../shared/types/aiConfig'

export default function AISettings() {
    const [showApiKey, setShowApiKey] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

    const queryClient = useQueryClient()

    // État du formulaire
    const [formData, setFormData] = useState<AIConfigRequest>({
        provider: 'gemini',
        api_key: '',
        api_url: '',
        model: '',
        is_active: true
    })

    // Récupérer la configuration actuelle
    const { data: currentConfig, isLoading } = useQuery<AIConfig | null>({
        queryKey: ['ai-config'],
        queryFn: aiConfigService.getAIConfig,
    })

    // Mutation pour sauvegarder la configuration
    const saveConfigMutation = useMutation({
        mutationFn: aiConfigService.saveAIConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-config'] })
            setTestResult({ success: true, message: 'Configuration saved successfully!' })
        },
        onError: (error) => {
            setTestResult({ success: false, message: `Error: ${(error as Error).message}` })
        }
    })

    // Mutation pour tester la configuration
    const testConfigMutation = useMutation({
        mutationFn: aiConfigService.testAIConfig,
        onSuccess: (result) => {
            setTestResult({ success: result.success, message: result.message })
        },
        onError: (error) => {
            setTestResult({ success: false, message: `Test failed: ${(error as Error).message}` })
        }
    })

    // Initialiser le formulaire avec la configuration actuelle
    useState(() => {
        if (currentConfig) {
            setFormData({
                provider: currentConfig.provider as AIProvider,
                api_key: currentConfig.api_key,
                api_url: currentConfig.api_url,
                model: currentConfig.model || '',
                is_active: currentConfig.is_active
            })
        } else {
            // Utiliser les valeurs par défaut
            const defaultConfig = DEFAULT_AI_CONFIGS[formData.provider]
            setFormData(prev => ({
                ...prev,
                api_url: defaultConfig.api_url || '',
                model: defaultConfig.model || ''
            }))
        }
    })

    const handleCopyUrl = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url)
            setCopyFeedback('Link copied!')
            setTimeout(() => setCopyFeedback(null), 2000)
        } catch (error) {
            setCopyFeedback('Copy failed')
            setTimeout(() => setCopyFeedback(null), 2000)
        }
    }


    const handleSave = async () => {
        await saveConfigMutation.mutateAsync(formData)
    }

    const handleTest = async () => {
        setIsTesting(true)
        setTestResult(null)
        try {
            await testConfigMutation.mutateAsync({
                provider: formData.provider,
                api_key: formData.api_key,
                api_url: formData.api_url,
                model: formData.model
            })
        } finally {
            setIsTesting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">AI Configuration</h2>
                    <p className="text-sm sm:text-base text-gray-600">Configure Google Gemini for menu analysis</p>
                </div>
            </div>

            {/* Configuration Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                    {/* Provider Info */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Brain className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Google Gemini</h3>
                                <p className="text-sm text-gray-600">Advanced AI model for text and image analysis</p>
                            </div>
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={formData.api_key}
                                onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                                placeholder="Enter your Gemini API key"
                                className="w-full pl-4 pr-12 py-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent touch-manipulation"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 touch-manipulation"
                            >
                                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                            <p className="text-xs text-gray-600 mb-2">
                                Get your API key from Google AI Studio:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-white px-2 py-1 rounded border text-gray-800 break-all">
                                    https://aistudio.google.com/apikey
                                </code>
                                <button
                                    type="button"
                                    onClick={() => handleCopyUrl('https://aistudio.google.com/apikey')}
                                    className="relative px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors touch-manipulation flex items-center gap-1"
                                >
                                    <Copy size={12} />
                                    Copy
                                </button>
                            </div>
                            {copyFeedback && (
                                <div className="mt-2 text-xs text-green-600 font-medium animate-pulse">
                                    ✓ {copyFeedback}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={`p-4 rounded-lg flex items-center space-x-3 ${testResult.success
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                            }`}>
                            {testResult.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            )}
                            <span className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {testResult.message}
                            </span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                        <button
                            onClick={handleTest}
                            disabled={!formData.api_key || isTesting}
                            className="flex items-center justify-center space-x-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation text-base font-medium"
                        >
                            <TestTube size={18} />
                            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={!formData.api_key || saveConfigMutation.isPending}
                            className="flex items-center justify-center space-x-2 px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation text-base font-medium"
                        >
                            <Save size={18} />
                            <span>{saveConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Current Configuration Status */}
            {currentConfig && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Current Configuration</h3>
                    <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Provider:</span>
                            <span className="text-gray-900">Google Gemini</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Model:</span>
                            <span className="text-gray-900">{currentConfig.model || 'gemini-2.0-flash'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Status:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentConfig.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {currentConfig.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Last Updated:</span>
                            <span className="text-gray-900 text-xs">{new Date(currentConfig.updated_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
