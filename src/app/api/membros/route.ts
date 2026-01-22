import { prisma } from '@/lib/prisma'
import { createHandler, apiSuccess, apiError, logger } from '@/lib/api-utils'
import { membroSchema, parsePagination, createPaginatedResponse } from '@/lib/validations'

export const GET = createHandler(
  { rateLimit: true },
  async (request, { ip }) => {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')
    const pagination = parsePagination(searchParams)
    const all = searchParams.get('all') === 'true' // Para chamada (precisa de todos)

    logger.info('Buscando membros', { busca, pagination, all, ip })

    const where = busca
      ? {
          nome: {
            contains: busca,
            mode: 'insensitive' as const,
          },
        }
      : undefined

    // Se all=true, retorna todos (para ChamadaGrid que precisa de todos)
    if (all) {
      const membros = await prisma.membro.findMany({
        where,
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          foto: true,
          whatsapp: true,
          dataAniversario: true,
          endereco: true,
          grupoPequeno: true,
          nomePai: true,
          nomeMae: true,
          createdAt: true,
        },
      })

      return apiSuccess(membros)
    }

    // Paginação para listagens administrativas
    const [membros, total] = await Promise.all([
      prisma.membro.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        select: {
          id: true,
          nome: true,
          foto: true,
          whatsapp: true,
          dataAniversario: true,
          endereco: true,
          grupoPequeno: true,
          nomePai: true,
          nomeMae: true,
          createdAt: true,
        },
      }),
      prisma.membro.count({ where }),
    ])

    return apiSuccess(createPaginatedResponse(membros, total, pagination))
  }
)

export const POST = createHandler(
  { rateLimit: true, schema: membroSchema },
  async (request, { body, ip }) => {
    const data = body as {
      nome: string
      foto?: string | null
      nomePai?: string | null
      nomeMae?: string | null
      whatsapp: string
      dataAniversario?: string | null
      endereco?: string | null
      grupoPequeno?: boolean
    }

    logger.info('Criando membro', { nome: data.nome, ip })

    // Verificar duplicado por WhatsApp
    const existente = await prisma.membro.findFirst({
      where: { whatsapp: data.whatsapp },
    })

    if (existente) {
      return apiError('Já existe um membro com este WhatsApp', 409)
    }

    const membro = await prisma.membro.create({
      data: {
        nome: data.nome,
        foto: data.foto || null,
        nomePai: data.nomePai || null,
        nomeMae: data.nomeMae || null,
        whatsapp: data.whatsapp,
        dataAniversario: data.dataAniversario ? new Date(data.dataAniversario) : null,
        endereco: data.endereco || null,
        grupoPequeno: data.grupoPequeno || false,
      },
    })

    logger.info('Membro criado', { id: membro.id, nome: membro.nome })

    return apiSuccess(membro, 201)
  }
)
