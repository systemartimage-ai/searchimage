# SEARCH IMAGE --- PLANO DE IMPLEMENTAÇÃO PARA CLAUDE CODE

## REGRA DE EXECUÇÃO

Antes de alterar: 1. Ler todos os `.md`. 2. Inspecionar projeto
existente. 3. Explicar impacto. 4. Implementar em etapas pequenas. 5.
Testar. 6. Abrir/inspecionar a aplicação. 7. Corrigir UX e erros. 8.
Testar novamente. 9. Atualizar documentação. 10. Só então considerar a
etapa entregue.

Não alterar silenciosamente decisões arquiteturais importantes.

## FASE 0 --- Fundação

- criar repositório;
- React + TS + Vite;
- Tailwind + shadcn/ui;
- lint/format;
- env example;
- estrutura por domínio;
- Supabase client;
- CI básica.

Entrega: app sobe localmente e build passa.

## FASE 1 --- Supabase/Auth

- projeto Supabase;
- migrations;
- pgvector;
- tabelas;
- RLS;
- profiles/roles;
- login;
- rotas protegidas;
- admin protegido.

Entrega: USER e ADMIN funcionando.

## FASE 2 --- Catálogo mock

Antes da IA real: - popular catálogo de teste; - cards; - filtros; -
fluxo upload; - resultado mock.

Entrega: UX validável sem depender do motor de IA.

## FASE 3 --- EmbeddingProvider

- interface abstrata;
- provider real;
- provider fake para testes;
- normalização;
- controle de modelo/dimensão;
- tratamento de custo/erro/rate limit.

Entrega: uma imagem gera vetor validado.

## FASE 4 --- Busca vetorial

- RPC SQL;
- nearest-neighbor;
- Top K;
- filtro pela versão ativa;
- endpoint seguro;
- resultado real.

Entrega: consulta retorna itens semelhantes.

## FASE 5 --- Indexador

- sources;
- job;
- descoberta;
- parser;
- download;
- hash;
- batch embeddings;
- upsert;
- checkpoint;
- logs;
- validação;
- versionamento.

Entrega: catálogo autorizado de teste indexado ponta a ponta.

## FASE 6 --- Admin

- dashboard;
- iniciar;
- acompanhar;
- erros;
- cancelar;
- ativar;
- rollback.

Entrega: operação sem mexer diretamente no banco.

## FASE 7 --- Diretório local

- seleção explícita;
- leitura das imagens autorizadas;
- progresso;
- índice local;
- pesquisa;
- privacidade;
- fallback para navegadores sem API necessária.

Entrega: busca local funcional nos navegadores suportados.

## FASE 8 --- Robustez

- dedupe;
- incremental;
- cache;
- observabilidade;
- limites;
- segurança;
- auditoria;
- performance.

## FASE 9 --- Deploy

- GitHub;
- preview;
- produção;
- env vars;
- domínio;
- smoke tests;
- rollback.

## Perguntas que Claude deve resolver antes do crawler real

- Qual é o site-fonte?
- Existe API, sitemap, feed ou exportação?
- Quantos produtos/imagens aproximadamente?
- O login usa MFA/CAPTCHA?
- Qual imagem representa o produto?
- Código/SKU aparece onde?
- É necessário guardar cópia da imagem?
- Com que frequência muda?

Não bloquear a fundação do sistema por essas respostas; usar adaptadores
e mocks até a fonte real ser definida.
