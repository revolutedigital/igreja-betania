import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Prisma antes de importar
vi.mock('@/lib/prisma', () => ({
  prisma: {
    membro: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    culto: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    presenca: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

// Mock rate limit para não bloquear testes
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ success: true }),
  getClientIP: () => '127.0.0.1',
}))

import { prisma } from '@/lib/prisma'

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Membros API', () => {
    describe('GET /api/membros', () => {
      it('deve retornar membros paginados', async () => {
        const mockMembros = [
          { id: 'cm1', nome: 'Ana Silva', foto: null, whatsapp: '11999999999', dataAniversario: null, endereco: null, grupoPequeno: false, nomePai: null, nomeMae: null, createdAt: new Date() },
          { id: 'cm2', nome: 'Bruno Costa', foto: null, whatsapp: '11888888888', dataAniversario: null, endereco: null, grupoPequeno: true, nomePai: null, nomeMae: null, createdAt: new Date() },
        ]

        vi.mocked(prisma.membro.findMany).mockResolvedValue(mockMembros)
        vi.mocked(prisma.membro.count).mockResolvedValue(2)

        // Importar dinamicamente para garantir que o mock está ativo
        const { GET } = await import('@/app/api/membros/route')

        const request = new Request('http://localhost:3000/api/membros?page=1&limit=10')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data.pagination).toBeDefined()
        expect(data.data.pagination.total).toBe(2)
      })

      it('deve retornar todos os membros com all=true', async () => {
        const mockMembros = [
          { id: 'cm1', nome: 'Ana Silva', foto: null, whatsapp: '11999999999', dataAniversario: null, endereco: null, grupoPequeno: false, nomePai: null, nomeMae: null, createdAt: new Date() },
        ]

        vi.mocked(prisma.membro.findMany).mockResolvedValue(mockMembros)

        const { GET } = await import('@/app/api/membros/route')

        const request = new Request('http://localhost:3000/api/membros?all=true')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(Array.isArray(data.data)).toBe(true)
      })

      it('deve filtrar por busca', async () => {
        vi.mocked(prisma.membro.findMany).mockResolvedValue([])
        vi.mocked(prisma.membro.count).mockResolvedValue(0)

        const { GET } = await import('@/app/api/membros/route')

        const request = new Request('http://localhost:3000/api/membros?busca=ana')
        await GET(request)

        expect(prisma.membro.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              nome: {
                contains: 'ana',
                mode: 'insensitive',
              },
            },
          })
        )
      })
    })

    describe('POST /api/membros', () => {
      it('deve criar membro com dados válidos', async () => {
        const novoMembro = {
          id: 'cm123',
          nome: 'Carlos Santos',
          whatsapp: '11777777777',
          foto: null,
          nomePai: null,
          nomeMae: null,
          dataAniversario: null,
          endereco: null,
          grupoPequeno: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        vi.mocked(prisma.membro.findFirst).mockResolvedValue(null) // Não existe duplicado
        vi.mocked(prisma.membro.create).mockResolvedValue(novoMembro)

        const { POST } = await import('@/app/api/membros/route')

        const request = new Request('http://localhost:3000/api/membros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: 'Carlos Santos',
            whatsapp: '11777777777',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(data.data.nome).toBe('Carlos Santos')
      })

      it('deve rejeitar WhatsApp duplicado', async () => {
        vi.mocked(prisma.membro.findFirst).mockResolvedValue({
          id: 'existente',
          nome: 'Existente',
          whatsapp: '11777777777',
        } as any)

        const { POST } = await import('@/app/api/membros/route')

        const request = new Request('http://localhost:3000/api/membros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: 'Novo Membro',
            whatsapp: '11777777777',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.success).toBe(false)
        expect(data.error).toContain('WhatsApp')
      })

      it('deve rejeitar dados inválidos', async () => {
        const { POST } = await import('@/app/api/membros/route')

        const request = new Request('http://localhost:3000/api/membros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: 'A', // Muito curto
            whatsapp: '123', // Muito curto
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
      })
    })
  })

  describe('Cultos API', () => {
    describe('GET /api/cultos', () => {
      it('deve retornar lista de cultos', async () => {
        const mockCultos = [
          { id: 'cc1', data: new Date(), horario: '10:00', createdAt: new Date(), _count: { presencas: 15 } },
          { id: 'cc2', data: new Date(), horario: '19:00', createdAt: new Date(), _count: { presencas: 20 } },
        ]

        vi.mocked(prisma.culto.findMany).mockResolvedValue(mockCultos)

        const { GET } = await import('@/app/api/cultos/route')

        const request = new Request('http://localhost:3000/api/cultos')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toHaveLength(2)
      })
    })

    describe('POST /api/cultos', () => {
      it('deve criar culto novo', async () => {
        const novoCulto = {
          id: 'cc123',
          data: new Date('2026-01-26'),
          horario: '10:00',
          createdAt: new Date(),
        }

        vi.mocked(prisma.culto.findFirst).mockResolvedValue(null)
        vi.mocked(prisma.culto.create).mockResolvedValue(novoCulto)

        const { POST } = await import('@/app/api/cultos/route')

        const request = new Request('http://localhost:3000/api/cultos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: '2026-01-26',
            horario: '10:00',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
      })

      it('deve retornar culto existente ao invés de duplicar', async () => {
        const cultoExistente = {
          id: 'cc-existente',
          data: new Date('2026-01-26'),
          horario: '10:00',
          createdAt: new Date(),
        }

        vi.mocked(prisma.culto.findFirst).mockResolvedValue(cultoExistente)

        const { POST } = await import('@/app/api/cultos/route')

        const request = new Request('http://localhost:3000/api/cultos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: '2026-01-26',
            horario: '10:00',
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.id).toBe('cc-existente')
        expect(prisma.culto.create).not.toHaveBeenCalled()
      })
    })
  })

  describe('Presença API', () => {
    describe('GET /api/presenca', () => {
      it('deve retornar presenças de um culto', async () => {
        const mockPresencas = [
          { id: 'p1', membroId: 'cm1', cultoId: 'cc1', presente: true, createdAt: new Date(), membro: { id: 'cm1', nome: 'Ana', foto: null, whatsapp: '11999999999' } },
        ]

        vi.mocked(prisma.presenca.findMany).mockResolvedValue(mockPresencas)

        const { GET } = await import('@/app/api/presenca/route')

        const request = new Request('http://localhost:3000/api/presenca?cultoId=cc1')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })
    })

    describe('POST /api/presenca', () => {
      it('deve registrar presença', async () => {
        const presenca = {
          id: 'p123',
          membroId: 'cm1',
          cultoId: 'cc1',
          presente: true,
          createdAt: new Date(),
        }

        vi.mocked(prisma.presenca.upsert).mockResolvedValue(presenca)

        const { POST } = await import('@/app/api/presenca/route')

        const request = new Request('http://localhost:3000/api/presenca', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            membroId: 'cm1abc123def456ghi', // CUID válido
            cultoId: 'cc1abc123def456ghi',
            presente: true,
          }),
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      })
    })
  })
})

describe('Validations', () => {
  describe('Senha Schema', () => {
    it('deve rejeitar senha fraca', async () => {
      const { registroSchema } = await import('@/lib/validations')

      const result = registroSchema.safeParse({
        nome: 'Teste',
        email: 'teste@teste.com',
        senha: '123456', // Senha fraca
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message)
        expect(messages.some(m => m.includes('8 caracteres') || m.includes('maiúscula'))).toBe(true)
      }
    })

    it('deve aceitar senha forte', async () => {
      const { registroSchema } = await import('@/lib/validations')

      const result = registroSchema.safeParse({
        nome: 'Teste',
        email: 'teste@teste.com',
        senha: 'Senha@123', // Senha forte
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Paginação', () => {
    it('deve parsear parâmetros de paginação', async () => {
      const { parsePagination } = await import('@/lib/validations')

      const params = new URLSearchParams('page=2&limit=25')
      const result = parsePagination(params)

      expect(result.page).toBe(2)
      expect(result.limit).toBe(25)
    })

    it('deve usar defaults para parâmetros inválidos', async () => {
      const { parsePagination } = await import('@/lib/validations')

      const params = new URLSearchParams('page=abc&limit=-5')
      const result = parsePagination(params)

      expect(result.page).toBe(1)
      expect(result.limit).toBe(50)
    })
  })
})
