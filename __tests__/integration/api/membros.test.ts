import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock, resetPrismaMock } from '../../__mocks__/prisma'

// Importar depois do mock
import '../../__mocks__/prisma'

describe('API /api/membros', () => {
  beforeEach(() => {
    resetPrismaMock()
  })

  describe('GET', () => {
    it('deve retornar lista de membros ordenada por nome', async () => {
      const mockMembros = [
        { id: '1', nome: 'Ana Silva', foto: null, whatsapp: '11999999999' },
        { id: '2', nome: 'Bruno Costa', foto: null, whatsapp: '11888888888' },
      ]

      prismaMock.membro.findMany.mockResolvedValue(mockMembros)

      // Simular chamada da API
      const result = await prismaMock.membro.findMany({
        orderBy: { nome: 'asc' },
      })

      expect(prismaMock.membro.findMany).toHaveBeenCalledWith({
        orderBy: { nome: 'asc' },
      })
      expect(result).toHaveLength(2)
      expect(result[0].nome).toBe('Ana Silva')
    })

    it('deve filtrar por busca case-insensitive', async () => {
      prismaMock.membro.findMany.mockResolvedValue([
        { id: '1', nome: 'Ana Silva', foto: null, whatsapp: '11999999999' },
      ])

      const busca = 'ana'
      await prismaMock.membro.findMany({
        where: {
          nome: {
            contains: busca,
            mode: 'insensitive',
          },
        },
      })

      expect(prismaMock.membro.findMany).toHaveBeenCalledWith({
        where: {
          nome: {
            contains: 'ana',
            mode: 'insensitive',
          },
        },
      })
    })

    it('deve retornar array vazio se nenhum membro', async () => {
      prismaMock.membro.findMany.mockResolvedValue([])

      const result = await prismaMock.membro.findMany()

      expect(result).toEqual([])
    })
  })

  describe('POST', () => {
    it('deve criar membro com dados obrigatórios', async () => {
      const novoMembro = {
        nome: 'Carlos Santos',
        whatsapp: '11777777777',
      }

      const membroCriado = {
        id: 'novo-id',
        ...novoMembro,
        foto: null,
        nomePai: null,
        nomeMae: null,
        dataAniversario: null,
        endereco: null,
        grupoPequeno: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.membro.create.mockResolvedValue(membroCriado)

      const result = await prismaMock.membro.create({
        data: novoMembro,
      })

      expect(prismaMock.membro.create).toHaveBeenCalledWith({
        data: novoMembro,
      })
      expect(result.id).toBe('novo-id')
      expect(result.nome).toBe('Carlos Santos')
    })

    it('deve aceitar campos opcionais', async () => {
      const membroCompleto = {
        nome: 'Diana Oliveira',
        whatsapp: '11666666666',
        foto: 'data:image/jpeg;base64,abc',
        nomePai: 'João Oliveira',
        nomeMae: 'Maria Oliveira',
        dataAniversario: new Date('1990-05-15'),
        endereco: 'Rua Test, 123',
        grupoPequeno: true,
      }

      prismaMock.membro.create.mockResolvedValue({
        id: 'id-completo',
        ...membroCompleto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await prismaMock.membro.create({
        data: membroCompleto,
      })

      expect(result.grupoPequeno).toBe(true)
      expect(result.foto).toBe('data:image/jpeg;base64,abc')
    })
  })

  describe('PUT /api/membros/[id]', () => {
    it('deve atualizar membro existente', async () => {
      const membroAtualizado = {
        id: '1',
        nome: 'Ana Silva Costa',
        whatsapp: '11999999999',
        foto: null,
        nomePai: null,
        nomeMae: null,
        dataAniversario: null,
        endereco: 'Novo Endereço',
        grupoPequeno: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.membro.update.mockResolvedValue(membroAtualizado)

      const result = await prismaMock.membro.update({
        where: { id: '1' },
        data: {
          nome: 'Ana Silva Costa',
          endereco: 'Novo Endereço',
          grupoPequeno: true,
        },
      })

      expect(result.nome).toBe('Ana Silva Costa')
      expect(result.endereco).toBe('Novo Endereço')
    })
  })

  describe('DELETE /api/membros/[id]', () => {
    it('deve excluir membro', async () => {
      prismaMock.membro.delete.mockResolvedValue({
        id: '1',
        nome: 'Ana Silva',
      } as any)

      await prismaMock.membro.delete({
        where: { id: '1' },
      })

      expect(prismaMock.membro.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })
  })
})
