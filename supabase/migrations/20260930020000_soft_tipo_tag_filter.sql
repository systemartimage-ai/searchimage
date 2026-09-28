-- Achado real (busca por imagem de "VALES CARTOGRÁFICOS", código
-- mme088a-118173-1361): o item é visivelmente um quadro (protótipo
-- 'quadro' bate 0.9005 contra 'espelho' 0.8773 no embedding salvo),
-- mas a margem (0.0232) ficou abaixo do limiar de confiança
-- (MARGIN_THRESHOLD=0.03 em classifyTipoByPrototype.ts) — por isso o
-- item nunca recebeu a tag 'quadro'. Como `match_catalog_items_hybrid`
-- exigia `tags @> tag_keywords` (item TEM que ter a tag), qualquer
-- busca cuja foto/texto fosse classificada com confiança como 'quadro'
-- excluía esse item por completo — mesmo sendo, na prática, o melhor
-- resultado possível. Ou seja: o limiar conservador (bom, evita tag
-- errada) virou "invisibilidade total" na busca (ruim, pior que uma
-- tag ausente).
--
-- Fix: só espelho/quadro (par binário mutuamente exclusivo, ver
-- TIPO_TAG_VALUES em tagTaxonomy.ts) passam a usar EXCLUSÃO em vez de
-- EXIGÊNCIA — busca por "quadro" agora só tira da lista quem tem a tag
-- 'espelho' (sinal confiável de que é o tipo ERRADO), sem exigir que o
-- item tenha a tag 'quadro' confirmada (que pode faltar por limiar
-- conservador). Preserva a precisão original (nunca mistura espelho
-- com quadro) sem penalizar item corretamente identificável mas que
-- ficou abaixo do limiar de confiança no indexamento. As demais
-- categorias de tag (tema/categoria/cor/animal) continuam com
-- exigência estrita via `tag_keywords` — a lógica de decidir isso pra
-- cada busca fica no client (ver searchCatalog.ts), aqui só o novo
-- parâmetro `exclude_tags` é adicionado.

-- `create or replace function` só substitui de verdade quando a lista
-- de parâmetros é idêntica à existente — como esta versão acrescenta
-- `exclude_tags`, o Postgres trataria como uma função SOBRECARREGADA
-- nova (mesmo nome, assinatura diferente) em vez de substituir a
-- antiga, deixando duas versões e quebrando o `grant`/chamadas futuras
-- por ambiguidade. Por isso apaga a assinatura antiga explicitamente
-- primeiro.
drop function if exists public.match_catalog_items_hybrid(
  vector(512), text[], integer, text, text, double precision
);

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
    and (match_code is null or (ci.metadata ->> 'code') ilike '%' || match_code || '%')
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
