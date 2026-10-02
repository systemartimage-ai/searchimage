import type { CatalogItem } from '@/domains/catalog/types'
import { cosineSimilarity } from './similarity'

export interface SearchResult {
  item: CatalogItem
  score: number
}

export interface SearchFilters {
  limit: number
  category?: string
  code?: string
  /** Similaridade mínima (0 a 1) para o item aparecer no resultado. */
  threshold?: number
}

/**
 * Núcleo da busca por similaridade sobre um array de CatalogItem em
 * memória (mesma dimensão de embedding da consulta). Usado tanto pelo
 * catálogo mock/amostra (searchMockCatalog.ts) quanto pela busca no
 * Diretório Local (searchLocalDirectory.ts) — a diferença entre os
 * dois é só qual array de itens é passado.
 */
export function scoreCatalogItems(
  items: CatalogItem[],
  queryEmbedding: number[],
  filters: SearchFilters,
): SearchResult[] {
  const codeQuery = filters.code?.trim().toLowerCase()

  const scored = items
    .filter((item) => {
      if (filters.category && item.category !== filters.category) return false
      if (codeQuery && !item.code.toLowerCase().includes(codeQuery)) return false
      return true
    })
    .map((item) => ({ item, score: cosineSimilarity(queryEmbedding, item.embedding) }))

  const filtered =
    filters.threshold != null ? scored.filter((r) => r.score >= filters.threshold!) : scored

  return filtered.sort((a, b) => b.score - a.score).slice(0, filters.limit)
}
