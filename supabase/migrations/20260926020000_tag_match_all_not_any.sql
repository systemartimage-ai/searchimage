-- match_catalog_items_hybrid usava `tags && tag_keywords` (E SE PELO
-- MENOS UMA tag bater) — pra consultas com mais de uma palavra-chave
-- (ex. "quadro de leão" -> tags ['quadro','leao']), isso trazia
-- qualquer item que fosse quadro OU tivesse leão, não a interseção.
-- Trocado pra `tags @> tag_keywords` (contém TODAS as tags pedidas) —
-- consulta composta agora filtra de verdade pela combinação.

create or replace function public.match_catalog_items_hybrid(
  query_embedding vector(512),
  tag_keywords text[] default null,
  match_limit integer default 20,
  match_category text default null,
  match_code text default null,
  match_threshold double precision default null
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
    and (match_category is null or ci.metadata ->> 'category' = match_category)
    and (match_code is null or (ci.metadata ->> 'code') ilike '%' || match_code || '%')
    and (
      match_threshold is null
      or 1 - (ci.embedding <=> query_embedding) >= match_threshold
    )
  order by ci.embedding <=> query_embedding
  limit match_limit;
$$;

grant execute on function public.match_catalog_items_hybrid to authenticated;
