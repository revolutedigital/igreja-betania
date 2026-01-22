'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Aqui você pode enviar para um serviço de monitoramento como Sentry
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { extra: errorInfo })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="min-h-[400px] flex items-center justify-center p-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
            </div>

            <h2 className="text-xl font-bold mb-2">Ops! Algo deu errado</h2>

            <p className="text-[var(--foreground-muted)] mb-6">
              Ocorreu um erro inesperado. Por favor, tente novamente.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm">
                <summary className="cursor-pointer font-medium text-red-700 dark:text-red-400">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-red-600 dark:text-red-300">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-primary flex items-center gap-2"
                aria-label="Tentar novamente"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Tentar novamente
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="btn-secondary"
                aria-label="Voltar para a página inicial"
              >
                Ir para início
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar error boundary de forma programática
export function useErrorHandler() {
  return (error: Error) => {
    console.error('useErrorHandler:', error)
    throw error
  }
}
