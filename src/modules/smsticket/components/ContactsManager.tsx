import {
    Building,
    Check,
    Download,
    Edit,
    Mail,
    Phone,
    Plus,
    Search,
    Tag,
    Trash2,
    Upload
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useSMS } from '../hooks/useSMS'
import { SMSContact } from '../types'

interface ContactsManagerProps {
    onContactSelect?: (contact: SMSContact) => void
}

export default function ContactsManager({ onContactSelect }: ContactsManagerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingContact, setEditingContact] = useState<SMSContact | null>(null)
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
    const [showBulkActions, setShowBulkActions] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        contacts,
        isLoadingContacts,
        createContact,
        updateContact,
        deleteContact,
        isCreatingContact,
        isUpdatingContact,
    } = useSMS()

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        email: '',
        company: '',
        tags: ''
    })

    // Filter contacts based on search term
    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone_number.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddContact = async () => {
        if (!formData.name || !formData.phone_number) return

        try {
            const tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

            await createContact({
                name: formData.name,
                phone_number: formData.phone_number,
                email: formData.email || undefined,
                company: formData.company || undefined,
                tags
            })

            // Reset form
            setFormData({
                name: '',
                phone_number: '',
                email: '',
                company: '',
                tags: ''
            })
            setShowAddForm(false)
        } catch (error) {
            console.error('Error creating contact:', error)
        }
    }

    const handleEditContact = async () => {
        if (!editingContact || !formData.name || !formData.phone_number) return

        try {
            const tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

            await updateContact({
                id: editingContact.id, contact: {
                    name: formData.name,
                    phone_number: formData.phone_number,
                    email: formData.email || undefined,
                    company: formData.company || undefined,
                    tags
                }
            })

            setEditingContact(null)
            setFormData({
                name: '',
                phone_number: '',
                email: '',
                company: '',
                tags: ''
            })
        } catch (error) {
            console.error('Error updating contact:', error)
        }
    }

    const handleDeleteContact = async (id: string) => {
        if (!confirm('Are you sure you want to delete this contact?')) return

        try {
            await deleteContact(id)
        } catch (error) {
            console.error('Error deleting contact:', error)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedContacts.size === 0) return
        if (!confirm(`Are you sure you want to delete ${selectedContacts.size} contacts?`)) return

        try {
            for (const id of selectedContacts) {
                await deleteContact(id)
            }
            setSelectedContacts(new Set())
            setShowBulkActions(false)
        } catch (error) {
            console.error('Error deleting contacts:', error)
        }
    }

    const handleContactSelect = (contact: SMSContact) => {
        if (onContactSelect) {
            onContactSelect(contact)
        }
    }

    const startEdit = (contact: SMSContact) => {
        setEditingContact(contact)
        setFormData({
            name: contact.name,
            phone_number: contact.phone_number,
            email: contact.email || '',
            company: contact.company || '',
            tags: contact.tags?.join(', ') || ''
        })
    }

    const cancelEdit = () => {
        setEditingContact(null)
        setFormData({
            name: '',
            phone_number: '',
            email: '',
            company: '',
            tags: ''
        })
    }

    const toggleContactSelection = (id: string) => {
        const newSelected = new Set(selectedContacts)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedContacts(newSelected)
        setShowBulkActions(newSelected.size > 0)
    }

    const selectAllContacts = () => {
        if (selectedContacts.size === filteredContacts.length) {
            setSelectedContacts(new Set())
            setShowBulkActions(false)
        } else {
            setSelectedContacts(new Set(filteredContacts.map(c => c.id)))
            setShowBulkActions(true)
        }
    }

    const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            const text = await file.text()
            const lines = text.split('\n').filter(line => line.trim())
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

            // Expected headers: name, phone_number, email, company, tags
            const nameIndex = headers.indexOf('name')
            const phoneIndex = headers.indexOf('phone_number')
            const emailIndex = headers.indexOf('email')
            const companyIndex = headers.indexOf('company')
            const tagsIndex = headers.indexOf('tags')

            if (nameIndex === -1 || phoneIndex === -1) {
                alert('CSV must contain "name" and "phone_number" columns')
                return
            }

            let imported = 0
            let errors = 0

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim())

                try {
                    const tags = values[tagsIndex] ? values[tagsIndex].split(';').map(t => t.trim()) : []

                    await createContact({
                        name: values[nameIndex],
                        phone_number: values[phoneIndex],
                        email: values[emailIndex] || undefined,
                        company: values[companyIndex] || undefined,
                        tags
                    })
                    imported++
                } catch (error) {
                    console.error(`Error importing contact ${i}:`, error)
                    errors++
                }
            }

            alert(`Import completed: ${imported} contacts imported, ${errors} errors`)
        } catch (error) {
            console.error('Error importing CSV:', error)
            alert('Error importing CSV file')
        }
    }

    const handleCSVExport = () => {
        const headers = ['name', 'phone_number', 'email', 'company', 'tags']
        const csvContent = [
            headers.join(','),
            ...contacts.map(contact => [
                `"${contact.name}"`,
                `"${contact.phone_number}"`,
                `"${contact.email || ''}"`,
                `"${contact.company || ''}"`,
                `"${contact.tags?.join(';') || ''}"`
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sms_contacts_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    if (isLoadingContacts) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading contacts...</div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Contacts</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCSVExport}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Upload size={16} />
                            Import CSV
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={16} />
                            Add Contact
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Bulk Actions */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    {showBulkActions && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {selectedContacts.size} selected
                            </span>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                                <Trash2 size={16} />
                                Delete Selected
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Contacts List */}
            <div className="divide-y divide-gray-200">
                {filteredContacts.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                        <Phone size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No contacts found</p>
                        <p className="text-sm">
                            {searchTerm ? 'Try adjusting your search terms' : 'Add your first contact to get started'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Select All */}
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                                    onChange={selectAllContacts}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-600">
                                    Select all ({filteredContacts.length} contacts)
                                </span>
                            </label>
                        </div>

                        {filteredContacts.map((contact) => (
                            <div key={contact.id} className="p-6 hover:bg-gray-50">
                                <div className="flex items-start gap-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedContacts.has(contact.id)}
                                        onChange={() => toggleContactSelection(contact.id)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                                    />

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-medium text-gray-900">{contact.name}</h3>
                                                    {!contact.is_active && (
                                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={14} />
                                                        <span>{contact.phone_number}</span>
                                                    </div>

                                                    {contact.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail size={14} />
                                                            <span>{contact.email}</span>
                                                        </div>
                                                    )}

                                                    {contact.company && (
                                                        <div className="flex items-center gap-2">
                                                            <Building size={14} />
                                                            <span>{contact.company}</span>
                                                        </div>
                                                    )}

                                                    {contact.tags && contact.tags.length > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <Tag size={14} />
                                                            <div className="flex gap-1">
                                                                {contact.tags.map((tag, index) => (
                                                                    <span key={index} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleContactSelect(contact)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Select contact"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => startEdit(contact)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Edit contact"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteContact(contact.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete contact"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {/* Add/Edit Form Modal */}
            {(showAddForm || editingContact) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingContact ? 'Edit Contact' : 'Add New Contact'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Contact name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+33 6 12 34 56 78"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="contact@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Company
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Company name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="VIP, Regular, etc. (comma separated)"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-6">
                                <button
                                    onClick={editingContact ? cancelEdit : () => setShowAddForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editingContact ? handleEditContact : handleAddContact}
                                    disabled={!formData.name || !formData.phone_number || isCreatingContact || isUpdatingContact}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isCreatingContact || isUpdatingContact ? 'Saving...' : (editingContact ? 'Update' : 'Add')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden file input for CSV import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
            />
        </div>
    )
}
