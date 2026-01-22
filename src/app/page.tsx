'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Home, Users, ClipboardCheck, BarChart3, LogIn, User } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-betania rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gradient">Betânia</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <Link
                href="/admin"
                className="p-2 rounded-full glass-card hover:scale-110 transition-transform"
                title={session.user?.name || 'Admin'}
              >
                <User className="w-5 h-5 text-amber-600" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="p-2 rounded-full glass-card hover:scale-110 transition-transform"
                title="Entrar"
              >
                <LogIn className="w-5 h-5 text-amber-600" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          {/* Logo/Ícone */}
          <div className="mb-8 inline-flex">
            <div className="w-24 h-24 bg-gradient-betania rounded-3xl flex items-center justify-center shadow-lg animate-glow">
              <Home className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Betânia</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--foreground-muted)] mb-2">
            Gestão de Membros para sua Igreja
          </p>
          <p className="text-sm text-[var(--foreground-muted)] mb-12">
            Onde Jesus conhecia cada um pelo nome
          </p>

          {/* Cards de ação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-12">
            <Link
              href="/cadastro"
              className="glass-card card-interactive rounded-2xl p-6 text-left"
            >
              <div className="w-12 h-12 bg-gradient-betania rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="font-semibold text-lg mb-1">Fazer Cadastro</h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Cadastre-se como membro
              </p>
            </Link>

            <Link
              href="/admin"
              className="glass-card card-interactive rounded-2xl p-6 text-left"
            >
              <div className="w-12 h-12 bg-[var(--secondary)] rounded-xl flex items-center justify-center mb-4">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <h2 className="font-semibold text-lg mb-1">Área Admin</h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Gerenciar membros e chamada
              </p>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <ClipboardCheck className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h3 className="font-medium mb-1">Chamada Fácil</h3>
              <p className="text-xs text-[var(--foreground-muted)]">
                Registre presença com um toque
              </p>
            </div>

            <div className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Users className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h3 className="font-medium mb-1">Cadastro Simples</h3>
              <p className="text-xs text-[var(--foreground-muted)]">
                Link para membros se cadastrarem
              </p>
            </div>

            <div className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <BarChart3 className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h3 className="font-medium mb-1">Relatórios</h3>
              <p className="text-xs text-[var(--foreground-muted)]">
                Ausências e aniversários
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center">
        <p className="text-xs text-[var(--foreground-muted)]">
          Betânia v1.0 • Feito com amor para a Igreja
        </p>
      </footer>
    </div>
  )
}
