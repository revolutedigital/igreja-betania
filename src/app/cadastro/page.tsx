'use client'

import CadastroForm from '@/components/CadastroForm'
import ThemeToggle from '@/components/ThemeToggle'
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-betania rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gradient">Betânia</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Botão voltar */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Título */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">Bem-vindo!</span>
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Preencha seus dados para se cadastrar
            </p>
          </div>

          {/* Card do formulário */}
          <div className="glass-card rounded-3xl p-6 md:p-8 animate-fade-in">
            <CadastroForm />
          </div>
        </div>
      </main>
    </div>
  )
}
