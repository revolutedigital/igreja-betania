'use client'

import { useState } from 'react'
import Link from 'next/link'
import ChamadaGrid from '@/components/ChamadaGrid'
import ThemeToggle from '@/components/ThemeToggle'
import { Home, ArrowLeft, Calendar, Clock, Loader2, Play } from 'lucide-react'

interface Culto {
  id: string
  data: string
  horario: string
}

export default function ChamadaPage() {
  const [cultoId, setCultoId] = useState<string | null>(null)
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>('')
  const [dataSelecionada, setDataSelecionada] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)

  const horarios = [
    { value: '10:00', label: 'Culto das 10h', icon: '🌅' },
    { value: '17:00', label: 'Culto das 17h', icon: '🌤️' },
    { value: '19:00', label: 'Culto das 19h', icon: '🌙' },
  ]

  const iniciarChamada = async () => {
    if (!horarioSelecionado || !dataSelecionada) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/cultos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataSelecionada,
          horario: horarioSelecionado,
        }),
      })

      const culto: Culto = await response.json()
      setCultoId(culto.id)
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error)
    } finally {
      setLoading(false)
    }
  }

  const voltarSelecao = () => {
    setCultoId(null)
  }

  // Tela de chamada ativa
  if (cultoId) {
    const horarioLabel = horarios.find(h => h.value === horarioSelecionado)?.label
    return (
      <div className="min-h-screen bg-gradient-hero">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 glass">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={voltarSelecao}
              className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <div className="text-center">
              <h1 className="font-bold text-gradient">Chamada</h1>
              <p className="text-xs text-[var(--foreground-muted)]">
                {new Date(dataSelecionada + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })} • {horarioLabel}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Grid de chamada */}
        <main className="pt-20 pb-8 px-4">
          <div className="max-w-6xl mx-auto">
            <ChamadaGrid cultoId={cultoId} />
          </div>
        </main>
      </div>
    )
  }

  // Tela de seleção
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
        <div className="max-w-md mx-auto">
          {/* Botão voltar */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Título */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">Chamada</span>
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Selecione a data e o horário do culto
            </p>
          </div>

          {/* Card de seleção */}
          <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 animate-fade-in">
            {/* Data */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Calendar className="w-4 h-4 text-amber-600" />
                Data do culto
              </label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={e => setDataSelecionada(e.target.value)}
                className="input-field text-lg"
              />
            </div>

            {/* Horário */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
                Horário do culto
              </label>
              <div className="grid grid-cols-1 gap-3">
                {horarios.map(horario => (
                  <button
                    key={horario.value}
                    type="button"
                    onClick={() => setHorarioSelecionado(horario.value)}
                    className={`p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                      horarioSelecionado === horario.value
                        ? 'bg-gradient-betania text-white shadow-lg scale-[1.02]'
                        : 'glass-card hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-2xl">{horario.icon}</span>
                    <span className="font-semibold">{horario.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Botão iniciar */}
            <button
              onClick={iniciarChamada}
              disabled={loading || !horarioSelecionado}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Iniciar Chamada
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
