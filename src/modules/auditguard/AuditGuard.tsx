import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Download,
    Eye,
    FileText,
    RefreshCw,
    Settings,
    Shield,
    XCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { securityService } from '../../shared/services/securityService'
import {
    Anomaly,
    AnomalySeverity,
    COUNTRY_COMPLIANCE_CONFIGS,
    SecurityConfig,
    SecurityStats
} from '../../shared/types/security'

export default function AuditGuard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'anomalies' | 'compliance' | 'config'>('overview')
    const [sessionId] = useState(() => securityService.generateSessionId())
    const queryClient = useQueryClient()

    // Queries
    const { data: securityStats, isLoading: statsLoading } = useQuery<SecurityStats>({
        queryKey: ['security-stats'],
        queryFn: () => securityService.getSecurityStats(),
        refetchInterval: 30000, // Refresh every 30 seconds
    })

    const { data: anomalies = [], isLoading: anomaliesLoading } = useQuery<Anomaly[]>({
        queryKey: ['anomalies'],
        queryFn: () => securityService.getAnomalies(50),
        refetchInterval: 60000, // Refresh every minute
    })

    const { data: _unresolvedAnomalies = [] } = useQuery<Anomaly[]>({
        queryKey: ['unresolved-anomalies'],
        queryFn: () => securityService.getUnresolvedAnomalies(),
        refetchInterval: 30000,
    })

    const { data: securityConfig } = useQuery<SecurityConfig | null>({
        queryKey: ['security-config'],
        queryFn: () => securityService.getSecurityConfig(),
    })

    // Mutations
    const resolveAnomalyMutation = useMutation({
        mutationFn: ({ anomalyId, resolvedBy }: { anomalyId: string; resolvedBy: string }) =>
            securityService.resolveAnomaly(anomalyId, resolvedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['anomalies'] })
            queryClient.invalidateQueries({ queryKey: ['unresolved-anomalies'] })
        },
    })

    const saveConfigMutation = useMutation({
        mutationFn: (config: SecurityConfig) => securityService.saveSecurityConfig(config),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-config'] })
        },
    })

    // Security system initialization
    useEffect(() => {
        const initSecurity = async () => {
            try {
                await securityService.initSecuritySystem()
                await securityService.createAppClock(sessionId)
            } catch (error) {
                console.error('Error initializing security:', error)
            }
        }
        initSecurity()
    }, [sessionId])

    // Real-time monitoring
    useEffect(() => {
        if (securityConfig) {
            securityService.startRealTimeMonitoring(sessionId, securityConfig)
        }
    }, [sessionId, securityConfig])

    // Listen for security alerts
    useEffect(() => {
        const handleSecurityAlert = (event: CustomEvent) => {
            console.log('Security alert received:', event.detail)
            // Here we could display a notification
        }

        window.addEventListener('security-alert', handleSecurityAlert as EventListener)
        return () => {
            window.removeEventListener('security-alert', handleSecurityAlert as EventListener)
        }
    }, [])

    const getSeverityColor = (severity: AnomalySeverity) => {
        switch (severity) {
            case AnomalySeverity.Low:
                return 'text-blue-600 bg-blue-100'
            case AnomalySeverity.Medium:
                return 'text-yellow-600 bg-yellow-100'
            case AnomalySeverity.High:
                return 'text-orange-600 bg-orange-100'
            case AnomalySeverity.Critical:
                return 'text-red-600 bg-red-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    const getSeverityIcon = (severity: AnomalySeverity) => {
        switch (severity) {
            case AnomalySeverity.Low:
                return <Eye className="w-4 h-4" />
            case AnomalySeverity.Medium:
                return <AlertTriangle className="w-4 h-4" />
            case AnomalySeverity.High:
                return <XCircle className="w-4 h-4" />
            case AnomalySeverity.Critical:
                return <Shield className="w-4 h-4" />
            default:
                return <Activity className="w-4 h-4" />
        }
    }

    const handleResolveAnomaly = (anomalyId: string) => {
        resolveAnomalyMutation.mutate({
            anomalyId,
            resolvedBy: 'admin', // In production, use the logged-in user
        })
    }

    const handleExportData = async (format: 'json' | 'csv') => {
        try {
            const data = await securityService.exportSecurityData(format)
            const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `security-export-${new Date().toISOString().split('T')[0]}.${format}`
            a.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error exporting data:', error)
        }
    }

    if (statsLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Shield className="w-6 h-6 text-blue-600" />
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">AuditGuard</h1>
                            <p className="text-sm text-gray-500">Security monitoring and compliance system</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleExportData('json')}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export JSON</span>
                        </button>
                        <button
                            onClick={() => handleExportData('csv')}
                            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'overview', name: 'Overview', icon: Activity },
                            { id: 'anomalies', name: 'Anomalies', icon: AlertTriangle },
                            { id: 'compliance', name: 'Compliance', icon: FileText },
                            { id: 'config', name: 'Configuration', icon: Settings },
                        ].map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.name}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Security Statistics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Secure Logs</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {securityStats?.total_secure_logs || 0}
                                            </p>
                                        </div>
                                        <FileText className="w-8 h-8 text-blue-600" />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Anomalies</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {securityStats?.total_anomalies || 0}
                                            </p>
                                        </div>
                                        <AlertTriangle className="w-8 h-8 text-orange-600" />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Unresolved Anomalies</p>
                                            <p className="text-2xl font-bold text-red-600">
                                                {securityStats?.unresolved_anomalies || 0}
                                            </p>
                                        </div>
                                        <XCircle className="w-8 h-8 text-red-600" />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">System Uptime</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {Math.floor((securityStats?.system_uptime || 0) / (1000 * 60 * 60))}h
                                            </p>
                                        </div>
                                        <Clock className="w-8 h-8 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Security Status */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Integrity</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Transaction Chain</span>
                                            <div className="flex items-center space-x-2">
                                                {securityStats?.chain_integrity ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                )}
                                                <span className={`text-sm font-medium ${securityStats?.chain_integrity ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {securityStats?.chain_integrity ? 'Integral' : 'Compromised'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Temporal Consistency</span>
                                            <div className="flex items-center space-x-2">
                                                {securityStats?.time_consistency ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                )}
                                                <span className={`text-sm font-medium ${securityStats?.time_consistency ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {securityStats?.time_consistency ? 'Consistent' : 'Anomalous'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                                    <div className="space-y-3">
                                        {anomalies.slice(0, 5).map((anomaly) => (
                                            <div key={anomaly.id} className="flex items-center space-x-3">
                                                {getSeverityIcon(anomaly.severity)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {anomaly.description}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(anomaly.timestamp).toLocaleString('en-US')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'anomalies' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Detected Anomalies</h2>
                                <button
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['anomalies'] })}
                                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Refresh</span>
                                </button>
                            </div>

                            {anomaliesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {anomalies.map((anomaly) => (
                                        <div
                                            key={anomaly.id}
                                            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        {getSeverityIcon(anomaly.severity)}
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                                                            {anomaly.severity}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(anomaly.timestamp).toLocaleString('en-US')}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                        {anomaly.description}
                                                    </h3>
                                                    <div className="text-sm text-gray-600 mb-4">
                                                        <strong>Type:</strong> {anomaly.anomaly_type}
                                                    </div>
                                                    {anomaly.recommendations.length > 0 && (
                                                        <div className="mb-4">
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h4>
                                                            <ul className="list-disc list-inside space-y-1">
                                                                {anomaly.recommendations.map((rec, index) => (
                                                                    <li key={index} className="text-sm text-gray-600">{rec}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {!anomaly.resolved && (
                                                        <button
                                                            onClick={() => handleResolveAnomaly(anomaly.id)}
                                                            disabled={resolveAnomalyMutation.isPending}
                                                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}
                                                    {anomaly.resolved && (
                                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                                                            Resolved
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {anomalies.length === 0 && (
                                        <div className="text-center py-12">
                                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No anomalies</h3>
                                            <p className="text-gray-500">System is operating normally</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'compliance' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">Regulatory Compliance</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.entries(COUNTRY_COMPLIANCE_CONFIGS).map(([code, config]) => (
                                    <div key={code} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <span className="text-sm font-bold text-blue-600">{code}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{config.country_name}</h3>
                                                <p className="text-sm text-gray-500">{config.tax_name}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Retention:</span>
                                                <span className="font-medium">{config.retention_period_days} days</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Reporting:</span>
                                                <span className="font-medium">{config.submission_frequency}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Signature:</span>
                                                <span className="font-medium">
                                                    {config.digital_signature_required ? 'Required' : 'Optional'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">Security Configuration</h2>

                            {securityConfig && (
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <form className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Chain Validation
                                                </label>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={securityConfig.enable_chain_validation}
                                                        onChange={(e) => saveConfigMutation.mutate({
                                                            ...securityConfig,
                                                            enable_chain_validation: e.target.checked
                                                        })}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">
                                                        Enable chain integrity validation
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Temporal Validation
                                                </label>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={securityConfig.enable_time_validation}
                                                        onChange={(e) => saveConfigMutation.mutate({
                                                            ...securityConfig,
                                                            enable_time_validation: e.target.checked
                                                        })}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">
                                                        Enable temporal consistency validation
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Anomaly Detection
                                                </label>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={securityConfig.enable_anomaly_detection}
                                                        onChange={(e) => saveConfigMutation.mutate({
                                                            ...securityConfig,
                                                            enable_anomaly_detection: e.target.checked
                                                        })}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">
                                                        Enable automatic anomaly detection
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Real-time Monitoring
                                                </label>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={securityConfig.enable_real_time_monitoring}
                                                        onChange={(e) => saveConfigMutation.mutate({
                                                            ...securityConfig,
                                                            enable_real_time_monitoring: e.target.checked
                                                        })}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600">
                                                        Enable continuous monitoring
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Max Time Drift (seconds)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={securityConfig.max_time_drift}
                                                    onChange={(e) => saveConfigMutation.mutate({
                                                        ...securityConfig,
                                                        max_time_drift: parseInt(e.target.value)
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Suspicious Amount Threshold (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={securityConfig.suspicious_amount_threshold}
                                                    onChange={(e) => saveConfigMutation.mutate({
                                                        ...securityConfig,
                                                        suspicious_amount_threshold: parseFloat(e.target.value)
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
