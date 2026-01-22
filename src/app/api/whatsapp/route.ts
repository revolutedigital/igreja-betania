import { NextResponse } from 'next/server'
import {
  initWhatsApp,
  getConnectionStatus,
  sendMessage,
  sendBulkMessages,
  disconnectWhatsApp,
  messageTemplates,
} from '@/lib/whatsapp/client'

export async function GET() {
  try {
    const status = getConnectionStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Erro ao obter status:', error)
    return NextResponse.json({ error: 'Erro ao obter status' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, phone, message, messages, template, nome } = body

    switch (action) {
      case 'connect':
        const connectResult = await initWhatsApp()
        return NextResponse.json(connectResult)

      case 'disconnect':
        await disconnectWhatsApp()
        return NextResponse.json({ success: true })

      case 'send':
        if (!phone || !message) {
          return NextResponse.json(
            { error: 'Telefone e mensagem são obrigatórios' },
            { status: 400 }
          )
        }
        const sendResult = await sendMessage(phone, message)
        return NextResponse.json(sendResult)

      case 'send-template':
        if (!phone || !template || !nome) {
          return NextResponse.json(
            { error: 'Telefone, template e nome são obrigatórios' },
            { status: 400 }
          )
        }
        const templateFn = messageTemplates[template as keyof typeof messageTemplates]
        if (!templateFn) {
          return NextResponse.json({ error: 'Template não encontrado' }, { status: 400 })
        }
        const templateMessage = typeof templateFn === 'function'
          ? templateFn(nome, message)
          : templateFn
        const templateResult = await sendMessage(phone, templateMessage)
        return NextResponse.json(templateResult)

      case 'send-bulk':
        if (!messages || !Array.isArray(messages)) {
          return NextResponse.json(
            { error: 'Lista de mensagens é obrigatória' },
            { status: 400 }
          )
        }
        const bulkResult = await sendBulkMessages(messages)
        return NextResponse.json({ results: bulkResult })

      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API WhatsApp:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
