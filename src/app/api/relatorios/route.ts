import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface Presenca {
  id: string
  presente: boolean
  culto: {
    id: string
    data: Date
    horario: string
  }
}

interface MembroComPresencas {
  id: string
  nome: string
  foto: string | null
  whatsapp: string
  dataAniversario: Date | null
  grupoPequeno: boolean
  presencas: Presenca[]
}

interface CultoComCount {
  id: string
  data: Date
  horario: string
  _count: {
    presencas: number
  }
}

export async function GET() {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Busca todos os membros com suas presenças
    const membros = await prisma.membro.findMany({
      include: {
        presencas: {
          include: { culto: true },
          orderBy: { culto: { data: 'desc' } },
        },
      },
    }) as MembroComPresencas[]

    // Busca cultos dos últimos 4 domingos
    const quatroDomingosAtras = new Date(hoje)
    quatroDomingosAtras.setDate(quatroDomingosAtras.getDate() - 28)

    const cultosRecentes = await prisma.culto.findMany({
      where: {
        data: { gte: quatroDomingosAtras },
      },
      include: {
        _count: { select: { presencas: true } },
      },
      orderBy: { data: 'desc' },
    }) as CultoComCount[]

    // Calcula ausentes (membros que não vieram nos últimos 2 domingos)
    const doisDomingosAtras = new Date(hoje)
    doisDomingosAtras.setDate(doisDomingosAtras.getDate() - 14)

    const ausentes = membros.filter((membro: MembroComPresencas) => {
      const presencasRecentes = membro.presencas.filter(
        (p: Presenca) => new Date(p.culto.data) >= doisDomingosAtras && p.presente
      )
      return presencasRecentes.length === 0
    })

    // Calcula aniversariantes da semana
    const aniversariantes = membros.filter((membro: MembroComPresencas) => {
      if (!membro.dataAniversario) return false
      const aniversario = new Date(membro.dataAniversario)
      const mesAniversario = aniversario.getMonth()
      const diaAniversario = aniversario.getDate()

      // Verifica se o aniversário está na próxima semana
      for (let i = 0; i <= 7; i++) {
        const dia = new Date(hoje)
        dia.setDate(dia.getDate() + i)
        if (dia.getMonth() === mesAniversario && dia.getDate() === diaAniversario) {
          return true
        }
      }
      return false
    })

    // Estatísticas gerais
    const totalMembros = membros.length
    const membrosGrupoPequeno = membros.filter((m: MembroComPresencas) => m.grupoPequeno).length

    // Frequência por culto (média dos últimos cultos)
    const frequenciaPorHorario: Record<string, number[]> = {
      '10:00': [],
      '17:00': [],
      '19:00': [],
    }

    cultosRecentes.forEach((culto: CultoComCount) => {
      if (frequenciaPorHorario[culto.horario]) {
        frequenciaPorHorario[culto.horario].push(culto._count.presencas)
      }
    })

    const mediaFrequencia = Object.entries(frequenciaPorHorario).map(([horario, presencas]) => ({
      horario,
      media: presencas.length > 0
        ? Math.round(presencas.reduce((a, b) => a + b, 0) / presencas.length)
        : 0,
    }))

    return NextResponse.json({
      totalMembros,
      membrosGrupoPequeno,
      ausentes: ausentes.map((m: MembroComPresencas) => ({
        id: m.id,
        nome: m.nome,
        foto: m.foto,
        whatsapp: m.whatsapp,
        ultimaPresenca: m.presencas[0]?.culto.data || null,
      })),
      aniversariantes: aniversariantes.map((m: MembroComPresencas) => ({
        id: m.id,
        nome: m.nome,
        foto: m.foto,
        whatsapp: m.whatsapp,
        dataAniversario: m.dataAniversario,
      })),
      mediaFrequencia,
      cultosRecentes: cultosRecentes.slice(0, 10).map((c: CultoComCount) => ({
        id: c.id,
        data: c.data,
        horario: c.horario,
        presentes: c._count.presencas,
      })),
    })
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatórios' },
      { status: 500 }
    )
  }
}
