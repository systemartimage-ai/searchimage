-- Busca por imagem/texto: timeout 57014 com ~49 mil itens.
--
-- EXPLAIN ANALYZE (usuário authenticated, catálogo de 49.359 itens, índice
-- HNSW catalog_items_embedding_idx válido) mostrou que o planner escolhia
-- Seq Scan + top-N sort: ~13-15 s, ~600 mil buffers. Forçando o índice, a
-- mesma consulta levou ~0,9 s. O planner subestima o custo de calcular a
-- distância em vetores de 512 dimensões (TOAST) na varredura completa.
--
-- Correção, restrita a esta função (não muda configuração global):
--  * enable_seqscan = off (SET da função): o planner prefere o HNSW (ou o
--    GIN de tags, quando o filtro de tags for seletivo). As tabelas pequenas
--    (sources/index_versions) continuam sendo lidas, pois não há outro caminho.
--  * hnsw.ef_search = 500, via set_config(..., is_local => true) no corpo:
--    o padrão (40) fazia o índice devolver só ~42 linhas para LIMIT 100, e
--    filtros pós-índice (tags, categoria, limiar) esvaziavam o resultado.
--    Não pode ser SET da função: no Supabase o role das migrations recebe
--    42501 ao gravar hnsw.* em CREATE/ALTER FUNCTION.
--  * hnsw.iterative_scan = strict_order (pgvector >= 0.8): continua varrendo
--    o índice até completar o LIMIT, mantendo a ordem exata. Em versão que
--    não conhece o parâmetro o erro é ignorado.
--
-- A função passa a ser plpgsql e VOLATILE (set_config tem efeito colateral,
-- restrito à transação). Assinatura, filtros, SECURITY INVOKER e RLS
-- permanecem idênticos à 20261001010000_fix_hybrid_thumbnail_url.sql.

begin;
set local lock_timeout = '5s';

create or replace function public.match_catalog_items_hybrid(
  query_embedding vector(512),
  tag_keywords text[] default null,
  match_limit integer default 20,
  match_category text default null,
  match_code text default null,
  match_threshold double precision default null,
  exclude_tags text[] default null
)
returns table (
  id uuid,
  title text,
  code text,
  category text,
  source text,
  thumbnail_url text,
  score double precision
)
language plpgsql
volatile
security invoker
set enable_seqscan = off
as $$
#variable_conflict use_column
begin
  perform set_config('hnsw.ef_search', '500', true);
  begin
    perform set_config('hnsw.iterative_scan', 'strict_order', true);
  exception when others then
    null;
  end;

  return query
  select
    ci.id,
    ci.title,
    ci.metadata ->> 'code',
    ci.metadata ->> 'category',
    s.name,
    ci.image_url,
    1 - (ci.embedding <=> query_embedding)
  from public.catalog_items ci
  join public.sources s on s.id = ci.source_id
  where ci.embedding is not null
    and (
      tag_keywords is null
      or cardinality(tag_keywords) = 0
      or ci.tags @> tag_keywords
    )
    and (
      exclude_tags is null
      or cardinality(exclude_tags) = 0
      or not (ci.tags && exclude_tags)
    )
    and (match_category is null or ci.metadata ->> 'category' = match_category)
    and (
      match_code is null
      or ci.metadata ->> 'code' ilike '%' || match_code || '%'
      or ci.title ilike '%' || match_code || '%'
    )
    and (
      match_threshold is null
      or 1 - (ci.embedding <=> query_embedding) >= match_threshold
    )
  order by ci.embedding <=> query_embedding
  limit match_limit;
end;
$$;

grant execute on function public.match_catalog_items_hybrid(
  vector(512), text[], integer, text, text, double precision, text[]
) to authenticated;

commit;
