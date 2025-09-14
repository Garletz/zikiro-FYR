import { invoke } from '@tauri-apps/api/core'

export interface MenuItem {
    name: string
    price: string
    category?: string
}

export interface MenuAnalysisRequest {
    image_data: string
    mime_type: string
}

export interface MenuAnalysisResponse {
    success: boolean
    items: MenuItem[]
    error?: string
}

export interface ImportMenuRequest {
    items: MenuItem[]
}

export interface ImportMenuResponse {
    success: boolean
    imported_products: any[]
    created_categories: any[]
    error?: string
}

export const menuAnalysisService = {
    // Analyser une image de menu
    analyzeMenuImage: async (request: MenuAnalysisRequest): Promise<MenuAnalysisResponse> => {
        return invoke('analyze_menu_image', { request })
    },

    // Importer les éléments de menu sélectionnés
    importMenuItems: async (request: ImportMenuRequest): Promise<ImportMenuResponse> => {
        return invoke('import_menu_items', { request })
    },

    // Convertir un fichier en base64
    fileToBase64: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                const result = reader.result as string
                // Extraire les données base64 (supprimer le préfixe data:image/...)
                const base64Data = result.includes(',') ? result.split(',')[1] : result
                resolve(base64Data)
            }
            reader.onerror = error => reject(error)
        })
    },

    // Valider un fichier image
    validateImageFile: (file: File): { valid: boolean; error?: string } => {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            return { valid: false, error: 'Le fichier doit être une image' }
        }

        // Vérifier la taille (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return { valid: false, error: 'L\'image est trop volumineuse. Taille maximum : 10MB' }
        }

        return { valid: true }
    }
}
