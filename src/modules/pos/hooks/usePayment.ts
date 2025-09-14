import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { logsService } from '../../../shared/services/logsService'
import { Product } from '../../../shared/types/app'
import { CartItem } from '../types'
import { ordersService } from '../../orders/services/ordersService'
import { TableData } from '../types'

export const usePayment = (selectedTable: TableData | null, cartItems: CartItem[], products: Product[]) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false)
  const { formatAmount } = useTaxSettings()

  const sendToKitchenMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTable || cartItems.length === 0) {
        throw new Error('Aucune table sélectionnée ou panier vide')
      }

      // Vérifier s'il existe déjà une commande pour cette table
      const existingOrder = await ordersService.getOrderByTable(selectedTable.id)

      // Convert cart items to order items format
      const orderItems = cartItems.map(item => {
        const product = products.find(p => p.id === item.product_id)
        return {
          product_id: item.product_id,
          product_name: product?.name || item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          status: 'active' as const
        }
      })

      if (existingOrder) {
        // Mettre à jour la commande existante
        await ordersService.updateOrderItems(existingOrder.id, orderItems)
        return 'Commande mise à jour en cuisine avec succès'
      } else {
        // Créer une nouvelle commande
        await ordersService.createOrderFromCart(
          selectedTable.id,
          selectedTable.name,
          orderItems
        )
        return 'Nouvelle commande envoyée en cuisine avec succès'
      }
    }
  })

  const sendToKitchen = async () => {
    setIsSendingToKitchen(true)
    try {
      await sendToKitchenMutation.mutateAsync()
    } catch (error) {
      console.error('Erreur lors de l\'envoi en cuisine:', error)
      throw error
    } finally {
      setIsSendingToKitchen(false)
    }
  }

  const processPayment = async (
    totalAmount: number,
    taxAmount: number,
    itemsCount: number,
    paymentMethodName: string,
    customerName: string,
    onSuccess: () => void
  ) => {
    setIsProcessingPayment(true)

    try {
      // Simuler un traitement de paiement
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Enregistrer l'événement de vente dans les logs
      await logsService.logSaleEvent(
        selectedTable?.id,
        selectedTable?.name,
        totalAmount,
        itemsCount,
        paymentMethodName,
        customerName,
        cartItems.map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      )

      // Enregistrer spécifiquement les détails de TVA
      try {
        await logsService.logFinancialEvent(
          `Vente - TVA collectée`,
          `Vente avec TVA de ${formatAmount(taxAmount)}`,
          taxAmount,
          {
            tax_amount: taxAmount,
            subtotal: totalAmount - taxAmount,
            total: totalAmount,
            items_count: itemsCount,
            payment_method: paymentMethodName,
            customer_name: customerName,
            table_id: selectedTable?.id,
            table_name: selectedTable?.name
          }
        )
      } catch (taxError) {
        console.error('❌ Erreur lors de l\'enregistrement des détails de TVA:', taxError)
        // On continue même si l'enregistrement de TVA échoue
      }

      onSuccess()
    } catch (error) {
      console.error('❌ Erreur lors du paiement:', error)
      throw error
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return {
    sendToKitchen,
    processPayment,
    isProcessingPayment,
    isSendingToKitchen,
    sendToKitchenMutation
  }
}
