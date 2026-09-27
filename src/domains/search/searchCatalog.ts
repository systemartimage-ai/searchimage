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

function toResults(data: MatchCatalogItemsRow[] | null): SearchResult[] {
  return (data ?? []).map((row) => {
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

/**
 * Busca real: nearest-neighbor no Postgres/pgvector via RPC
 * `match_catalog_items_hybrid` (ver
 * supabase/migrations/20260926010000_add_tags_and_hybrid_search.sql).
 * Substitui searchMockCatalog() na aplicação — que continua existindo
 * só para os testes de unidade da lógica de similaridade/filtros.
 *
 * `tagKeywords` (opcional, vem de extractTagKeywords.ts pra busca por
 * texto): quando presente, filtra primeiro pelos itens com aquela tag
 * — sinal exato, robusto a palavra única/genérica (ex. "leão" sozinho
 * tem sinal fraco na busca semântica pura, mas a tag `leao` acha
 * direto). Se ZERO itens tiverem a tag (ainda não classificados, ou
 * combinação rara), cai pra busca semântica pura automaticamente —
 * esse fallback só pode acontecer aqui no client, não dá pra fazer só
 * em SQL sem saber de antemão se vai bater alguma coisa.
 *
 * A RLS de catalog_items já garante que só aparecem itens do
 * index_versions ACTIVE, então não precisa filtrar isso aqui.
 */
export async function searchCatalog(
  queryEmbedding: number[],
  filters: SearchFilters,
  tagKeywords?: string[],
): Promise<SearchResult[]> {
  const baseParams = {
    query_embedding: queryEmbedding,
    match_limit: filters.limit,
    match_category: filters.category || null,
    match_code: filters.code?.trim() || null,
    match_threshold: filters.threshold ?? null,
  }

  if (tagKeywords && tagKeywords.length > 0) {
    const { data, error } = await supabase.rpc('match_catalog_items_hybrid', {
      ...baseParams,
      tag_keywords: tagKeywords,
    })
    if (error) throw error
    if (data && data.length > 0) return toResults(data)
    // Nenhum item com essa tag ainda — cai pra busca semântica pura abaixo.
  }

  const { data, error } = await supabase.rpc('match_catalog_items_hybrid', {
    ...baseParams,
    tag_keywords: null,
  })
  if (error) throw error
  return toResults(data)
}
