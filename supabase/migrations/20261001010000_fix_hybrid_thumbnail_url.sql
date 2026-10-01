-- Corrige regressão da 20261001000000: thumbnail_url voltou a priorizar
-- image_storage_path (caminho interno do Storage, não é URL exibível),
-- quebrando as imagens nos resultados. A UI precisa sempre de image_url
-- (mesma decisão de 20260926000000_fix_thumbnail_url_precedence.sql).
-- Só recria a função; assinatura, filtros e índices ficam como estavam.

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

grant execute on function public.match_catalog_items_hybrid(
  vector(512), text[], integer, text, text, double precision, text[]
) to authenticated;

commit;
