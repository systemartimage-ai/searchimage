-- Somente leitura. Lista os itens escolhidos (com imagem) e, na última linha,
-- a média dos embeddings deles (protótipo "menina/mulher"), como texto.
with escolhidos as (
  select ci.title, ci.image_url, ci.embedding
  from public.catalog_items ci
  where ci.embedding is not null
    and ci.title = any (array[
      'DA001A-6249-022','GAI-ATY1954A-120120','AV215G-6250-1287','GAI-ATY675B-8055',
      'GAI-FH022I-8058EN','NC061A-123123-448','SB006C-6363-1081','NC060A-123123-448',
      'AR003C-12080-1PO','EI003F-6646-1097'
    ])
)
select 'item' as tipo, title, image_url, null::bigint as n, null::text as vetor
from escolhidos
union all
select 'media', null, null, count(*), avg(embedding)::text
from escolhidos
order by tipo desc, title;
