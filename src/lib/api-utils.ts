import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { z } from 'zod'

// ============================================
// UTILITÁRIOS DE API - Resposta Padronizada
// ============================================

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  meta?: {
    timestamp: string
    requestId: string
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    }
  }, { status })
}

export function apiError(error: string, status = 400): NextResponse<ApiResponse> {
  console.error(`[API Error] ${status}: ${error}`)

  return NextResponse.json({
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    }
  }, { status })
}

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================

type UserSession = {
  user: {
    id: string
    email: string
    role: string
    nome: string
  }
}

export async function requireAuth(_request: Request): Promise<
  { authenticated: true; session: UserSession } |
  { authenticated: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return {
      authenticated: false,
      response: apiError('Não autorizado', 401)
    }
  }

  // Extrair dados do user com fallbacks
  const user = session.user as { id?: string; email?: string | null; role?: string; name?: string | null }

  return {
    authenticated: true,
    session: {
      user: {
        id: user.id || '',
        email: user.email || '',
        role: user.role || 'voluntario',
        nome: user.name || '',
      }
    }
  }
}

export async function requireAdmin(request: Request): Promise<
  { authenticated: true; session: UserSession } |
  { authenticated: false; response: NextResponse }
> {
  const authResult = await requireAuth(request)

  if (!authResult.authenticated) {
    return authResult
  }

  if (authResult.session.user.role !== 'admin') {
    return {
      authenticated: false,
      response: apiError('Acesso negado. Apenas administradores.', 403)
    }
  }

  return authResult
}

// ============================================
// HANDLER COM MIDDLEWARES INTEGRADOS
// ============================================

interface HandlerOptions {
  requireAuth?: boolean
  requireAdmin?: boolean
  rateLimit?: boolean
  schema?: z.ZodSchema
}

type HandlerContext = {
  session?: UserSession
  body?: unknown
  ip: string
}

export function createHandler(
  options: HandlerOptions,
  handler: (request: Request, context: HandlerContext) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    const ip = getClientIP(request)

    try {
      // Rate limiting
      if (options.rateLimit !== false) {
        const rateLimitResult = rateLimit(request)
        if (!rateLimitResult.success) {
          return rateLimitResult.response
        }
      }

      // Autenticação
      let session: UserSession | undefined

      if (options.requireAdmin) {
        const authResult = await requireAdmin(request)
        if (!authResult.authenticated) {
          return authResult.response
        }
        session = authResult.session
      } else if (options.requireAuth) {
        const authResult = await requireAuth(request)
        if (!authResult.authenticated) {
          return authResult.response
        }
        session = authResult.session
      }

      // Validação do body
      let body: unknown

      if (options.schema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const rawBody = await request.json()
          const result = options.schema.safeParse(rawBody)

          if (!result.success) {
            const errorMessages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
            return apiError(`Validação falhou: ${errorMessages}`, 400)
          }

          body = result.data
        } catch {
          return apiError('Body inválido', 400)
        }
      }

      // Executa o handler
      return await handler(request, { session, body, ip })

    } catch (error) {
      console.error('[API Unhandled Error]', error)

      if (error instanceof Error) {
        // Não expor detalhes de erro interno em produção
        const message = process.env.NODE_ENV === 'development'
          ? error.message
          : 'Erro interno do servidor'

        return apiError(message, 500)
      }

      return apiError('Erro interno do servidor', 500)
    }
  }
}

// ============================================
// LOGGING ESTRUTURADO
// ============================================

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: Record<string, unknown>
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry)
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(formatLog({ level: 'info', message, timestamp: new Date().toISOString(), data }))
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(formatLog({ level: 'warn', message, timestamp: new Date().toISOString(), data }))
  },
  error: (message: string, data?: Record<string, unknown>) => {
    console.error(formatLog({ level: 'error', message, timestamp: new Date().toISOString(), data }))
  },
  debug: (message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog({ level: 'debug', message, timestamp: new Date().toISOString(), data }))
    }
  },
}
