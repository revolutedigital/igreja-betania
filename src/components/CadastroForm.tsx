'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, X, Check, User, Phone, Calendar, MapPin, Users, Loader2 } from 'lucide-react'

interface FormData {
  nome: string
  foto: string | null
  nomePai: string
  nomeMae: string
  whatsapp: string
  dataAniversario: string
  endereco: string
  grupoPequeno: boolean
}

export default function CadastroForm() {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    foto: null,
    nomePai: '',
    nomeMae: '',
    whatsapp: '',
    dataAniversario: '',
    endereco: '',
    grupoPequeno: false,
  })
  const [showCamera, setShowCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setShowCamera(true)
    } catch (err) {
      console.error('Erro ao acessar câmera:', err)
      setError('Não foi possível acessar a câmera')
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const photoData = canvas.toDataURL('image/jpeg', 0.8)
        setFormData(prev => ({ ...prev, foto: photoData }))
      }
    }
    stopCamera()
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }, [])

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, foto: null }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/membros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dataAniversario: formData.dataAniversario || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao cadastrar')
      }

      setSuccess(true)
      setFormData({
        nome: '',
        foto: null,
        nomePai: '',
        nomeMae: '',
        whatsapp: '',
        dataAniversario: '',
        endereco: '',
        grupoPequeno: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Cadastro realizado!</h2>
        <p className="text-[var(--foreground-muted)] mb-6">Obrigado por se cadastrar no Betânia.</p>
        <button
          onClick={() => setSuccess(false)}
          className="btn-primary"
        >
          Fazer outro cadastro
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl animate-fade-in flex items-center gap-2">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Foto */}
      <div className="flex flex-col items-center">
        {formData.foto ? (
          <div className="relative animate-fade-in">
            <img
              src={formData.foto}
              alt="Sua foto"
              className="w-32 h-32 rounded-full object-cover border-4 border-amber-500 shadow-lg"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : showCamera ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-64 h-64 rounded-2xl object-cover shadow-lg"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="btn-primary flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capturar
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            className="w-32 h-32 rounded-full bg-gradient-warm flex flex-col items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            <Camera className="w-8 h-8 text-amber-700" />
            <span className="text-sm text-amber-800 mt-1 font-medium">Tirar foto</span>
          </button>
        )}
        <p className="text-sm text-[var(--foreground-muted)] mt-3">Foto (opcional)</p>
      </div>

      {/* Nome */}
      <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <User className="w-4 h-4 text-amber-600" />
          Nome completo *
        </label>
        <input
          type="text"
          required
          value={formData.nome}
          onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          className="input-field"
          placeholder="Digite seu nome"
        />
      </div>

      {/* WhatsApp */}
      <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Phone className="w-4 h-4 text-amber-600" />
          WhatsApp *
        </label>
        <input
          type="tel"
          required
          value={formData.whatsapp}
          onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
          className="input-field"
          placeholder="(11) 99999-9999"
        />
      </div>

      {/* Data de Aniversário */}
      <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          Data de aniversário
        </label>
        <input
          type="date"
          value={formData.dataAniversario}
          onChange={e => setFormData(prev => ({ ...prev, dataAniversario: e.target.value }))}
          className="input-field"
        />
      </div>

      {/* Nome do Pai */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <User className="w-4 h-4 text-amber-600" />
          Nome do pai
        </label>
        <input
          type="text"
          value={formData.nomePai}
          onChange={e => setFormData(prev => ({ ...prev, nomePai: e.target.value }))}
          className="input-field"
          placeholder="Nome do pai (opcional)"
        />
      </div>

      {/* Nome da Mãe */}
      <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <User className="w-4 h-4 text-amber-600" />
          Nome da mãe
        </label>
        <input
          type="text"
          value={formData.nomeMae}
          onChange={e => setFormData(prev => ({ ...prev, nomeMae: e.target.value }))}
          className="input-field"
          placeholder="Nome da mãe (opcional)"
        />
      </div>

      {/* Endereço */}
      <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <MapPin className="w-4 h-4 text-amber-600" />
          Endereço
        </label>
        <input
          type="text"
          value={formData.endereco}
          onChange={e => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
          className="input-field"
          placeholder="Endereço (opcional)"
        />
      </div>

      {/* Grupo Pequeno */}
      <div className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
        <label className="flex items-center gap-3 cursor-pointer glass-card rounded-xl p-4 hover:scale-[1.02] transition-transform">
          <input
            type="checkbox"
            checked={formData.grupoPequeno}
            onChange={e => setFormData(prev => ({ ...prev, grupoPequeno: e.target.checked }))}
            className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
          />
          <Users className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium">Participa de grupo pequeno?</span>
        </label>
      </div>

      {/* Botão de envio */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Cadastrando...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            Cadastrar
          </>
        )}
      </button>
    </form>
  )
}
