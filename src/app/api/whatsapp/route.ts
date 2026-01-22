import { createHandler, apiSuccess, apiError, logger } from '@/lib/api-utils'
import { whatsappSchema } from '@/lib/validations'
import {
  initWhatsApp,
  getConnectionStatus,
  sendMessage,
  sendBulkMessages,
  disconnectWhatsApp,
  messageTemplates,
} from '@/lib/whatsapp/client'

export const GET = createHandler(
  { rateLimit: true },
  async (request, { ip }) => {
    logger.info('Obtendo status WhatsApp', { ip })
    const status = getConnectionStatus()
    return apiSuccess(status)
  }
)

export const POST = createHandler(
  { rateLimit: true, schema: whatsappSchema },
  async (request, { body, ip }) => {
    const { action, phone, message, messages, template, nome } = body as {
      action: string
      phone?: string
      message?: string
      messages?: Array<{ phone: string; message: string }>
      template?: string
      nome?: string
    }

    logger.info('Ação WhatsApp', { action, ip })

    switch (action) {
      case 'connect': {
        const connectResult = await initWhatsApp()
        logger.info('WhatsApp conectado', { ip })
        return apiSuccess(connectResult)
      }

      case 'disconnect': {
        await disconnectWhatsApp()
        logger.info('WhatsApp desconectado', { ip })
        return apiSuccess({ success: true })
      }

      case 'send': {
        if (!phone || !message) {
          return apiError('Telefone e mensagem são obrigatórios', 400)
        }
        const sendResult = await sendMessage(phone, message)
        logger.info('Mensagem enviada', { phone, ip })
        return apiSuccess(sendResult)
      }

      case 'send-template': {
        if (!phone || !template || !nome) {
          return apiError('Telefone, template e nome são obrigatórios', 400)
        }
        const templateFn = messageTemplates[template as keyof typeof messageTemplates]
        if (!templateFn) {
          return apiError('Template não encontrado', 400)
        }
        const templateMessage = typeof templateFn === 'function'
          ? templateFn(nome, message || '')
          : templateFn
        const templateResult = await sendMessage(phone, templateMessage)
        logger.info('Template enviado', { phone, template, ip })
        return apiSuccess(templateResult)
      }

      case 'send-bulk': {
        if (!messages || !Array.isArray(messages)) {
          return apiError('Lista de mensagens é obrigatória', 400)
        }
        const bulkResult = await sendBulkMessages(messages)
        logger.info('Mensagens em massa enviadas', { count: messages.length, ip })
        return apiSuccess({ results: bulkResult })
      }

      default:
        return apiError('Ação não reconhecida', 400)
    }
  }
)
