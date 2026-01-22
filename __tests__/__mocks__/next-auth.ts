import { vi } from 'vitest'
import type { Session } from 'next-auth'

export const mockSession: Session = {
  user: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@igreja.com',
    role: 'admin',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const useSessionMock = vi.fn(() => ({
  data: mockSession,
  status: 'authenticated' as const,
  update: vi.fn(),
}))

export const signInMock = vi.fn()
export const signOutMock = vi.fn()

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: useSessionMock,
  signIn: signInMock,
  signOut: signOutMock,
}))

export function setUnauthenticated() {
  useSessionMock.mockReturnValue({
    data: null,
    status: 'unauthenticated' as const,
    update: vi.fn(),
  })
}

export function setAuthenticated(session: Session = mockSession) {
  useSessionMock.mockReturnValue({
    data: session,
    status: 'authenticated' as const,
    update: vi.fn(),
  })
}

export function setLoading() {
  useSessionMock.mockReturnValue({
    data: null,
    status: 'loading' as const,
    update: vi.fn(),
  })
}
