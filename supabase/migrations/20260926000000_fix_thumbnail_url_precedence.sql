-- Corrige match_catalog_items: thumbnail_url estava priorizando
-- image_storage_path (caminho interno do Storage, não uma URL
-- exibível) sobre image_url. Funcionava sem erro pro catálogo do site
-- (image_storage_path sempre null lá), mas quebrava pras fotos do
-- Diretório Local enviadas via scripts/uploadLocalPhotos.mjs, que
-- preenchem image_storage_path com o caminho interno e image_url com
-- a URL pública real do Storage — a UI precisa de image_url sempre.
-- image_storage_path continua gravado na tabela (metadado útil pra
-- exclusão/administração), só não é mais usado pra exibição.

create or replace function public.match_catalog_items(
  query_embedding vector(512),
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
    and (match_category is null or ci.metadata ->> 'category' = match_category)
    and (match_code is null or (ci.metadata ->> 'code') ilike '%' || match_code || '%')
    and (
      match_threshold is null
      or 1 - (ci.embedding <=> query_embedding) >= match_threshold
    )
  order by ci.embedding <=> query_embedding
  limit match_limit;
$$;
