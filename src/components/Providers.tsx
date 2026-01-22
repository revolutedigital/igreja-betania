'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './ThemeProvider'
import { QueryProvider } from '@/lib/query-client'
import { ErrorBoundary } from './ErrorBoundary'
import PWAInstall from './PWAInstall'
import KeyboardShortcuts from './KeyboardShortcuts'
import ConnectionStatus from './ConnectionStatus'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <SessionProvider>
          <ThemeProvider>
            {children}
            <PWAInstall />
            <KeyboardShortcuts />
            <ConnectionStatus />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: 'white',
                  },
                },
              }}
            />
          </ThemeProvider>
        </SessionProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
