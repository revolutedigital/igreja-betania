import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDAÇÃO - ZOD
// ============================================

// Validação de senha forte
const senhaSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial')

// Paginação
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type PaginationInput = z.infer<typeof paginationSchema>

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Membro
export const membroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  foto: z.string().nullable().optional(),
  nomePai: z.string().max(100).optional().nullable(),
  nomeMae: z.string().max(100).optional().nullable(),
  whatsapp: z.string().min(10, 'WhatsApp inválido').max(15).regex(/^\d+$/, 'Apenas números'),
  dataAniversario: z.string().nullable().optional(),
  endereco: z.string().max(200).optional().nullable(),
  grupoPequeno: z.boolean().default(false),
})

export const membroUpdateSchema = membroSchema.partial()

// Presença
export const presencaSchema = z.object({
  membroId: z.string().cuid('ID do membro inválido'),
  cultoId: z.string().cuid('ID do culto inválido'),
  presente: z.boolean().default(true),
})

// Culto
export const cultoSchema = z.object({
  data: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  horario: z.string().min(1, 'Horário obrigatório'),
})

// Autenticação
export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  senha: z.string().min(1, 'Senha obrigatória'),
})

export const registroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).trim(),
  email: z.string().email('Email inválido').toLowerCase(),
  senha: senhaSchema,
  codigoAdmin: z.string().optional(),
})

// WhatsApp
export const whatsappMessageSchema = z.object({
  numero: z.string().min(10, 'Número inválido'),
  mensagem: z.string().min(1, 'Mensagem obrigatória').max(4096),
})

// WhatsApp API route schema
export const whatsappSchema = z.object({
  action: z.enum(['connect', 'disconnect', 'send', 'send-template', 'send-bulk']),
  phone: z.string().min(10).optional(),
  message: z.string().max(4096).optional(),
  messages: z.array(z.object({
    phone: z.string().min(10),
    message: z.string().max(4096),
  })).optional(),
  template: z.string().optional(),
  nome: z.string().optional(),
})

export const whatsappBulkSchema = z.object({
  membrosIds: z.array(z.string().cuid()).min(1, 'Selecione pelo menos 1 membro'),
  template: z.enum(['ausencia', 'aniversario', 'boasVindas', 'lembreteCulto', 'custom']),
  mensagemCustom: z.string().max(4096).optional(),
})

// Push Notifications
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

// Types exportados
export type MembroInput = z.infer<typeof membroSchema>
export type MembroUpdateInput = z.infer<typeof membroUpdateSchema>
export type PresencaInput = z.infer<typeof presencaSchema>
export type CultoInput = z.infer<typeof cultoSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegistroInput = z.infer<typeof registroSchema>
export type WhatsAppMessageInput = z.infer<typeof whatsappMessageSchema>
export type WhatsAppBulkInput = z.infer<typeof whatsappBulkSchema>
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>

// Helper para validar e retornar erro formatado
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map(e => e.message).join(', ')
    return { success: false, error: errors }
  }
  return { success: true, data: result.data }
}

// Helper para paginação
export function parsePagination(searchParams: URLSearchParams): PaginationInput {
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  const result = paginationSchema.safeParse({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 50,
  })

  return result.success ? result.data : { page: 1, limit: 50 }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationInput
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pagination.limit)

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  }
}
