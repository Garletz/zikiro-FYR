import { useState } from 'react'
import { CartItem } from '../types'
import { SplitBreakdown } from '../types'

export const useSplitTicket = (cartItems: CartItem[], cartTotal: number, getCartTax: () => number) => {
  const [splitMode, setSplitMode] = useState<'equal' | 'custom' | 'item'>('equal')
  const [splitCount, setSplitCount] = useState(2)
  const [customSplits, setCustomSplits] = useState<{ [key: string]: number }>({})
  const [itemAssignments, setItemAssignments] = useState<{ [key: string]: string[] }>({})
  const [paidAmounts, setPaidAmounts] = useState<{ [key: string]: number }>({})
  const [currentPayer, setCurrentPayer] = useState<string>('')

  const getSplitBreakdown = (): SplitBreakdown[] => {
    if (splitMode === 'equal') {
      const amountPerTicket = (cartTotal + getCartTax()) / splitCount
      return Array.from({ length: splitCount }, (_, i) => ({
        id: `ticket-${i + 1}`,
        name: `Personne ${i + 1}`,
        amount: amountPerTicket,
        paid: paidAmounts[`ticket-${i + 1}`] || 0,
        remaining: amountPerTicket - (paidAmounts[`ticket-${i + 1}`] || 0)
      }))
    } else if (splitMode === 'custom') {
      return Array.from({ length: splitCount }, (_, i) => {
        const ticketId = `ticket-${i + 1}`
        const amount = customSplits[ticketId] || 0
        return {
          id: ticketId,
          name: `Personne ${i + 1}`,
          amount,
          paid: paidAmounts[ticketId] || 0,
          remaining: amount - (paidAmounts[ticketId] || 0)
        }
      })
    } else if (splitMode === 'item') {
      return Array.from({ length: splitCount }, (_, i) => {
        const ticketId = `ticket-${i + 1}`
        const assignedItems = cartItems.filter(item =>
          itemAssignments[item.product_id]?.includes(ticketId)
        )
        const amount = assignedItems.reduce((sum, item) => sum + item.total_price, 0)
        const taxAmount = getCartTax() * (amount / cartTotal)
        const totalAmount = amount + taxAmount

        return {
          id: ticketId,
          name: `Personne ${i + 1}`,
          amount: totalAmount,
          paid: paidAmounts[ticketId] || 0,
          remaining: totalAmount - (paidAmounts[ticketId] || 0),
          items: assignedItems
        }
      })
    }
    return []
  }

  const getTotalRemaining = () => {
    const breakdown = getSplitBreakdown()
    return breakdown.reduce((sum, item) => sum + item.remaining, 0)
  }

  const getTotalPaid = () => {
    const breakdown = getSplitBreakdown()
    return breakdown.reduce((sum, item) => sum + item.paid, 0)
  }

  const handlePartialPayment = (ticketId: string, amount: number) => {
    setPaidAmounts(prev => ({
      ...prev,
      [ticketId]: (prev[ticketId] || 0) + amount
    }))
    setCurrentPayer('')
  }

  const assignItemToTicket = (itemId: string, ticketId: string, assign: boolean) => {
    setItemAssignments(prev => {
      if (assign) {
        // Assigner cet article à cette personne (remplace toute assignation précédente pour CET article)
        return { ...prev, [itemId]: [ticketId] }
      } else {
        // Désassigner cet article de cette personne
        return { ...prev, [itemId]: [] }
      }
    })
  }

  const clearSplit = () => {
    setCustomSplits({})
    setItemAssignments({})
    setSplitCount(2)
    setSplitMode('equal')
    setPaidAmounts({})
    setCurrentPayer('')
  }

  const isNoteFullyPaid = () => getTotalRemaining() <= 0.01

  return {
    splitMode,
    setSplitMode,
    splitCount,
    setSplitCount,
    customSplits,
    setCustomSplits,
    itemAssignments,
    paidAmounts,
    currentPayer,
    setCurrentPayer,
    getSplitBreakdown,
    getTotalRemaining,
    getTotalPaid,
    handlePartialPayment,
    assignItemToTicket,
    clearSplit,
    isNoteFullyPaid
  }
}
