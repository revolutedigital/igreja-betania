// WhatsApp Client usando Baileys com importação dinâmica
// Isso evita erros de build do Next.js com módulos nativos

// Estado global
let sock: any = null
let qrCode: string | null = null
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'qr' = 'disconnected'

// Carregar Baileys dinamicamente (apenas no servidor)
async function loadBaileys() {
  if (typeof window !== 'undefined') {
    throw new Error('WhatsApp client só pode ser usado no servidor')
  }

  const baileys = await import('@whiskeysockets/baileys')
  const { default: pino } = await import('pino')
  const path = await import('path')
  const fs = await import('fs')

  return { baileys, pino, path, fs }
}

export async function initWhatsApp(): Promise<{ status: string; qr?: string }> {
  if (sock && connectionStatus === 'connected') {
    return { status: 'connected' }
  }

  connectionStatus = 'connecting'

  try {
    const { baileys, pino, path, fs } = await loadBaileys()
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys

    // Diretório para salvar a sessão
    const AUTH_DIR = path.join(process.cwd(), '.whatsapp-auth')

    // Garantir que o diretório de autenticação exista
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true })
    }

    // Logger silencioso para produção
    const logger = pino({ level: 'silent' }) as any

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)

    sock = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['Betânia Igreja', 'Chrome', '1.0.0'],
    })

    // Eventos de conexão
    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        qrCode = qr
        connectionStatus = 'qr'
        console.log('QR Code gerado para conexão WhatsApp')
      }

      if (connection === 'close') {
        const Boom = (await import('@hapi/boom')).Boom
        const shouldReconnect =
          (lastDisconnect?.error as InstanceType<typeof Boom>)?.output?.statusCode !== DisconnectReason.loggedOut

        console.log('Conexão fechada:', lastDisconnect?.error)
        connectionStatus = 'disconnected'
        qrCode = null

        if (shouldReconnect) {
          console.log('Reconectando...')
          setTimeout(() => initWhatsApp(), 5000)
        }
      } else if (connection === 'open') {
        console.log('WhatsApp conectado!')
        connectionStatus = 'connected'
        qrCode = null
      }
    })

    // Salvar credenciais quando atualizadas
    sock.ev.on('creds.update', saveCreds)

    // Aguardar um pouco para o QR ser gerado
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (qrCode) {
      return { status: 'qr', qr: qrCode }
    }

    return { status: connectionStatus }
  } catch (error) {
    console.error('Erro ao inicializar WhatsApp:', error)
    connectionStatus = 'disconnected'
    throw error
  }
}

export function getConnectionStatus(): { status: string; qr?: string } {
  return {
    status: connectionStatus,
    qr: qrCode || undefined,
  }
}

export async function sendMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!sock || connectionStatus !== 'connected') {
    return { success: false, error: 'WhatsApp não conectado' }
  }

  try {
    // Formatar número para o padrão do WhatsApp
    const formattedPhone = formatPhoneNumber(phone)
    const jid = `${formattedPhone}@s.whatsapp.net`

    // Verificar se o número existe no WhatsApp
    const [result] = await sock.onWhatsApp(formattedPhone)

    if (!result?.exists) {
      return { success: false, error: 'Número não encontrado no WhatsApp' }
    }

    // Enviar mensagem
    await sock.sendMessage(jid, { text: message })

    return { success: true }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return { success: false, error: 'Erro ao enviar mensagem' }
  }
}

export async function sendBulkMessages(
  messages: Array<{ phone: string; message: string }>
): Promise<Array<{ phone: string; success: boolean; error?: string }>> {
  const results = []

  for (const msg of messages) {
    // Aguardar entre mensagens para evitar bloqueio
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const result = await sendMessage(msg.phone, msg.message)
    results.push({ phone: msg.phone, ...result })
  }

  return results
}

export async function disconnectWhatsApp(): Promise<void> {
  if (sock) {
    await sock.logout()
    sock = null
    qrCode = null
    connectionStatus = 'disconnected'
  }
}

// Formatar número de telefone brasileiro
function formatPhoneNumber(phone: string): string {
  // Remover caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '')

  // Adicionar código do país se não tiver
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }

  // Garantir que tenha 13 dígitos (55 + DDD + 9 dígitos)
  if (cleaned.length === 12) {
    // Adicionar 9 na frente se for celular sem o 9
    const ddd = cleaned.substring(2, 4)
    const numero = cleaned.substring(4)
    cleaned = `55${ddd}9${numero}`
  }

  return cleaned
}

// Mensagens pré-definidas
export const messageTemplates = {
  ausencia: (nome: string) =>
    `Olá ${nome}! 👋\n\nSentimos sua falta nos últimos cultos da Igreja Betânia. Esperamos te ver em breve!\n\nQue Deus abençoe sua semana! 🙏`,

  aniversario: (nome: string) =>
    `🎂 Feliz Aniversário, ${nome}! 🎉\n\nA família Betânia deseja a você um dia muito especial!\n\nQue Deus continue abençoando sua vida com saúde, paz e alegria!\n\n🙏 Com carinho, Igreja Betânia`,

  boasVindas: (nome: string) =>
    `Olá ${nome}! 👋\n\nSeja muito bem-vindo(a) à família Betânia!\n\nEstamos muito felizes em ter você conosco. Qualquer dúvida, estamos à disposição.\n\nDeus abençoe! 🙏`,

  lembreteCulto: (nome: string, horario: string) =>
    `Olá ${nome}! 🙏\n\nLembrando que hoje temos culto às ${horario}.\n\nTe esperamos! 🏠\n\nIgreja Betânia`,

  custom: (nome: string, mensagem: string) =>
    mensagem.replace('{nome}', nome),
}
