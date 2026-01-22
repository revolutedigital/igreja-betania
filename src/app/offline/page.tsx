'use client'

import { Home, WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        {/* Ícone */}
        <div className="mb-8 inline-flex">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-3xl flex items-center justify-center shadow-lg">
            <WifiOff className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold mb-4">
          <span className="text-gradient">Sem Conexão</span>
        </h1>

        <p className="text-[var(--foreground-muted)] mb-8 max-w-md mx-auto">
          Você está offline. Verifique sua conexão com a internet e tente novamente.
        </p>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Tentar Novamente
          </button>

          <a
            href="/"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Página Inicial
          </a>
        </div>

        {/* Dicas */}
        <div className="mt-12 glass-card rounded-2xl p-6 max-w-md mx-auto text-left">
          <h3 className="font-semibold mb-3">Dicas:</h3>
          <ul className="text-sm text-[var(--foreground-muted)] space-y-2">
            <li>• Verifique se o Wi-Fi está ativado</li>
            <li>• Tente se aproximar do roteador</li>
            <li>• Verifique os dados móveis</li>
            <li>• Aguarde alguns segundos e tente novamente</li>
          </ul>
        </div>

        {/* Logo */}
        <div className="mt-12 flex items-center justify-center gap-2 opacity-50">
          <div className="w-8 h-8 bg-gradient-betania rounded-lg flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gradient">Betânia</span>
        </div>
      </div>
    </div>
  )
}
