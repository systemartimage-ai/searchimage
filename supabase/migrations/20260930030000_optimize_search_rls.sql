-- Busca por imagem e texto: erro 57014 (statement timeout) na RPC
-- match_catalog_items_hybrid. As policies chamadas pela busca faziam
-- verificações de administrador por linha, inclusive nas tabelas ligadas.
--
-- O SELECT escalar permite um InitPlan: a identidade/permissão, que não
-- depende do item, é calculada uma vez por statement. Os conjuntos de
-- fontes/versões elegíveis também deixam de ser subconsultas correlacionadas.
-- Referência: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
--
-- Preserva as permissões existentes (inclusive leitura ampla do ADMIN).
-- Mantém RLS e SECURITY INVOKER; não altera dados, embeddings ou timeout.
-- As policies FOR ALL também participam do SELECT: precisam da mesma
-- otimização, mesmo tendo "write" no nome.

begin;
set local lock_timeout = '5s';

alter policy "profiles_select_own" on public.profiles
  using (id = (select auth.uid()) or (select public.is_admin()));

alter policy "profiles_update_own" on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

alter policy "profiles_admin_all" on public.profiles
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

alter policy "sources_select_enabled" on public.sources
  using (enabled or (select public.is_admin()));

alter policy "sources_admin_write" on public.sources
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

alter policy "index_versions_select_active" on public.index_versions
  using (status = 'ACTIVE' or (select public.is_admin()));

alter policy "index_versions_admin_write" on public.index_versions
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

alter policy "catalog_items_select_searchable" on public.catalog_items
  using (
    (select public.is_admin())
    or (
      active
      and index_version_id in (
        select iv.id from public.index_versions iv where iv.status = 'ACTIVE'
      )
      and source_id in (
        select s.id from public.sources s where s.enabled
      )
    )
  );

alter policy "catalog_items_admin_write" on public.catalog_items
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

commit;
