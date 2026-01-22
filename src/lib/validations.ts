import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDAÇÃO - ZOD
// ============================================

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
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const registroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
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
