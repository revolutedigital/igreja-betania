import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { apiSuccess, apiError, logger } from '@/lib/api-utils'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { membroSchema } from '@/lib/validations'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request)

  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    const { id } = await params

    logger.info('Buscando membro por ID', { id, ip })

    const membro = await prisma.membro.findUnique({
      where: { id },
      include: {
        presencas: {
          include: { culto: true },
          orderBy: { culto: { data: 'desc' } },
        },
      },
    })

    if (!membro) {
      return apiError('Membro não encontrado', 404)
    }

    return apiSuccess(membro)
  } catch (error) {
    logger.error('Erro ao buscar membro', { error: String(error), ip })
    return apiError('Erro ao buscar membro', 500)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request)

  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    const { id } = await params

    // Validação do body
    let body
    try {
      const rawBody = await request.json()
      const result = membroSchema.safeParse(rawBody)

      if (!result.success) {
        const errorMessages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
        return apiError(`Validação falhou: ${errorMessages}`, 400)
      }

      body = result.data
    } catch {
      return apiError('Body inválido', 400)
    }

    logger.info('Atualizando membro', { id, nome: body.nome, ip })

    // Verificar se membro existe
    const existente = await prisma.membro.findUnique({
      where: { id },
    })

    if (!existente) {
      return apiError('Membro não encontrado', 404)
    }

    // Verificar se WhatsApp já está em uso por outro membro
    const whatsappDuplicado = await prisma.membro.findFirst({
      where: {
        whatsapp: body.whatsapp,
        NOT: { id },
      },
    })

    if (whatsappDuplicado) {
      return apiError('Este WhatsApp já está cadastrado para outro membro', 409)
    }

    const membro = await prisma.membro.update({
      where: { id },
      data: {
        nome: body.nome,
        foto: body.foto || null,
        nomePai: body.nomePai || null,
        nomeMae: body.nomeMae || null,
        whatsapp: body.whatsapp,
        dataAniversario: body.dataAniversario ? new Date(body.dataAniversario) : null,
        endereco: body.endereco || null,
        grupoPequeno: body.grupoPequeno ?? false,
      },
    })

    logger.info('Membro atualizado', { id: membro.id, nome: membro.nome })

    return apiSuccess(membro)
  } catch (error) {
    logger.error('Erro ao atualizar membro', { error: String(error), ip })
    return apiError('Erro ao atualizar membro', 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request)

  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    const { id } = await params

    logger.info('Excluindo membro', { id, ip })

    // Verificar se membro existe
    const existente = await prisma.membro.findUnique({
      where: { id },
    })

    if (!existente) {
      return apiError('Membro não encontrado', 404)
    }

    await prisma.membro.delete({
      where: { id },
    })

    logger.info('Membro excluído', { id, nome: existente.nome })

    return apiSuccess({ success: true, message: 'Membro excluído com sucesso' })
  } catch (error) {
    logger.error('Erro ao excluir membro', { error: String(error), ip })
    return apiError('Erro ao excluir membro', 500)
  }
}
