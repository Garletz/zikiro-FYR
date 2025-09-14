import {
    CheckCircle,
    Clock,
    Filter,
    Globe,
    History,
    MessageSquare,
    MoreVertical,
    Phone,
    Plus,
    Search,
    Send,
    Settings,
    Users,
    WifiOff,
    XCircle
} from 'lucide-react'
import { useState } from 'react'
import { ConnectSettings } from './components/ConnectSettings'
import ContactsManager from './components/ContactsManager'
import { useSMS } from './hooks/useSMS'
import { SMSContact } from './types'
import { normalizePhoneNumber } from './utils/phoneNormalization'

type TabType = 'compose' | 'contacts' | 'history' | 'templates' | 'connect-settings'

export default function SMSTicket() {
    const [activeTab, setActiveTab] = useState<TabType>('compose')
    const [message, setMessage] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState('')
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [templateForm, setTemplateForm] = useState({
        name: '',
        content: '',
        category: 'general'
    })

    const {
        messages,
        templates,
        sendSMS,
        isSendingSMS,
        getActiveTemplates,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        // New provider configurations
        providerSelection,
        smsGatewayConfig,
        infobipConfig,
        sim800900Config,
        updateProviderSelection,
        updateSMSGateway,
        testSMSGateway,
        updateInfobip,
        testInfobip,
        updateSIM800900,
        scanPorts,
        isUpdatingProviderSelection,
        isUpdatingSMSGateway,
        isUpdatingInfobip,
        isUpdatingSIM800900
    } = useSMS()

    const handleSendSMS = async () => {
        if (!phoneNumber || !message) return

        try {
            // Normaliser le numéro de téléphone avant l'envoi
            const normalizedPhone = normalizePhoneNumber(phoneNumber)

            console.log('Compose SMS - Sending SMS:', {
                originalPhone: phoneNumber,
                normalizedPhone,
                message,
                template_id: selectedTemplate
            })

            await sendSMS({
                phone_number: normalizedPhone,
                message,
                template_id: selectedTemplate || undefined
            })

            console.log('Compose SMS - SMS sent successfully')

            // Clear form
            setMessage('')
            setPhoneNumber('')
            setSelectedTemplate('')
        } catch (error) {
            console.error('Compose SMS - Error sending SMS:', error)
        }
    }

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId)
        const template = getActiveTemplates().find(t => t.id === templateId)
        if (template) {
            setMessage(template.content)
        }
    }

    const handleContactSelect = (contact: SMSContact) => {
        setPhoneNumber(contact.phone_number)
        setActiveTab('compose')
    }

    const handleNewTemplate = () => {
        setEditingTemplate(null)
        setTemplateForm({ name: '', content: '', category: 'general' })
        setShowTemplateModal(true)
    }

    const handleEditTemplate = (template: any) => {
        setEditingTemplate(template)
        setTemplateForm({
            name: template.name,
            content: template.content,
            category: template.category
        })
        setShowTemplateModal(true)
    }

    const handleSaveTemplate = async () => {
        if (!templateForm.name || !templateForm.content) return

        try {
            if (editingTemplate) {
                await updateTemplate({ id: editingTemplate.id, template: templateForm })
            } else {
                await createTemplate(templateForm)
            }
            setShowTemplateModal(false)
            setTemplateForm({ name: '', content: '', category: 'general' })
        } catch (error) {
            console.error('Error saving template:', error)
        }
    }

    const handleDeleteTemplate = async (templateId: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                await deleteTemplate(templateId)
            } catch (error) {
                console.error('Error deleting template:', error)
            }
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return <CheckCircle className="text-green-500" size={16} />
            case 'failed':
                return <XCircle className="text-red-500" size={16} />
            default:
                return <Clock className="text-yellow-500" size={16} />
        }
    }

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'sms_gateway_android':
                return <Phone className="text-green-500" size={16} />
            case 'infobip':
                return <Globe className="text-blue-500" size={16} />
            case 'sim800_900':
                return <Phone className="text-purple-500" size={16} />
            case 'none':
                return <WifiOff className="text-gray-500" size={16} />
            default:
                return <WifiOff className="text-gray-500" size={16} />
        }
    }

    return (
        <div className="h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="text-blue-600" size={32} />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">SMS Ticket</h1>
                            <p className="text-gray-600">SMS and notifications management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {providerSelection && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                                {getProviderIcon(providerSelection.default_provider)}
                                <span className="text-sm text-gray-600">
                                    {providerSelection.default_provider !== 'none' ? 'Active' : 'Simulation Mode'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <nav className="flex space-x-8">
                    {[
                        { id: 'compose', label: 'Compose', icon: Send },
                        { id: 'contacts', label: 'Contacts', icon: Users },
                        { id: 'history', label: 'History', icon: History },
                        { id: 'templates', label: 'Templates', icon: MessageSquare },
                        { id: 'connect-settings', label: 'Connect Settings', icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="p-6">
                {activeTab === 'compose' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold mb-6">Compose SMS</h2>

                            <div className="space-y-6">
                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="tel"
                                            placeholder="+33 6 12 34 56 78"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Template Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Message template
                                    </label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => handleTemplateSelect(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select a template</option>
                                        {getActiveTemplates().map(template => (
                                            <option key={template.id} value={template.id}>
                                                {template.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your message here..."
                                        rows={6}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="text-sm text-gray-500">
                                            {message.length}/160 characters
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {Math.ceil(message.length / 160)} SMS
                                        </div>
                                    </div>
                                </div>

                                {/* Send Button */}
                                <button
                                    onClick={handleSendSMS}
                                    disabled={!phoneNumber || !message || isSendingSMS}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={20} />
                                    {isSendingSMS ? 'Sending...' : 'Send SMS'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'contacts' && (
                    <ContactsManager onContactSelect={handleContactSelect} />
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">SMS History</h2>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                        <Filter size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {messages.map((msg) => (
                                <div key={msg.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium text-gray-900">{msg.phone_number}</span>
                                                {getStatusIcon(msg.status)}
                                                {getProviderIcon(msg.provider)}
                                                <span className="text-sm text-gray-500">
                                                    {new Date(msg.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 mb-2">{msg.message}</p>
                                            {msg.customer_name && (
                                                <span className="text-sm text-gray-500">
                                                    Customer: {msg.customer_name}
                                                </span>
                                            )}
                                        </div>
                                        <button className="p-1 hover:bg-gray-100 rounded">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">SMS Templates</h2>
                                <button
                                    onClick={handleNewTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={16} />
                                    New template
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {templates.map((template) => (
                                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-medium text-gray-900">{template.name}</h3>
                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                {template.category}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{template.content}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {template.variables?.length || 0} variables
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleTemplateSelect(template.id)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    Use
                                                </button>
                                                <button
                                                    onClick={() => handleEditTemplate(template)}
                                                    className="text-green-600 hover:text-green-800 text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'connect-settings' && (
                    <ConnectSettings
                        onSaveProviderSelection={async (selection) => {
                            await updateProviderSelection(selection)
                        }}
                        onSaveSMSGateway={async (config) => {
                            await updateSMSGateway(config)
                        }}
                        onTestSMSGateway={testSMSGateway}
                        onSaveInfobip={async (config) => {
                            await updateInfobip(config)
                        }}
                        onTestInfobip={testInfobip}
                        onSaveSIM800900={async (config) => {
                            await updateSIM800900(config)
                        }}
                        onScanPorts={scanPorts}
                        providerSelection={providerSelection}
                        smsGatewayConfig={smsGatewayConfig}
                        infobipConfig={infobipConfig}
                        sim800900Config={sim800900Config}
                        isLoading={isUpdatingProviderSelection || isUpdatingSMSGateway || isUpdatingInfobip || isUpdatingSIM800900}
                    />
                )}
            </div>

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingTemplate ? 'Edit Template' : 'New Template'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Template Name
                                </label>
                                <input
                                    type="text"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter template name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={templateForm.category}
                                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="general">General</option>
                                    <option value="order">Order</option>
                                    <option value="payment">Payment</option>
                                    <option value="table">Table</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message Content
                                </label>
                                <textarea
                                    value={templateForm.content}
                                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Enter your message template. Use {variable_name} for dynamic content."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use variables like {`{order_number}`}, {`{total_amount}`}, {`{table_number}`}, {`{business_name}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                disabled={!templateForm.name || !templateForm.content}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {editingTemplate ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
