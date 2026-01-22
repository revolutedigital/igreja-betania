import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const cultos = await prisma.culto.findMany({
      orderBy: { data: 'desc' },
      include: {
        _count: {
          select: { presencas: true },
        },
      },
    })

    return NextResponse.json(cultos)
  } catch (error) {
    console.error('Erro ao buscar cultos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cultos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, horario } = body

    if (!data || !horario) {
      return NextResponse.json(
        { error: 'Data e horário são obrigatórios' },
        { status: 400 }
      )
    }

    // Verifica se já existe culto nessa data/horário
    const cultoExistente = await prisma.culto.findFirst({
      where: {
        data: new Date(data),
        horario,
      },
    })

    if (cultoExistente) {
      return NextResponse.json(cultoExistente)
    }

    const culto = await prisma.culto.create({
      data: {
        data: new Date(data),
        horario,
      },
    })

    return NextResponse.json(culto, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar culto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar culto' },
      { status: 500 }
    )
  }
}
