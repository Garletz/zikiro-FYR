import { CheckCircle, Copy, Eye, EyeOff, Smartphone, TestTube, Wifi, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SMSGatewayAndroidConfig } from '../../types'
import { normalizePhoneNumber } from '../../utils/phoneNormalization'

interface SMSGatewayAndroidFormProps {
    config: SMSGatewayAndroidConfig | null
    onSave: (config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'>) => void
    onTest: (config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>
    isSaving?: boolean
    isTesting?: boolean
}

export default function SMSGatewayAndroidForm({
    config,
    onSave,
    onTest,
    isSaving = false,
    isTesting = false
}: SMSGatewayAndroidFormProps) {
    const [formData, setFormData] = useState({
        device_ip: '',
        port: 8080,
        username: '',
        password: '',
        is_enabled: false
    })
    const [showPassword, setShowPassword] = useState(false)
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
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

    useEffect(() => {
        if (config) {
            setFormData({
                device_ip: config.device_ip || '',
                port: config.port || 8080,
                username: config.username || '',
                password: config.password || '',
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

    const handleInputChange = (field: keyof typeof formData, value: string | number | boolean) => {
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
                        device_ip: formData.device_ip,
                        port: formData.port
                    }
                })
            } else {
                setTestResult({
                    success: false,
                    message: 'Échec de l\'envoi du SMS. Vérifiez la configuration et que le serveur SMS Gateway est démarré.'
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

    const isFormValid = formData.device_ip && formData.username && formData.password

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                    <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">SMS Gateway Android</h3>
                    <p className="text-sm text-gray-600">
                        Configure your Android device with SMS Gateway app for local SMS sending
                    </p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Wifi className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-medium text-blue-900">Setup Instructions</h4>
                        <ol className="text-sm text-blue-800 mt-2 space-y-1">
                            <li>1. Download and install SMS Gateway for Android app</li>
                            <li>2. Enable Local Server mode in the app</li>
                            <li>3. Note the device IP address and credentials</li>
                            <li>4. Configure the settings below</li>
                        </ol>

                        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                            <p className="text-xs text-gray-600 mb-2">
                                Download SMS Gateway Android app:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs bg-gray-50 px-2 py-1 rounded border text-gray-800 break-all">
                                    https://sms-gate.app/
                                </code>
                                <button
                                    type="button"
                                    onClick={() => handleCopyUrl('https://sms-gate.app/')}
                                    className="relative px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors touch-manipulation flex items-center gap-1"
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
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Device IP Address *
                    </label>
                    <input
                        type="text"
                        value={formData.device_ip}
                        onChange={(e) => handleInputChange('device_ip', e.target.value)}
                        placeholder="192.168.1.100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Local IP address of your Android device
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Port *
                    </label>
                    <input
                        type="number"
                        value={formData.port}
                        onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 8080)}
                        placeholder="8080"
                        min="1024"
                        max="65535"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Port number (1024-65535)
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username *
                    </label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="admin"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        API authentication username
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        API authentication password (min 8 characters)
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
                                    <p><strong>Serveur:</strong> {testResult.details.device_ip}:{testResult.details.port}</p>
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
