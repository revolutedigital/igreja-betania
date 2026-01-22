import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChamadaGrid from '@/components/ChamadaGrid'
import * as offline from '@/lib/offline'
import { setOffline, setOnline } from '../../__mocks__/navigator'

// Mock das funções offline
vi.mock('@/lib/offline', () => ({
  getMembrosOffline: vi.fn(),
  saveMembrosOffline: vi.fn(),
  getPresencasByCultoOffline: vi.fn(),
  savePresencaOffline: vi.fn(),
  deletePresencaOffline: vi.fn(),
}))

// Mock do react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}))

const mockMembros = [
  { id: '1', nome: 'Ana Silva', foto: null },
  { id: '2', nome: 'Bruno Santos', foto: 'data:image/jpeg;base64,abc' },
  { id: '3', nome: 'Carla Oliveira', foto: null },
]

const mockPresencas = [
  { membroId: '1', cultoId: 'culto-1', presente: true },
]

describe('ChamadaGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setOnline()

    // Setup fetch mock
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockMembros),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(mockPresencas),
      })
  })

  describe('Carregamento', () => {
    it('deve mostrar loading inicial', () => {
      render(<ChamadaGrid cultoId="culto-1" />)
      expect(screen.getByText('Carregando membros...')).toBeInTheDocument()
    })

    it('deve carregar membros da API quando online', async () => {
      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('Ana Silva')).toBeInTheDocument()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/membros')
      expect(offline.saveMembrosOffline).toHaveBeenCalledWith(mockMembros)
    })

    it('deve carregar do IndexedDB quando offline', async () => {
      setOffline()
      vi.mocked(offline.getMembrosOffline).mockResolvedValue(mockMembros)
      vi.mocked(offline.getPresencasByCultoOffline).mockResolvedValue([])

      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('Ana Silva')).toBeInTheDocument()
      })

      expect(offline.getMembrosOffline).toHaveBeenCalled()
    })

    it('deve mostrar indicador offline', async () => {
      setOffline()
      vi.mocked(offline.getMembrosOffline).mockResolvedValue(mockMembros)
      vi.mocked(offline.getPresencasByCultoOffline).mockResolvedValue([])

      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('(offline)')).toBeInTheDocument()
      })
    })
  })

  describe('Busca', () => {
    it('deve filtrar membros por nome', async () => {
      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('Ana Silva')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Buscar membro...')
      await userEvent.type(searchInput, 'Bruno')

      expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument()
      expect(screen.getByText('Bruno Santos')).toBeInTheDocument()
    })

    it('deve ser case-insensitive na busca', async () => {
      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('Ana Silva')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Buscar membro...')
      await userEvent.type(searchInput, 'CARLA')

      expect(screen.getByText(/Carla/)).toBeInTheDocument()
    })

    it('deve mostrar mensagem quando nenhum membro encontrado', async () => {
      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('Ana Silva')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Buscar membro...')
      await userEvent.type(searchInput, 'xyz123')

      expect(screen.getByText('Nenhum membro encontrado')).toBeInTheDocument()
    })
  })

  describe('Presença', () => {
    it('deve mostrar membro presente com estilo diferente', async () => {
      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('Ana Silva')).toBeInTheDocument()
      })

      // Ana está presente no mock
      const anaCard = screen.getByText('Ana Silva').closest('button')
      expect(anaCard).toHaveClass('from-green-400')
    })

    it('deve atualizar contador de presentes', async () => {
      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // 1 presente
        expect(screen.getByText('/ 3')).toBeInTheDocument() // total 3
      })
    })

    it('deve marcar presença ao clicar quando online', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockMembros) })
        .mockResolvedValueOnce({ json: () => Promise.resolve([]) }) // sem presenças
        .mockResolvedValueOnce({ ok: true }) // POST presença

      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('Bruno Santos')).toBeInTheDocument()
      })

      const brunoCard = screen.getByText('Bruno Santos').closest('button')
      fireEvent.click(brunoCard!)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/presenca', expect.objectContaining({
          method: 'POST',
        }))
      })
    })

    it('deve salvar no IndexedDB quando offline', async () => {
      setOffline()
      vi.mocked(offline.getMembrosOffline).mockResolvedValue(mockMembros)
      vi.mocked(offline.getPresencasByCultoOffline).mockResolvedValue([])

      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('Bruno Santos')).toBeInTheDocument()
      })

      const brunoCard = screen.getByText('Bruno Santos').closest('button')
      fireEvent.click(brunoCard!)

      await waitFor(() => {
        expect(offline.savePresencaOffline).toHaveBeenCalled()
      })
    })

    it('deve vibrar ao marcar presença', async () => {
      const vibrateMock = vi.fn()
      Object.defineProperty(navigator, 'vibrate', { value: vibrateMock, writable: true })

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ json: () => Promise.resolve(mockMembros) })
        .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
        .mockResolvedValueOnce({ ok: true })

      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('Bruno Santos')).toBeInTheDocument()
      })

      const brunoCard = screen.getByText('Bruno Santos').closest('button')
      fireEvent.click(brunoCard!)

      expect(vibrateMock).toHaveBeenCalledWith(50)
    })
  })

  describe('UI', () => {
    it('deve mostrar foto do membro quando disponível', async () => {
      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        const img = screen.getByAltText('Bruno Santos')
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,abc')
      })
    })

    it('deve mostrar inicial quando não tem foto', async () => {
      render(<ChamadaGrid cultoId="culto-1" />)

      await waitFor(() => {
        expect(screen.getByText('A')).toBeInTheDocument() // Ana
        expect(screen.getByText('C')).toBeInTheDocument() // Carla
      })
    })
  })
})
