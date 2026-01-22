'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { requestNotificationPermission, subscribeToPush, unsubscribeFromPush } from '@/lib/push'
import toast from 'react-hot-toast'

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Verificar se já está inscrito
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      })
    }
  }, [])

  const handleToggle = async () => {
    setLoading(true)

    try {
      if (isSubscribed) {
        // Cancelar inscrição
        const success = await unsubscribeFromPush()
        if (success) {
          setIsSubscribed(false)
          toast.success('Notificações desativadas')
        }
      } else {
        // Solicitar permissão e inscrever
        const perm = await requestNotificationPermission()
        setPermission(perm)

        if (perm === 'granted') {
          const subscription = await subscribeToPush()
          if (subscription) {
            setIsSubscribed(true)
            toast.success('Notificações ativadas!')
          }
        } else if (perm === 'denied') {
          toast.error('Permissão de notificação negada')
        }
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao configurar notificações')
    } finally {
      setLoading(false)
    }
  }

  if (!('Notification' in window)) {
    return null
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || permission === 'denied'}
      className={`p-2 rounded-full glass-card hover:scale-110 transition-transform ${
        permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={
        permission === 'denied'
          ? 'Notificações bloqueadas'
          : isSubscribed
          ? 'Desativar notificações'
          : 'Ativar notificações'
      }
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
      ) : isSubscribed ? (
        <Bell className="w-5 h-5 text-amber-600" />
      ) : (
        <BellOff className="w-5 h-5 text-[var(--foreground-muted)]" />
      )}
    </button>
  )
}
