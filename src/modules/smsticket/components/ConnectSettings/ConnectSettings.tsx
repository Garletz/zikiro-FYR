import { Cpu, Globe, Settings, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
    InfobipConfig,
    ProviderSelection as ProviderSelectionType,
    SIM800900Config,
    SMSGatewayAndroidConfig
} from '../../types'
import InfobipForm from './InfobipForm'
import ProviderSelection from './ProviderSelection'
import SIM800900Form from './SIM800900Form'
import SMSGatewayAndroidForm from './SMSGatewayAndroidForm'

interface ConnectSettingsProps {
    onSaveProviderSelection: (selection: ProviderSelectionType) => Promise<void>
    onSaveSMSGateway: (config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
    onTestSMSGateway: (config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>
    onSaveInfobip: (config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
    onTestInfobip: (config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>
    onSaveSIM800900: (config: Omit<SIM800900Config, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
    onScanPorts: () => Promise<string[]>
    providerSelection?: ProviderSelectionType
    smsGatewayConfig?: SMSGatewayAndroidConfig | null
    infobipConfig?: InfobipConfig | null
    sim800900Config?: SIM800900Config | null
    isLoading?: boolean
}

type SubTabType = 'provider-selection' | 'sms-gateway' | 'infobip' | 'sim800-900'

export default function ConnectSettings({
    onSaveProviderSelection,
    onSaveSMSGateway,
    onTestSMSGateway,
    onSaveInfobip,
    onTestInfobip,
    onSaveSIM800900,
    onScanPorts,
    providerSelection,
    smsGatewayConfig,
    infobipConfig,
    sim800900Config,
    isLoading = false
}: ConnectSettingsProps) {
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('provider-selection')
    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [tempProviderSelection, setTempProviderSelection] = useState<ProviderSelectionType | null>(null)

    // Initialize temp selection when providerSelection changes
    useEffect(() => {
        if (providerSelection) {
            setTempProviderSelection(providerSelection)
        }
    }, [providerSelection])

    const subTabs = [
        {
            id: 'provider-selection' as const,
            label: 'Provider Selection',
            icon: Settings,
            description: 'Choose default provider and simulation mode'
        },
        {
            id: 'sms-gateway' as const,
            label: 'SMS Gateway Android',
            icon: Smartphone,
            description: 'Local Android device configuration'
        },
        {
            id: 'infobip' as const,
            label: 'Infobip',
            icon: Globe,
            description: 'Cloud-based SMS service'
        },
        {
            id: 'sim800-900' as const,
            label: 'SIM 800/900',
            icon: Cpu,
            description: 'Hardware SIM module'
        }
    ]


    const handleSaveSMSGateway = async (config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'>) => {
        setIsSaving(true)
        try {
            await onSaveSMSGateway(config)
        } finally {
            setIsSaving(false)
        }
    }

    const handleTestSMSGateway = async (config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'>) => {
        setIsTesting(true)
        try {
            return await onTestSMSGateway(config)
        } finally {
            setIsTesting(false)
        }
    }

    const handleSaveInfobip = async (config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'>) => {
        setIsSaving(true)
        try {
            await onSaveInfobip(config)
        } finally {
            setIsSaving(false)
        }
    }

    const handleTestInfobip = async (config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'>) => {
        setIsTesting(true)
        try {
            return await onTestInfobip(config)
        } finally {
            setIsTesting(false)
        }
    }

    const handleSaveSIM800900 = async (config: Omit<SIM800900Config, 'id' | 'created_at' | 'updated_at'>) => {
        setIsSaving(true)
        try {
            await onSaveSIM800900(config)
        } finally {
            setIsSaving(false)
        }
    }


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Settings className="text-blue-600" size={24} />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Connect Settings</h2>
                            <p className="text-gray-600">Configure SMS providers and connection settings</p>
                        </div>
                    </div>
                </div>

                {/* Sub Navigation */}
                <div className="border-b border-gray-200 px-6">
                    <nav className="flex space-x-8">
                        {subTabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeSubTab === tab.id

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveSubTab(tab.id)}
                                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeSubTab === 'provider-selection' && (
                        <ProviderSelection
                            defaultProvider={tempProviderSelection?.default_provider || 'none'}
                            onProviderChange={(provider) => {
                                // Update temp state for immediate UI feedback
                                if (tempProviderSelection) {
                                    const updatedSelection = {
                                        ...tempProviderSelection,
                                        default_provider: provider,
                                        simulation_mode: provider === 'none'
                                    }
                                    setTempProviderSelection(updatedSelection)
                                }
                            }}
                            onSave={async () => {
                                if (tempProviderSelection) {
                                    setIsSaving(true)
                                    try {
                                        await onSaveProviderSelection(tempProviderSelection)
                                    } finally {
                                        setIsSaving(false)
                                    }
                                }
                            }}
                            isSaving={isSaving}
                        />
                    )}

                    {activeSubTab === 'sms-gateway' && (
                        <SMSGatewayAndroidForm
                            config={smsGatewayConfig || null}
                            onSave={handleSaveSMSGateway}
                            onTest={handleTestSMSGateway}
                            isSaving={isSaving}
                            isTesting={isTesting}
                        />
                    )}

                    {activeSubTab === 'infobip' && (
                        <InfobipForm
                            config={infobipConfig || null}
                            onSave={handleSaveInfobip}
                            onTest={handleTestInfobip}
                            isSaving={isSaving}
                            isTesting={isTesting}
                        />
                    )}

                    {activeSubTab === 'sim800-900' && (
                        <SIM800900Form
                            config={sim800900Config || null}
                            onSave={handleSaveSIM800900}
                            onScanPorts={onScanPorts}
                            isSaving={isSaving}
                            isScanning={isTesting}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
