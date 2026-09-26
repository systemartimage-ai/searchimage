import type { CatalogItem } from '@/domains/catalog/types'
import { cacheKey, getCachedEmbedding, setCachedEmbedding } from './embeddingCache'
import { createThumbnailUrl } from './thumbnail'
import { embedInWorker } from './clipWorkerClient'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Enumera arquivos de imagem dentro de um FileSystemDirectoryHandle já
 * autorizado pelo usuário. `includeSubfolders` controla se desce
 * recursivamente nas subpastas ou só olha o nível raiz da pasta
 * selecionada.
 */
async function* walkImageFiles(
  dirHandle: FileSystemDirectoryHandle,
  includeSubfolders: boolean,
): AsyncGenerator<File> {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'directory') {
      if (includeSubfolders) yield* walkImageFiles(entry, includeSubfolders)
    } else if (entry.kind === 'file') {
      const file = await entry.getFile()
      if (ACCEPTED_TYPES.includes(file.type)) {
        yield file
      }
    }
  }
}

export interface IndexLocalDirectoryCallbacks {
  /** Chamado assim que o total de arquivos é conhecido (antes de processar). */
  onTotal?: (total: number) => void
  /** Chamado a cada arquivo processado, com o item pronto (já com embedding e miniatura). */
  onItem: (item: CatalogItem, doneCount: number) => void
}

export async function indexLocalDirectory(
  dirHandle: FileSystemDirectoryHandle,
  folderId: string,
  folderLabel: string,
  includeSubfolders: boolean,
  callbacks: IndexLocalDirectoryCallbacks,
): Promise<void> {
  const files: File[] = []
  for await (const file of walkImageFiles(dirHandle, includeSubfolders)) {
    files.push(file)
  }
  callbacks.onTotal?.(files.length)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const key = cacheKey(file)

    // Miniatura e checagem de cache correm em paralelo com a chamada
    // ao Worker (quando precisa calcular de verdade) — a miniatura não
    // depende do embedding, então não precisa esperar.
    const [thumbnailUrl, embedding] = await Promise.all([
      createThumbnailUrl(file),
      (async () => {
        const cached = await getCachedEmbedding(key)
        if (cached) return cached
        const computed = await embedInWorker(file)
        await setCachedEmbedding(key, computed)
        return computed
      })(),
    ])

    const item: CatalogItem = {
      id: `${folderId}-${i}-${file.name}`,
      title: file.name.replace(/\.[^./]+$/, ''),
      code: file.name,
      category: '',
      source: `Diretório Local — ${folderLabel}`,
      thumbnailUrl,
      embedding,
    }

    callbacks.onItem(item, i + 1)
  }
}
