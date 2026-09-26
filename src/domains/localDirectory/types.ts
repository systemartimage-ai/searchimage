export type FolderStatus = 'indexing' | 'ready' | 'error'

export interface LocalFolder {
  id: string
  name: string
  includeSubfolders: boolean
  status: FolderStatus
  done: number
  total: number
  errorMessage: string | null
}
