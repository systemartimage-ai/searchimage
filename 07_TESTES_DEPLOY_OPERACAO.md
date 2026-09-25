# SEARCH IMAGE --- TESTES, DEPLOY E OPERAÇÃO

## Testes unitários

- hash/dedupe;
- normalização;
- parser;
- score;
- filtros;
- permissões;
- transições de status.

## Integração

- Supabase;
- RPC vetorial;
- Storage;
- index job;
- ativação/rollback.

## E2E

1.  Login.
2.  Upload.
3.  Busca.
4.  Abrir resultado.
5.  Admin inicia indexação.
6.  Falha não derruba índice ativo.
7.  Nova versão é ativada.
8.  Rollback funciona.
9.  Diretório local autorizado funciona.

## Teste de qualidade visual

Criar conjunto de referência com: - mesma imagem; - recorte; - mudança
de resolução; - fundo diferente; - foto em perspectiva; - produto
semelhante; - produto diferente.

Medir Recall@K/Top-K e revisar falsos positivos.

## Performance

Medir separadamente: - upload; - geração do embedding; - query
vetorial; - render; - indexação por 100/1.000 imagens.

Não definir SLA fictício antes de medir.

## Deploy

### GitHub

- main protegida;
- branches/PRs;
- migrations versionadas.

### Vercel ou Netlify

Ambos são viáveis para o front-end. Escolher um e documentar. Não
acoplar a arquitetura a recursos exclusivos sem necessidade.

### Ambientes

- local
- preview/staging
- production

Supabase de produção separado quando o projeto amadurecer.

## Backups

- banco;
- migrations;
- configuração de fontes;
- possibilidade de reconstruir embeddings.

## Monitoramento

- falhas de busca;
- falhas de embedding;
- jobs travados;
- taxa de sucesso;
- duração;
- volume.

## Runbook

### Índice falhou

Manter versão ativa anterior. Corrigir e retomar/criar novo job.

### Nova versão ruim

Rollback para versão anterior.

### Provider de IA indisponível

Busca já indexada ainda depende do embedding da imagem de consulta.
Exibir erro claro e retry; preparar provider alternativo futuramente.

### Site-fonte mudou layout

Falhar de forma observável; não publicar índice incompleto
automaticamente.
