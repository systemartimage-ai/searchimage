import { supabase } from '@/lib/supabase'
import type { CatalogItem } from '@/domains/catalog/types'
import type { SearchFilters, SearchResult } from './searchMockCatalog'

interface MatchCatalogItemsRow {
  id: string
  title: string | null
  code: string | null
  category: string | null
  source: string | null
  thumbnail_url: string | null
  score: number
}

/**
 * Busca real: nearest-neighbor no Postgres/pgvector via RPC
 * `match_catalog_items` (ver supabase/migrations/20260925010000_...).
 * Substitui searchMockCatalog() na aplicação — que continua existindo
 * só para os testes de unidade da lógica de similaridade/filtros.
 *
 * A RLS de catalog_items já garante que só aparecem itens do
 * index_versions ACTIVE, então não precisa filtrar isso aqui.
 */
export async function searchCatalog(
  queryEmbedding: number[],
  filters: SearchFilters,
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc('match_catalog_items', {
    query_embedding: queryEmbedding,
    match_limit: filters.limit,
    match_category: filters.category || null,
    match_code: filters.code?.trim() || null,
    match_threshold: filters.threshold ?? null,
  })

  if (error) throw error

  return ((data ?? []) as MatchCatalogItemsRow[]).map((row) => {
    const item: CatalogItem = {
      id: row.id,
      title: row.title ?? '',
      code: row.code ?? '',
      category: row.category ?? '',
      source: row.source ?? '',
      thumbnailUrl: row.thumbnail_url ?? '',
      // Embedding não vem do servidor (não precisa no cliente — a
      // similaridade já foi calculada no Postgres).
      embedding: [],
    }
    return { item, score: row.score }
  })
}
