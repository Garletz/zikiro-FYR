import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { ProductDisplay } from '../types'

interface ModernProductCardProps {
    product: ProductDisplay
    onSelect: (product: ProductDisplay) => void
    getCategoryColor: (categoryId: string) => string
}

export default function ModernProductCard({
    product,
    onSelect,
    getCategoryColor
}: ModernProductCardProps) {
    const { formatAmount } = useTaxSettings()

    const isLowStock = product.stock_quantity <= 5
    const isOutOfStock = product.stock_quantity === 0

    // Fonction pour détecter le type de script
    const detectScriptType = (text: string): 'latin' | 'chinese' | 'hindi' | 'arabic' | 'mixed' => {
        const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf\uf900-\ufaff\u3300-\u33ff\u2e80-\u2eff\u2f00-\u2fdf\u31c0-\u31ef\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3300-\u33ff]/
        const hindiRegex = /[\u0900-\u097f\u1cd0-\u1cff\u200c\u200d\u20f0]/
        const arabicRegex = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/

        const hasChinese = chineseRegex.test(text)
        const hasHindi = hindiRegex.test(text)
        const hasArabic = arabicRegex.test(text)

        if (hasChinese && !hasHindi && !hasArabic) return 'chinese'
        if (hasHindi && !hasChinese && !hasArabic) return 'hindi'
        if (hasArabic && !hasChinese && !hasHindi) return 'arabic'
        if (hasChinese || hasHindi || hasArabic) return 'mixed'
        return 'latin'
    }

    // Fonction pour calculer la taille de police adaptative multi-scripts
    const getAdaptiveFontSize = (text: string): string => {
        const length = text.length
        const scriptType = detectScriptType(text)

        // Ajustements selon le type de script
        if (scriptType === 'chinese') {
            // Les caractères chinois sont plus larges
            if (length <= 2) return 'text-lg'        // Très court (ex: "米饭")
            if (length <= 4) return 'text-base'      // Court (ex: "宫保鸡丁")
            if (length <= 6) return 'text-sm'        // Moyen (ex: "北京烤鸭")
            return 'text-xs'                         // Long
        }

        if (scriptType === 'hindi') {
            // Les caractères hindi sont de largeur variable
            if (length <= 3) return 'text-lg'        // Très court
            if (length <= 5) return 'text-base'      // Court
            if (length <= 7) return 'text-sm'        // Moyen
            return 'text-xs'                         // Long
        }

        if (scriptType === 'arabic') {
            // Les caractères arabes sont plus compacts
            if (length <= 5) return 'text-lg'        // Très court
            if (length <= 8) return 'text-base'      // Court
            if (length <= 12) return 'text-sm'       // Moyen
            return 'text-xs'                         // Long
        }

        if (scriptType === 'mixed') {
            // Texte mixte - utiliser la taille la plus petite
            if (length <= 4) return 'text-base'      // Très court
            if (length <= 6) return 'text-sm'        // Court
            return 'text-xs'                         // Moyen et long
        }

        // Script latin (par défaut)
        if (length <= 4) return 'text-lg'        // Très court (ex: "Ble")
        if (length <= 6) return 'text-base'      // Court (ex: "Pizza")
        if (length <= 8) return 'text-sm'        // Moyen-court (ex: "Tiramisu")
        if (length <= 9) return 'text-xs'        // Moyen (ex: "Choucroute")
        if (length <= 12) return 'text-xs'       // Long (ex: "Charlotte au Chocolat")
        return 'text-xs'                         // Très long (fallback)
    }

    // Fonction pour calculer le line-clamp adaptatif multi-scripts
    const getAdaptiveLineClamp = (text: string): string => {
        const length = text.length
        const scriptType = detectScriptType(text)

        // Ajustements selon le type de script
        if (scriptType === 'chinese') {
            // Les caractères chinois sont plus larges, moins de lignes
            if (length <= 4) return 'line-clamp-1'   // Court = 1 ligne
            if (length <= 8) return 'line-clamp-2'  // Moyen = 2 lignes
            return 'line-clamp-3'                    // Long = 3 lignes
        }

        if (scriptType === 'hindi') {
            // Les caractères hindi sont de largeur variable
            if (length <= 4) return 'line-clamp-1'   // Court = 1 ligne
            if (length <= 8) return 'line-clamp-2'  // Moyen = 2 lignes
            return 'line-clamp-3'                    // Long = 3 lignes
        }

        if (scriptType === 'arabic') {
            // Les caractères arabes sont plus compacts
            if (length <= 6) return 'line-clamp-1'   // Court = 1 ligne
            if (length <= 12) return 'line-clamp-2'  // Moyen = 2 lignes
            return 'line-clamp-3'                    // Long = 3 lignes
        }

        if (scriptType === 'mixed') {
            // Texte mixte - utiliser 2 lignes pour la plupart
            if (length <= 4) return 'line-clamp-1'   // Court = 1 ligne
            if (length <= 12) return 'line-clamp-2'  // Moyen = 2 lignes
            return 'line-clamp-3'                    // Long = 3 lignes
        }

        // Script latin (par défaut)
        if (length <= 6) return 'line-clamp-1'   // Court = 1 ligne
        if (length <= 20) return 'line-clamp-2'  // Moyen à long = 2 lignes
        return 'line-clamp-3'                    // Très long = 3 lignes
    }

    // Text-maximized card design
    return (
        <div
            className={`relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border-2 border-slate-600 hover:border-emerald-400 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-lg hover:shadow-emerald-500/20 ${isOutOfStock ? 'opacity-70' : ''
                }`}
            onClick={() => onSelect(product)}
            style={{
                aspectRatio: '1/1',
                minHeight: '90px'
            }}
        >
            {/* Background pattern */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-transparent to-slate-600/10"></div>

            {/* Price Tag - Floating on top right */}
            <div className="absolute -top-1 -right-1 z-10">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-xs font-medium px-2 py-0.5 rounded-full shadow-lg border-2 border-slate-800">
                    {formatAmount(product.price)}
                </div>
            </div>

            {/* Stock Indicator - Top Left Corner */}
            <div className="absolute top-1 left-1 z-10">
                <div className={`w-3 h-3 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${isOutOfStock
                    ? 'bg-red-500 text-white'
                    : isLowStock
                        ? 'bg-orange-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}>
                    {product.stock_quantity}
                </div>
            </div>

            {/* Main Content - Maximized for Text */}
            <div className="relative h-full flex flex-col p-1.5 pt-3">
                {/* Product Name - Adaptive Size with Maximum Space */}
                <div className="flex-1 flex items-center justify-center text-center px-0.5">
                    <h3 className={`font-bold text-white leading-tight drop-shadow-sm text-center ${getAdaptiveFontSize(product.name)} ${getAdaptiveLineClamp(product.name)}`}>
                        {product.name}
                    </h3>
                </div>

                {/* Bottom - Category Color Indicator */}
                <div className="flex items-center justify-center mt-2">
                    <div
                        className="w-2 h-2 rounded-full shadow-sm"
                        style={{ backgroundColor: getCategoryColor(product.category_id) }}
                    ></div>
                </div>
            </div>

            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400/0 to-emerald-400/0 hover:from-emerald-400/10 hover:to-emerald-400/5 transition-all duration-300"></div>
        </div>
    )
}
