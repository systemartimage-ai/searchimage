-- Busca "Somente acrílicos": o grupo `acrilico` tem 7.418 itens (> 2.500), então
-- caía no caminho aproximado (HNSW + filtro pós-índice), que devolve poucos
-- resultados quando só ~13% dos candidatos são acrílico (LIMIT 100 -> ~65).
--
-- Mudança única, em relação a 20261001030000_two_path_hybrid_search.sql:
-- o limite do caminho EXATO sobe de 2.500 para 10.000 linhas filtradas
-- (custo medido: ~0,27 ms/linha -> até ~2,7 s). Filtros acima disso (ex.: a
-- tag `quadro`, ~47 mil) continuam no caminho HNSW. Corpo, assinatura,
-- SECURITY INVOKER, RLS e image_url permanecem idênticos.
-- Se o grupo acrílico passar de ~10 mil itens, revisar este limite.

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
set plan_cache_mode = force_custom_plan
as $$
#variable_conflict use_column
declare
  has_filter boolean;
  filtered_count integer := 0;
  cand_n integer;
begin
  has_filter :=
    coalesce(cardinality(tag_keywords), 0) > 0
    or coalesce(cardinality(exclude_tags), 0) > 0
    or match_category is not null
    or match_code is not null;

  if has_filter then
    select count(*) into filtered_count
    from (
      select 1
      from public.catalog_items ci
      where ci.embedding is not null
        and (
          coalesce(cardinality(tag_keywords), 0) = 0
          or ci.tags @> tag_keywords
        )
        and (
          coalesce(cardinality(exclude_tags), 0) = 0
          or not (ci.tags && exclude_tags)
        )
        and (match_category is null or ci.metadata ->> 'category' = match_category)
        and (
          match_code is null
          or ci.metadata ->> 'code' ilike '%' || match_code || '%'
          or ci.title ilike '%' || match_code || '%'
        )
      limit 10001
    ) t;
  end if;

  if has_filter and filtered_count <= 10000 then
    return query
    with f as materialized (
      select ci.id, ci.title, ci.metadata, ci.image_url, ci.source_id, ci.embedding
      from public.catalog_items ci
      where ci.embedding is not null
        and (
          coalesce(cardinality(tag_keywords), 0) = 0
          or ci.tags @> tag_keywords
        )
        and (
          coalesce(cardinality(exclude_tags), 0) = 0
          or not (ci.tags && exclude_tags)
        )
        and (match_category is null or ci.metadata ->> 'category' = match_category)
        and (
          match_code is null
          or ci.metadata ->> 'code' ilike '%' || match_code || '%'
          or ci.title ilike '%' || match_code || '%'
        )
    )
    select
      f.id,
      f.title,
      f.metadata ->> 'code',
      f.metadata ->> 'category',
      s.name,
      f.image_url,
      1 - (f.embedding <=> query_embedding)
    from f
    join public.sources s on s.id = f.source_id
    where match_threshold is null
      or 1 - (f.embedding <=> query_embedding) >= match_threshold
    order by f.embedding <=> query_embedding
    limit match_limit;
  else
    cand_n := case
      when has_filter then least(1000, greatest(match_limit * 5, 200))
      else greatest(match_limit, 40)
    end;
    perform set_config('hnsw.ef_search', cand_n::text, true);

    return query
    with cand as materialized (
      select ci.id, ci.title, ci.metadata, ci.image_url, ci.source_id, ci.tags,
             (ci.embedding <=> query_embedding) as dist
      from public.catalog_items ci
      where ci.embedding is not null
      order by ci.embedding <=> query_embedding
      limit cand_n
    )
    select
      c.id,
      c.title,
      c.metadata ->> 'code',
      c.metadata ->> 'category',
      s.name,
      c.image_url,
      1 - c.dist
    from cand c
    join public.sources s on s.id = c.source_id
    where (
        coalesce(cardinality(tag_keywords), 0) = 0
        or c.tags @> tag_keywords
      )
      and (
        coalesce(cardinality(exclude_tags), 0) = 0
        or not (c.tags && exclude_tags)
      )
      and (match_category is null or c.metadata ->> 'category' = match_category)
      and (
        match_code is null
        or c.metadata ->> 'code' ilike '%' || match_code || '%'
        or c.title ilike '%' || match_code || '%'
      )
      and (match_threshold is null or 1 - c.dist >= match_threshold)
    order by c.dist
    limit match_limit;
  end if;
end;
$$;

grant execute on function public.match_catalog_items_hybrid(
  vector(512), text[], integer, text, text, double precision, text[]
) to authenticated;

commit;
