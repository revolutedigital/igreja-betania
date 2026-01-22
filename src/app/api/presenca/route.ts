import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cultoId = searchParams.get('cultoId')

    if (!cultoId) {
      return NextResponse.json(
        { error: 'ID do culto é obrigatório' },
        { status: 400 }
      )
    }

    const presencas = await prisma.presenca.findMany({
      where: { cultoId },
      include: { membro: true },
    })

    return NextResponse.json(presencas)
  } catch (error) {
    console.error('Erro ao buscar presenças:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar presenças' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { membroId, cultoId, presente } = body

    if (!membroId || !cultoId) {
      return NextResponse.json(
        { error: 'ID do membro e do culto são obrigatórios' },
        { status: 400 }
      )
    }

    // Usa upsert para criar ou atualizar a presença
    const presenca = await prisma.presenca.upsert({
      where: {
        membroId_cultoId: {
          membroId,
          cultoId,
        },
      },
      update: {
        presente: presente ?? true,
      },
      create: {
        membroId,
        cultoId,
        presente: presente ?? true,
      },
    })

    return NextResponse.json(presenca)
  } catch (error) {
    console.error('Erro ao registrar presença:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar presença' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const membroId = searchParams.get('membroId')
    const cultoId = searchParams.get('cultoId')

    if (!membroId || !cultoId) {
      return NextResponse.json(
        { error: 'ID do membro e do culto são obrigatórios' },
        { status: 400 }
      )
    }

    await prisma.presenca.delete({
      where: {
        membroId_cultoId: {
          membroId,
          cultoId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover presença:', error)
    return NextResponse.json(
      { error: 'Erro ao remover presença' },
      { status: 500 }
    )
  }
}
