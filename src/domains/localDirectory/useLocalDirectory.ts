import { useCallback, useRef, useState } from 'react'
import type { CatalogItem } from '@/domains/catalog/types'
import { startBackgroundKeepAlive, stopBackgroundKeepAlive } from '@/lib/backgroundKeepAlive'
import { indexLocalDirectory } from './indexLocalDirectory'
import type { LocalFolder } from './types'

const SUPPORTED = typeof window !== 'undefined' && 'showDirectoryPicker' in window

export function useLocalDirectory() {
  const [folders, setFolders] = useState<LocalFolder[]>([])
  const [items, setItems] = useState<CatalogItem[]>([])
  const itemsByFolderRef = useRef<Map<string, CatalogItem[]>>(new Map())

  const updateFolder = useCallback((id: string, patch: Partial<LocalFolder>) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }, [])

  const rebuildItems = useCallback(() => {
    setItems(Array.from(itemsByFolderRef.current.values()).flat())
  }, [])

  const connect = useCallback(
    async (includeSubfolders: boolean) => {
      if (!SUPPORTED) return

      let dirHandle: FileSystemDirectoryHandle
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API ainda não tem tipos padrão do TS/lib.dom
        dirHandle = await (window as any).showDirectoryPicker()
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        return
      }

      const id = crypto.randomUUID()
      const folder: LocalFolder = {
        id,
        name: dirHandle.name,
        includeSubfolders,
        status: 'indexing',
        done: 0,
        total: 0,
        errorMessage: null,
      }
      setFolders((prev) => [...prev, folder])
      itemsByFolderRef.current.set(id, [])

      // Reduz (não elimina) a chance do navegador congelar o processamento
      // se o usuário trocar de aba durante a indexação — ver backgroundKeepAlive.ts.
      startBackgroundKeepAlive()
      try {
        await indexLocalDirectory(dirHandle, id, dirHandle.name, includeSubfolders, {
          onTotal: (total) => updateFolder(id, { total }),
          onItem: (item, doneCount) => {
            itemsByFolderRef.current.get(id)?.push(item)
            rebuildItems()
            updateFolder(id, { done: doneCount })
          },
        })
        updateFolder(id, { status: 'ready' })
      } catch {
        updateFolder(id, {
          status: 'error',
          errorMessage: 'Não foi possível indexar as imagens dessa pasta.',
        })
      } finally {
        stopBackgroundKeepAlive()
      }
    },
    [updateFolder, rebuildItems],
  )

  const removeFolder = useCallback(
    (id: string) => {
      for (const item of itemsByFolderRef.current.get(id) ?? []) {
        URL.revokeObjectURL(item.thumbnailUrl)
      }
      itemsByFolderRef.current.delete(id)
      rebuildItems()
      setFolders((prev) => prev.filter((f) => f.id !== id))
    },
    [rebuildItems],
  )

  const clear = useCallback(() => {
    for (const folderItems of itemsByFolderRef.current.values()) {
      for (const item of folderItems) URL.revokeObjectURL(item.thumbnailUrl)
    }
    itemsByFolderRef.current.clear()
    setItems([])
    setFolders([])
  }, [])

  return { folders, items, connect, removeFolder, clear, supported: SUPPORTED }
}
