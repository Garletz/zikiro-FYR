import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoke } from '@tauri-apps/api/core'
import { AlertCircle, CheckCircle, Edit, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { logsService } from '../../shared/services/logsService'
import { LogCategory } from '../../shared/types/logs'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost?: number
  category_id: string
  barcode?: string
  sku?: string
  stock_quantity?: number
  min_stock?: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  description?: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().optional(),
  category_id: z.string().min(1, 'Category is required'),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  stock_quantity: z.number().optional(),
  min_stock: z.number().optional(),
  image_url: z.string().optional(),
  is_active: z.boolean().default(true),
})

type ProductFormData = z.infer<typeof productSchema>

export default function Products() {
  // Debug: trace renders

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null)
  const [showAdvancedFields, setShowAdvancedFields] = useState(false)
  const queryClient = useQueryClient()

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => invoke('get_products'),
    retry: 3,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => invoke('get_categories')
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      cost: undefined,
      category_id: '',
      barcode: '',
      sku: '',
      stock_quantity: undefined,
      min_stock: undefined,
      image_url: '',
      is_active: true,
    },
  })

  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    reset: editReset,
    formState: { errors: editErrors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const result = await invoke('create_product', { request: data }) as Product

      // Log the creation event
      await logsService.logProductEvent(LogCategory.Product, result.id, data.name, 'Creation')

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowAddModal(false)
      reset()
      setShowSuccessMessage('Product created successfully!')
      setTimeout(() => setShowSuccessMessage(null), 3000)
    },
    onError: (error) => {
      setShowErrorMessage('Error creating product: ' + error)
      setTimeout(() => setShowErrorMessage(null), 5000)
    },
  })

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      const result = await invoke('update_product', { id, request: data }) as Product

      // Log the modification event
      await logsService.logProductEvent(LogCategory.Product, id, data.name, 'Modification')

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowEditModal(false)
      setEditingProduct(null)
      editReset()
      setShowSuccessMessage('Product updated successfully!')
      setTimeout(() => setShowSuccessMessage(null), 3000)
    },
    onError: (error) => {
      setShowErrorMessage('Error updating product: ' + error)
      setTimeout(() => setShowErrorMessage(null), 5000)
    },
  })

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get product name before deletion for logs
      const product = products?.find(p => p.id === id)
      const productName = product?.name || 'Unknown product'

      const result = await invoke('delete_product', { id })

      // Log the deletion event
      await logsService.logProductEvent(LogCategory.Product, id, productName, 'Deletion')

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowSuccessMessage('Product deleted successfully!')
      setTimeout(() => setShowSuccessMessage(null), 3000)
    },
    onError: (error) => {
      setShowErrorMessage('Error deleting product: ' + error)
      setTimeout(() => setShowErrorMessage(null), 5000)
    },
  })

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data)
  }

  const onEditSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data })
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    editReset({
      name: product.name,
      description: product.description || '',
      price: product.price,
      cost: product.cost || undefined,
      category_id: product.category_id,
      barcode: product.barcode || '',
      sku: product.sku || '',
      stock_quantity: product.stock_quantity || undefined,
      min_stock: product.min_stock || undefined,
      image_url: product.image_url || '',
      is_active: product.is_active,
    })
    setShowAdvancedFields(false)
    setShowEditModal(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the product "${name}"?`)) {
      deleteProductMutation.mutate(id)
    }
  }

  const handleAddNew = () => {
    reset()
    setShowAdvancedFields(false)
    setShowAddModal(true)
  }

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <p className="text-red-600">Error loading products</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
          <button
            onClick={handleAddNew}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Product
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search a product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts?.map((product) => {
          const category = categories?.find(c => c.id === product.category_id)
          return (
            <div key={product.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                  {category && (
                    <div className="flex items-center mb-2">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{category.name}</span>
                    </div>
                  )}
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-semibold text-primary-600">{product.price.toFixed(2)} €</span>
                </div>
                {product.cost !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cost:</span>
                    <span className="font-medium text-gray-600">{product.cost.toFixed(2)} €</span>
                  </div>
                )}
                {product.stock_quantity !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stock:</span>
                    <span className={`font-medium ${product.min_stock !== undefined && product.stock_quantity <= product.min_stock ? 'text-danger-600' : 'text-success-600'
                      }`}>
                      {product.stock_quantity}
                    </span>
                  </div>
                )}
                {product.barcode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Barcode:</span>
                    <span className="font-mono text-gray-600">{product.barcode}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created on {new Date(product.created_at).toLocaleDateString('en-US')}</span>
                  <span className={`px-2 py-1 rounded-full ${product.is_active
                    ? 'bg-success-100 text-success-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredProducts?.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No products found' : 'No products'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Start by creating your first product'
            }
          </p>
          {!searchTerm && (
            <button onClick={handleAddNew} className="btn btn-primary">
              Create a product
            </button>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Champs obligatoires */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    {...register('name')}
                    className="input"
                    placeholder="Nom du produit"
                  />
                  {errors.name && (
                    <p className="text-danger-600 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie *</label>
                  <select
                    {...register('category_id')}
                    className="input"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories?.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="text-danger-600 text-xs mt-1">{errors.category_id.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Prix *</label>
                    <input
                      {...register('price', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="text-danger-600 text-xs mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Coût</label>
                    <input
                      {...register('cost', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="0.00"
                    />
                    {errors.cost && (
                      <p className="text-danger-600 text-xs mt-1">{errors.cost.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bouton "Voir plus" */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center w-full py-2 border border-primary-200 rounded-lg hover:bg-primary-50"
                >
                  {showAdvancedFields ? 'Masquer les options' : 'Voir plus d\'options'}
                  <svg
                    className={`w-4 h-4 ml-1 transition-transform ${showAdvancedFields ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Champs avancés (cachés par défaut) */}
              {showAdvancedFields && (
                <div className="space-y-3 border-t pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock</label>
                      <input
                        {...register('stock_quantity', { valueAsNumber: true })}
                        type="number"
                        className="input"
                        placeholder="0"
                      />
                      {errors.stock_quantity && (
                        <p className="text-danger-600 text-xs mt-1">{errors.stock_quantity.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Stock minimum</label>
                      <input
                        {...register('min_stock', { valueAsNumber: true })}
                        type="number"
                        className="input"
                        placeholder="0"
                      />
                      {errors.min_stock && (
                        <p className="text-danger-600 text-xs mt-1">{errors.min_stock.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Code-barres</label>
                      <input
                        {...register('barcode')}
                        className="input"
                        placeholder="Code-barres"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">SKU</label>
                      <input
                        {...register('sku')}
                        className="input"
                        placeholder="SKU"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      {...register('description')}
                      className="input"
                      rows={2}
                      placeholder="Description du produit"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">URL de l'image</label>
                    <input
                      {...register('image_url')}
                      className="input"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      {...register('is_active')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm">Produit actif</label>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="flex-1 btn btn-primary disabled:opacity-50 text-sm"
                >
                  {createProductMutation.isPending ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Modifier le Produit</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingProduct(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-4">
              {/* Champs obligatoires */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    {...editRegister('name')}
                    className="input"
                    placeholder="Nom du produit"
                  />
                  {editErrors.name && (
                    <p className="text-danger-600 text-xs mt-1">{editErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie *</label>
                  <select
                    {...editRegister('category_id')}
                    className="input"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories?.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {editErrors.category_id && (
                    <p className="text-danger-600 text-xs mt-1">{editErrors.category_id.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Prix *</label>
                    <input
                      {...editRegister('price', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="0.00"
                    />
                    {editErrors.price && (
                      <p className="text-danger-600 text-xs mt-1">{editErrors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Coût</label>
                    <input
                      {...editRegister('cost', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="0.00"
                    />
                    {editErrors.cost && (
                      <p className="text-danger-600 text-xs mt-1">{editErrors.cost.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bouton "Voir plus" */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center w-full py-2 border border-primary-200 rounded-lg hover:bg-primary-50"
                >
                  {showAdvancedFields ? 'Masquer les options' : 'Voir plus d\'options'}
                  <svg
                    className={`w-4 h-4 ml-1 transition-transform ${showAdvancedFields ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Champs avancés (cachés par défaut) */}
              {showAdvancedFields && (
                <div className="space-y-3 border-t pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock</label>
                      <input
                        {...editRegister('stock_quantity', { valueAsNumber: true })}
                        type="number"
                        className="input"
                        placeholder="0"
                      />
                      {editErrors.stock_quantity && (
                        <p className="text-danger-600 text-xs mt-1">{editErrors.stock_quantity.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Stock minimum</label>
                      <input
                        {...editRegister('min_stock', { valueAsNumber: true })}
                        type="number"
                        className="input"
                        placeholder="0"
                      />
                      {editErrors.min_stock && (
                        <p className="text-danger-600 text-xs mt-1">{editErrors.min_stock.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Code-barres</label>
                      <input
                        {...editRegister('barcode')}
                        className="input"
                        placeholder="Code-barres"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">SKU</label>
                      <input
                        {...editRegister('sku')}
                        className="input"
                        placeholder="SKU"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      {...editRegister('description')}
                      className="input"
                      rows={2}
                      placeholder="Description du produit"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">URL de l'image</label>
                    <input
                      {...editRegister('image_url')}
                      className="input"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      {...editRegister('is_active')}
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm">Produit actif</label>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingProduct(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateProductMutation.isPending}
                  className="flex-1 btn btn-primary disabled:opacity-50 text-sm"
                >
                  {updateProductMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
