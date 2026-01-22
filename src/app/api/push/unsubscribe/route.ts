import { prisma } from '@/lib/prisma'
import { createHandler, apiSuccess, apiError, logger } from '@/lib/api-utils'
import { z } from 'zod'

const unsubscribeSchema = z.object({
  endpoint: z.string().url('Endpoint inválido'),
})

export const POST = createHandler(
  { rateLimit: true, schema: unsubscribeSchema },
  async (_request, { body, ip }) => {
    const { endpoint } = body as { endpoint: string }

    logger.info('Removendo push subscription', { ip })

    // Remover do banco de dados
    const deleted = await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    })

    if (deleted.count === 0) {
      logger.warn('Subscription não encontrada', { ip })
      return apiError('Subscription não encontrada', 404)
    }

    logger.info('Push subscription removida', { ip })

    return apiSuccess({ success: true })
  }
)
