import { prisma } from '@/lib/prisma'
import { createHandler, apiSuccess, apiError, logger } from '@/lib/api-utils'
import { presencaSchema } from '@/lib/validations'
import { z } from 'zod'

export const GET = createHandler(
  { rateLimit: true },
  async (request, { ip }) => {
    const { searchParams } = new URL(request.url)
    const cultoId = searchParams.get('cultoId')

    if (!cultoId) {
      return apiError('ID do culto é obrigatório', 400)
    }

    // Validar CUID
    const validation = z.string().cuid().safeParse(cultoId)
    if (!validation.success) {
      return apiError('ID do culto inválido', 400)
    }

    logger.debug('Buscando presenças', { cultoId, ip })

    const presencas = await prisma.presenca.findMany({
      where: { cultoId },
      include: {
        membro: {
          select: {
            id: true,
            nome: true,
            foto: true,
            whatsapp: true,
          }
        }
      },
    })

    return apiSuccess(presencas)
  }
)

export const POST = createHandler(
  { rateLimit: true, schema: presencaSchema },
  async (request, { body, ip }) => {
    const { membroId, cultoId, presente } = body as z.infer<typeof presencaSchema>

    logger.info('Registrando presença', { membroId, cultoId, presente, ip })

    // Verificar se membro e culto existem
    const [membro, culto] = await Promise.all([
      prisma.membro.findUnique({ where: { id: membroId } }),
      prisma.culto.findUnique({ where: { id: cultoId } }),
    ])

    if (!membro) {
      return apiError('Membro não encontrado', 404)
    }

    if (!culto) {
      return apiError('Culto não encontrado', 404)
    }

    // Usa upsert para criar ou atualizar a presença
    const presenca = await prisma.presenca.upsert({
      where: {
        membroId_cultoId: {
          membroId,
          cultoId,
        },
      },
      update: {
        presente,
      },
      create: {
        membroId,
        cultoId,
        presente,
      },
      include: {
        membro: {
          select: { id: true, nome: true }
        }
      }
    })

    logger.info('Presença registrada', { id: presenca.id, presente: presenca.presente })

    return apiSuccess(presenca)
  }
)

export const DELETE = createHandler(
  { rateLimit: true },
  async (request, { ip }) => {
    const { searchParams } = new URL(request.url)
    const membroId = searchParams.get('membroId')
    const cultoId = searchParams.get('cultoId')

    if (!membroId || !cultoId) {
      return apiError('ID do membro e do culto são obrigatórios', 400)
    }

    // Validar CUIDs
    const membroValidation = z.string().cuid().safeParse(membroId)
    const cultoValidation = z.string().cuid().safeParse(cultoId)

    if (!membroValidation.success || !cultoValidation.success) {
      return apiError('IDs inválidos', 400)
    }

    logger.info('Removendo presença', { membroId, cultoId, ip })

    try {
      await prisma.presenca.delete({
        where: {
          membroId_cultoId: {
            membroId,
            cultoId,
          },
        },
      })

      return apiSuccess({ deleted: true })
    } catch {
      return apiError('Presença não encontrada', 404)
    }
  }
)
