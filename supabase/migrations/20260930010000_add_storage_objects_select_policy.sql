-- Achado testando de verdade: upload com upsert:true (usado pra
-- reprocessar/atualizar um objeto já existente) falhava sempre com
-- "new row violates row-level security policy", enquanto upload sem
-- upsert (insert simples) sempre funcionava. Isolado por eliminação:
-- não era bucket_id, não era is_admin(), não era o role da policy —
-- era especificamente o upsert. A leitura pública via URL
-- (/object/public/...) não passa por RLS, mas uma consulta direta na
-- tabela storage.objects (que o upsert precisa fazer pra decidir se
-- insere ou atualiza) precisa da própria policy de SELECT — que nunca
-- existia. Sem isso, a checagem de "já existe?" do upsert falhava.

create policy "catalog_thumbnails_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'catalog-thumbnails' and public.is_admin());
