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
      syncedAt?: number
    }
    indexes: { 'by-nome': string }
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
    }
    indexes: { 'by-data': string }
  }
  pendingActions: {
    key: number
    value: {
      id?: number
      type: 'create' | 'update' | 'delete'
      entity: 'membro' | 'presenca' | 'culto'
      data: Record<string, unknown>
      createdAt: number
    }
  }
}

const DB_NAME = 'betania-offline'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<BetaniaDB> | null = null

export async function getDB(): Promise<IDBPDatabase<BetaniaDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<BetaniaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store de membros
      if (!db.objectStoreNames.contains('membros')) {
        const membrosStore = db.createObjectStore('membros', { keyPath: 'id' })
        membrosStore.createIndex('by-nome', 'nome')
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
      }

      // Store de ações pendentes
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true })
      }
    },
  })

  return dbInstance
}

// Membros
export async function saveMembrosOffline(membros: BetaniaDB['membros']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('membros', 'readwrite')

  for (const membro of membros) {
    await tx.store.put({ ...membro, syncedAt: Date.now() })
  }

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

// Presenças
export async function savePresencaOffline(
  presenca: Omit<BetaniaDB['presencas']['value'], 'syncedAt'>
): Promise<void> {
  const db = await getDB()
  await db.put('presencas', {
    ...presenca,
    syncedAt: Date.now(),
    pendingSync: !navigator.onLine,
  })

  // Se offline, adicionar à fila de sincronização
  if (!navigator.onLine) {
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

// Cultos
export async function saveCultosOffline(cultos: BetaniaDB['cultos']['value'][]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('cultos', 'readwrite')

  for (const culto of cultos) {
    await tx.store.put({ ...culto, syncedAt: Date.now() })
  }

  await tx.done
}

export async function getCultosOffline(): Promise<BetaniaDB['cultos']['value'][]> {
  const db = await getDB()
  return db.getAll('cultos')
}

// Ações pendentes
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

// Sincronização
export async function syncPendingActions(): Promise<{ success: number; failed: number }> {
  if (!navigator.onLine) {
    return { success: 0, failed: 0 }
  }

  const actions = await getPendingActions()
  let success = 0
  let failed = 0

  for (const action of actions) {
    try {
      let endpoint = ''
      let method = ''
      let body = action.data

      switch (action.entity) {
        case 'presenca':
          endpoint = '/api/presenca'
          if (action.type === 'create') {
            method = 'POST'
          } else if (action.type === 'delete') {
            endpoint = `/api/presenca?membroId=${action.data.membroId}&cultoId=${action.data.cultoId}`
            method = 'DELETE'
            body = {}
          }
          break
        // Adicionar outros casos conforme necessário
      }

      if (endpoint && method) {
        const response = await fetch(endpoint, {
          method,
          headers: method !== 'DELETE' ? { 'Content-Type': 'application/json' } : undefined,
          body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
        })

        if (response.ok) {
          await clearPendingAction(action.id!)
          success++
        } else {
          failed++
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar ação:', error)
      failed++
    }
  }

  return { success, failed }
}

// Inicializar listener de conexão
export function initOfflineSync(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('online', async () => {
    console.log('Conexão restaurada, sincronizando...')
    const result = await syncPendingActions()
    console.log(`Sincronização concluída: ${result.success} sucesso, ${result.failed} falhas`)
  })
}
