import { prisma } from '@/lib/prisma'
import { createHandler, apiSuccess, apiError, logger } from '@/lib/api-utils'
import { registroSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export const POST = createHandler(
  { rateLimit: true, schema: registroSchema },
  async (_request, { body, ip }) => {
    const { nome, email, senha, codigoAdmin } = body as {
      nome: string
      email: string
      senha: string
      codigoAdmin?: string
    }

    logger.info('Tentativa de registro', { email, ip })

    // Verifica se já existe usuário com este email
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    })

    if (usuarioExistente) {
      logger.warn('Email já cadastrado', { email, ip })
      return apiError('Email já cadastrado', 400)
    }

    // Determina o role baseado no código admin
    const adminCode = process.env.ADMIN_CODE || 'BETANIA2024'
    const role = codigoAdmin === adminCode ? 'admin' : 'voluntario'

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        role,
      },
    })

    logger.info('Usuário registrado', { id: usuario.id, email, role })

    return apiSuccess({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    }, 201)
  }
)
