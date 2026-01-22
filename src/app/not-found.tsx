'use client'

import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-8"
      role="main"
      aria-labelledby="notfound-title"
    >
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-amber-600" aria-hidden="true" />
        </div>

        <h1 id="notfound-title" className="text-6xl font-bold text-gradient mb-4">
          404
        </h1>

        <h2 className="text-xl font-semibold mb-2">
          Página não encontrada
        </h2>

        <p className="text-[var(--foreground-muted)] mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/"
            className="btn-primary flex items-center gap-2"
            aria-label="Ir para a página inicial"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Página inicial
          </Link>

          <button
            onClick={() => typeof window !== 'undefined' && window.history.back()}
            className="btn-secondary flex items-center gap-2"
            aria-label="Voltar para a página anterior"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Voltar
          </button>
        </div>
      </div>
    </main>
  )
}
