import type { CatalogItem } from '@/domains/catalog/types'
import { scoreCatalogItems, type SearchFilters, type SearchResult } from './scoreCatalogItems'

/**
 * Busca no Diretório Local: 100% em memória, no navegador — os itens
 * (com embedding já calculado por ClipEmbeddingProvider ao conectar a
 * pasta) nunca saem do dispositivo. category/code filtram vazio pra
 * itens locais (não têm essas informações), então só limit/threshold
 * fazem efeito de verdade aqui.
 */
export function searchLocalDirectory(
  items: CatalogItem[],
  queryEmbedding: number[],
  filters: SearchFilters,
): SearchResult[] {
  return scoreCatalogItems(items, queryEmbedding, { ...filters, category: undefined, code: undefined })
}
