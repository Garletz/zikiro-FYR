import { CheckCircle, Cpu, Globe, Smartphone, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProviderSelectionProps {
    defaultProvider: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900'
    onProviderChange: (provider: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900') => void
    onSave: () => void
    isSaving?: boolean
}

export default function ProviderSelection({
    defaultProvider,
    onProviderChange,
    onSave,
    isSaving = false
}: ProviderSelectionProps) {
    const [selectedProvider, setSelectedProvider] = useState<'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900'>(defaultProvider)

    // Update local state when prop changes
    useEffect(() => {
        setSelectedProvider(defaultProvider)
    }, [defaultProvider])
    const providers = [
        {
            id: 'none',
            name: 'Simulation Mode',
            description: 'Test mode without sending real SMS',
            icon: WifiOff,
            color: 'text-gray-500',
            bgColor: 'bg-gray-100'
        },
        {
            id: 'sms_gateway_android',
            name: 'SMS Gateway Android',
            description: 'Local Android device with SMS Gateway app',
            icon: Smartphone,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            id: 'infobip',
            name: 'Infobip',
            description: 'Cloud-based SMS service provider',
            icon: Globe,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            id: 'sim800_900',
            name: 'SIM 800/900',
            description: 'Hardware SIM module via USB/COM port',
            icon: Cpu,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Default Provider</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Choose your default SMS provider. You can configure each provider in their respective tabs.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => {
                    const Icon = provider.icon
                    const isSelected = selectedProvider === provider.id

                    const handleClick = () => {
                        setSelectedProvider(provider.id as any)
                        onProviderChange(provider.id as any)
                    }

                    return (
                        <div
                            key={provider.id}
                            onClick={handleClick}
                            className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${provider.bgColor}`}>
                                    <Icon className={`w-6 h-6 ${provider.color}`} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{provider.name}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                                </div>
                                {isSelected && (
                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>


            <div className="flex justify-end">
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    )
}
