import type { ProcessEntryResult, ScannedEntry } from './types'

/** Remove caracteres que o Storage não aceita bem no caminho do objeto. */
export function sanitizeExternalId(externalId: string): string {
  return externalId.replace(/[^a-zA-Z0-9/._-]+/g, '_')
}

export function buildStoragePath(sourceId: string, externalId: string): string {
  return `${sourceId}/${sanitizeExternalId(externalId)}.webp`
}

/** Mesma convenção do script Node (uploadLocalPhotos.mjs) — prefixar com o nome da pasta raiz
 * evita colisão entre duas pastas raiz diferentes que por acaso tenham a mesma subestrutura. */
export function buildExternalId(rootFolderName: string, relativePath: string): string {
  return `${rootFolderName}::${relativePath}`
}

export interface DerivedMetadata {
  title: string
  code: string
  category: string | null
}

/** Título/código vêm do nome do arquivo, categoria da subpasta de primeiro nível — tudo editável depois. */
export function deriveMetadataFromPath(
  entry: Pick<ScannedEntry, 'relativePath' | 'topLevelGroup'>,
): DerivedMetadata {
  const filename = entry.relativePath.split('/').pop() ?? entry.relativePath
  const code = filename.replace(/\.[^./]+$/, '')
  return { title: code, code, category: entry.topLevelGroup || null }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const STORAGE_FREE_TIER_BYTES = 1 * 1024 * 1024 * 1024 // 1GB (Supabase free tier)

export interface StorageProjection {
  avgBytesPerFile: number
  projectedBytes: number
  pctOfFreeTier: number
}

/** Média real a partir de uma amostra JÁ COMPRIMIDA (não chuta) — mesma lógica do script de upload em massa. */
export function averageBytes(sampleSizesBytes: number[]): number {
  if (sampleSizesBytes.length === 0) return 0
  return sampleSizesBytes.reduce((sum, n) => sum + n, 0) / sampleSizesBytes.length
}

/** Projeta o total a partir de uma média já conhecida — recalculável instantaneamente a cada toggle de subpasta, sem recomprimir nada. */
export function projectFromAverage(avgBytesPerFile: number, totalFileCount: number): StorageProjection {
  const projectedBytes = avgBytesPerFile * totalFileCount
  return {
    avgBytesPerFile,
    projectedBytes,
    pctOfFreeTier: (projectedBytes / STORAGE_FREE_TIER_BYTES) * 100,
  }
}

/** CSV pra exportar o log de erros de um lote grande — pura, testável sem DOM. */
export function buildErrorCsv(errors: ProcessEntryResult[]): string {
  const header = 'arquivo,etapa,mensagem'
  const rows = errors.map((e) => {
    const stage = e.errorStage ?? ''
    const message = (e.errorMessage ?? '').replace(/"/g, '""')
    const path = e.relativePath.replace(/"/g, '""')
    return `"${path}","${stage}","${message}"`
  })
  return [header, ...rows].join('\n')
}
