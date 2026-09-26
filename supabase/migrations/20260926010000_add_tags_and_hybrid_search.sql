-- Tags estruturadas por item (tipo, tema, categoria/ambiente, cores,
-- animal específico, moldura, formato) — geradas por classificação
-- "zero-shot" com o embedding CLIP já calculado de cada item (sem
-- reprocessar imagem), ver scripts/generateTags.mjs. Resolve o caso de
-- palavra única/genérica na busca por texto (ex. "leão" sozinho não
-- tinha sinal suficiente na busca semântica pura), sem depender de
-- como cada usuário escreve a consulta.

alter table public.catalog_items
  add column tags text[] not null default '{}';

create index catalog_items_tags_idx on public.catalog_items using gin (tags);

-- Busca híbrida: se tag_keywords bater com alguma tag do item, filtra
-- só esse conjunto (sinal exato, robusto a palavra única) e ordena por
-- similaridade dentro dele; sem bater tag nenhuma, cai pra busca
-- semântica pura de sempre (mesmo comportamento de match_catalog_items).
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
      or ci.tags && tag_keywords
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
