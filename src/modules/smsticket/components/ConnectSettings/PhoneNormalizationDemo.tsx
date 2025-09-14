import { useState } from 'react'
import { formatPhoneForDisplay, normalizePhoneNumber, PHONE_FORMAT_EXAMPLES } from '../../utils/phoneNormalization'

export default function PhoneNormalizationDemo() {
    const [testPhone, setTestPhone] = useState('')
    const normalized = normalizePhoneNumber(testPhone)
    const formatted = formatPhoneForDisplay(testPhone)

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-3">🧪 Test de normalisation des numéros</h4>
            <div className="space-y-3">
                <div>
                    <input
                        type="tel"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="Tapez un numéro (ex: 06 28 78 27 25)"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {testPhone && (
                    <div className="text-sm space-y-1">
                        <p><strong>Numéro saisi:</strong> <code className="bg-blue-100 px-1 rounded">{testPhone}</code></p>
                        <p><strong>Numéro normalisé:</strong> <code className="bg-green-100 px-1 rounded">{normalized}</code></p>
                        <p><strong>Format affiché:</strong> <code className="bg-purple-100 px-1 rounded">{formatted}</code></p>
                    </div>
                )}

                <div className="text-xs text-blue-700">
                    <p><strong>Exemples acceptés :</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                        {PHONE_FORMAT_EXAMPLES.fr.slice(0, 3).map((example, index) => (
                            <li key={index}><code>{example}</code> → <code>{normalizePhoneNumber(example)}</code></li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
