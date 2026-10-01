-- Busca por imagem/texto: timeout 57014 com ~49 mil itens.
--
-- EXPLAIN ANALYZE (usuário authenticated, catálogo de 49.359 itens, índice
-- HNSW catalog_items_embedding_idx válido) mostrou que o planner escolhia
-- Seq Scan + top-N sort: ~13-15 s, ~600 mil buffers. Forçando o índice, a
-- mesma consulta levou ~0,9 s. O planner subestima o custo de calcular a
-- distância em vetores de 512 dimensões (TOAST) na varredura completa.
--
-- Correção, restrita a esta função (não muda configuração global):
--  * enable_seqscan = off: o planner prefere o HNSW (ou o GIN de tags,
--    quando o filtro de tags for seletivo). As tabelas pequenas
--    (sources/index_versions) continuam sendo lidas, pois não há outro caminho.
--  * hnsw.ef_search = 500: o padrão (40) fazia o índice devolver só ~42
--    linhas para LIMIT 100, e filtros pós-índice (tags, categoria, limiar)
--    esvaziavam o resultado.
--  * hnsw.iterative_scan = strict_order (pgvector >= 0.8): continua varrendo
--    o índice até completar o LIMIT, mantendo a ordem exata. Aplicado só se a
--    extensão suportar, para a migration não falhar em versão antiga.
--
-- Corpo, assinatura, SECURITY INVOKER e RLS permanecem idênticos à
-- 20261001010000_fix_hybrid_thumbnail_url.sql.

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
language sql
stable
security invoker
set enable_seqscan = off
set hnsw.ef_search = 500
as $$
  select
    ci.id,
    ci.title,
    ci.metadata ->> 'code' as code,
    ci.metadata ->> 'category' as category,
    s.name as source,
    ci.image_url as thumbnail_url,
    1 - (ci.embedding <=> query_embedding) as score
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
$$;

do $$
declare
  v text;
begin
  select extversion into v from pg_extension where extname = 'vector';
  if v is not null and string_to_array(v, '.')::int[] >= array[0, 8, 0] then
    alter function public.match_catalog_items_hybrid(
      vector(512), text[], integer, text, text, double precision, text[]
    ) set hnsw.iterative_scan = 'strict_order';
  end if;
end $$;

grant execute on function public.match_catalog_items_hybrid(
  vector(512), text[], integer, text, text, double precision, text[]
) to authenticated;

commit;
