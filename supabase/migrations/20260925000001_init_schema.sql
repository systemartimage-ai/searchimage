-- Fase 1: schema inicial (perfis/roles, fontes, versões de índice,
-- itens de catálogo, jobs/erros de indexação) + RLS.
--
-- A tabela de embeddings (vetor) fica para a Fase 3: sua dimensão
-- depende do EmbeddingProvider real ainda não escolhido (ver
-- DIRETRIZES.md). Habilitamos a extensão agora porque isso não
-- compromete nenhuma decisão de modelo.

create extension if not exists vector;

-- Função utilitária para manter updated_at em dia.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Função security definer para checar admin sem recursão de RLS em
-- `profiles` (padrão recomendado pelo Supabase para esse caso).
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- Cria automaticamente um profile (role USER) para cada novo usuário
-- autenticado. Promoção a ADMIN é manual (SQL/dashboard), documentada
-- em DIRETRIZES.md quando acontecer.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'USER');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------
-- sources
-- ---------------------------------------------------------------

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  base_url text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sources enable row level security;

create policy "sources_select_enabled" on public.sources
  for select to authenticated
  using (enabled or public.is_admin());

create policy "sources_admin_write" on public.sources
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------
-- index_versions
-- ---------------------------------------------------------------

create table public.index_versions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  status text not null default 'BUILDING'
    check (status in ('BUILDING', 'READY', 'ACTIVE', 'FAILED', 'ARCHIVED')),
  embedding_model text,
  vector_dimension integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  activated_at timestamptz,
  counters jsonb not null default '{}'::jsonb
);

create index index_versions_source_id_idx on public.index_versions (source_id);
create index index_versions_status_idx on public.index_versions (status);

alter table public.index_versions enable row level security;

create policy "index_versions_select_active" on public.index_versions
  for select to authenticated
  using (status = 'ACTIVE' or public.is_admin());

create policy "index_versions_admin_write" on public.index_versions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------
-- catalog_items
-- ---------------------------------------------------------------

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  index_version_id uuid not null references public.index_versions (id) on delete cascade,
  external_id text,
  title text,
  description text,
  page_url text,
  image_url text,
  image_storage_path text,
  image_hash text,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_items_source_id_idx on public.catalog_items (source_id);
create index catalog_items_index_version_id_idx on public.catalog_items (index_version_id);
create index catalog_items_image_hash_idx on public.catalog_items (image_hash);
create unique index catalog_items_source_external_id_key
  on public.catalog_items (source_id, external_id)
  where external_id is not null;

create trigger catalog_items_set_updated_at
  before update on public.catalog_items
  for each row execute function public.set_updated_at();

alter table public.catalog_items enable row level security;

-- Leitura pública (autenticada) só do que é pesquisável de verdade:
-- fonte habilitada, versão ativa do índice e item ativo.
create policy "catalog_items_select_searchable" on public.catalog_items
  for select to authenticated
  using (
    public.is_admin()
    or (
      active
      and exists (
        select 1 from public.index_versions iv
        where iv.id = catalog_items.index_version_id and iv.status = 'ACTIVE'
      )
      and exists (
        select 1 from public.sources s
        where s.id = catalog_items.source_id and s.enabled
      )
    )
  );

create policy "catalog_items_admin_write" on public.catalog_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------
-- indexing_jobs / indexing_errors (uso administrativo)
-- ---------------------------------------------------------------

create table public.indexing_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  index_version_id uuid references public.index_versions (id) on delete set null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  progress numeric,
  current_stage text,
  started_by uuid references public.profiles (id),
  error_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index indexing_jobs_source_id_idx on public.indexing_jobs (source_id);

alter table public.indexing_jobs enable row level security;

create policy "indexing_jobs_admin_only" on public.indexing_jobs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.indexing_errors (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.indexing_jobs (id) on delete cascade,
  item_ref text,
  stage text,
  message text,
  retry_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index indexing_errors_job_id_idx on public.indexing_errors (job_id);

alter table public.indexing_errors enable row level security;

create policy "indexing_errors_admin_only" on public.indexing_errors
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
