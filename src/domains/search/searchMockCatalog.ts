import { REAL_CATALOG_SAMPLE } from '@/domains/catalog/realCatalogSample'
import type { CatalogItem } from '@/domains/catalog/types'
import { cosineSimilarity } from './similarity'

// MOCK_CATALOG (fictício, embedding de 16 dimensões) saiu da busca ao
// vivo: desde que REAL_CATALOG_SAMPLE passou a usar embedding CLIP real
// (512 dimensões, ver realCatalogSample.ts), misturar os dois faria
// cosineSimilarity lançar erro de dimensões diferentes. MOCK_CATALOG
// continua existindo só para os testes que dependem dele diretamente
// (searchMockCatalog.test.ts).
const SEARCHABLE_CATALOG: CatalogItem[] = REAL_CATALOG_SAMPLE

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

export function searchMockCatalog(
  queryEmbedding: number[],
  filters: SearchFilters,
): SearchResult[] {
  const codeQuery = filters.code?.trim().toLowerCase()

  const scored = SEARCHABLE_CATALOG.filter((item) => {
    if (filters.category && item.category !== filters.category) return false
    if (codeQuery && !item.code.toLowerCase().includes(codeQuery)) return false
    return true
  }).map((item) => ({ item, score: cosineSimilarity(queryEmbedding, item.embedding) }))

  const filtered =
    filters.threshold != null ? scored.filter((r) => r.score >= filters.threshold!) : scored

  return filtered.sort((a, b) => b.score - a.score).slice(0, filters.limit)
}
