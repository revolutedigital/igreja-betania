import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Membro {
  nome: string
  whatsapp: string
  ultimaPresenca?: string | null
}

interface CultoData {
  data: string
  horario: string
  presentes: number
}

interface RelatorioData {
  totalMembros: number
  membrosGrupoPequeno: number
  ausentes: Membro[]
  aniversariantes: Array<Membro & { dataAniversario: string }>
  mediaFrequencia: Array<{ horario: string; media: number }>
  cultosRecentes: CultoData[]
}

export function generateRelatoriosPDF(dados: RelatorioData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Título
  doc.setFontSize(24)
  doc.setTextColor(217, 119, 6) // amber-600
  doc.text('Betânia', pageWidth / 2, yPos, { align: 'center' })

  yPos += 10
  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  doc.text('Relatório de Membros e Presença', pageWidth / 2, yPos, { align: 'center' })

  yPos += 8
  doc.setFontSize(10)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' })

  // Linha separadora
  yPos += 10
  doc.setDrawColor(217, 119, 6)
  doc.setLineWidth(0.5)
  doc.line(20, yPos, pageWidth - 20, yPos)

  // Estatísticas Gerais
  yPos += 15
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Estatísticas Gerais', 20, yPos)

  yPos += 10
  doc.setFontSize(11)
  doc.text(`Total de Membros: ${dados.totalMembros}`, 25, yPos)
  yPos += 7
  doc.text(`Membros em Grupo Pequeno: ${dados.membrosGrupoPequeno}`, 25, yPos)
  yPos += 7
  doc.text(`Membros Ausentes (2+ domingos): ${dados.ausentes.length}`, 25, yPos)
  yPos += 7
  doc.text(`Aniversariantes da Semana: ${dados.aniversariantes.length}`, 25, yPos)

  // Média de Frequência por Culto
  yPos += 15
  doc.setFontSize(14)
  doc.text('Média de Presença por Culto', 20, yPos)

  yPos += 5
  autoTable(doc, {
    startY: yPos,
    head: [['Horário', 'Média de Presentes']],
    body: dados.mediaFrequencia.map((f) => [
      f.horario === '10:00' ? '10h (Manhã)' : f.horario === '17:00' ? '17h (Tarde)' : '19h (Noite)',
      f.media.toString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [217, 119, 6] },
    margin: { left: 20, right: 20 },
  })

  yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Cultos Recentes
  if (dados.cultosRecentes.length > 0) {
    doc.setFontSize(14)
    doc.text('Cultos Recentes', 20, yPos)

    yPos += 5
    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Horário', 'Presentes']],
      body: dados.cultosRecentes.slice(0, 10).map((c) => [
        new Date(c.data).toLocaleDateString('pt-BR'),
        c.horario,
        c.presentes.toString(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [217, 119, 6] },
      margin: { left: 20, right: 20 },
    })

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // Verificar se precisa de nova página
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }

  // Membros Ausentes
  if (dados.ausentes.length > 0) {
    doc.setFontSize(14)
    doc.text('Membros Ausentes (2+ Domingos)', 20, yPos)

    yPos += 5
    autoTable(doc, {
      startY: yPos,
      head: [['Nome', 'WhatsApp', 'Última Presença']],
      body: dados.ausentes.map((m) => [
        m.nome,
        m.whatsapp,
        m.ultimaPresenca
          ? new Date(m.ultimaPresenca).toLocaleDateString('pt-BR')
          : 'Nunca registrou',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] }, // orange-500
      margin: { left: 20, right: 20 },
    })

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  }

  // Verificar se precisa de nova página
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }

  // Aniversariantes
  if (dados.aniversariantes.length > 0) {
    doc.setFontSize(14)
    doc.text('Aniversariantes da Semana', 20, yPos)

    yPos += 5
    autoTable(doc, {
      startY: yPos,
      head: [['Nome', 'WhatsApp', 'Data']],
      body: dados.aniversariantes.map((m) => [
        m.nome,
        m.whatsapp,
        new Date(m.dataAniversario).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [236, 72, 153] }, // pink-500
      margin: { left: 20, right: 20 },
    })
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Igreja Betânia - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Salvar o PDF
  doc.save(`relatorio-betania-${new Date().toISOString().split('T')[0]}.pdf`)
}

export function generateMembrosListPDF(membros: Array<{
  nome: string
  whatsapp: string
  dataAniversario?: string | null
  grupoPequeno: boolean
}>): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Título
  doc.setFontSize(24)
  doc.setTextColor(217, 119, 6)
  doc.text('Betânia', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  doc.text('Lista de Membros', pageWidth / 2, 30, { align: 'center' })

  doc.setFontSize(10)
  doc.text(`Total: ${membros.length} membros | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 38, { align: 'center' })

  // Linha separadora
  doc.setDrawColor(217, 119, 6)
  doc.setLineWidth(0.5)
  doc.line(20, 45, pageWidth - 20, 45)

  // Tabela de membros
  autoTable(doc, {
    startY: 50,
    head: [['Nome', 'WhatsApp', 'Aniversário', 'Grupo Pequeno']],
    body: membros.map((m) => [
      m.nome,
      m.whatsapp,
      m.dataAniversario
        ? new Date(m.dataAniversario).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          })
        : '-',
      m.grupoPequeno ? 'Sim' : 'Não',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [217, 119, 6] },
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9 },
  })

  // Rodapé
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Igreja Betânia - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  doc.save(`membros-betania-${new Date().toISOString().split('T')[0]}.pdf`)
}
