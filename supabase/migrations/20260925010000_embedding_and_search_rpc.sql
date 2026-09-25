-- Fase 3/4: coluna de embedding real (CLIP ViT-B/32 via Transformers.js,
-- rodando localmente sem custo/API — ver DIRETRIZES.md) em
-- catalog_items, índice HNSW para busca por similaridade de cosseno, e
-- RPC de nearest-neighbor.
--
-- A dimensão (512) é a do modelo escolhido agora (Xenova/clip-vit-base-patch32).
-- Se o modelo mudar no futuro, isso exige nova migration (coluna com
-- outra dimensão) — por isso o nome/dimensão ficam registrados também
-- em index_versions.embedding_model / vector_dimension.

alter table public.catalog_items
  add column embedding vector(512);

create index catalog_items_embedding_idx
  on public.catalog_items
  using hnsw (embedding vector_cosine_ops);

-- security invoker (padrão do Postgres, explícito aqui de propósito):
-- a função roda com o privilégio de quem chama, então a RLS de
-- catalog_items (só item ativo + índice ACTIVE + fonte habilitada,
-- salvo ADMIN) continua valendo normalmente dentro da RPC.
create function public.match_catalog_items(
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
    coalesce(ci.image_storage_path, ci.image_url) as thumbnail_url,
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

grant execute on function public.match_catalog_items to authenticated;
