import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useActiveTabState } from '../../../shared/hooks/useTabState'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { Product } from '../../../shared/types/app'
import { Category } from '../services/categoriesService'
import { tablesService } from '../services/tablesService'
import { CartItem, CartItemDisplay, LocalCart } from '../types'

export const useCart = (selectedTable: any, products: Product[], categories: Category[]) => {
  const queryClient = useQueryClient()
  const { calculateTax } = useTaxSettings()

  const [localCart, setLocalCart] = useActiveTabState<LocalCart>(
    'localCart',
    { items: [], total_amount: 0 },
    true
  )

  // Mutations pour le panier de table
  const addToCartMutation = useMutation({
    mutationFn: ({ table_id, product }: { table_id: string; product: Product }) => {
      return tablesService.addItemToCart(table_id, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price
      })
    },
    onSuccess: () => {
      if (selectedTable) {
        queryClient.invalidateQueries({ queryKey: ['table-cart', selectedTable.id] })
      }
    },
  })

  const updateCartItemMutation = useMutation({
    mutationFn: ({ table_id, product_id, quantity }: { table_id: string; product_id: string; quantity: number }) =>
      tablesService.updateCartItem(table_id, product_id, { quantity }),
    onSuccess: () => {
      if (selectedTable) {
        queryClient.invalidateQueries({ queryKey: ['table-cart', selectedTable.id] })
      }
    },
  })

  const removeFromCartMutation = useMutation({
    mutationFn: ({ table_id, product_id }: { table_id: string; product_id: string }) =>
      tablesService.removeItemFromCart(table_id, product_id),
    onSuccess: () => {
      if (selectedTable) {
        queryClient.invalidateQueries({ queryKey: ['table-cart', selectedTable.id] })
      }
    },
  })

  const clearCartMutation = useMutation({
    mutationFn: (table_id: string) => tablesService.clearTableCart(table_id),
    onSuccess: () => {
      if (selectedTable) {
        queryClient.invalidateQueries({ queryKey: ['table-cart', selectedTable.id] })
      }
    },
  })

  // Fonctions pour le panier local
  const addToLocalCart = (product: Product) => {
    setLocalCart((prevCart: LocalCart) => {
      const existingItem = prevCart.items.find((item: CartItem) => item.product_id === product.id)

      if (existingItem) {
        const updatedItems = prevCart.items.map((item: CartItem) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
            : item
        )
        const total_amount = updatedItems.reduce((sum: number, item: CartItem) => sum + item.total_price, 0)
        return { items: updatedItems, total_amount }
      } else {
        const newItem: CartItem = {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.price,
          total_price: product.price
        }
        const updatedItems = [...prevCart.items, newItem]
        const total_amount = updatedItems.reduce((sum: number, item: CartItem) => sum + item.total_price, 0)
        return { items: updatedItems, total_amount }
      }
    })
  }

  const updateLocalCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromLocalCart(productId)
      return
    }

    setLocalCart((prevCart: LocalCart) => {
      const updatedItems = prevCart.items.map((item: CartItem) =>
        item.product_id === productId
          ? { ...item, quantity, total_price: quantity * item.unit_price }
          : item
      )
      const total_amount = updatedItems.reduce((sum: number, item: CartItem) => sum + item.total_price, 0)
      return { items: updatedItems, total_amount }
    })
  }

  const removeFromLocalCart = (productId: string) => {
    setLocalCart((prevCart: LocalCart) => {
      const updatedItems = prevCart.items.filter((item: CartItem) => item.product_id !== productId)
      const total_amount = updatedItems.reduce((sum: number, item: CartItem) => sum + item.total_price, 0)
      return { items: updatedItems, total_amount }
    })
  }

  const clearLocalCart = () => {
    setLocalCart({ items: [], total_amount: 0 })
  }

  // Fonctions combinées
  const addToCart = (product: Product) => {
    if (selectedTable) {
      addToCartMutation.mutate({ table_id: selectedTable.id, product })
    } else {
      addToLocalCart(product)
    }
  }

  const removeFromCart = (productId: string) => {
    if (selectedTable) {
      removeFromCartMutation.mutate({ table_id: selectedTable.id, product_id: productId })
    } else {
      removeFromLocalCart(productId)
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (selectedTable) {
      updateCartItemMutation.mutate({ table_id: selectedTable.id, product_id: productId, quantity })
    } else {
      updateLocalCartQuantity(productId, quantity)
    }
  }

  const clearCart = async () => {
    if (selectedTable) {
      clearCartMutation.mutate(selectedTable.id)
    } else {
      clearLocalCart()
    }
  }

  // Fonction pour enrichir les items du panier avec les données des produits
  const enrichCartItems = (items: CartItem[]): CartItemDisplay[] => {
    return items.map(item => {
      const product = products.find(p => p.id === item.product_id)
      const taxAmount = calculateTax(item.total_price, product?.category_id, categories)

      return {
        ...item,
        product: product ? {
          id: product.id,
          name: product.name,
          category_id: product.category_id,
          category_name: (product as any).category_name || '',
          price: product.price
        } : undefined,
        tax_amount: taxAmount,
        total_with_tax: item.total_price + taxAmount
      }
    })
  }

  return {
    localCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    enrichCartItems,
    mutations: {
      addToCartMutation,
      updateCartItemMutation,
      removeFromCartMutation,
      clearCartMutation
    }
  }
}
