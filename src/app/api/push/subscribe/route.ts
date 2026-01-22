import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Em uma implementação real, você armazenaria as subscriptions no banco de dados
// Por enquanto, vamos manter em memória (não persiste entre reinicializações)
const subscriptions: Map<string, PushSubscription> = new Map()

export async function POST(request: Request) {
  try {
    const subscription = await request.json()

    // Armazenar subscription (em produção, salvar no banco)
    subscriptions.set(subscription.endpoint, subscription)

    console.log('Nova subscription de push registrada')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao registrar subscription:', error)
    return NextResponse.json({ error: 'Erro ao registrar' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    count: subscriptions.size,
  })
}
