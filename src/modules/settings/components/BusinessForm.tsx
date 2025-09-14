import { AlertCircle, Building, CheckCircle, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BusinessService } from '../../../shared/services/businessService';

interface BusinessInfo {
    business_name: string;
    business_address: string;
    business_phone: string;
    business_email: string;
    business_website?: string;
    business_logo?: string;
    business_description?: string;
}

interface BusinessFormProps {
    onSave?: () => void;
}

export const BusinessForm: React.FC<BusinessFormProps> = ({ onSave }) => {
    const [formData, setFormData] = useState<BusinessInfo>({
        business_name: '',
        business_address: '',
        business_phone: '',
        business_email: '',
        business_website: '',
        business_logo: '',
        business_description: '',
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Load data on component mount
    useEffect(() => {
        loadBusinessInfo();
    }, []);

    const loadBusinessInfo = async () => {
        setIsLoading(true);
        try {
            console.log('Loading business info...');
            const data = await BusinessService.getBusinessInfo();
            console.log('Loaded business info:', data);

            setFormData({
                business_name: data.business_name || '',
                business_address: data.business_address || '',
                business_phone: data.business_phone || '',
                business_email: data.business_email || '',
                business_website: data.business_website || '',
                business_logo: data.business_logo || '',
                business_description: data.business_description || '',
            });
        } catch (error) {
            console.error('Error loading business info:', error);
            setErrorMessage('Failed to load business information');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof BusinessInfo, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Reset save status when user makes changes
        if (saveStatus !== 'idle') {
            setSaveStatus('idle');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        setErrorMessage('');

        try {
            console.log('Saving business info:', formData);
            await BusinessService.saveBusinessInfo(formData);
            console.log('Business info saved successfully');

            setSaveStatus('success');
            onSave?.();

            // Auto-hide success message after 3 seconds
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Error saving business info:', error);
            setSaveStatus('error');
            setErrorMessage('Failed to save business information');
        } finally {
            setIsSaving(false);
        }
    };

    const isFormEmpty = !formData.business_name && !formData.business_email && !formData.business_phone;
    const hasChanges = formData.business_name || formData.business_email || formData.business_phone;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading business information...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Building className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                    {!isLoading && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${hasChanges
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                            }`}>
                            {hasChanges ? '✓ Configured' : 'Empty'}
                        </div>
                    )}
                </div>
            </div>

            {/* Form */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Name */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name *
                        </label>
                        <input
                            type="text"
                            value={formData.business_name}
                            onChange={(e) => handleInputChange('business_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your business name"
                        />
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Address
                        </label>
                        <textarea
                            value={formData.business_address}
                            onChange={(e) => handleInputChange('business_address', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your business address (with Google Maps link if needed)"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.business_phone}
                            onChange={(e) => handleInputChange('business_phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+33 1 23 45 67 89"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.business_email}
                            onChange={(e) => handleInputChange('business_email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="contact@business.com"
                        />
                    </div>


                </div>

                {/* Save Button and Status */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                        {saveStatus === 'success' && (
                            <div className="flex items-center text-green-600">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                <span className="text-sm font-medium">Saved successfully!</span>
                            </div>
                        )}
                        {saveStatus === 'error' && (
                            <div className="flex items-center text-red-600">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                <span className="text-sm font-medium">{errorMessage}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || isFormEmpty}
                        className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Business Information
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
