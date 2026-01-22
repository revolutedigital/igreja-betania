import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'

// Mock do next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Modal de Ajuda', () => {
    it('deve mostrar help ao pressionar ?', () => {
      render(<KeyboardShortcuts />)

      act(() => {
        fireEvent.keyDown(document, { key: '?' })
      })

      expect(screen.getByText('Atalhos de Teclado')).toBeInTheDocument()
    })

    it('deve fechar help ao pressionar Escape', () => {
      render(<KeyboardShortcuts />)

      // Abrir
      act(() => {
        fireEvent.keyDown(document, { key: '?' })
      })

      expect(screen.getByText('Atalhos de Teclado')).toBeInTheDocument()

      // Fechar
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' })
      })

      expect(screen.queryByText('Atalhos de Teclado')).not.toBeInTheDocument()
    })

    it('deve fechar help ao clicar no X', () => {
      render(<KeyboardShortcuts />)

      act(() => {
        fireEvent.keyDown(document, { key: '?' })
      })

      const closeButton = screen.getByRole('button')
      fireEvent.click(closeButton)

      expect(screen.queryByText('Atalhos de Teclado')).not.toBeInTheDocument()
    })
  })

  describe('Navegação com g + tecla', () => {
    it('deve navegar para home com g+h', () => {
      render(<KeyboardShortcuts />)

      act(() => {
        fireEvent.keyDown(document, { key: 'g' })
      })

      act(() => {
        fireEvent.keyDown(document, { key: 'h' })
      })

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('deve navegar para admin com g+a', () => {
      render(<KeyboardShortcuts />)

      act(() => {
        fireEvent.keyDown(document, { key: 'g' })
      })

      act(() => {
        fireEvent.keyDown(document, { key: 'a' })
      })

      expect(mockPush).toHaveBeenCalledWith('/admin')
    })

    it('deve navegar para chamada com g+c', () => {
      render(<KeyboardShortcuts />)

      act(() => {
        fireEvent.keyDown(document, { key: 'g' })
      })

      act(() => {
        fireEvent.keyDown(document, { key: 'c' })
      })

      expect(mockPush).toHaveBeenCalledWith('/admin/chamada')
    })

    it('deve navegar para membros com g+m', () => {
      render(<KeyboardShortcuts />)

      act(() => {
        fireEvent.keyDown(document, { key: 'g' })
      })

      act(() => {
        fireEvent.keyDown(document, { key: 'm' })
      })

      expect(mockPush).toHaveBeenCalledWith('/admin/membros')
    })

    it('deve navegar para relatórios com g+r', () => {
      render(<KeyboardShortcuts />)

      act(() => {
        fireEvent.keyDown(document, { key: 'g' })
      })

      act(() => {
        fireEvent.keyDown(document, { key: 'r' })
      })

      expect(mockPush).toHaveBeenCalledWith('/admin/relatorios')
    })

    it('deve navegar para cadastro com g+n', () => {
      render(<KeyboardShortcuts />)

      act(() => {
        fireEvent.keyDown(document, { key: 'g' })
      })

      act(() => {
        fireEvent.keyDown(document, { key: 'n' })
      })

      expect(mockPush).toHaveBeenCalledWith('/cadastro')
    })

    it('deve expirar após 1 segundo sem segunda tecla', () => {
      render(<KeyboardShortcuts />)

      act(() => {
        fireEvent.keyDown(document, { key: 'g' })
      })

      act(() => {
        vi.advanceTimersByTime(1100)
      })

      act(() => {
        fireEvent.keyDown(document, { key: 'h' })
      })

      // Não deve navegar pois o timeout expirou
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Ignorar em inputs', () => {
    it('não deve processar atalhos quando em input', () => {
      render(
        <>
          <input data-testid="test-input" />
          <KeyboardShortcuts />
        </>
      )

      const input = screen.getByTestId('test-input')
      input.focus()

      // Simular que o activeElement é um INPUT
      Object.defineProperty(document, 'activeElement', {
        value: input,
        configurable: true,
      })

      act(() => {
        fireEvent.keyDown(input, { key: '?' })
      })

      expect(screen.queryByText('Atalhos de Teclado')).not.toBeInTheDocument()
    })
  })
})
