'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, ArrowLeft, Search, UserPlus, Phone, Edit2, Trash2, Users, Loader2, X, Check, MessageCircle } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

interface Membro {
  id: string
  nome: string
  foto: string | null
  whatsapp: string
  dataAniversario: string | null
  grupoPequeno: boolean
}

export default function MembrosPage() {
  const [membros, setMembros] = useState<Membro[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Membro>>({})

  useEffect(() => {
    fetchMembros()
  }, [])

  const fetchMembros = async () => {
    try {
      const response = await fetch('/api/membros')
      const data = await response.json()
      setMembros(data)
    } catch (error) {
      console.error('Erro ao buscar membros:', error)
    } finally {
      setLoading(false)
    }
  }

  const excluirMembro = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return

    try {
      await fetch(`/api/membros/${id}`, { method: 'DELETE' })
      setMembros(membros.filter(m => m.id !== id))
    } catch (error) {
      console.error('Erro ao excluir membro:', error)
    }
  }

  const iniciarEdicao = (membro: Membro) => {
    setEditando(membro.id)
    setFormData({
      nome: membro.nome,
      whatsapp: membro.whatsapp,
      dataAniversario: membro.dataAniversario?.split('T')[0] || '',
      grupoPequeno: membro.grupoPequeno,
    })
  }

  const salvarEdicao = async () => {
    if (!editando) return

    try {
      const response = await fetch(`/api/membros/${editando}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchMembros()
        setEditando(null)
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
    }
  }

  const membrosFiltrados = membros.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
          <p className="text-[var(--foreground-muted)]">Carregando membros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
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
        <div className="max-w-4xl mx-auto">
          {/* Botão voltar */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Header da página */}
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Membros</h1>
              <p className="text-[var(--foreground-muted)]">{membros.length} cadastrados</p>
            </div>
            <Link
              href="/cadastro"
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Novo
            </Link>
          </div>

          {/* Busca */}
          <div className="mb-6 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Lista de membros */}
          <div className="space-y-3">
            {membrosFiltrados.map((membro, index) => (
              <div
                key={membro.id}
                className="glass-card rounded-2xl p-4 flex items-center gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Foto */}
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-amber-200">
                  {membro.foto ? (
                    <img
                      src={membro.foto}
                      alt={membro.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-warm flex items-center justify-center text-xl font-bold text-amber-700">
                      {membro.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Informações */}
                {editando === membro.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={formData.nome || ''}
                      onChange={e => setFormData({ ...formData, nome: e.target.value })}
                      className="input-field"
                      placeholder="Nome"
                    />
                    <input
                      type="tel"
                      value={formData.whatsapp || ''}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="input-field"
                      placeholder="WhatsApp"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={salvarEdicao}
                        className="btn-primary py-2 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="btn-secondary py-2 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{membro.nome}</h3>
                      <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {membro.whatsapp}
                      </p>
                      {membro.grupoPequeno && (
                        <span className="badge badge-primary mt-1">
                          <Users className="w-3 h-3" />
                          Grupo Pequeno
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-1">
                      <a
                        href={`https://wa.me/55${membro.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => iniciarEdicao(membro)}
                        className="p-2 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => excluirMembro(membro.id)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {membrosFiltrados.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <Users className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--foreground-muted)]">Nenhum membro encontrado</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
