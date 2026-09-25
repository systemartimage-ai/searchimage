# SEARCH IMAGE --- SUPABASE, BANCO E SEGURANÇA

## Extensão

Habilitar `vector`/pgvector.

## Tabelas propostas

### profiles

- id
- role: USER \| ADMIN
- created_at

### sources

- id
- name
- type
- base_url
- enabled
- created_at

### index_versions

- id
- source_id
- status
- embedding_model
- vector_dimension
- started_at
- completed_at
- activated_at
- counters JSONB

### catalog_items

- id
- source_id
- index_version_id
- external_id
- title
- description
- page_url
- image_url
- image_storage_path
- image_hash
- metadata JSONB
- active
- created_at
- updated_at

### image_embeddings

Dependendo do desenho final, vetor pode ficar na própria tabela do item
ou separado: - item_id - embedding vector(N) - model - version -
created_at

### indexing_jobs

- id
- source_id
- index_version_id
- status
- progress
- current_stage
- started_by
- error_summary
- started_at
- finished_at

### indexing_errors

- id
- job_id
- item/url
- stage
- message
- retry_count
- created_at

## Busca

Criar RPC/função SQL de similarity search filtrando somente: - source
habilitada; - versão `ACTIVE`; - item ativo.

Adicionar índice vetorial adequado após medir volume e comportamento.

## RLS

- usuário comum: leitura somente do necessário para busca.
- admin: operações administrativas.
- service role: somente back-end seguro.
- cliente jamais recebe service-role key.

## Storage

Guardar miniaturas/cópias apenas se necessário. Se o catálogo puder
servir as imagens originais de forma confiável, avaliar armazenar apenas
URLs; para estabilidade, thumbnails próprias podem ser úteis.

## Segredos

Usar variáveis de ambiente da plataforma. Nunca: - `.env` commitado; -
token no JavaScript público; - credencial em `CLAUDE.md`; - senha do
site-fonte no banco em texto puro.

## LGPD/privacidade

Evitar armazenar imagens de consulta por padrão. Se telemetria for
necessária, registrar metadados técnicos e somente armazenar imagem
mediante regra explícita e justificativa.

## Auditoria

Registrar ações administrativas: - início/cancelamento; - ativação; -
rollback; - exclusão; - alteração de fonte.
