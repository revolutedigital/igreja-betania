import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface BetaniaDB extends DBSchema {
  membros: {
    key: string
    value: {
      id: string
      nome: string
      foto: string | null
      whatsapp: string
      dataAniversario: string | null
      grupoPequeno: boolean
      endereco?: string | null
      nomePai?: string | null
      nomeMae?: string | null
      syncedAt?: number
      pendingSync?: boolean
    }
    indexes: { 'by-nome': string; 'pending': number }
  }
  presencas: {
    key: string
    value: {
      id: string
      membroId: string
      cultoId: string
      presente: boolean
      syncedAt?: number
      pendingSync?: boolean
    }
    indexes: { 'by-culto': string; 'by-membro': string; 'pending': number }
  }
  cultos: {
    key: string
    value: {
      id: string
      data: string
      horario: string
      syncedAt?: number
      pendingSync?: boolean
    }
    indexes: { 'by-data': string; 'pending': number }
  }
  pendingActions: {
    key: number
    value: {
      id?: number
      type: 'create' | 'update' | 'delete'
      entity: 'membro' | 'presenca' | 'culto'
      data: Record<string, unknown>
      createdAt: number
      retries: number
    }
  }
  syncMeta: {
    key: string
    value: {
      entity: string
      lastSyncAt: number
    }
  }
}

const DB_NAME = 'betania-offline'
const DB_VERSION = 2 // Incrementado para nova estrutura

let dbInstance: IDBPDatabase<BetaniaDB> | null = null

export async function getDB(): Promise<IDBPDatabase<BetaniaDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<BetaniaDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Store de membros
      if (!db.objectStoreNames.contains('membros')) {
        const membrosStore = db.createObjectStore('membros', { keyPath: 'id' })
        membrosStore.createIndex('by-nome', 'nome')
        membrosStore.createIndex('pending', 'pendingSync')
      }

      // Store de presenças
      if (!db.objectStoreNames.contains('presencas')) {
        const presencasStore = db.createObjectStore('presencas', { keyPath: 'id' })
        presencasStore.createIndex('by-culto', 'cultoId')
        presencasStore.createIndex('by-membro', 'membroId')
        presencasStore.createIndex('pending', 'pendingSync')
      }

      // Store de cultos
      if (!db.objectStoreNames.contains('cultos')) {
        const cultosStore = db.createObjectStore('cultos', { keyPath: 'id' })
        cultosStore.createIndex('by-data', 'data')
        cultosStore.createIndex('pending', 'pendingSync')
      }

      // Store de ações pendentes
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true })
      }

      // Store de metadados de sync
      if (!db.objectStoreNames.contains('syncMeta')) {
        db.createObjectStore('syncMeta', { keyPath: 'entity' })
      }
    },
  })

  return dbInstance
}

// ============================================
// MEMBROS
// ============================================

export async function saveMembrosOffline(membros: BetaniaDB['membros']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['membros', 'syncMeta'], 'readwrite')

  for (const membro of membros) {
    await tx.objectStore('membros').put({ ...membro, syncedAt: Date.now(), pendingSync: false })
  }

  await tx.objectStore('syncMeta').put({ entity: 'membros', lastSyncAt: Date.now() })
  await tx.done
}

export async function getMembrosOffline(): Promise<BetaniaDB['membros']['value'][]> {
  const db = await getDB()
  return db.getAll('membros')
}

export async function getMembroOffline(id: string): Promise<BetaniaDB['membros']['value'] | undefined> {
  const db = await getDB()
  return db.get('membros', id)
}

export async function saveMembroOffline(membro: BetaniaDB['membros']['value']): Promise<void> {
  const db = await getDB()
  const isOffline = !navigator.onLine

  await db.put('membros', {
    ...membro,
    syncedAt: Date.now(),
    pendingSync: isOffline,
  })

  if (isOffline) {
    await addPendingAction('create', 'membro', membro)
  }
}

export async function updateMembroOffline(id: string, data: Partial<BetaniaDB['membros']['value']>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('membros', id)

  if (existing) {
    const updated = { ...existing, ...data, pendingSync: !navigator.onLine }
    await db.put('membros', updated)

    if (!navigator.onLine) {
      await addPendingAction('update', 'membro', { id, ...data })
    }
  }
}

// ============================================
// PRESENÇAS
// ============================================

export async function savePresencaOffline(
  presenca: Omit<BetaniaDB['presencas']['value'], 'syncedAt'>
): Promise<void> {
  const db = await getDB()
  const isOffline = !navigator.onLine

  await db.put('presencas', {
    ...presenca,
    syncedAt: Date.now(),
    pendingSync: isOffline,
  })

  if (isOffline) {
    await addPendingAction('create', 'presenca', presenca)
  }
}

export async function getPresencasByCultoOffline(
  cultoId: string
): Promise<BetaniaDB['presencas']['value'][]> {
  const db = await getDB()
  return db.getAllFromIndex('presencas', 'by-culto', cultoId)
}

export async function deletePresencaOffline(membroId: string, cultoId: string): Promise<void> {
  const db = await getDB()
  const presencas = await db.getAllFromIndex('presencas', 'by-culto', cultoId)
  const presenca = presencas.find((p) => p.membroId === membroId)

  if (presenca) {
    await db.delete('presencas', presenca.id)

    if (!navigator.onLine) {
      await addPendingAction('delete', 'presenca', { membroId, cultoId })
    }
  }
}

export async function savePresencasOffline(presencas: BetaniaDB['presencas']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('presencas', 'readwrite')

  for (const presenca of presencas) {
    await tx.store.put({ ...presenca, syncedAt: Date.now(), pendingSync: false })
  }

  await tx.done
}

// ============================================
// CULTOS
// ============================================

export async function saveCultosOffline(cultos: BetaniaDB['cultos']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['cultos', 'syncMeta'], 'readwrite')

  for (const culto of cultos) {
    await tx.objectStore('cultos').put({ ...culto, syncedAt: Date.now(), pendingSync: false })
  }

  await tx.objectStore('syncMeta').put({ entity: 'cultos', lastSyncAt: Date.now() })
  await tx.done
}

export async function getCultosOffline(): Promise<BetaniaDB['cultos']['value'][]> {
  const db = await getDB()
  return db.getAll('cultos')
}

export async function getCultoOffline(id: string): Promise<BetaniaDB['cultos']['value'] | undefined> {
  const db = await getDB()
  return db.get('cultos', id)
}

export async function saveCultoOffline(culto: BetaniaDB['cultos']['value']): Promise<void> {
  const db = await getDB()
  const isOffline = !navigator.onLine

  await db.put('cultos', {
    ...culto,
    syncedAt: Date.now(),
    pendingSync: isOffline,
  })

  if (isOffline) {
    await addPendingAction('create', 'culto', culto)
  }
}

// ============================================
// AÇÕES PENDENTES
// ============================================

export async function addPendingAction(
  type: 'create' | 'update' | 'delete',
  entity: 'membro' | 'presenca' | 'culto',
  data: Record<string, unknown>
): Promise<void> {
  const db = await getDB()
  await db.add('pendingActions', {
    type,
    entity,
    data,
    createdAt: Date.now(),
    retries: 0,
  })
}

export async function getPendingActions(): Promise<BetaniaDB['pendingActions']['value'][]> {
  const db = await getDB()
  return db.getAll('pendingActions')
}

export async function clearPendingAction(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('pendingActions', id)
}

export async function incrementRetry(id: number): Promise<void> {
  const db = await getDB()
  const action = await db.get('pendingActions', id)
  if (action) {
    action.retries++
    await db.put('pendingActions', action)
  }
}

// ============================================
// SINCRONIZAÇÃO COMPLETA
// ============================================

const MAX_RETRIES = 3

export async function syncPendingActions(): Promise<{ success: number; failed: number }> {
  if (!navigator.onLine) {
    return { success: 0, failed: 0 }
  }

  const actions = await getPendingActions()
  let success = 0
  let failed = 0

  for (const action of actions) {
    // Pular ações com muitas falhas
    if (action.retries >= MAX_RETRIES) {
      console.warn(`Ação ${action.id} excedeu máximo de retries, removendo...`)
      await clearPendingAction(action.id!)
      failed++
      continue
    }

    try {
      let endpoint = ''
      let method = ''
      let body: Record<string, unknown> | null = action.data

      switch (action.entity) {
        case 'presenca':
          endpoint = '/api/presenca'
          if (action.type === 'create') {
            method = 'POST'
          } else if (action.type === 'delete') {
            endpoint = `/api/presenca?membroId=${action.data.membroId}&cultoId=${action.data.cultoId}`
            method = 'DELETE'
            body = null
          }
          break

        case 'membro':
          if (action.type === 'create') {
            endpoint = '/api/membros'
            method = 'POST'
          } else if (action.type === 'update') {
            endpoint = `/api/membros/${action.data.id}`
            method = 'PUT'
          } else if (action.type === 'delete') {
            endpoint = `/api/membros/${action.data.id}`
            method = 'DELETE'
            body = null
          }
          break

        case 'culto':
          if (action.type === 'create') {
            endpoint = '/api/cultos'
            method = 'POST'
          }
          break
      }

      if (endpoint && method) {
        const response = await fetch(endpoint, {
          method,
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        })

        if (response.ok) {
          await clearPendingAction(action.id!)

          // Atualizar registro local como sincronizado
          const db = await getDB()
          if (action.entity === 'membro' && action.data.id) {
            const membro = await db.get('membros', action.data.id as string)
            if (membro) {
              await db.put('membros', { ...membro, pendingSync: false })
            }
          } else if (action.entity === 'culto' && action.data.id) {
            const culto = await db.get('cultos', action.data.id as string)
            if (culto) {
              await db.put('cultos', { ...culto, pendingSync: false })
            }
          }

          success++
        } else {
          await incrementRetry(action.id!)
          failed++
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar ação:', error)
      await incrementRetry(action.id!)
      failed++
    }
  }

  return { success, failed }
}

// Sincronização de dados do servidor
export async function syncFromServer(): Promise<void> {
  if (!navigator.onLine) return

  try {
    // Sincronizar membros
    const membrosRes = await fetch('/api/membros?all=true')
    if (membrosRes.ok) {
      const membrosData = await membrosRes.json()
      const membros = membrosData.data || membrosData
      if (Array.isArray(membros)) {
        await saveMembrosOffline(membros)
      }
    }

    // Sincronizar cultos
    const cultosRes = await fetch('/api/cultos')
    if (cultosRes.ok) {
      const cultosData = await cultosRes.json()
      const cultos = cultosData.data || cultosData
      if (Array.isArray(cultos)) {
        await saveCultosOffline(cultos)
      }
    }

    console.log('Sincronização do servidor concluída')
  } catch (error) {
    console.error('Erro ao sincronizar do servidor:', error)
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

export function initOfflineSync(): void {
  if (typeof window === 'undefined') return

  // Sincronizar quando voltar online
  window.addEventListener('online', async () => {
    console.log('Conexão restaurada, sincronizando...')

    // Primeiro envia ações pendentes
    const result = await syncPendingActions()
    console.log(`Ações pendentes: ${result.success} sucesso, ${result.failed} falhas`)

    // Depois atualiza dados do servidor
    await syncFromServer()
  })

  // Sincronizar dados na inicialização se online
  if (navigator.onLine) {
    syncFromServer().catch(console.error)
  }
}

// Verificar se há dados pendentes
export async function hasPendingData(): Promise<boolean> {
  const actions = await getPendingActions()
  return actions.length > 0
}

// Obter estatísticas de sync
export async function getSyncStats(): Promise<{
  pendingActions: number
  lastMembrosSync: number | null
  lastCultosSync: number | null
}> {
  const db = await getDB()
  const actions = await db.getAll('pendingActions')
  const membrosMeta = await db.get('syncMeta', 'membros')
  const cultosMeta = await db.get('syncMeta', 'cultos')

  return {
    pendingActions: actions.length,
    lastMembrosSync: membrosMeta?.lastSyncAt || null,
    lastCultosSync: cultosMeta?.lastSyncAt || null,
  }
}
