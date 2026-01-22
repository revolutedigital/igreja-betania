'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// ============================================
// HOOKS DE API COM REACT QUERY
// ============================================

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  const json: ApiResponse<T> = await response.json()

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Erro ao buscar dados')
  }

  return json.data as T
}

async function mutator<T, B = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: B
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json: ApiResponse<T> = await response.json()

  if (!response.ok || !json.success) {
    throw new Error(json.error || 'Erro ao processar requisição')
  }

  return json.data as T
}

// ============================================
// MEMBROS
// ============================================

export interface Membro {
  id: string
  nome: string
  foto: string | null
  whatsapp: string
  dataAniversario: string | null
  endereco: string | null
  grupoPequeno: boolean
  nomePai: string | null
  nomeMae: string | null
  createdAt: string
}

export function useMembros(busca?: string) {
  const url = busca ? `/api/membros?busca=${encodeURIComponent(busca)}` : '/api/membros'

  return useQuery({
    queryKey: ['membros', busca],
    queryFn: () => fetcher<Membro[]>(url),
    staleTime: 30 * 1000, // 30 segundos
  })
}

export function useMembro(id: string) {
  return useQuery({
    queryKey: ['membro', id],
    queryFn: () => fetcher<Membro>(`/api/membros/${id}`),
    enabled: !!id,
  })
}

export function useCreateMembro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<Membro, 'id' | 'createdAt'>) =>
      mutator<Membro>('/api/membros', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membros'] })
      toast.success('Membro cadastrado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateMembro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Membro> }) =>
      mutator<Membro>(`/api/membros/${id}`, 'PUT', data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['membros'] })
      queryClient.invalidateQueries({ queryKey: ['membro', id] })
      toast.success('Membro atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteMembro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => mutator<{ deleted: boolean }>(`/api/membros/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membros'] })
      toast.success('Membro excluído!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// ============================================
// PRESENÇAS
// ============================================

export interface Presenca {
  id: string
  membroId: string
  cultoId: string
  presente: boolean
  createdAt: string
  membro?: {
    id: string
    nome: string
    foto: string | null
    whatsapp: string
  }
}

export function usePresencas(cultoId: string) {
  return useQuery({
    queryKey: ['presencas', cultoId],
    queryFn: () => fetcher<Presenca[]>(`/api/presenca?cultoId=${cultoId}`),
    enabled: !!cultoId,
    staleTime: 10 * 1000, // 10 segundos
  })
}

export function useTogglePresenca() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { membroId: string; cultoId: string; presente: boolean }) =>
      mutator<Presenca>('/api/presenca', 'POST', data),
    onSuccess: (_, { cultoId }) => {
      queryClient.invalidateQueries({ queryKey: ['presencas', cultoId] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// ============================================
// CULTOS
// ============================================

export interface Culto {
  id: string
  data: string
  horario: string
  createdAt: string
  _count?: {
    presencas: number
  }
}

export function useCultos() {
  return useQuery({
    queryKey: ['cultos'],
    queryFn: () => fetcher<Culto[]>('/api/cultos'),
    staleTime: 60 * 1000, // 1 minuto
  })
}

export function useCreateCulto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { data: string; horario: string }) =>
      mutator<Culto>('/api/cultos', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cultos'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// ============================================
// RELATÓRIOS
// ============================================

export interface Relatorio {
  totalMembros: number
  membrosAtivos: number
  totalCultos: number
  mediaPresenca: number
  frequenciaPorCulto: Array<{
    data: string
    horario: string
    presentes: number
    total: number
  }>
  membrosAusentes: Array<{
    id: string
    nome: string
    whatsapp: string
    ultimaPresenca: string | null
  }>
  aniversariantes: Array<{
    id: string
    nome: string
    dataAniversario: string
  }>
}

export function useRelatorio() {
  return useQuery({
    queryKey: ['relatorio'],
    queryFn: () => fetcher<Relatorio>('/api/relatorios'),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
