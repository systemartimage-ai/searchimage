-- Regressão para 20260930030000_optimize_search_rls.sql.
-- Executar como postgres em banco de TESTE com as migrations aplicadas.
-- Fixtures e alterações são descartadas pelo ROLLBACK final.
begin;

create temporary table search_rls_fixture as
select gen_random_uuid() as user_id, gen_random_uuid() as admin_id,
       gen_random_uuid() as source_id, gen_random_uuid() as disabled_source_id,
       gen_random_uuid() as version_id, gen_random_uuid() as archived_version_id,
       gen_random_uuid() as disabled_version_id,
       ('[' || '1,' || repeat('0,', 510) || '0]')::vector(512) as embedding;
grant select on search_rls_fixture to authenticated, anon;

insert into auth.users (id, email)
select user_id, user_id::text || '@example.invalid' from search_rls_fixture
union all
select admin_id, admin_id::text || '@example.invalid' from search_rls_fixture;
update public.profiles set role = 'ADMIN'
where id = (select admin_id from search_rls_fixture);

insert into public.sources (id, name, type, base_url, enabled)
select source_id, 'RLS test enabled', 'test', 'https://example.invalid', true
from search_rls_fixture
union all
select disabled_source_id, 'RLS test disabled', 'test', 'https://example.invalid', false
from search_rls_fixture;

insert into public.index_versions (id, source_id, status)
select version_id, source_id, 'ACTIVE' from search_rls_fixture
union all
select archived_version_id, source_id, 'ARCHIVED' from search_rls_fixture
union all
select disabled_version_id, disabled_source_id, 'ACTIVE' from search_rls_fixture;

create temporary table search_rls_items (id uuid, scenario text);
insert into search_rls_items
select gen_random_uuid(), scenario
from unnest(array['quadro', 'espelho', 'inactive', 'archived', 'disabled']) scenario;
grant select on search_rls_items to authenticated, anon;

insert into public.catalog_items
  (id, source_id, index_version_id, active, title, metadata, tags, embedding)
select i.id,
       case when i.scenario = 'disabled' then f.disabled_source_id else f.source_id end,
       case when i.scenario = 'archived' then f.archived_version_id
            when i.scenario = 'disabled' then f.disabled_version_id else f.version_id end,
       i.scenario <> 'inactive', i.scenario,
       jsonb_build_object('code', 'RLS-TEST-' || i.id),
       case when i.scenario = 'espelho' then array['espelho'] else array['quadro', 'leao'] end,
       f.embedding
from search_rls_fixture f cross join search_rls_items i;

set local role anon;
do $$ begin
  if exists (select 1 from public.catalog_items where id in (select id from search_rls_items)) then
    raise exception 'Anon conseguiu ler o catálogo';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select user_id::text from search_rls_fixture), true);

do $$
declare visible uuid[]; expected uuid[]; found integer;
begin
  select array_agg(id order by id) into visible from public.catalog_items
  where id in (select id from search_rls_items);
  select array_agg(id order by id) into expected from search_rls_items
  where scenario in ('quadro', 'espelho');
  if visible is distinct from expected then
    raise exception 'USER deve ver apenas itens ativos de fonte habilitada e versão ACTIVE';
  end if;

  select count(*) into found from public.match_catalog_items_hybrid(
    query_embedding => (select embedding from search_rls_fixture),
    match_code => 'RLS-TEST-', match_limit => 100
  );
  if found <> 2 then raise exception 'Busca USER sem tags: esperado 2, retornou %', found; end if;

  select count(*) into found from public.match_catalog_items_hybrid(
    query_embedding => (select embedding from search_rls_fixture),
    match_code => 'RLS-TEST-', match_limit => 100, exclude_tags => array['espelho']
  );
  if found <> 1 then raise exception 'Busca por imagem com exclusão de tipo incorreta'; end if;

  select count(*) into found from public.match_catalog_items_hybrid(
    query_embedding => (select embedding from search_rls_fixture),
    match_code => 'RLS-TEST-', match_limit => 100, tag_keywords => array['leao'],
    exclude_tags => array['espelho']
  );
  if found <> 1 then raise exception 'Busca por texto com tags incorreta'; end if;

  if exists (select 1 from public.profiles where id = (select admin_id from search_rls_fixture)) then
    raise exception 'USER conseguiu ler perfil de outro usuário';
  end if;

  update public.catalog_items set title = 'not allowed'
  where id in (select id from search_rls_items);
  get diagnostics found = row_count;
  if found <> 0 then raise exception 'USER conseguiu alterar o catálogo'; end if;

  delete from public.catalog_items where id in (select id from search_rls_items);
  get diagnostics found = row_count;
  if found <> 0 then raise exception 'USER conseguiu apagar o catálogo'; end if;

  begin
    insert into public.catalog_items (source_id, index_version_id)
    select source_id, version_id from search_rls_fixture;
    raise exception 'USER conseguiu inserir no catálogo';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.profiles set role = 'ADMIN' where id = (select user_id from search_rls_fixture);
    raise exception 'USER conseguiu se promover';
  exception when raise_exception then
    if sqlerrm <> 'Apenas administradores podem alterar o campo role.' then raise; end if;
  end;
end $$;

select set_config('request.jwt.claim.sub', (select admin_id::text from search_rls_fixture), true);
do $$
declare found integer;
begin
  select count(*) into found from public.match_catalog_items_hybrid(
    query_embedding => (select embedding from search_rls_fixture),
    match_code => 'RLS-TEST-', match_limit => 100
  );
  if found <> 5 then raise exception 'ADMIN perdeu a visibilidade existente: % itens', found; end if;

  update public.catalog_items set title = 'admin allowed'
  where id in (select id from search_rls_items);
  get diagnostics found = row_count;
  if found <> 5 then raise exception 'ADMIN perdeu permissão de escrita'; end if;

  if not exists (select 1 from public.profiles where id = (select user_id from search_rls_fixture)) then
    raise exception 'ADMIN perdeu acesso ao perfil USER';
  end if;
end $$;

rollback;
