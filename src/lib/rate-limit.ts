import { NextResponse } from 'next/server'

// ============================================
// RATE LIMITING - In-Memory (sem dependência externa)
// Para produção com múltiplas instâncias, use Redis
// ============================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Limpa a cada minuto

interface RateLimitConfig {
  limit: number      // Número máximo de requests
  window: number     // Janela de tempo em segundos
}

const defaultConfig: RateLimitConfig = {
  limit: 100,
  window: 60, // 100 requests por minuto
}

// Configurações específicas por rota
const routeConfigs: Record<string, RateLimitConfig> = {
  '/api/auth/registro': { limit: 5, window: 60 },      // 5 registros por minuto
  '/api/auth/[...nextauth]': { limit: 10, window: 60 }, // 10 logins por minuto
  '/api/membros': { limit: 60, window: 60 },           // 60 requests por minuto
  '/api/presenca': { limit: 120, window: 60 },         // 120 requests por minuto (chamada é frequente)
  '/api/whatsapp': { limit: 10, window: 60 },          // 10 mensagens por minuto
  '/api/push': { limit: 20, window: 60 },              // 20 requests por minuto
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  return 'unknown'
}

export function rateLimit(
  request: Request,
  routePath?: string
): { success: true } | { success: false; response: NextResponse } {
  const ip = getClientIP(request)
  const path = routePath || new URL(request.url).pathname

  // Encontra config específica ou usa default
  const config = Object.entries(routeConfigs).find(([route]) =>
    path.startsWith(route.replace('[...nextauth]', ''))
  )?.[1] || defaultConfig

  const key = `${ip}:${path}`
  const now = Date.now()
  const windowMs = config.window * 1000

  let entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // Nova janela
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)
    return { success: true }
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Muitas requisições. Tente novamente em breve.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          }
        }
      )
    }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  return { success: true }
}

// Middleware helper para usar em API routes
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  routePath?: string
) {
  return async (request: Request) => {
    const rateLimitResult = rateLimit(request, routePath)

    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    return handler(request)
  }
}
