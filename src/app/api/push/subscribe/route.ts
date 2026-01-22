import { prisma } from '@/lib/prisma'
import { createHandler, apiSuccess, apiError, logger } from '@/lib/api-utils'
import { pushSubscriptionSchema } from '@/lib/validations'

export const POST = createHandler(
  { rateLimit: true, schema: pushSubscriptionSchema },
  async (_request, { body, ip }) => {
    const subscription = body as {
      endpoint: string
      keys: {
        p256dh: string
        auth: string
      }
    }

    logger.info('Registrando push subscription', { ip })

    // Salvar no banco de dados (upsert para evitar duplicatas)
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })

    logger.info('Push subscription registrada', { ip })

    return apiSuccess({ success: true }, 201)
  }
)

export const GET = createHandler(
  { rateLimit: true },
  async (_request, { ip }) => {
    logger.info('Contando push subscriptions', { ip })

    const count = await prisma.pushSubscription.count()

    return apiSuccess({ count })
  }
)
