# SEARCH IMAGE --- INDEXAÇÃO DO CATÁLOGO

## Objetivo

Construir previamente a base pesquisável do catálogo. A indexação é
administrativa e manual no MVP.

## Autenticação no site-fonte

Quando o catálogo exigir login, priorizar uma sessão autenticada pelo
próprio administrador sem gravar senha em código.

Fluxo previsto: 1. Admin inicia "Nova indexação". 2. Sistema abre/usa
contexto de navegação autorizado. 3. Se necessário, administrador
realiza o login. 4. A sessão autenticada é usada durante aquela coleta. 5. Não persistir senha. 6. Cookies/tokens de sessão devem receber
tratamento seguro e vida limitada.

**Amendment (fonte `artimage.com.br`, decisão do usuário em
2026-09-25):** para esta fonte específica, o usuário (dono/admin do
site) autorizou explicitamente guardar a credencial de login para que o
indexador possa autenticar sozinho, sem depender de uma sessão de
navegador aberta manualmente a cada rodada — a senha é trocada por eles
com frequência como mitigação. Isso substitui, só para esta fonte, o
passo 5 acima. A regra que continua **não-negociável** (vem do
`CLAUDE.md`/`04_SUPABASE_BANCO_SEGURANCA.md` e não foi alterada pelo
usuário) é: a credencial nunca vai para o repositório Git, nunca para
código versionado, nunca para o front-end, nunca para uma tabela
legível pelo client — só como secret server-side (variável de ambiente
do indexador/Edge Function, ex. `ARTIMAGE_SOURCE_PASSWORD`), acessível
apenas ao processo de indexação. Continua valendo vida limitada e
tratamento seguro do cookie/token de sessão gerado a partir dela.

**Observação:** em produção hospedada, uma aba aberta no computador do
administrador não é automaticamente acessível ao servidor remoto.
Portanto, a implementação concreta da coleta autenticada deve ser
escolhida conforme o site-fonte: API/feed/sitemap/exportação são
preferíveis; automação de navegador autenticada deve ser um componente
controlado.

## Estratégia de descoberta --- prioridade

1.  API oficial/feed/exportação estruturada.
2.  Sitemap.
3.  URLs de categorias/paginação.
4.  Crawler autorizado.
5.  Automação de navegador somente quando necessária.

## Pipeline

### Fase A --- Descoberta

Mapear páginas e itens, respeitando escopo/domínio configurado.

### Fase B --- Extração

Extrair: - código/SKU quando existir; - título; - URL do produto; - URL
da imagem principal; - imagens secundárias opcionalmente; -
categoria/metadados.

### Fase C --- Download/normalização

Validar MIME, dimensões, tamanho, erro HTTP e duplicidade.

### Fase D --- Embeddings

Processar em batch. Registrar versão do modelo.

### Fase E --- Persistência

Inserir/upsert em versão de índice `BUILDING`.

### Fase F --- Validação

Medir: - itens descobertos; - imagens válidas; - imagens sem
embedding; - duplicatas; - erros; - cobertura.

### Fase G --- Ativação

Somente após validação, marcar `READY` e permitir "Ativar versão". A
versão antiga permanece disponível para rollback.

## Reindexação

Botão admin: `REINDEXAR`.

Modos: - Completa. - Incremental, quando houver meios confiáveis de
detectar mudanças.

Incremental: - novo item → inserir; - imagem alterada → recalcular
embedding; - metadado alterado → atualizar sem recalcular vetor se
imagem não mudou; - removido → marcar inativo; - inalterado → não
processar novamente.

## Resiliência

- checkpoint;
- retries com backoff;
- idempotência;
- cancelamento;
- retomada;
- limite de concorrência;
- relatório final.

## Painel

Mostrar: - fonte; - índice ativo; - última indexação; - duração; -
total; - novos; - alterados; - removidos; - falhas; - progresso; -
log; - botão reindexar; - cancelar; - ativar; - rollback.

## Não fazer

- Não reindexar a cada pesquisa.
- Não armazenar senha no repositório.
- Não apagar índice ativo no começo da rotina.
- Não depender de seletores CSS frágeis sem abstração/configuração.
