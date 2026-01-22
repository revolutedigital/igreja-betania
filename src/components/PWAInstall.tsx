'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true
  const dismissedUntil = localStorage.getItem('pwa-banner-dismissed-until')
  return dismissedUntil ? Date.now() < parseInt(dismissedUntil) : false
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const hasShownRef = useRef(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Verificar se foi dismissado recentemente
    if (isDismissed()) {
      return
    }

    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('SW registrado:', registration.scope)
      }).catch((error) => {
        console.error('Erro ao registrar SW:', error)
      })
    }

    // Capturar evento de instalação
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Só mostrar banner se não foi dismissado e não mostrou ainda nesta sessão
      if (!isDismissed() && !hasShownRef.current) {
        hasShownRef.current = true
        setTimeout(() => {
          // Verificar novamente antes de mostrar
          if (!isDismissed()) {
            setShowInstallBanner(true)
          }
        }, 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Detectar quando foi instalado
    const handleInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
    }
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowInstallBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowInstallBanner(false)
    // Não mostrar novamente por 24 horas
    const dismissedUntil = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem('pwa-banner-dismissed-until', dismissedUntil.toString())
  }

  if (isInstalled || !showInstallBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in">
      <div className="max-w-md mx-auto glass-card rounded-2xl p-4 shadow-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-betania rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Instalar Betânia</h3>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              Adicione à tela inicial para acesso rápido e uso offline
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="btn-primary text-xs py-2 px-4"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="btn-secondary text-xs py-2 px-4"
              >
                Agora não
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
