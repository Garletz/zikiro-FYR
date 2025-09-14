import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { AlertCircle, CheckCircle, Edit, Plus, Tags, Trash2 } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useTaxSettings } from '../../shared/hooks/useTaxSettings'

interface Category {
  id: string
  name: string
  description?: string
  color: string
  tax_rate_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
  tax_rate_id: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

export default function Categories() {
  // Debug: trace renders

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Refs to synchronize color fields
  const addColorPickerRef = useRef<HTMLInputElement>(null)
  const addColorInputRef = useRef<HTMLInputElement>(null)
  const editColorPickerRef = useRef<HTMLInputElement>(null)
  const editColorInputRef = useRef<HTMLInputElement>(null)

  // Tax rate options based on settings
  const { currentConfig } = useTaxSettings()

  const taxRateOptions = currentConfig.tax_rates.map(rate => ({
    value: rate.id,
    label: `${rate.name} (${rate.rate}%)`,
    description: rate.description || '',
    isDefault: rate.is_default
  }))

  // Find default rate for current country
  const defaultTaxRate = currentConfig.tax_rates.find(rate => rate.is_default)?.id || currentConfig.tax_rates[0]?.id

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => invoke('get_categories'),
    retry: 3,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#3B82F6',
      tax_rate_id: defaultTaxRate,
    },
  })

  // Force form update when country changes
  React.useEffect(() => {
    if (defaultTaxRate) {
      reset({
        name: '',
        description: '',
        color: '#3B82F6',
        tax_rate_id: defaultTaxRate,
      })
    }
  }, [defaultTaxRate, reset])

  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    reset: editReset,
    setValue: editSetValue,
    formState: { errors: editErrors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  })

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => invoke('create_category', { request: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowAddModal(false)
      reset()
      setShowSuccessMessage('Category created successfully!')
      setTimeout(() => setShowSuccessMessage(null), 3000)
    },
    onError: (error) => {
      setShowErrorMessage('Error creating category: ' + error)
      setTimeout(() => setShowErrorMessage(null), 5000)
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      invoke('update_category', { id, request: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowEditModal(false)
      setEditingCategory(null)
      editReset()
      setShowSuccessMessage('Category updated successfully!')
      setTimeout(() => setShowSuccessMessage(null), 3000)
    },
    onError: (error) => {
      setShowErrorMessage('Error updating category: ' + error)
      setTimeout(() => setShowErrorMessage(null), 5000)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => invoke('delete_category', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowSuccessMessage('Category deleted successfully!')
      setTimeout(() => setShowSuccessMessage(null), 3000)
    },
    onError: (error) => {
      setShowErrorMessage('Error deleting category: ' + error)
      setTimeout(() => setShowErrorMessage(null), 5000)
    },
  })

  const onSubmit = (data: CategoryFormData) => {
    createCategoryMutation.mutate(data)
  }

  const onEditSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data })
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    editReset({
      name: category.name,
      description: category.description || '',
      color: category.color,
      tax_rate_id: category.tax_rate_id || defaultTaxRate,
    })
    setShowEditModal(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}" ?`)) {
      deleteCategoryMutation.mutate(id)
    }
  }

  const handleAddNew = () => {
    reset()
    setShowAddModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading categories</p>
          <p className="text-sm text-gray-500 mt-2">{String(error)}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600">Manage your product categories</p>
          </div>
          <button
            onClick={handleAddNew}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-success-600 mr-3" />
          <span className="text-success-800">{showSuccessMessage}</span>
        </div>
      )}

      {showErrorMessage && (
        <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-danger-600 mr-3" />
          <span className="text-danger-800">{showErrorMessage}</span>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <div key={category.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: category.color }}
                ></div>
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {category.description && (
              <p className="text-gray-600 mb-4">{category.description}</p>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Tax: <span className="font-semibold text-gray-700">
                  {(() => {
                    const taxRate = currentConfig.tax_rates.find(r => r.id === category.tax_rate_id)
                    return taxRate ? `${taxRate.name} (${taxRate.rate}%)` : 'Not defined'
                  })()}
                </span></span>
                <span>Created on {new Date(category.created_at).toLocaleDateString('en-US')}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${category.is_active
                ? 'bg-success-100 text-success-800'
                : 'bg-gray-100 text-gray-800'
                }`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {categories?.length === 0 && (
        <div className="text-center py-12">
          <Tags className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories</h3>
          <p className="text-gray-500 mb-4">Start by creating your first category</p>
          <button onClick={handleAddNew} className="btn btn-primary">
            Create a category
          </button>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">New Category</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  {...register('name')}
                  className="input"
                  placeholder="Category name"
                />
                {errors.name && (
                  <p className="text-danger-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  {...register('description')}
                  className="input"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color *</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    defaultValue="#3B82F6"
                    onChange={(e) => {
                      setValue('color', e.target.value)
                      if (addColorInputRef.current) {
                        addColorInputRef.current.value = e.target.value
                      }
                    }}
                  />
                  <input
                    {...register('color', { required: 'Color is required' })}
                    ref={addColorInputRef}
                    className="input flex-1"
                    placeholder="#3B82F6"
                    defaultValue="#3B82F6"
                    onChange={(e) => {
                      if (addColorPickerRef.current) {
                        addColorPickerRef.current.value = e.target.value
                      }
                    }}
                  />
                </div>
                {errors.color && (
                  <p className="text-danger-600 text-sm mt-1">{errors.color.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax Rate</label>
                <select
                  {...register('tax_rate_id')}
                  className="input"
                >
                  {taxRateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.isDefault && '(Default)'}
                    </option>
                  ))}
                </select>
                {errors.tax_rate_id && (
                  <p className="text-danger-600 text-sm mt-1">{errors.tax_rate_id.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  {createCategoryMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Category</h3>

            <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  {...editRegister('name')}
                  className="input"
                  placeholder="Category name"
                />
                {editErrors.name && (
                  <p className="text-danger-600 text-sm mt-1">{editErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  {...editRegister('description')}
                  className="input"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color *</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    defaultValue={editingCategory?.color || "#3B82F6"}
                    onChange={(e) => {
                      editSetValue('color', e.target.value)
                      if (editColorInputRef.current) {
                        editColorInputRef.current.value = e.target.value
                      }
                    }}
                  />
                  <input
                    {...editRegister('color', { required: 'Color is required' })}
                    ref={editColorInputRef}
                    className="input flex-1"
                    placeholder="#3B82F6"
                    defaultValue={editingCategory?.color || "#3B82F6"}
                    onChange={(e) => {
                      if (editColorPickerRef.current) {
                        editColorPickerRef.current.value = e.target.value
                      }
                    }}
                  />
                </div>
                {editErrors.color && (
                  <p className="text-danger-600 text-sm mt-1">{editErrors.color.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax Rate</label>
                <select
                  {...editRegister('tax_rate_id')}
                  className="input"
                >
                  {taxRateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.isDefault && '(Default)'}
                    </option>
                  ))}
                </select>
                {editErrors.tax_rate_id && (
                  <p className="text-danger-600 text-sm mt-1">{editErrors.tax_rate_id.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingCategory(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateCategoryMutation.isPending}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  {updateCategoryMutation.isPending ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

