import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { endpoint } = await request.json()

    // Em produção, remover do banco de dados
    console.log('Subscription removida:', endpoint)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover subscription:', error)
    return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 })
  }
}
