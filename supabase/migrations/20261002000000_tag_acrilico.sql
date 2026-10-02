-- Marca como `acrilico` (tags) os itens de acrílico já identificáveis por dado
-- objetivo. Atualização de DADOS, idempotente; não altera embeddings, índices
-- nem a função de busca.
--
-- Regras (confirmadas pelo usuário em 2026-10-02):
--  1. pasta do Storage `Artsy_ACRILICO`;
--  2. código terminado em `AC` + até 3 letras, ou com esse trecho antes de um
--     traço (ex.: -AC, -ACBZ, -ACDB-L, .AC, -AC-AMB). `AC` no início do
--     código NÃO conta (é inicial de autor, ex.: AC03-80100);
--  3. site Artimage, categoria `Colecionáveis` (Collectibles).
-- Fora, por decisão do usuário (2026-10-02): itens da galeria
-- GALERIA_CL_-_Collectibles cujo código não termina em AC não são acrílico.
--
-- Contagem prévia no banco real: pasta 344, código 6.123, site 1.021,
-- total 7.418, já marcados 0 (catálogo de 56.700 itens).
--
-- No Supabase SQL Editor a mesma atualização foi aplicada em lotes (LIMIT),
-- repetidos até 0 linhas, para não estourar o tempo; o resultado é idêntico.
--
-- Reversão: restaurar as tags da tabela de backup (instrução no final).

begin;
set local lock_timeout = '5s';

-- Cópia das tags originais dos itens que serão marcados. RLS ligada e sem
-- policy: a tabela não fica exposta pela API pública.
create table if not exists public.catalog_items_tags_backup_20261002 (
  id uuid primary key,
  tags text[]
);
alter table public.catalog_items_tags_backup_20261002 enable row level security;

insert into public.catalog_items_tags_backup_20261002 (id, tags)
select ci.id, ci.tags
from public.catalog_items ci
join public.sources s on s.id = ci.source_id
where ci.image_storage_path like '%/Artsy_ACRILICO/%'
   or ci.title ~* '[-.]AC[A-Z]{0,3}(-|$)'
   or (s.name = 'Artimage' and ci.metadata ->> 'category' = 'Colecionáveis')
on conflict (id) do nothing;

update public.catalog_items ci
set tags = array_append(coalesce(ci.tags, '{}'), 'acrilico')
from public.sources s
where s.id = ci.source_id
  and not (coalesce(ci.tags, '{}') @> array['acrilico'])
  and (
    ci.image_storage_path like '%/Artsy_ACRILICO/%'
    or ci.title ~* '[-.]AC[A-Z]{0,3}(-|$)'
    or (s.name = 'Artimage' and ci.metadata ->> 'category' = 'Colecionáveis')
  );

commit;

-- Reversão (não executar junto):
--   update public.catalog_items ci set tags = b.tags
--   from public.catalog_items_tags_backup_20261002 b where b.id = ci.id;
