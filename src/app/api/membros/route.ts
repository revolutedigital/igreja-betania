import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')

    const membros = await prisma.membro.findMany({
      where: busca
        ? {
            nome: {
              contains: busca,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(membros)
  } catch (error) {
    console.error('Erro ao buscar membros:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar membros' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { nome, foto, nomePai, nomeMae, whatsapp, dataAniversario, endereco, grupoPequeno } = body

    if (!nome || !whatsapp) {
      return NextResponse.json(
        { error: 'Nome e WhatsApp são obrigatórios' },
        { status: 400 }
      )
    }

    const membro = await prisma.membro.create({
      data: {
        nome,
        foto: foto || null,
        nomePai: nomePai || null,
        nomeMae: nomeMae || null,
        whatsapp,
        dataAniversario: dataAniversario ? new Date(dataAniversario) : null,
        endereco: endereco || null,
        grupoPequeno: grupoPequeno || false,
      },
    })

    return NextResponse.json(membro, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar membro:', error)
    return NextResponse.json(
      { error: 'Erro ao criar membro' },
      { status: 500 }
    )
  }
}
