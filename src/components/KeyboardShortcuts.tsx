'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Keyboard, X } from 'lucide-react'

export default function KeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      // Atalhos globais
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowHelp(true)
      }

      if (e.key === 'Escape') {
        setShowHelp(false)
      }

      // Navegação com Ctrl/Cmd + tecla
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'h':
            e.preventDefault()
            router.push('/')
            break
          case 'c':
            if (e.shiftKey) {
              e.preventDefault()
              router.push('/admin/chamada')
            }
            break
          case 'm':
            e.preventDefault()
            router.push('/admin/membros')
            break
          case 'r':
            if (e.shiftKey) {
              e.preventDefault()
              router.push('/admin/relatorios')
            }
            break
          case 'n':
            e.preventDefault()
            router.push('/cadastro')
            break
        }
      }

      // Atalhos simples (g + tecla para "go to")
      if (e.key === 'g') {
        const handleNextKey = (nextE: KeyboardEvent) => {
          switch (nextE.key) {
            case 'h':
              router.push('/')
              break
            case 'c':
              router.push('/admin/chamada')
              break
            case 'm':
              router.push('/admin/membros')
              break
            case 'r':
              router.push('/admin/relatorios')
              break
            case 'n':
              router.push('/cadastro')
              break
            case 'a':
              router.push('/admin')
              break
          }
          document.removeEventListener('keydown', handleNextKey)
        }
        document.addEventListener('keydown', handleNextKey, { once: true })
        setTimeout(() => {
          document.removeEventListener('keydown', handleNextKey)
        }, 1000)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  if (!showHelp) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-betania rounded-xl flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Atalhos de Teclado</h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="p-2 hover:bg-[var(--background)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-2">
              Navegação Rápida (g + tecla)
            </h3>
            <div className="space-y-2">
              <ShortcutRow keys={['g', 'h']} description="Ir para Home" />
              <ShortcutRow keys={['g', 'a']} description="Ir para Admin" />
              <ShortcutRow keys={['g', 'c']} description="Ir para Chamada" />
              <ShortcutRow keys={['g', 'm']} description="Ir para Membros" />
              <ShortcutRow keys={['g', 'r']} description="Ir para Relatórios" />
              <ShortcutRow keys={['g', 'n']} description="Novo Cadastro" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-2">
              Geral
            </h3>
            <div className="space-y-2">
              <ShortcutRow keys={['?']} description="Mostrar atalhos" />
              <ShortcutRow keys={['Esc']} description="Fechar modal" />
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--foreground-muted)] mt-6 text-center">
          Pressione <kbd className="px-1.5 py-0.5 bg-[var(--background)] rounded text-xs">?</kbd> a qualquer momento
        </p>
      </div>
    </div>
  )
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            <kbd className="px-2 py-1 bg-[var(--background)] rounded text-xs font-mono">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="text-[var(--foreground-muted)] mx-1">+</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
