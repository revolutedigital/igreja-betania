'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, ArrowLeft, Users, UserCheck, AlertTriangle, Cake, Clock, Copy, Check, MessageCircle, Loader2, Calendar, TrendingUp, FileDown } from 'lucide-react'
import { generateRelatoriosPDF } from '@/lib/pdf'
import toast from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface Ausente {
  id: string
  nome: string
  foto: string | null
  whatsapp: string
  ultimaPresenca: string | null
}

interface Aniversariante {
  id: string
  nome: string
  foto: string | null
  whatsapp: string
  dataAniversario: string
}

interface FrequenciaCulto {
  horario: string
  media: number
}

interface CultoRecente {
  id: string
  data: string
  horario: string
  presentes: number
}

interface Relatorios {
  totalMembros: number
  membrosGrupoPequeno: number
  ausentes: Ausente[]
  aniversariantes: Aniversariante[]
  mediaFrequencia: FrequenciaCulto[]
  cultosRecentes: CultoRecente[]
}

export default function RelatoriosPage() {
  const [dados, setDados] = useState<Relatorios | null>(null)
  const [loading, setLoading] = useState(true)
  const [mensagemCopiada, setMensagemCopiada] = useState<string | null>(null)

  useEffect(() => {
    fetchRelatorios()
  }, [])

  const fetchRelatorios = async () => {
    try {
      const response = await fetch('/api/relatorios')
      const data = await response.json()
      setDados(data)
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const copiarMensagem = (tipo: 'ausencia' | 'aniversario', nome: string) => {
    let mensagem = ''
    if (tipo === 'ausencia') {
      mensagem = `Olá ${nome.split(' ')[0]}! Sentimos sua falta no culto. Esperamos te ver em breve!`
    } else {
      mensagem = `Feliz aniversário, ${nome.split(' ')[0]}! Que Deus abençoe muito sua vida! Parabéns!`
    }

    navigator.clipboard.writeText(mensagem)
    setMensagemCopiada(nome)
    setTimeout(() => setMensagemCopiada(null), 2000)
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const getHorarioLabel = (horario: string) => {
    const labels: Record<string, string> = {
      '10:00': '10h',
      '17:00': '17h',
      '19:00': '19h',
    }
    return labels[horario] || horario
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
          <p className="text-[var(--foreground-muted)]">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Erro ao carregar relatórios</p>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Botão voltar */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Título */}
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Relatórios</h1>
              <p className="text-[var(--foreground-muted)]">Visão geral da sua igreja</p>
            </div>
            <button
              onClick={() => {
                if (dados) {
                  generateRelatoriosPDF(dados)
                  toast.success('PDF gerado com sucesso!')
                }
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <FileDown className="w-5 h-5" />
              Exportar PDF
            </button>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-4 text-center">
              <Users className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gradient">{dados.totalMembros}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Total Membros</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-600">{dados.membrosGrupoPequeno}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Grupo Pequeno</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-orange-600">{dados.ausentes.length}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Ausentes</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <Cake className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-pink-600">{dados.aniversariantes.length}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Aniversariantes</p>
            </div>
          </div>

          {/* Gráfico de barras - Frequência por horário */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Clock className="w-5 h-5 text-amber-600" />
              Média de Presença por Culto
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados.mediaFrequencia.map(f => ({ ...f, name: getHorarioLabel(f.horario) }))}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--foreground-muted)' }} />
                  <YAxis tick={{ fill: 'var(--foreground-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="media" fill="url(#gradientBar)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de linha - Histórico de presença */}
          {dados.cultosRecentes.length > 0 && (
            <div className="glass-card rounded-2xl p-6 animate-fade-in">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Tendência de Presença
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...dados.cultosRecentes].reverse().map(c => ({
                    data: new Date(c.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                    presentes: c.presentes,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="data" tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--foreground-muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="presentes"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, fill: '#059669' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Gráfico de pizza - Distribuição */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 animate-fade-in">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Users className="w-5 h-5 text-amber-600" />
                Distribuição de Membros
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Grupo Pequeno', value: dados.membrosGrupoPequeno, color: '#10b981' },
                        { name: 'Regular', value: dados.totalMembros - dados.membrosGrupoPequeno, color: '#f59e0b' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-[var(--foreground-muted)]">Grupo Pequeno</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-[var(--foreground-muted)]">Regular</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 animate-fade-in">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Status de Frequência
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Frequentes', value: dados.totalMembros - dados.ausentes.length, color: '#10b981' },
                        { name: 'Ausentes', value: dados.ausentes.length, color: '#f97316' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f97316" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-[var(--foreground-muted)]">Frequentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm text-[var(--foreground-muted)]">Ausentes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Aniversariantes da semana */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Cake className="w-5 h-5 text-pink-500" />
              Aniversariantes da Semana
            </h2>
            {dados.aniversariantes.length === 0 ? (
              <p className="text-[var(--foreground-muted)] text-center py-4">Nenhum aniversariante esta semana</p>
            ) : (
              <div className="space-y-3">
                {dados.aniversariantes.map(pessoa => (
                  <div key={pessoa.id} className="flex items-center gap-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-pink-300">
                      {pessoa.foto ? (
                        <img src={pessoa.foto} alt={pessoa.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-pink-200 dark:bg-pink-800 flex items-center justify-center text-pink-600 dark:text-pink-200 font-bold">
                          {pessoa.nome.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{pessoa.nome}</p>
                      <p className="text-sm text-pink-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatarData(pessoa.dataAniversario)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copiarMensagem('aniversario', pessoa.nome)}
                        className="p-2 text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-lg transition-colors"
                        title="Copiar mensagem"
                      >
                        {mensagemCopiada === pessoa.nome ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <a
                        href={`https://wa.me/55${pessoa.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Membros ausentes */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Ausentes há 2+ Domingos
            </h2>
            {dados.ausentes.length === 0 ? (
              <div className="text-center py-4">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">Todos os membros estão frequentes!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dados.ausentes.map(pessoa => (
                  <div key={pessoa.id} className="flex items-center gap-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-orange-300">
                      {pessoa.foto ? (
                        <img src={pessoa.foto} alt={pessoa.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-orange-200 dark:bg-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-200 font-bold">
                          {pessoa.nome.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{pessoa.nome}</p>
                      <p className="text-sm text-orange-600">
                        {pessoa.ultimaPresenca
                          ? `Última: ${formatarData(pessoa.ultimaPresenca)}`
                          : 'Nunca registrou'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copiarMensagem('ausencia', pessoa.nome)}
                        className="p-2 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                        title="Copiar mensagem"
                      >
                        {mensagemCopiada === pessoa.nome ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <a
                        href={`https://wa.me/55${pessoa.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico de cultos recentes */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Calendar className="w-5 h-5 text-amber-600" />
              Cultos Recentes
            </h2>
            {dados.cultosRecentes.length === 0 ? (
              <p className="text-[var(--foreground-muted)] text-center py-4">Nenhum culto registrado</p>
            ) : (
              <div className="space-y-2">
                {dados.cultosRecentes.map(culto => (
                  <div key={culto.id} className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-betania rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {getHorarioLabel(culto.horario)}
                      </div>
                      <span className="text-sm">
                        {new Date(culto.data).toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[var(--foreground-muted)]" />
                      <span className="font-bold text-gradient">{culto.presentes}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
