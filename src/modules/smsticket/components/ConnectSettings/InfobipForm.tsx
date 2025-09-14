import { CheckCircle, ExternalLink, Eye, EyeOff, Globe, TestTube, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { InfobipConfig } from '../../types'
import { normalizePhoneNumber } from '../../utils/phoneNormalization'

interface InfobipFormProps {
    config: InfobipConfig | null
    onSave: (config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'>) => void
    onTest: (config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>
    isSaving?: boolean
    isTesting?: boolean
}

export default function InfobipForm({
    config,
    onSave,
    onTest,
    isSaving = false,
    isTesting = false
}: InfobipFormProps) {
    const [formData, setFormData] = useState({
        api_key: '',
        base_url: 'https://api.infobip.com',
        sender_name: '',
        is_enabled: false
    })
    const [showApiKey, setShowApiKey] = useState(false)
    const [testPhoneNumber, setTestPhoneNumber] = useState('')
    const [testMessage, setTestMessage] = useState('Test SMS from POS-GPT-NIKEL')
    const [normalizedPhone, setNormalizedPhone] = useState('')
    const [testResult, setTestResult] = useState<{
        success: boolean | null
        message: string
        details?: any
    }>({
        success: null,
        message: ''
    })

    useEffect(() => {
        if (config) {
            setFormData({
                api_key: config.api_key || '',
                base_url: config.base_url || 'https://api.infobip.com',
                sender_name: config.sender_name || '',
                is_enabled: config.is_enabled || false
            })
        }
    }, [config])


    // Normaliser le numéro quand il change
    useEffect(() => {
        if (testPhoneNumber.trim()) {
            const normalized = normalizePhoneNumber(testPhoneNumber)
            setNormalizedPhone(normalized)
        } else {
            setNormalizedPhone('')
        }
    }, [testPhoneNumber])

    const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
        // Normaliser l'URL pour s'assurer qu'elle commence par https://
        if (field === 'base_url' && typeof value === 'string') {
            let url = value.trim()
            if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url
            }
            value = url
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSave = () => {
        // Toujours activer le provider quand on sauvegarde
        onSave({
            ...formData,
            is_enabled: true
        })
    }

    const handleTest = async () => {
        if (!testPhoneNumber.trim()) {
            setTestResult({
                success: false,
                message: 'Veuillez entrer un numéro de téléphone pour le test'
            })
            return
        }

        setTestResult({
            success: null,
            message: 'Test en cours...'
        })

        try {
            const result = await onTest({
                ...formData,
            })

            if (result) {
                setTestResult({
                    success: true,
                    message: 'SMS envoyé avec succès ! Vérifiez votre téléphone.',
                    details: {
                        phone: normalizedPhone,
                        original_phone: testPhoneNumber,
                        message: testMessage,
                        sender: formData.sender_name,
                        base_url: formData.base_url
                    }
                })
            } else {
                setTestResult({
                    success: false,
                    message: 'Échec de l\'envoi du SMS. Vérifiez la configuration et les crédits Infobip.'
                })
            }
        } catch (error) {
            console.error('Erreur lors du test:', error)
            setTestResult({
                success: false,
                message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
            })
        }
    }

    const isFormValid = formData.api_key && formData.base_url && formData.sender_name

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Infobip</h3>
                    <p className="text-sm text-gray-600">
                        Configure Infobip cloud-based SMS service provider
                    </p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-blue-900">Setup Instructions</h4>
                        <ol className="text-sm text-blue-800 mt-2 space-y-1">
                            <li>1. Create an account at <a href="https://www.infobip.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">infobip.com <ExternalLink size={12} /></a></li>
                            <li>2. Generate an API key from your dashboard</li>
                            <li>3. Configure the settings below</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key *
                    </label>
                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={formData.api_key}
                            onChange={(e) => handleInputChange('api_key', e.target.value)}
                            placeholder="Enter your Infobip API key"
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Your Infobip API key for authentication
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base URL *
                    </label>
                    <input
                        type="url"
                        value={formData.base_url}
                        onChange={(e) => handleInputChange('base_url', e.target.value)}
                        placeholder="https://1gjwy1.api.infobip.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Infobip API base URL (ex: https://1gjwy1.api.infobip.com ou https://api.infobip.com)
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sender Name *
                    </label>
                    <input
                        type="text"
                        value={formData.sender_name}
                        onChange={(e) => handleInputChange('sender_name', e.target.value)}
                        placeholder="YourBusiness"
                        maxLength={11}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Sender name (max 11 characters, alphanumeric only)
                    </p>
                </div>
            </div>


            {/* Test Configuration */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Test Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Test Phone Number *
                        </label>
                        <input
                            type="tel"
                            value={testPhoneNumber}
                            onChange={(e) => setTestPhoneNumber(e.target.value)}
                            placeholder="06 28 78 27 25 ou +33 6 28 78 27 25"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="mt-1">
                            <p className="text-xs text-gray-500">
                                Formats acceptés : 06 28 78 27 25, +33 6 28 78 27 25, 0628782725
                            </p>
                            {normalizedPhone && (
                                <p className="text-xs text-blue-600 font-medium">
                                    📱 Envoi vers : {normalizedPhone}
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Test Message
                        </label>
                        <input
                            type="text"
                            value={testMessage}
                            onChange={(e) => setTestMessage(e.target.value)}
                            placeholder="Test SMS message"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Message content for test SMS
                        </p>
                    </div>
                </div>
            </div>

            {/* Test Results */}
            {testResult.success !== null && (
                <div className={`border rounded-lg p-4 ${testResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-start gap-3">
                        {testResult.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <h4 className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'
                                }`}>
                                {testResult.success ? 'Test réussi' : 'Test échoué'}
                            </h4>
                            <p className={`text-sm mt-1 ${testResult.success ? 'text-green-700' : 'text-red-700'
                                }`}>
                                {testResult.message}
                            </p>
                            {testResult.details && (
                                <div className="mt-3 text-xs text-gray-600">
                                    <p><strong>Numéro saisi:</strong> {testResult.details.original_phone}</p>
                                    <p><strong>Numéro envoyé:</strong> {testResult.details.phone}</p>
                                    <p><strong>Message:</strong> {testResult.details.message}</p>
                                    <p><strong>Expéditeur:</strong> {testResult.details.sender}</p>
                                    <p><strong>API:</strong> {testResult.details.base_url}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleTest}
                        disabled={!isFormValid || !testPhoneNumber.trim() || isTesting}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <TestTube size={16} />
                        {isTesting ? 'Sending Test SMS...' : 'Send Test SMS'}
                    </button>

                </div>

                <button
                    onClick={handleSave}
                    disabled={!isFormValid || isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    )
}
