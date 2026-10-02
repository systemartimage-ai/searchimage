-- Busca híbrida: duas estratégias, para evitar leitura em massa de vetores.
--
-- Medições no Supabase (49 mil itens): cada embedding (512 float4) fica em
-- TOAST; calcular distância em todas as linhas leva 13-15 s. A
-- 20261001020000 forçou o HNSW em tudo e resolveu a busca sem filtro, mas
-- a busca com tag (`quadro`) passou a levar ~1 min (varredura iterativa do
-- HNSW com filtro pós-índice) e o texto "céu azul" estourou o timeout.
--
-- Agora a função decide pelo tamanho do conjunto filtrado:
--  1. Filtros não vetoriais (tags, exclusão de tags, categoria, código/nome)
--     que casam <= 2500 linhas: busca exata. Só essas linhas têm a distância
--     calculada (CTE materializada, o planner não troca por HNSW).
--  2. Sem filtro, ou filtro amplo (> 2500 linhas): HNSW traz os candidatos
--     mais próximos e os filtros são aplicados sobre eles. Sem filtro, o
--     número de candidatos é o próprio LIMIT; com filtro, 5x o LIMIT
--     (mínimo 200, máximo 1000).
--
-- Mantém: assinatura, image_url como miniatura, SECURITY INVOKER e RLS.
-- plan_cache_mode = force_custom_plan evita plano genérico, que não
-- consegue simplificar "param is null or ..." e perde o uso de índices.
-- hnsw.ef_search é definido no corpo (SET de função hnsw.* dá 42501).

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
      limit 2501
    ) t;
  end if;

  if has_filter and filtered_count <= 2500 then
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
