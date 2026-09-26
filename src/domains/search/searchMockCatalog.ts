import { REAL_CATALOG_SAMPLE } from '@/domains/catalog/realCatalogSample'
import type { CatalogItem } from '@/domains/catalog/types'
import { scoreCatalogItems, type SearchFilters, type SearchResult } from './scoreCatalogItems'

export type { SearchFilters, SearchResult }

// MOCK_CATALOG (fictício, embedding de 16 dimensões) saiu da busca ao
// vivo: desde que REAL_CATALOG_SAMPLE passou a usar embedding CLIP real
// (512 dimensões, ver realCatalogSample.ts), misturar os dois faria
// cosineSimilarity lançar erro de dimensões diferentes. MOCK_CATALOG
// continua existindo só para os testes que dependem dele diretamente
// (searchMockCatalog.test.ts).
const SEARCHABLE_CATALOG: CatalogItem[] = REAL_CATALOG_SAMPLE

export function searchMockCatalog(
  queryEmbedding: number[],
  filters: SearchFilters,
): SearchResult[] {
  return scoreCatalogItems(SEARCHABLE_CATALOG, queryEmbedding, filters)
}
