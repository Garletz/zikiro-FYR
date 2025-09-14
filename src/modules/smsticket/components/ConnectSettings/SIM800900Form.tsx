import { CheckCircle, Cpu, RefreshCw, Search, Usb, Wifi, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SIM800900Config } from '../../types'

interface SIM800900FormProps {
    config: SIM800900Config | null
    onSave: (config: Omit<SIM800900Config, 'id' | 'created_at' | 'updated_at'>) => void
    onScanPorts: () => Promise<string[]>
    isSaving?: boolean
    isScanning?: boolean
}

interface DetectedPort {
    port: string
    type: 'usb' | 'com'
    description: string
    isConnected: boolean
}

export default function SIM800900Form({
    config,
    onSave,
    onScanPorts,
    isSaving = false,
}: SIM800900FormProps) {
    const [formData, setFormData] = useState({
        port: '',
        baud_rate: 9600,
        pin_code: '',
        is_enabled: false
    })
    const [detectedPorts, setDetectedPorts] = useState<DetectedPort[]>([])
    const [isScanningPorts, setIsScanningPorts] = useState(false)

    useEffect(() => {
        if (config) {
            setFormData({
                port: config.port || '',
                baud_rate: config.baud_rate || 9600,
                pin_code: config.pin_code || '',
                is_enabled: config.is_enabled || false
            })
        }
    }, [config])

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

    const handleScanPorts = async () => {
        setIsScanningPorts(true)
        try {
            const ports = await onScanPorts()
            const detected: DetectedPort[] = ports.map(port => ({
                port,
                type: port.toLowerCase().includes('usb') ? 'usb' : 'com',
                description: `SIM Module on ${port}`,
                isConnected: true
            }))
            setDetectedPorts(detected)
        } catch (error) {
            console.error('Error scanning ports:', error)
            setDetectedPorts([])
        } finally {
            setIsScanningPorts(false)
        }
    }

    const handlePortSelect = (port: string) => {
        handleInputChange('port', port)
    }

    const isFormValid = formData.port && formData.baud_rate

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                    <Cpu className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">SIM 800/900</h3>
                    <p className="text-sm text-gray-600">
                        Configure hardware SIM module via USB/COM port
                    </p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Cpu className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-amber-900">Hardware Setup</h4>
                        <ol className="text-sm text-amber-800 mt-2 space-y-1">
                            <li>1. Connect your SIM 800/900 module via USB or COM port</li>
                            <li>2. Insert a valid SIM card with SMS capabilities</li>
                            <li>3. Ensure proper power supply to the module</li>
                            <li>4. Scan for available ports and configure settings</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Port Selection *
                        </label>
                        <button
                            onClick={handleScanPorts}
                            disabled={isScanningPorts}
                            className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RefreshCw size={14} className={isScanningPorts ? 'animate-spin' : ''} />
                            {isScanningPorts ? 'Scanning...' : 'Scan Ports'}
                        </button>
                    </div>

                    {detectedPorts.length > 0 ? (
                        <div className="space-y-2">
                            {detectedPorts.map((detectedPort) => (
                                <div
                                    key={detectedPort.port}
                                    onClick={() => handlePortSelect(detectedPort.port)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.port === detectedPort.port
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {detectedPort.type === 'usb' ? (
                                            <Usb className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <Wifi className="w-5 h-5 text-blue-600" />
                                        )}
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{detectedPort.port}</div>
                                            <div className="text-sm text-gray-600">{detectedPort.description}</div>
                                        </div>
                                        {detectedPort.isConnected && (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
                            <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No ports detected. Click "Scan Ports" to search for SIM modules.</p>
                        </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                        Select the port where your SIM 800/900 module is connected
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Baud Rate *
                        </label>
                        <select
                            value={formData.baud_rate}
                            onChange={(e) => handleInputChange('baud_rate', parseInt(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={9600}>9600</option>
                            <option value={19200}>19200</option>
                            <option value={38400}>38400</option>
                            <option value={57600}>57600</option>
                            <option value={115200}>115200</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Communication speed with the SIM module
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            PIN Code
                        </label>
                        <input
                            type="password"
                            value={formData.pin_code}
                            onChange={(e) => handleInputChange('pin_code', e.target.value)}
                            placeholder="1234 (optional)"
                            maxLength={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            SIM card PIN code (if required)
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-yellow-900">Development Notice</h4>
                        <p className="text-sm text-yellow-800 mt-1">
                            This provider is currently in development. The interface is ready but the actual SMS sending functionality will be implemented later.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                    <h4 className="font-medium text-gray-900">Enable Provider</h4>
                    <p className="text-sm text-gray-600">
                        Activate this provider for SMS sending (when implemented)
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.is_enabled}
                        onChange={(e) => handleInputChange('is_enabled', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex justify-end">
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
