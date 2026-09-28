import { supabase } from '@/lib/supabase'
import type { CatalogItem } from '@/domains/catalog/types'
import { TIPO_TAG_VALUES } from '@/domains/catalog/tagTaxonomy'
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

const TIPO_VALUES = new Set<string>(TIPO_TAG_VALUES)

/**
 * "espelho"/"quadro" são um par mutuamente exclusivo classificado por
 * protótipo (ver classifyTipoByPrototype.ts), com limiar conservador
 * de propósito: item ambíguo fica SEM tag em vez de arriscar tag
 * errada. Achado real (item "VALES CARTOGRÁFICOS",
 * mme088a-118173-1361): esse item é claramente um quadro (margem
 * 0.9005 vs 0.8773 contra os protótipos), mas ficou 0.007 abaixo do
 * limiar de confiança — sem tag `quadro`. Como o filtro de tag exigia
 * a tag presente (`tags @> tag_keywords`), esse item ficava
 * TOTALMENTE INVISÍVEL em qualquer busca classificada como "quadro",
 * mesmo sendo o melhor resultado possível.
 *
 * Por isso, só esse par vira EXCLUSÃO (tira da lista quem tem a tag do
 * tipo OPOSTO — sinal confiável de tipo errado) em vez de EXIGÊNCIA —
 * preserva a precisão original (nunca mistura espelho com quadro nos
 * resultados) sem penalizar item corretamente identificável que ficou
 * abaixo do limiar de confiança no indexamento. As demais categorias
 * (tema/categoria/cor/animal) continuam com exigência estrita — são
 * aditivas, não um par exclusivo, então a mesma lógica não se aplica.
 */
export function splitTagKeywords(tagKeywords: string[]): { requireTags: string[]; excludeTags: string[] } {
  const tipo = tagKeywords.find((t) => TIPO_VALUES.has(t))
  const requireTags = tagKeywords.filter((t) => !TIPO_VALUES.has(t))
  const excludeTags = tipo ? [tipo === 'quadro' ? 'espelho' : 'quadro'] : []
  return { requireTags, excludeTags }
}

/**
 * Busca real: nearest-neighbor no Postgres/pgvector via RPC
 * `match_catalog_items_hybrid` (ver
 * supabase/migrations/20260926010000_add_tags_and_hybrid_search.sql e
 * 20260930020000_soft_tipo_tag_filter.sql).
 * Substitui searchMockCatalog() na aplicação — que continua existindo
 * só para os testes de unidade da lógica de similaridade/filtros.
 *
 * `tagKeywords` (opcional, vem de extractTagKeywords.ts pra busca por
 * texto ou de classifyTags/classifyTipoByPrototype pra busca por
 * imagem): quando presente, filtra primeiro pelos itens com aquela tag
 * — sinal exato, robusto a palavra única/genérica (ex. "leão" sozinho
 * tem sinal fraco na busca semântica pura, mas a tag `leao` acha
 * direto). Se ZERO itens baterem esse primeiro filtro, cai pra busca
 * semântica — mas mantendo a exclusão de tipo oposto (nunca mistura
 * espelho/quadro mesmo no fallback) — e só se ainda assim não filtrar
 * nada é que cai pra busca totalmente livre. Esses fallbacks só podem
 * acontecer aqui no client, não dá pra fazer só em SQL sem saber de
 * antemão se vai bater alguma coisa.
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
    const { requireTags, excludeTags } = splitTagKeywords(tagKeywords)

    const { data, error } = await supabase.rpc('match_catalog_items_hybrid', {
      ...baseParams,
      tag_keywords: requireTags.length > 0 ? requireTags : null,
      exclude_tags: excludeTags.length > 0 ? excludeTags : null,
    })
    if (error) throw error
    if (data && data.length > 0) return toResults(data)

    if (excludeTags.length > 0) {
      // Nenhum item bateu as tags exigidas — relaxa a exigência, mas
      // continua excluindo o tipo oposto (nunca mistura espelho/quadro).
      const relaxed = await supabase.rpc('match_catalog_items_hybrid', {
        ...baseParams,
        tag_keywords: null,
        exclude_tags: excludeTags,
      })
      if (relaxed.error) throw relaxed.error
      if (relaxed.data && relaxed.data.length > 0) return toResults(relaxed.data)
    }
    // Ainda nada — cai pra busca semântica totalmente livre abaixo.
  }

  const { data, error } = await supabase.rpc('match_catalog_items_hybrid', {
    ...baseParams,
    tag_keywords: null,
    exclude_tags: null,
  })
  if (error) throw error
  return toResults(data)
}
