import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'

describe('offline', () => {
  // Recreate IndexedDB and reimport module for each test
  beforeEach(async () => {
    // @ts-expect-error - replacing global
    globalThis.indexedDB = new IDBFactory()
    // Reset module cache
    vi.resetModules()
  })

  describe('Membros', () => {
    it('saveMembrosOffline deve salvar array de membros', async () => {
      const { saveMembrosOffline, getMembrosOffline } = await import('@/lib/offline')

      const mockMembros = [
        { id: '1', nome: 'Ana Silva', foto: null, whatsapp: '11999999999', dataAniversario: null, grupoPequeno: false },
        { id: '2', nome: 'Bruno Santos', foto: 'data:image/jpeg;base64,abc', whatsapp: '11888888888', dataAniversario: null, grupoPequeno: false },
      ]

      await saveMembrosOffline(mockMembros)

      const saved = await getMembrosOffline()
      expect(saved).toHaveLength(2)
    })

    it('getMembrosOffline deve retornar todos os membros', async () => {
      const { saveMembrosOffline, getMembrosOffline } = await import('@/lib/offline')

      const mockMembros = [
        { id: '1', nome: 'Ana Silva', foto: null, whatsapp: '11999999999', dataAniversario: null, grupoPequeno: false },
        { id: '2', nome: 'Bruno Santos', foto: null, whatsapp: '11888888888', dataAniversario: null, grupoPequeno: false },
      ]

      await saveMembrosOffline(mockMembros)

      const membros = await getMembrosOffline()

      expect(membros).toHaveLength(2)
      expect(membros.map(m => m.id)).toContain('1')
      expect(membros.map(m => m.id)).toContain('2')
    })

    it('deve sobrescrever membros existentes com mesmo id', async () => {
      const { saveMembrosOffline, getMembrosOffline } = await import('@/lib/offline')

      const mockMembros = [
        { id: '1', nome: 'Ana Silva', foto: null, whatsapp: '11999999999', dataAniversario: null, grupoPequeno: false },
      ]

      await saveMembrosOffline(mockMembros)

      // Atualizar com novo nome
      const updated = [{ ...mockMembros[0], nome: 'Ana Silva Costa' }]
      await saveMembrosOffline(updated)

      const membros = await getMembrosOffline()
      const ana = membros.find(m => m.id === '1')
      expect(ana?.nome).toBe('Ana Silva Costa')
    })
  })

  describe('Presenças', () => {
    it('savePresencaOffline deve salvar presença', async () => {
      const { savePresencaOffline, getPresencasByCultoOffline } = await import('@/lib/offline')

      const presenca = {
        id: 'presenca-1',
        membroId: 'membro-1',
        cultoId: 'culto-1',
        presente: true,
      }

      await savePresencaOffline(presenca)

      const presencas = await getPresencasByCultoOffline('culto-1')
      expect(presencas).toHaveLength(1)
      expect(presencas[0].membroId).toBe('membro-1')
    })

    it('getPresencasByCultoOffline deve filtrar por culto', async () => {
      const { savePresencaOffline, getPresencasByCultoOffline } = await import('@/lib/offline')

      await savePresencaOffline({
        id: '1',
        membroId: 'm1',
        cultoId: 'culto-1',
        presente: true,
      })
      await savePresencaOffline({
        id: '2',
        membroId: 'm2',
        cultoId: 'culto-2',
        presente: true,
      })
      await savePresencaOffline({
        id: '3',
        membroId: 'm3',
        cultoId: 'culto-1',
        presente: false,
      })

      const presencasCulto1 = await getPresencasByCultoOffline('culto-1')

      expect(presencasCulto1).toHaveLength(2)
      expect(presencasCulto1.every(p => p.cultoId === 'culto-1')).toBe(true)
    })

    it('deletePresencaOffline deve remover presença', async () => {
      const { savePresencaOffline, deletePresencaOffline, getPresencasByCultoOffline } = await import('@/lib/offline')

      await savePresencaOffline({
        id: 'p1',
        membroId: 'm1',
        cultoId: 'c1',
        presente: true,
      })

      await deletePresencaOffline('m1', 'c1')

      const presencas = await getPresencasByCultoOffline('c1')
      expect(presencas).toHaveLength(0)
    })
  })
})
