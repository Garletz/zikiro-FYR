/**
 * Normalise un numéro de téléphone au format international
 * @param phone - Le numéro de téléphone à normaliser
 * @param defaultCountryCode - Le code pays par défaut (défaut: +33 pour la France)
 * @returns Le numéro normalisé au format international
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode: string = '+33'): string {
    if (!phone || !phone.trim()) {
        return ''
    }

    // Supprimer tous les espaces, tirets, points et parenthèses
    let cleaned = phone.replace(/[\s\-\.\(\)]/g, '')

    // Si le numéro commence par 0, le remplacer par le code pays par défaut
    if (cleaned.startsWith('0')) {
        cleaned = defaultCountryCode + cleaned.substring(1)
    }
    // Si le numéro commence par le code pays sans +, ajouter le +
    else if (cleaned.startsWith(defaultCountryCode.substring(1)) && !cleaned.startsWith(defaultCountryCode)) {
        cleaned = '+' + cleaned
    }
    // Si le numéro ne commence pas par +, ajouter le code pays par défaut
    else if (!cleaned.startsWith('+')) {
        cleaned = defaultCountryCode + cleaned
    }

    return cleaned
}

/**
 * Valide qu'un numéro de téléphone est au bon format
 * @param phone - Le numéro de téléphone à valider
 * @returns true si le numéro est valide, false sinon
 */
export function isValidPhoneNumber(phone: string): boolean {
    if (!phone || !phone.trim()) {
        return false
    }

    const normalized = normalizePhoneNumber(phone)

    // Vérifier que le numéro commence par + et contient au moins 10 chiffres
    const phoneRegex = /^\+[1-9]\d{9,14}$/
    return phoneRegex.test(normalized)
}

/**
 * Formate un numéro de téléphone pour l'affichage
 * @param phone - Le numéro de téléphone à formater
 * @returns Le numéro formaté pour l'affichage
 */
export function formatPhoneForDisplay(phone: string): string {
    if (!phone || !phone.trim()) {
        return ''
    }

    const normalized = normalizePhoneNumber(phone)

    // Formater le numéro français
    if (normalized.startsWith('+33')) {
        const number = normalized.substring(3)
        if (number.length === 9) {
            return `+33 ${number.substring(0, 1)} ${number.substring(1, 3)} ${number.substring(3, 5)} ${number.substring(5, 7)} ${number.substring(7, 9)}`
        }
    }

    return normalized
}

/**
 * Exemples de formats acceptés
 */
export const PHONE_FORMAT_EXAMPLES = {
    fr: [
        '06 28 78 27 25',
        '+33 6 28 78 27 25',
        '0628782725',
        '6 28 78 27 25',
        '+33628782725'
    ],
    international: [
        '+1 555 123 4567', // USA
        '+44 20 7946 0958', // UK
        '+49 30 12345678' // Germany
    ]
}
