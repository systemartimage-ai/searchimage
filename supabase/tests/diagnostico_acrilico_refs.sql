-- Somente leitura. Confere os códigos de referência de acrílico (positivos) e de
-- "parece mas não é" (negativos): se a regra de código/pasta/categoria os pega,
-- a imagem de cada um, a média dos embeddings de cada grupo e quantos itens
-- teriam "-AC-" no meio do código (variação da regra).
with refs(grupo, cod) as (
  select 'positivo', unnest(array[
    'KJ653A-2222-AC','OD131A-3020-AC','IB218A-2323-AC','MOB067A-1515-AC','AK835A-2222-AC',
    'LN1188A-1515-AC','LN1177A-3030-AC','TA103A-5050-AC','BD439A-1826-VMBR','TA116A-2424-AC',
    'TA119A-1414-AC','KJ620A-2020-AC','LM482A-2525-AC','LM470A-2020-AC','CL176A-1818-AC',
    'CL138A-1818-AC','GB038A-151515-ACGR','CL056A-2530-CX.AC','KJ171A-50505-AC','KJ195A-70100-AC',
    'KJ261A-4030-AC-BR-CV','KJ325A-3550-ACNC','RD104A-3040CX.AC','RD080A-2040CX.AC'])
  union all
  select 'negativo', unnest(array[
    'TA050A-PEND-COMP','RED181A-PEND','IB026-OBJT-COMP','KJ435A-OBJT-COMP','KJ455A-1515-OBJT',
    'LB051A-1414-OBJT','LP047A-2511-PF','IB226A-1712-CV','IB225A-2015-CV'])
),
it as (
  select r.grupo, ci.title, s.name as fonte, ci.image_url, ci.embedding,
         (ci.title ~* '(-|\.)AC[A-Z]{0,3}(-[A-Z])?$') as r_final,
         (ci.image_storage_path like '%/Artsy_ACRILICO/%') as r_pasta,
         (s.name = 'Artimage' and ci.metadata ->> 'category' = 'Colecionáveis') as r_site
  from refs r
  join public.catalog_items ci on ci.title = r.cod
  join public.sources s on s.id = ci.source_id
  where ci.embedding is not null
)
select grupo as tipo, title, fonte, r_final, r_pasta, r_site, image_url, null::bigint as n, null::text as vetor
from it
union all
select 'media ' || grupo, null, null, null, null, null, null, count(*), avg(embedding)::text
from it group by grupo
union all
select 'regra -AC- no meio (não termina em AC)', (array_agg(title))[1], null, null, null, null, null, count(*), null
from public.catalog_items
where title ~* '-AC-' and not (title ~* '(-|\.)AC[A-Z]{0,3}(-[A-Z])?$')
order by tipo, title;
