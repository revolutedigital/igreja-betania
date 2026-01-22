'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Home, ClipboardCheck, Users, BarChart3, Share2, ArrowLeft, LogOut, User, Shield, Loader2, MessageCircle } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const menuItems = [
    {
      href: '/admin/chamada',
      title: 'Fazer Chamada',
      description: 'Registrar presença no culto',
      icon: ClipboardCheck,
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      href: '/admin/membros',
      title: 'Membros',
      description: 'Gerenciar cadastros',
      icon: Users,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      href: '/admin/relatorios',
      title: 'Relatórios',
      description: 'Frequência e alertas',
      icon: BarChart3,
      gradient: 'from-sky-500 to-blue-600',
    },
    {
      href: '/admin/whatsapp',
      title: 'WhatsApp',
      description: 'Enviar mensagens automáticas',
      icon: MessageCircle,
      gradient: 'from-green-500 to-green-600',
    },
    {
      href: '/cadastro',
      title: 'Link de Cadastro',
      description: 'Compartilhar com membros',
      icon: Share2,
      gradient: 'from-pink-500 to-rose-600',
    },
  ]

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
          <p className="text-[var(--foreground-muted)]">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

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
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 rounded-full glass-card hover:scale-110 transition-transform text-red-500"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Botão voltar */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Card de boas-vindas */}
          <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-betania rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-[var(--foreground-muted)] text-sm">Bem-vindo(a),</p>
                <h2 className="text-xl font-bold">{session.user?.name}</h2>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium capitalize">
                    {session.user?.role || 'voluntário'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">Painel Admin</span>
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Gerencie membros e presença da igreja
            </p>
          </div>

          {/* Grid de cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="glass-card card-interactive rounded-2xl p-6 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="font-semibold text-lg mb-1">{item.title}</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">{item.description}</p>
                </Link>
              )
            })}
          </div>

          {/* Info card */}
          <div className="mt-8 glass-card rounded-2xl p-6 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm text-[var(--foreground-muted)]">
              Compartilhe o link <strong className="text-[var(--primary)]">/cadastro</strong> para os membros se cadastrarem
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
