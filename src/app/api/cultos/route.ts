import { prisma } from '@/lib/prisma'
import { createHandler, apiSuccess, apiError, logger } from '@/lib/api-utils'
import { cultoSchema } from '@/lib/validations'

export const GET = createHandler(
  { rateLimit: true },
  async (request, { ip }) => {
    logger.info('Buscando cultos', { ip })

    const cultos = await prisma.culto.findMany({
      orderBy: { data: 'desc' },
      include: {
        _count: {
          select: { presencas: true },
        },
      },
    })

    return apiSuccess(cultos)
  }
)

export const POST = createHandler(
  { rateLimit: true, schema: cultoSchema },
  async (request, { body, ip }) => {
    const { data, horario } = body as { data: string; horario: string }

    logger.info('Criando culto', { data, horario, ip })

    // Verifica se já existe culto nessa data/horário
    const cultoExistente = await prisma.culto.findFirst({
      where: {
        data: new Date(data),
        horario,
      },
    })

    if (cultoExistente) {
      logger.info('Culto existente retornado', { id: cultoExistente.id })
      return apiSuccess(cultoExistente)
    }

    const culto = await prisma.culto.create({
      data: {
        data: new Date(data),
        horario,
      },
    })

    logger.info('Culto criado', { id: culto.id })

    return apiSuccess(culto, 201)
  }
)
