import { invoke } from '@tauri-apps/api/core'
import {
    CreateIngredientRequest,
    CreateSupplierRequest,
    Ingredient,
    InvoiceAnalysisRequest,
    InvoiceAnalysisResponse,
    InvoiceData,
    StockAlert,
    StockDashboardData,
    StockMovement,
    Supplier,
    UpdateIngredientRequest
} from '../types/masterStocks'

export const masterStocksService = {
    // ===== DATABASE INITIALIZATION =====
    async initDatabase(): Promise<void> {
        try {
            return await invoke('init_masterstocks_database')
        } catch (error) {
            console.error('Error initializing MasterStocks database:', error)
            throw error
        }
    },

    // ===== INGREDIENTS =====
    async getIngredients(): Promise<Ingredient[]> {
        try {
            const ingredients = await invoke<Ingredient[]>('get_ingredients')
            console.log('Fetched ingredients:', ingredients)
            return ingredients
        } catch (error) {
            console.error('Error fetching ingredients:', error)
            throw error
        }
    },

    async createIngredient(request: CreateIngredientRequest): Promise<Ingredient> {
        try {
            return await invoke<Ingredient>('create_ingredient', { request })
        } catch (error) {
            console.error('Error creating ingredient:', error)
            throw error
        }
    },

    async updateIngredient(id: string, request: UpdateIngredientRequest): Promise<Ingredient> {
        try {
            return await invoke<Ingredient>('update_ingredient_command', { id, request })
        } catch (error) {
            console.error('Error updating ingredient:', error)
            throw error
        }
    },

    async deleteIngredient(id: string): Promise<void> {
        try {
            return await invoke<void>('delete_ingredient_command', { id })
        } catch (error) {
            console.error('Error deleting ingredient:', error)
            throw error
        }
    },

    async updateStockQuantity(ingredientId: string, quantity: number, reason: string): Promise<void> {
        try {
            return await invoke<void>('update_stock_quantity', { ingredientId, quantity, reason })
        } catch (error) {
            console.error('Error updating stock quantity:', error)
            throw error
        }
    },

    // ===== SUPPLIERS =====
    async getSuppliers(): Promise<Supplier[]> {
        try {
            return await invoke('get_suppliers')
        } catch (error) {
            console.error('Error fetching suppliers:', error)
            throw error
        }
    },

    async createSupplier(request: CreateSupplierRequest): Promise<Supplier> {
        try {
            return await invoke('create_supplier', { request })
        } catch (error) {
            console.error('Error creating supplier:', error)
            throw error
        }
    },

    // ===== STOCK ALERTS =====
    async getStockAlerts(): Promise<StockAlert[]> {
        try {
            return await invoke('get_stock_alerts')
        } catch (error) {
            console.error('Error fetching stock alerts:', error)
            throw error
        }
    },

    async markAlertAsRead(alertId: string): Promise<void> {
        try {
            return await invoke('mark_alert_as_read_command', { alertId })
        } catch (error) {
            console.error('Error marking alert as read:', error)
            throw error
        }
    },

    // ===== STOCK MOVEMENTS =====
    async getStockMovements(ingredientId: string): Promise<StockMovement[]> {
        try {
            return await invoke('get_stock_movements', { ingredientId })
        } catch (error) {
            console.error('Error fetching stock movements:', error)
            throw error
        }
    },

    // ===== AI INVOICE ANALYSIS =====
    async analyzeInvoiceImage(request: InvoiceAnalysisRequest): Promise<InvoiceAnalysisResponse> {
        try {
            return await invoke('analyze_invoice_image', { request })
        } catch (error) {
            console.error('Error analyzing invoice image:', error)
            throw error
        }
    },

    async importInvoiceData(invoiceData: InvoiceData): Promise<string> {
        try {
            return await invoke('import_invoice_data', { invoiceData })
        } catch (error) {
            console.error('Error importing invoice data:', error)
            throw error
        }
    },

    // ===== UTILITY FUNCTIONS =====
    async getDashboardData(): Promise<StockDashboardData> {
        try {
            const [ingredients, alerts, movements] = await Promise.all([
                this.getIngredients(),
                this.getStockAlerts(),
                this.getStockMovements('') // Get all movements
            ])

            const totalIngredients = ingredients.length
            const lowStockCount = ingredients.filter(ing => ing.current_stock <= ing.min_stock && ing.current_stock > 0).length
            const outOfStockCount = ingredients.filter(ing => ing.current_stock <= 0).length
            const expiringSoonCount = ingredients.filter(ing => {
                if (!ing.expiration_date) return false
                const expDate = new Date(ing.expiration_date)
                const now = new Date()
                const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                return daysUntilExpiry <= 3 && daysUntilExpiry >= 0
            }).length

            const totalValue = ingredients.reduce((sum, ing) => sum + (ing.current_stock * ing.cost_per_unit), 0)

            return {
                totalIngredients,
                lowStockCount,
                outOfStockCount,
                expiringSoonCount,
                totalValue,
                recentMovements: movements.slice(0, 10), // Last 10 movements
                alerts
            }
        } catch (error) {
            console.error('Error getting dashboard data:', error)
            throw error
        }
    },

    // File to base64 conversion (for invoice images)
    fileToBase64: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                const result = reader.result as string
                // Extract base64 data (remove data:image/... prefix)
                const base64Data = result.includes(',') ? result.split(',')[1] : result
                resolve(base64Data)
            }
            reader.onerror = error => reject(error)
        })
    },

    // Validate image file
    validateImageFile: (file: File): { valid: boolean; error?: string } => {
        // Check file type
        if (!file.type.startsWith('image/')) {
            return { valid: false, error: 'Le fichier doit être une image' }
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return { valid: false, error: 'L\'image est trop volumineuse. Taille maximum : 10MB' }
        }

        return { valid: true }
    }
}
