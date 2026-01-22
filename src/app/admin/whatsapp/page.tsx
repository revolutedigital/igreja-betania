'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  Home,
  ArrowLeft,
  MessageCircle,
  Wifi,
  WifiOff,
  QrCode,
  Loader2,
  Send,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import toast from 'react-hot-toast'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'qr'

interface Membro {
  id: string
  nome: string
  whatsapp: string
}

export default function WhatsAppPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [membros, setMembros] = useState<Membro[]>([])
  const [selectedMembros, setSelectedMembros] = useState<Set<string>>(new Set())
  const [messageTemplate, setMessageTemplate] = useState<string>('ausencia')
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResults, setSendResults] = useState<Array<{phone: string; success: boolean; error?: string}>>([])

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login')
    }
  }, [sessionStatus, router])

  useEffect(() => {
    checkConnection()
    fetchMembros()
    const interval = setInterval(checkConnection, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, { width: 256 })
        .then(setQrImage)
        .catch(console.error)
    } else {
      setQrImage(null)
    }
  }, [qrCode])

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/whatsapp')
      const data = await response.json()
      setConnectionStatus(data.status)
      setQrCode(data.qr || null)
    } catch (error) {
      console.error('Erro ao verificar conexão:', error)
    }
  }

  const fetchMembros = async () => {
    try {
      const response = await fetch('/api/membros')
      const data = await response.json()
      setMembros(data)
    } catch (error) {
      console.error('Erro ao buscar membros:', error)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      })
      const data = await response.json()
      setConnectionStatus(data.status)
      setQrCode(data.qr || null)

      if (data.status === 'qr') {
        toast('Escaneie o QR Code com seu WhatsApp', { icon: '📱' })
      }
    } catch (error) {
      console.error('Erro ao conectar:', error)
      toast.error('Erro ao conectar')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      setConnectionStatus('disconnected')
      setQrCode(null)
      toast.success('Desconectado com sucesso')
    } catch (error) {
      console.error('Erro ao desconectar:', error)
      toast.error('Erro ao desconectar')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessages = async () => {
    if (selectedMembros.size === 0) {
      toast.error('Selecione pelo menos um membro')
      return
    }

    if (messageTemplate === 'custom' && !customMessage.trim()) {
      toast.error('Digite uma mensagem personalizada')
      return
    }

    setSending(true)
    setSendResults([])

    try {
      const membrosToSend = membros.filter(m => selectedMembros.has(m.id))
      const messages = membrosToSend.map(m => ({
        phone: m.whatsapp,
        message: messageTemplate === 'custom'
          ? customMessage.replace('{nome}', m.nome.split(' ')[0])
          : '', // Template será processado no servidor
        nome: m.nome.split(' ')[0],
        template: messageTemplate,
      }))

      // Enviar uma por uma com feedback
      const results = []
      for (const msg of messages) {
        const response = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send-template',
            phone: msg.phone,
            template: msg.template,
            nome: msg.nome,
            message: customMessage,
          }),
        })
        const result = await response.json()
        results.push({ phone: msg.phone, ...result })

        // Atualizar resultados em tempo real
        setSendResults([...results])

        // Delay entre mensagens
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const successCount = results.filter(r => r.success).length
      toast.success(`${successCount}/${results.length} mensagens enviadas`)
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error)
      toast.error('Erro ao enviar mensagens')
    } finally {
      setSending(false)
    }
  }

  const toggleMembro = (id: string) => {
    const newSelected = new Set(selectedMembros)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedMembros(newSelected)
  }

  const selectAll = () => {
    if (selectedMembros.size === membros.length) {
      setSelectedMembros(new Set())
    } else {
      setSelectedMembros(new Set(membros.map(m => m.id)))
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-betania rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gradient">Betânia</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Botão voltar */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {/* Título */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gradient flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-green-500" />
              WhatsApp
            </h1>
            <p className="text-[var(--foreground-muted)]">Envie mensagens automáticas para os membros</p>
          </div>

          {/* Status de Conexão */}
          <div className="glass-card rounded-2xl p-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Status da Conexão</h2>

            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                connectionStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/30' :
                connectionStatus === 'qr' ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-gray-100 dark:bg-gray-800'
              }`}>
                {connectionStatus === 'connected' ? (
                  <Wifi className="w-6 h-6 text-green-600" />
                ) : connectionStatus === 'qr' ? (
                  <QrCode className="w-6 h-6 text-amber-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {connectionStatus === 'connected' && 'Conectado'}
                  {connectionStatus === 'qr' && 'Aguardando escaneamento'}
                  {connectionStatus === 'connecting' && 'Conectando...'}
                  {connectionStatus === 'disconnected' && 'Desconectado'}
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {connectionStatus === 'connected' && 'Pronto para enviar mensagens'}
                  {connectionStatus === 'qr' && 'Escaneie o QR Code com seu WhatsApp'}
                  {connectionStatus === 'connecting' && 'Estabelecendo conexão...'}
                  {connectionStatus === 'disconnected' && 'Clique em conectar para começar'}
                </p>
              </div>
            </div>

            {/* QR Code */}
            {connectionStatus === 'qr' && qrImage && (
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-2xl">
                  <img src={qrImage} alt="QR Code" className="w-64 h-64" />
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-3">
              {connectionStatus === 'disconnected' && (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Wifi className="w-5 h-5" />
                  )}
                  Conectar WhatsApp
                </button>
              )}

              {connectionStatus === 'qr' && (
                <button
                  onClick={checkConnection}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Atualizar
                </button>
              )}

              {connectionStatus === 'connected' && (
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="btn-secondary flex items-center gap-2 text-red-600"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <WifiOff className="w-5 h-5" />
                  )}
                  Desconectar
                </button>
              )}
            </div>
          </div>

          {/* Enviar Mensagens */}
          {connectionStatus === 'connected' && (
            <>
              {/* Template de Mensagem */}
              <div className="glass-card rounded-2xl p-6 animate-fade-in">
                <h2 className="text-lg font-semibold mb-4">Tipo de Mensagem</h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { id: 'ausencia', label: 'Ausência', icon: AlertTriangle },
                    { id: 'aniversario', label: 'Aniversário', icon: '🎂' },
                    { id: 'boasVindas', label: 'Boas-vindas', icon: '👋' },
                    { id: 'custom', label: 'Personalizada', icon: '✏️' },
                  ].map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setMessageTemplate(template.id)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        messageTemplate === template.id
                          ? 'bg-gradient-betania text-white shadow-lg'
                          : 'glass-card hover:shadow-md'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">
                        {typeof template.icon === 'string' ? template.icon : <template.icon className="w-6 h-6 mx-auto" />}
                      </span>
                      <span className="text-sm font-medium">{template.label}</span>
                    </button>
                  ))}
                </div>

                {messageTemplate === 'custom' && (
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Digite sua mensagem... Use {nome} para inserir o nome do membro"
                    className="input-field min-h-[120px] resize-none"
                  />
                )}
              </div>

              {/* Selecionar Membros */}
              <div className="glass-card rounded-2xl p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Selecionar Membros
                  </h2>
                  <button
                    onClick={selectAll}
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    {selectedMembros.size === membros.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {membros.map((membro) => (
                    <label
                      key={membro.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedMembros.has(membro.id)
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'hover:bg-[var(--background)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembros.has(membro.id)}
                        onChange={() => toggleMembro(membro.id)}
                        className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <span className="flex-1">{membro.nome}</span>
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {membro.whatsapp}
                      </span>
                    </label>
                  ))}
                </div>

                <p className="text-sm text-[var(--foreground-muted)] mt-4">
                  {selectedMembros.size} membro(s) selecionado(s)
                </p>
              </div>

              {/* Botão Enviar */}
              <button
                onClick={handleSendMessages}
                disabled={sending || selectedMembros.size === 0}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando... ({sendResults.length}/{selectedMembros.size})
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Mensagens
                  </>
                )}
              </button>

              {/* Resultados */}
              {sendResults.length > 0 && (
                <div className="glass-card rounded-2xl p-6 animate-fade-in">
                  <h2 className="text-lg font-semibold mb-4">Resultados do Envio</h2>
                  <div className="space-y-2">
                    {sendResults.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                          result.success
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="flex-1">{result.phone}</span>
                        {!result.success && (
                          <span className="text-sm text-red-600">{result.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
