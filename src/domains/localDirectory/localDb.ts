// Banco IndexedDB compartilhado entre os caches de diretório local
// (embeddings por arquivo e pastas lembradas entre sessões) — um único
// openDb() central evita dois módulos independentes disputando a mesma
// versão do mesmo banco (cada `indexedDB.open` com versão diferente
// dispara upgrade e pode conflitar se gerenciado em dois lugares).
const DB_NAME = 'search-image-local-cache'
const DB_VERSION = 2

export const EMBEDDINGS_STORE = 'embeddings'
export const FOLDERS_STORE = 'folders'

export function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(EMBEDDINGS_STORE)) db.createObjectStore(EMBEDDINGS_STORE)
      if (!db.objectStoreNames.contains(FOLDERS_STORE)) db.createObjectStore(FOLDERS_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
