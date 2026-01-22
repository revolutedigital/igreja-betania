'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Check, Users, Loader2, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getMembrosOffline,
  saveMembrosOffline,
  getPresencasByCultoOffline,
  savePresencaOffline,
  deletePresencaOffline,
} from '@/lib/offline'

interface Membro {
  id: string
  nome: string
  foto: string | null
}

interface ChamadaGridProps {
  cultoId: string
}

export default function ChamadaGrid({ cultoId }: ChamadaGridProps) {
  const [membros, setMembros] = useState<Membro[]>([])
  const [presentes, setPresentes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [animatingId, setAnimatingId] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [cultoId])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (navigator.onLine) {
        // Online: buscar da API e salvar offline
        const membrosRes = await fetch('/api/membros')
        const membrosData = await membrosRes.json()
        setMembros(membrosData)

        // Salvar para uso offline
        await saveMembrosOffline(membrosData)

        const presencasRes = await fetch(`/api/presenca?cultoId=${cultoId}`)
        const presencasData = await presencasRes.json()

        const presentesSet = new Set<string>()
        presencasData.forEach((p: { membroId: string; presente: boolean }) => {
          if (p.presente) {
            presentesSet.add(p.membroId)
          }
        })
        setPresentes(presentesSet)
      } else {
        // Offline: buscar do IndexedDB
        const membrosOffline = await getMembrosOffline()
        setMembros(membrosOffline)

        const presencasOffline = await getPresencasByCultoOffline(cultoId)
        const presentesSet = new Set<string>()
        presencasOffline.forEach((p) => {
          if (p.presente) {
            presentesSet.add(p.membroId)
          }
        })
        setPresentes(presentesSet)

        toast('Modo offline - dados locais', { icon: '📴' })
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)

      // Tentar carregar do offline em caso de erro
      try {
        const membrosOffline = await getMembrosOffline()
        if (membrosOffline.length > 0) {
          setMembros(membrosOffline)
          toast('Usando dados offline', { icon: '📴' })
        } else {
          toast.error('Erro ao carregar membros')
        }
      } catch {
        toast.error('Erro ao carregar membros')
      }
    } finally {
      setLoading(false)
    }
  }

  const triggerHapticFeedback = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }, [])

  const togglePresenca = async (membroId: string, nomesMembro: string) => {
    const estaPresente = presentes.has(membroId)

    // Feedback tátil
    triggerHapticFeedback()

    // Animação
    setAnimatingId(membroId)
    setTimeout(() => setAnimatingId(null), 300)

    const novoPresentes = new Set(presentes)
    if (estaPresente) {
      novoPresentes.delete(membroId)
    } else {
      novoPresentes.add(membroId)
    }
    setPresentes(novoPresentes)

    try {
      if (navigator.onLine) {
        // Online: enviar para API
        if (estaPresente) {
          await fetch(`/api/presenca?membroId=${membroId}&cultoId=${cultoId}`, {
            method: 'DELETE',
          })
        } else {
          await fetch('/api/presenca', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ membroId, cultoId, presente: true }),
          })
        }
      } else {
        // Offline: salvar localmente
        if (estaPresente) {
          await deletePresencaOffline(membroId, cultoId)
        } else {
          await savePresencaOffline({
            id: `${membroId}-${cultoId}-${Date.now()}`,
            membroId,
            cultoId,
            presente: true,
          })
        }
      }

      if (estaPresente) {
        toast(`${nomesMembro.split(' ')[0]} removido`, { icon: '👋' })
      } else {
        toast.success(`${nomesMembro.split(' ')[0]} presente!`)
      }
    } catch (error) {
      console.error('Erro ao atualizar presença:', error)
      setPresentes(presentes)
      toast.error('Erro ao atualizar presença')
    }
  }

  const membrosFiltrados = membros.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <p className="text-[var(--foreground-muted)]">Carregando membros...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Buscar membro..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Contador */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-center gap-3">
        {isOffline && (
          <WifiOff className="w-5 h-5 text-orange-500" />
        )}
        <Users className="w-5 h-5 text-amber-600" />
        <span className="text-lg font-semibold">
          Presentes: <span className="text-green-600">{presentes.size}</span>
          <span className="text-[var(--foreground-muted)]"> / {membros.length}</span>
        </span>
        {isOffline && (
          <span className="text-xs text-orange-500 ml-2">(offline)</span>
        )}
      </div>

      {/* Grid de membros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {membrosFiltrados.map((membro, index) => {
          const isPresente = presentes.has(membro.id)
          const isAnimating = animatingId === membro.id
          return (
            <button
              key={membro.id}
              onClick={() => togglePresenca(membro.id, membro.nome)}
              className={`relative flex flex-col items-center p-4 rounded-2xl transition-all transform hover:scale-105 animate-fade-in ${
                isPresente
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                  : 'glass-card hover:shadow-lg'
              } ${isAnimating ? 'scale-110' : ''}`}
              style={{ animationDelay: `${index * 0.02}s` }}
            >
              {/* Indicador de check */}
              {isPresente && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              )}

              {/* Foto */}
              <div
                className={`w-16 h-16 rounded-full overflow-hidden mb-3 ${
                  isPresente ? 'ring-4 ring-white/50' : 'ring-2 ring-amber-200'
                }`}
              >
                {membro.foto ? (
                  <img
                    src={membro.foto}
                    alt={membro.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-xl font-bold ${
                    isPresente ? 'bg-white/20 text-white' : 'bg-gradient-warm text-amber-700'
                  }`}>
                    {membro.nome.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Nome */}
              <span className={`text-sm font-medium text-center line-clamp-2 ${
                isPresente ? 'text-white' : ''
              }`}>
                {membro.nome.split(' ').slice(0, 2).join(' ')}
              </span>
            </button>
          )
        })}
      </div>

      {membrosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--foreground-muted)]">Nenhum membro encontrado</p>
        </div>
      )}
    </div>
  )
}
