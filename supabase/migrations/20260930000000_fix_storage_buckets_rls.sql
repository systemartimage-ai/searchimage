-- Achado depurando o upload admin: storage.buckets tem RLS ativado
-- mas NENHUMA policy — sem isso, nenhum papel além do dono da tabela
-- consegue nem ENXERGAR a linha do bucket, e o serviço de Storage
-- aparentemente precisa dessa leitura antes de gravar em
-- storage.objects (confirmado testando: mesmo uma policy de INSERT em
-- storage.objects totalmente permissiva, sem checagem nenhuma, ainda
-- falhava com "new row violates row-level security policy" pra
-- qualquer sessão autenticada — só funcionava com a service-role key,
-- que ignora RLS por completo). Metadado de bucket (nome, público,
-- limites de tamanho/mime) não é sensível, então liberar leitura pra
-- qualquer usuário autenticado é seguro.

create policy "buckets_authenticated_select" on storage.buckets
  for select to authenticated
  using (true);

-- Limpa as policies de diagnóstico criadas durante a depuração.
drop policy if exists "debug_baseline_insert" on storage.objects;
drop policy if exists "debug_public_insert" on storage.objects;
