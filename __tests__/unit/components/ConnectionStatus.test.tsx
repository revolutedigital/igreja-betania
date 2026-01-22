import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ConnectionStatus from '@/components/ConnectionStatus'

describe('ConnectionStatus', () => {
  let originalOnLine: boolean

  beforeEach(() => {
    vi.useFakeTimers()
    originalOnLine = navigator.onLine
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
    })
  })

  it('não deve renderizar por padrão quando online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    render(<ConnectionStatus />)

    expect(screen.queryByText('Sem conexão')).not.toBeInTheDocument()
    expect(screen.queryByText('Conectado')).not.toBeInTheDocument()
  })

  it('deve mostrar "Sem conexão" quando offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    render(<ConnectionStatus />)

    // Simular evento offline
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
  })

  it('deve mostrar "Conectado" quando volta online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    render(<ConnectionStatus />)

    // Simular offline primeiro
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByText('Sem conexão')).toBeInTheDocument()

    // Simular volta online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.getByText('Conectado')).toBeInTheDocument()
  })

  it('deve esconder após 3 segundos quando online', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    render(<ConnectionStatus />)

    // Offline
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    // Online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.getByText('Conectado')).toBeInTheDocument()

    // Avançar 3 segundos
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText('Conectado')).not.toBeInTheDocument()
  })

  it('deve manter visível enquanto offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    render(<ConnectionStatus />)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    // Avançar muito tempo
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(screen.getByText('Sem conexão')).toBeInTheDocument()
  })
})
