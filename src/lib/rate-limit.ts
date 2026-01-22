import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ============================================
// RATE LIMITING - Upstash Redis (Production-Ready)
// Funciona com múltiplas instâncias e serverless
// ============================================

// Configuração do Redis (usa variáveis de ambiente se disponíveis)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Fallback in-memory para desenvolvimento local
interface RateLimitEntry {
  count: number
  resetTime: number
}

const inMemoryStore = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas periodicamente (fallback)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of inMemoryStore.entries()) {
      if (now > entry.resetTime) {
        inMemoryStore.delete(key)
      }
    }
  }, 60000)
}

interface RateLimitConfig {
  limit: number      // Número máximo de requests
  window: number     // Janela de tempo em segundos
}

const defaultConfig: RateLimitConfig = {
  limit: 100,
  window: 60,
}

// Configurações específicas por rota
const routeConfigs: Record<string, RateLimitConfig> = {
  '/api/auth/registro': { limit: 5, window: 60 },
  '/api/auth/[...nextauth]': { limit: 10, window: 60 },
  '/api/membros': { limit: 60, window: 60 },
  '/api/presenca': { limit: 120, window: 60 },
  '/api/whatsapp': { limit: 10, window: 60 },
  '/api/push': { limit: 20, window: 60 },
  '/api/relatorios': { limit: 30, window: 60 },
  '/api/cultos': { limit: 60, window: 60 },
}

// Cache de rate limiters do Upstash
const rateLimiters = new Map<string, Ratelimit>()

function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redis) return null

  const key = `${config.limit}-${config.window}`

  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.window} s`),
      analytics: true,
      prefix: 'igreja-betania',
    }))
  }

  return rateLimiters.get(key)!
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')

  if (cfIP) return cfIP
  if (forwarded) return forwarded.split(',')[0].trim()
  if (realIP) return realIP
  return 'unknown'
}

// Rate limit in-memory (fallback)
function rateLimitInMemory(
  ip: string,
  path: string,
  config: RateLimitConfig
): { success: true } | { success: false; response: NextResponse } {
  const key = `${ip}:${path}`
  const now = Date.now()
  const windowMs = config.window * 1000

  let entry = inMemoryStore.get(key)

  if (!entry || now > entry.resetTime) {
    entry = { count: 1, resetTime: now + windowMs }
    inMemoryStore.set(key, entry)
    return { success: true }
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em breve.', retryAfter },
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
  inMemoryStore.set(key, entry)
  return { success: true }
}

export async function rateLimitAsync(
  request: Request,
  routePath?: string
): Promise<{ success: true } | { success: false; response: NextResponse }> {
  const ip = getClientIP(request)
  const path = routePath || new URL(request.url).pathname

  const config = Object.entries(routeConfigs).find(([route]) =>
    path.startsWith(route.replace('[...nextauth]', ''))
  )?.[1] || defaultConfig

  const limiter = getRateLimiter(config)

  // Se Redis não está configurado, usa fallback in-memory
  if (!limiter) {
    return rateLimitInMemory(ip, path, config)
  }

  // Rate limit com Upstash Redis
  const identifier = `${ip}:${path}`
  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em breve.', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }
  }

  return { success: true }
}

// Versão síncrona (fallback para compatibilidade)
export function rateLimit(
  request: Request,
  routePath?: string
): { success: true } | { success: false; response: NextResponse } {
  const ip = getClientIP(request)
  const path = routePath || new URL(request.url).pathname

  const config = Object.entries(routeConfigs).find(([route]) =>
    path.startsWith(route.replace('[...nextauth]', ''))
  )?.[1] || defaultConfig

  return rateLimitInMemory(ip, path, config)
}

// Middleware helper
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  routePath?: string
) {
  return async (request: Request) => {
    const rateLimitResult = await rateLimitAsync(request, routePath)

    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    return handler(request)
  }
}
