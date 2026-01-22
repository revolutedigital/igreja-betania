import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '../../__mocks__/prisma'

import '../../__mocks__/prisma'

describe('API /api/presenca', () => {
  beforeEach(() => {
    resetPrismaMock()
  })

  describe('GET', () => {
    it('deve retornar presenças do culto com dados do membro', async () => {
      const mockPresencas = [
        {
          id: 'p1',
          membroId: 'm1',
          cultoId: 'c1',
          presente: true,
          membro: { id: 'm1', nome: 'Ana Silva', foto: null },
        },
        {
          id: 'p2',
          membroId: 'm2',
          cultoId: 'c1',
          presente: true,
          membro: { id: 'm2', nome: 'Bruno Costa', foto: null },
        },
      ]

      prismaMock.presenca.findMany.mockResolvedValue(mockPresencas)

      const result = await prismaMock.presenca.findMany({
        where: { cultoId: 'c1' },
        include: { membro: true },
      })

      expect(prismaMock.presenca.findMany).toHaveBeenCalledWith({
        where: { cultoId: 'c1' },
        include: { membro: true },
      })
      expect(result).toHaveLength(2)
      expect(result[0].membro.nome).toBe('Ana Silva')
    })

    it('deve retornar array vazio se nenhuma presença', async () => {
      prismaMock.presenca.findMany.mockResolvedValue([])

      const result = await prismaMock.presenca.findMany({
        where: { cultoId: 'c-inexistente' },
      })

      expect(result).toEqual([])
    })
  })

  describe('POST', () => {
    it('deve criar presença se não existir (upsert)', async () => {
      const novaPresenca = {
        id: 'p-novo',
        membroId: 'm1',
        cultoId: 'c1',
        presente: true,
        createdAt: new Date(),
      }

      prismaMock.presenca.upsert.mockResolvedValue(novaPresenca)

      const result = await prismaMock.presenca.upsert({
        where: {
          membroId_cultoId: {
            membroId: 'm1',
            cultoId: 'c1',
          },
        },
        create: {
          membroId: 'm1',
          cultoId: 'c1',
          presente: true,
        },
        update: {
          presente: true,
        },
      })

      expect(result.presente).toBe(true)
      expect(result.membroId).toBe('m1')
    })

    it('deve atualizar presença se existir (upsert)', async () => {
      const presencaAtualizada = {
        id: 'p-existente',
        membroId: 'm1',
        cultoId: 'c1',
        presente: false,
        createdAt: new Date(),
      }

      prismaMock.presenca.upsert.mockResolvedValue(presencaAtualizada)

      const result = await prismaMock.presenca.upsert({
        where: {
          membroId_cultoId: {
            membroId: 'm1',
            cultoId: 'c1',
          },
        },
        create: {
          membroId: 'm1',
          cultoId: 'c1',
          presente: false,
        },
        update: {
          presente: false,
        },
      })

      expect(result.presente).toBe(false)
    })
  })

  describe('DELETE', () => {
    it('deve remover presença', async () => {
      prismaMock.presenca.delete.mockResolvedValue({
        id: 'p1',
        membroId: 'm1',
        cultoId: 'c1',
        presente: true,
        createdAt: new Date(),
      })

      await prismaMock.presenca.delete({
        where: {
          membroId_cultoId: {
            membroId: 'm1',
            cultoId: 'c1',
          },
        },
      })

      expect(prismaMock.presenca.delete).toHaveBeenCalledWith({
        where: {
          membroId_cultoId: {
            membroId: 'm1',
            cultoId: 'c1',
          },
        },
      })
    })
  })
})
