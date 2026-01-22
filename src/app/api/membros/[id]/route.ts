import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const membro = await prisma.membro.findUnique({
      where: { id },
      include: {
        presencas: {
          include: { culto: true },
          orderBy: { culto: { data: 'desc' } },
        },
      },
    })

    if (!membro) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(membro)
  } catch (error) {
    console.error('Erro ao buscar membro:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar membro' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { nome, foto, nomePai, nomeMae, whatsapp, dataAniversario, endereco, grupoPequeno } = body

    const membro = await prisma.membro.update({
      where: { id },
      data: {
        nome,
        foto: foto || null,
        nomePai: nomePai || null,
        nomeMae: nomeMae || null,
        whatsapp,
        dataAniversario: dataAniversario ? new Date(dataAniversario) : null,
        endereco: endereco || null,
        grupoPequeno: grupoPequeno ?? false,
      },
    })

    return NextResponse.json(membro)
  } catch (error) {
    console.error('Erro ao atualizar membro:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar membro' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.membro.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir membro:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir membro' },
      { status: 500 }
    )
  }
}
