import { AlertTriangle, RefreshCw } from 'lucide-react'
import React, { Component, ReactNode } from 'react'

interface TabErrorBoundaryProps {
    children: ReactNode
    tabId: string
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface TabErrorBoundaryState {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
}

export default class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
    constructor(props: TabErrorBoundaryProps) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): Partial<TabErrorBoundaryState> {
        return {
            hasError: true,
            error
        }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Tab error logged silently

        this.setState({
            error,
            errorInfo
        })

        // Notifier le parent si un callback est fourni
        if (this.props.onError) {
            this.props.onError(error, errorInfo)
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
                    <div className="text-center max-w-md">
                        {/* Icône d'erreur */}
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        {/* Titre */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Erreur dans cet onglet
                        </h3>

                        {/* Message */}
                        <p className="text-gray-600 mb-6">
                            Une erreur s'est produite dans ce module. Les autres onglets continuent de fonctionner normalement.
                        </p>

                        {/* Détails de l'erreur (en mode développement) */}
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                                    Détails de l'erreur
                                </summary>
                                <div className="bg-red-50 border border-red-200 rounded p-3 text-xs font-mono text-red-800 overflow-auto">
                                    <div className="mb-2">
                                        <strong>Message:</strong> {this.state.error.message}
                                    </div>
                                    {this.state.error.stack && (
                                        <div>
                                            <strong>Stack:</strong>
                                            <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Boutons d'action */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Réessayer
                            </button>
                        </div>

                        {/* Note de sécurité */}
                        <p className="text-xs text-gray-500 mt-4">
                            Cet onglet est isolé des autres. Vous pouvez continuer à utiliser l'application.
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

