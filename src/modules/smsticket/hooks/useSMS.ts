import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { smsTicketService } from '../services/smsTicketService'

export const useSMS = () => {
    const queryClient = useQueryClient()

    // SMS Messages
    const {
        data: messages = [],
        isLoading: isLoadingMessages,
        error: messagesError
    } = useQuery({
        queryKey: ['sms-messages'],
        queryFn: () => smsTicketService.getSMSMessages(50)
    })

    const sendSMSMutation = useMutation({
        mutationFn: smsTicketService.sendSMS,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-messages'] })
        }
    })

    // SMS Templates
    const {
        data: templates = [],
        isLoading: isLoadingTemplates,
        error: templatesError
    } = useQuery({
        queryKey: ['sms-templates'],
        queryFn: smsTicketService.getSMSTemplates
    })

    const createTemplateMutation = useMutation({
        mutationFn: smsTicketService.createSMSTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
        }
    })

    const updateTemplateMutation = useMutation({
        mutationFn: ({ id, template }: { id: string; template: any }) =>
            smsTicketService.updateSMSTemplate(id, template),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
        }
    })

    const deleteTemplateMutation = useMutation({
        mutationFn: smsTicketService.deleteSMSTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
        }
    })

    // SMS Contacts
    const {
        data: contacts = [],
        isLoading: isLoadingContacts,
        error: contactsError
    } = useQuery({
        queryKey: ['sms-contacts'],
        queryFn: smsTicketService.getSMSContacts
    })

    const createContactMutation = useMutation({
        mutationFn: smsTicketService.createSMSContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-contacts'] })
        }
    })

    const updateContactMutation = useMutation({
        mutationFn: ({ id, contact }: { id: string; contact: any }) =>
            smsTicketService.updateSMSContact(id, contact),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-contacts'] })
        }
    })

    const deleteContactMutation = useMutation({
        mutationFn: smsTicketService.deleteSMSContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-contacts'] })
        }
    })

    // SMS Configuration
    const {
        data: config,
        isLoading: isLoadingConfig,
        error: configError
    } = useQuery({
        queryKey: ['sms-config'],
        queryFn: smsTicketService.getSMSConfig
    })

    const updateConfigMutation = useMutation({
        mutationFn: smsTicketService.updateSMSConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-config'] })
        }
    })

    // Provider Selection
    const {
        data: providerSelection,
        isLoading: isLoadingProviderSelection,
        error: providerSelectionError
    } = useQuery({
        queryKey: ['provider-selection'],
        queryFn: smsTicketService.getProviderSelection
    })

    const updateProviderSelectionMutation = useMutation({
        mutationFn: smsTicketService.updateProviderSelection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-selection'] })
        }
    })

    // SMS Gateway Android Configuration
    const {
        data: smsGatewayConfig,
        isLoading: isLoadingSMSGateway,
        error: smsGatewayError
    } = useQuery({
        queryKey: ['sms-gateway-config'],
        queryFn: smsTicketService.getSMSGatewayAndroidConfig
    })

    const updateSMSGatewayMutation = useMutation({
        mutationFn: smsTicketService.updateSMSGatewayAndroidConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sms-gateway-config'] })
        }
    })

    const testSMSGatewayMutation = useMutation({
        mutationFn: smsTicketService.testSMSGatewayAndroidConnection
    })

    // Infobip Configuration
    const {
        data: infobipConfig,
        isLoading: isLoadingInfobip,
        error: infobipError
    } = useQuery({
        queryKey: ['infobip-config'],
        queryFn: smsTicketService.getInfobipConfig
    })

    const updateInfobipMutation = useMutation({
        mutationFn: smsTicketService.updateInfobipConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['infobip-config'] })
        }
    })

    const testInfobipMutation = useMutation({
        mutationFn: smsTicketService.testInfobipConnection
    })

    // SIM 800/900 Configuration
    const {
        data: sim800900Config,
        isLoading: isLoadingSIM800900,
        error: sim800900Error
    } = useQuery({
        queryKey: ['sim800-900-config'],
        queryFn: smsTicketService.getSIM800900Config
    })

    const updateSIM800900Mutation = useMutation({
        mutationFn: smsTicketService.updateSIM800900Config,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sim800-900-config'] })
        }
    })

    const scanPortsMutation = useMutation({
        mutationFn: smsTicketService.scanSerialPorts
    })

    // Helper functions
    const sendTicketNotification = async (ticketId: string, customerPhone: string, message: string) => {
        return smsTicketService.sendTicketNotification(ticketId, customerPhone, message)
    }

    const sendOrderNotification = async (orderId: string, tableId: string, customerPhone: string, message: string) => {
        return smsTicketService.sendOrderNotification(orderId, tableId, customerPhone, message)
    }

    const getMessagesByPhone = (phoneNumber: string) => {
        return messages.filter(msg => msg.phone_number === phoneNumber)
    }

    const getTemplatesByCategory = (category: string) => {
        return templates.filter(template => template.category === category)
    }

    const getActiveTemplates = () => {
        return templates.filter(template => template.is_active)
    }

    return {
        // Messages
        messages,
        isLoadingMessages,
        messagesError,
        sendSMS: sendSMSMutation.mutateAsync,
        isSendingSMS: sendSMSMutation.isPending,

        // Templates
        templates,
        isLoadingTemplates,
        templatesError,
        createTemplate: createTemplateMutation.mutateAsync,
        updateTemplate: updateTemplateMutation.mutateAsync,
        deleteTemplate: deleteTemplateMutation.mutateAsync,
        isCreatingTemplate: createTemplateMutation.isPending,
        isUpdatingTemplate: updateTemplateMutation.isPending,
        isDeletingTemplate: deleteTemplateMutation.isPending,

        // Contacts
        contacts,
        isLoadingContacts,
        contactsError,
        createContact: createContactMutation.mutateAsync,
        updateContact: updateContactMutation.mutateAsync,
        deleteContact: deleteContactMutation.mutateAsync,
        isCreatingContact: createContactMutation.isPending,
        isUpdatingContact: updateContactMutation.isPending,
        isDeletingContact: deleteContactMutation.isPending,

        // Configuration
        config,
        isLoadingConfig,
        configError,
        updateConfig: updateConfigMutation.mutateAsync,
        isUpdatingConfig: updateConfigMutation.isPending,

        // Provider Selection
        providerSelection,
        isLoadingProviderSelection,
        providerSelectionError,
        updateProviderSelection: updateProviderSelectionMutation.mutateAsync,
        isUpdatingProviderSelection: updateProviderSelectionMutation.isPending,

        // SMS Gateway Android
        smsGatewayConfig,
        isLoadingSMSGateway,
        smsGatewayError,
        updateSMSGateway: updateSMSGatewayMutation.mutateAsync,
        testSMSGateway: testSMSGatewayMutation.mutateAsync,
        isUpdatingSMSGateway: updateSMSGatewayMutation.isPending,
        isTestingSMSGateway: testSMSGatewayMutation.isPending,

        // Infobip
        infobipConfig,
        isLoadingInfobip,
        infobipError,
        updateInfobip: updateInfobipMutation.mutateAsync,
        testInfobip: testInfobipMutation.mutateAsync,
        isUpdatingInfobip: updateInfobipMutation.isPending,
        isTestingInfobip: testInfobipMutation.isPending,

        // SIM 800/900
        sim800900Config,
        isLoadingSIM800900,
        sim800900Error,
        updateSIM800900: updateSIM800900Mutation.mutateAsync,
        scanPorts: scanPortsMutation.mutateAsync,
        isUpdatingSIM800900: updateSIM800900Mutation.isPending,
        isScanningPorts: scanPortsMutation.isPending,

        // Helper functions
        sendTicketNotification,
        sendOrderNotification,
        getMessagesByPhone,
        getTemplatesByCategory,
        getActiveTemplates
    }
}
