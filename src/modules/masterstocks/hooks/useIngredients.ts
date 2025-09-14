import { useEffect, useState } from 'react'
import { masterStocksService } from '../services/masterStocksService'
import { CreateIngredientRequest, Ingredient, UpdateIngredientRequest } from '../types/masterStocks'

export const useIngredients = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchIngredients = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await masterStocksService.getIngredients()
            setIngredients(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement des ingrédients')
        } finally {
            setLoading(false)
        }
    }

    const createIngredient = async (request: CreateIngredientRequest) => {
        try {
            const newIngredient = await masterStocksService.createIngredient(request)
            setIngredients(prev => [...prev, newIngredient])
            return newIngredient
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'ingrédient')
            throw err
        }
    }

    const updateIngredient = async (id: string, request: UpdateIngredientRequest) => {
        try {
            const updatedIngredient = await masterStocksService.updateIngredient(id, request)
            setIngredients(prev => prev.map(ing => ing.id === id ? updatedIngredient : ing))
            return updatedIngredient
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'ingrédient')
            throw err
        }
    }

    const deleteIngredient = async (id: string) => {
        try {
            await masterStocksService.deleteIngredient(id)
            setIngredients(prev => prev.filter(ing => ing.id !== id))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'ingrédient')
            throw err
        }
    }

    const updateStockQuantity = async (ingredientId: string, quantity: number, reason: string) => {
        try {
            await masterStocksService.updateStockQuantity(ingredientId, quantity, reason)
            // Refresh ingredients to get updated stock levels
            await fetchIngredients()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du stock')
            throw err
        }
    }

    useEffect(() => {
        fetchIngredients()
    }, [])

    return {
        ingredients,
        loading,
        error,
        fetchIngredients,
        refetch: fetchIngredients, // Alias for compatibility
        createIngredient,
        updateIngredient,
        deleteIngredient,
        updateStockQuantity
    }
}
