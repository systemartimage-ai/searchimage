# SEARCH IMAGE --- DOCUMENTO MESTRE

## 1. Visão do produto

**Search Image** será uma aplicação web de busca visual. O usuário
envia/arrasta uma imagem e escolhe onde pesquisar:

1.  **Catálogo Web Pré-indexado** --- base criada previamente pelo
    administrador a partir de um site/catálogo autorizado.
2.  **Diretório Local** --- pasta explicitamente selecionada e
    autorizada pelo usuário no navegador.

O sistema compara a imagem de consulta com o índice visual e retorna os
itens mais semelhantes, com miniatura, similaridade, código/nome quando
disponível, fonte e acesso ao original.

## 2. Princípio central

A busca cotidiana **não deve navegar pelo site remoto**. A
navegação/coleta ocorre somente durante a rotina administrativa de
indexação/reindexação. Depois disso, a pesquisa trabalha sobre um índice
preparado.

## 3. Stack proposta

- Front-end: React + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- Hospedagem: Vercel ou Netlify
- Banco/Auth: Supabase
- Banco vetorial: PostgreSQL + pgvector no Supabase
- Storage: Supabase Storage para miniaturas/metadados necessários
- Repositório: GitHub
- IA visual: modelo de embeddings multimodais/visuais encapsulado
  atrás de um `EmbeddingProvider`
- Indexador: serviço/módulo separado do front-end
- Testes: unitários + integração + E2E
- Observabilidade: logs estruturados de indexação e pesquisa

## 4. Regra arquitetural

Separar obrigatoriamente: - Aplicação de busca - Painel administrativo -
Motor de indexação - Motor de embeddings - Persistência vetorial -
Adaptadores de fonte

Nenhum segredo, senha, service-role key ou credencial pode ser exposto
no front-end.

## 5. Modos de pesquisa

### Catálogo pré-indexado

Pesquisa no Supabase/pgvector.

### Diretório local

O usuário escolhe a pasta explicitamente. O navegador somente acessa
aquilo que o usuário autorizou. A primeira leitura local pode gerar um
índice temporário/local para acelerar buscas subsequentes durante a
sessão ou, quando suportado e autorizado, persistir dados no
dispositivo.

## 6. Fluxo resumido

Admin → cadastra fonte → autentica sessão quando necessário → indexa →
valida → publica nova versão do índice.

Usuário → envia imagem → seleciona fonte → sistema gera embedding →
consulta índice → ordena resultados → apresenta similares.

## 7. Regra de publicação do índice

Nunca destruir o índice ativo antes de uma nova indexação terminar. Usar
versionamento: - `BUILDING` - `READY` - `ACTIVE` - `FAILED` - `ARCHIVED`

Somente uma versão `READY` validada pode virar `ACTIVE`.

## 8. Objetivo do MVP

Entregar primeiro: - login; - upload/drag-and-drop de imagem; - busca no
catálogo pré-indexado; - Top 10/20 resultados; - painel admin; -
indexação manual; - reindexação versionada; - logs; - diretório local
como segunda fonte; - responsividade.

## 9. Critérios de sucesso

- Busca rápida após indexação.
- Nenhuma navegação remota por pesquisa comum.
- Reindexação sem indisponibilizar o índice anterior.
- Resultados reproduzíveis e auditáveis.
- Segurança de credenciais.
- Arquitetura preparada para trocar o provedor de IA sem reescrever o
  produto.

## 10. Ordem de leitura para o Claude Code

1.  `00_README_MASTER.md`
2.  `01_ARQUITETURA.md`
3.  `02_INDEXACAO_CATALOGO.md`
4.  `03_BUSCA_VISUAL_E_DIRETORIO_LOCAL.md`
5.  `04_SUPABASE_BANCO_SEGURANCA.md`
6.  `05_FRONTEND_UX.md`
7.  `06_PLANO_IMPLEMENTACAO_CLAUDE_CODE.md`
8.  `07_TESTES_DEPLOY_OPERACAO.md`
9.  `CLAUDE.md`

O Claude Code deve tratar estes documentos como especificação funcional
inicial e manter a documentação atualizada conforme decisões reais do
projeto.
