export interface ScannedEntry {
  handle: FileSystemFileHandle
  /** Caminho relativo à pasta raiz escolhida, ex. "Quadros/Sub/foto.jpg". */
  relativePath: string
  /** Nome da subpasta de primeiro nível (subpastas aninhadas somam aqui); string vazia = arquivo na raiz. */
  topLevelGroup: string
  name: string
}

export interface ScanGroup {
  /** topLevelGroup original ('' = raiz). */
  key: string
  label: string
  fileCount: number
}

export type ProcessErrorStage = 'compress' | 'embed' | 'tag' | 'upload' | 'insert'

export interface ProcessEntryResult {
  status: 'uploaded' | 'skipped-duplicate' | 'error'
  externalId: string
  relativePath: string
  bytesUploaded?: number
  errorStage?: ProcessErrorStage
  errorMessage?: string
}

export type BulkUploadStatus = 'idle' | 'scanning' | 'scanned' | 'uploading' | 'done'
