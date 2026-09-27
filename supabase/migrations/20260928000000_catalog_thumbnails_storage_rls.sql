-- Ferramenta de upload em massa (admin) precisa subir direto pro
-- Storage a partir do navegador (client anon key + sessão do admin),
-- não mais só via script Node com a service-role key. Não existia
-- NENHUMA policy de storage.objects rastreada em migration pro bucket
-- catalog-thumbnails (criado manualmente pelo dashboard) — sem isso, a
-- sessão do admin não consegue gravar objeto nenhum (RLS de Storage
-- nega por padrão). Não precisa de policy de SELECT: o bucket é
-- público (leitura via URL pública não passa por RLS).

create policy "catalog_thumbnails_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalog-thumbnails' and public.is_admin());

create policy "catalog_thumbnails_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalog-thumbnails' and public.is_admin())
  with check (bucket_id = 'catalog-thumbnails' and public.is_admin());
