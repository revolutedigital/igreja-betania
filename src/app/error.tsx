'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error('App Error:', error)
  }, [error])

  return (
    <main
      className="min-h-screen flex items-center justify-center p-8"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" aria-hidden="true" />
        </div>

        <h1 id="error-title" className="text-2xl font-bold mb-2">
          Erro Inesperado
        </h1>

        <p className="text-[var(--foreground-muted)] mb-6">
          Desculpe, ocorreu um erro ao carregar esta página. Nossa equipe foi notificada.
        </p>

        {error.digest && (
          <p className="text-xs text-[var(--foreground-muted)] mb-6 font-mono">
            Código: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="btn-primary flex items-center gap-2"
            aria-label="Tentar carregar a página novamente"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Tentar novamente
          </button>

          <a
            href="/"
            className="btn-secondary flex items-center gap-2"
            aria-label="Voltar para a página inicial"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Página inicial
          </a>
        </div>
      </div>
    </main>
  )
}
