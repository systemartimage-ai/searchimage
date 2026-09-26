// Cache de embeddings de diretório local (IndexedDB) — permite
// reconectar a mesma pasta numa sessão futura sem reprocessar
// (recalcular embedding) arquivos que não mudaram. Chave = nome +
// tamanho + data de modificação do arquivo (fingerprint barato, sem
// precisar ler o conteúdo inteiro de novo).

const DB_NAME = 'search-image-local-cache'
const STORE_NAME = 'embeddings'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function cacheKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export async function getCachedEmbedding(key: string): Promise<number[] | null> {
  try {
    const db = await openDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    // Cache é otimização, não requisito — se IndexedDB falhar
    // (navegador privado, cota, etc.), só recalcula normalmente.
    return null
  }
}

export async function setCachedEmbedding(key: string, embedding: number[]): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(embedding, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Idem: falha ao gravar cache não deve quebrar a indexação.
  }
}
