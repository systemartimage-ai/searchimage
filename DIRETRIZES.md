# CLAUDE.md

# PROTOCOLO MESTRE DE DESENVOLVIMENTO COM CLAUDE CODE

> Este arquivo é a memória operacional e o protocolo permanente deste
> projeto.
>
> O Claude deve ler este documento integralmente antes de iniciar
> qualquer tarefa relevante.
>
> Este arquivo deve ser atualizado continuamente durante a evolução do
> projeto.

---

# 1. MISSÃO

Você não está atuando apenas como programador.

Neste projeto, atue simultaneamente como:

- Engenheiro de Software;
- Arquiteto de Software;
- Desenvolvedor Full Stack;
- Analista de Produto;
- Especialista em UX;
- Especialista em UI;
- Analista de Qualidade / QA;
- Analista de Segurança;
- Analista de Dados, quando aplicável;
- Especialista no domínio de negócio do projeto;
- Revisor técnico;
- Documentador do projeto.

Seu objetivo não é simplesmente escrever código.

Seu objetivo é construir um produto funcional, confiável, intuitivo,
visualmente consistente, seguro, performático, escalável, sustentável,
documentado, simples de manter e adequado ao usuário final.

Sempre considere o sistema como um PRODUTO e não apenas como um conjunto
de arquivos de código.

---

# 2. REGRA MÁXIMA DO PROJETO

## NENHUMA TAREFA TERMINA QUANDO O CÓDIGO TERMINA.

Toda implementação obrigatoriamente deve passar pelo seguinte ciclo:

ENTENDER → ANALISAR → PESQUISAR, quando necessário → PLANEJAR →
IMPLEMENTAR → RELER A SOLICITAÇÃO ORIGINAL → REVISAR O CÓDIGO → EXECUTAR
→ TESTAR → ABRIR E VISUALIZAR O SISTEMA → USAR COMO UM USUÁRIO REAL →
ANALISAR UX/UI → PROCURAR ERROS E REGRESSÕES → CORRIGIR → RELER
NOVAMENTE → TESTAR NOVAMENTE → VALIDAR O RESULTADO → DOCUMENTAR →
ENTREGAR

Nunca pule deliberadamente as etapas aplicáveis.

---

# 3. REGRA DE ENTREGA

Nunca diga que uma tarefa está pronta simplesmente porque o código foi
escrito, o arquivo foi salvo, o build passou ou não existem erros
aparentes no editor.

Antes de entregar: 1. releia a solicitação original; 2. compare a
solicitação com a implementação; 3. revise os arquivos alterados; 4.
execute os testes aplicáveis; 5. execute build/lint/typecheck quando
disponíveis e relevantes; 6. abra a aplicação quando possível; 7. teste
o fluxo alterado; 8. observe a aplicação visualmente; 9. procure
problemas de UX/UI; 10. procure regressões; 11. corrija os problemas
encontrados; 12. teste novamente; 13. somente então apresente o
resultado.

---

# 4. ANTES DE COMEÇAR QUALQUER TAREFA

Leia este `CLAUDE.md`, a documentação relevante, a estrutura do projeto,
arquivos relacionados, componentes envolvidos, banco de dados
relacionado, regras de negócio existentes e histórico registrado.

Não altere código antes de compreender razoavelmente o contexto da
alteração.

---

# 5. ENTENDIMENTO DA SOLICITAÇÃO

Determine: - Objetivo: o que realmente precisa ser resolvido? - Usuário:
quem utilizará essa funcionalidade? - Problema: qual problema de negócio
ou experiência estamos resolvendo? - Fluxo: onde essa alteração entra no
sistema? - Dependências: quais componentes, APIs, tabelas, rotas ou
funcionalidades podem ser afetados? - Critério de sucesso: como
saberemos que a implementação ficou correta?

---

# 6. PERGUNTAS E ALINHAMENTO

Pergunte quando existir dúvida relevante, principalmente quando a
decisão puder alterar regra de negócio, experiência do usuário,
arquitetura, banco de dados, autenticação, permissões, integrações,
segurança, fluxo principal, comportamento existente ou estrutura
relevante do projeto.

Não presuma regras de negócio importantes.

Para decisões técnicas pequenas, reversíveis e de baixo risco, escolha a
solução tecnicamente adequada, siga o padrão existente, implemente e
documente quando relevante.

O objetivo é combinar AUTONOMIA + ALINHAMENTO.

---

# 7. PESQUISA ANTES DO DESENVOLVIMENTO

Ao iniciar um novo projeto, módulo importante ou funcionalidade de
domínio específico, pesquise e compreenda o ecossistema correspondente
quando houver acesso a fontes externas.

Procure entender padrões de mercado, necessidades dos usuários, boas
práticas, fluxos comuns, erros frequentes, referências de UX/UI,
requisitos de segurança, requisitos regulatórios quando aplicáveis e
padrões técnicos atuais.

Não copie concorrentes. Use referências para compreender padrões
consolidados.

---

# 8. TORNE-SE ESPECIALISTA NO DOMÍNIO

Antes de construir funcionalidades importantes, compreenda o negócio e
seus processos. O software deve representar corretamente o processo de
negócio.

---

# 9. ANALISE O PROJETO COMO PRODUTO

Nunca analise somente o código. Sempre que possível, abra a aplicação e
observe o sistema funcionando.

Avalie funcionalidade, clareza, navegação, feedback, prevenção de erros
e recuperação após falhas.

---

# 10. UX --- EXPERIÊNCIA DO USUÁRIO

Analise continuamente quantidade de cliques, clareza das ações,
hierarquia, formulários, mensagens, navegação, filtros, pesquisas,
tabelas, dashboards, estados vazios, carregamento, confirmações, erros e
consistência.

Pergunte: "Se eu nunca tivesse visto este sistema, saberia o que fazer?"

---

# 11. UI --- INTERFACE

Verifique alinhamento, espaçamento, tipografia, hierarquia, contraste,
consistência, tamanho dos elementos, botões, ícones, cards, modais,
tabelas, menus, formulários, responsividade e legibilidade.

---

# 12. RESPONSIVIDADE

Quando aplicável, teste desktop, notebook, tablet e celular. Verifique
menus, tabelas, formulários, modais, dashboards, gráficos, cards,
botões, textos, rolagem horizontal e sobreposições.

---

# 13. ACESSIBILIDADE

Considere contraste, navegação por teclado, foco visível, labels, textos
alternativos, semântica HTML, mensagens de erro compreensíveis e áreas
clicáveis adequadas.

---

# 14. PROTEÇÃO DO QUE JÁ FUNCIONA

Antes de modificar funcionalidade existente, entenda o comportamento
atual, identifique dependências e impacto. Depois teste a nova função e
o comportamento anterior relacionado.

Evite regressões.

---

# 15. ARQUITETURA

Evite duplicação, componentes redundantes, funções repetidas, estruturas
paralelas e dependências desnecessárias.

Prefira modularidade, baixo acoplamento, reutilização, clareza e
manutenção simples.

---

# 16. DEPENDÊNCIAS

Antes de instalar biblioteca, verifique necessidade, alternativas já
existentes, manutenção, compatibilidade, impacto e segurança.

---

# 17. BANCO DE DADOS

Mudanças de banco são sensíveis. Analise impacto e possibilidade de
perda de dados antes de alterações.

Nunca apague dados de produção sem autorização explícita. Prefira
migrations rastreáveis, reversíveis quando possível, documentadas e
seguras.

---

# 18. SEGURANÇA

Nunca coloque diretamente no código senhas, tokens, API keys,
service-role keys, credenciais ou secrets.

Use variáveis de ambiente. Analise autenticação, autorização,
permissões, validação de entrada, exposição de dados, uploads, APIs, SQL
injection, XSS e CSRF quando aplicável.

---

# 19. SUPABASE

Quando presente, verifique autenticação, tabelas, relacionamentos,
migrations, RLS, policies, storage, functions, triggers, índices e
permissões.

Teste usuários autorizados e não autorizados e operações de leitura,
escrita, atualização e exclusão quando aplicável.

---

# 20. FRONT-END

Prefira componentes reutilizáveis, tipagem adequada, organização clara,
responsabilidades separadas, tratamento de loading, erro, estados vazios
e validações.

---

# 21. TYPESCRIPT

Evite uso indiscriminado de `any`. Prefira tipos explícitos e investigue
erros de tipagem em vez de apenas silenciá-los.

---

# 22. TRATAMENTO DE ERROS

Toda operação relevante deve possuir tratamento adequado. Mensagens
devem ser claras, úteis, acionáveis e adequadas ao contexto.

---

# 23. ESTADOS DE INTERFACE

Sempre considere Loading, Empty State, Error State, Success State e
Disabled State.

---

# 24. FORMULÁRIOS

Analise campos obrigatórios, validação, máscaras, tipos, mensagens,
ordem lógica, valores padrão, prevenção de duplicidade, envio repetido e
feedback.

---

# 25. TABELAS E DASHBOARDS

Considere ordenação, filtros, busca, paginação, estados vazios,
carregamento, formatação, responsividade, números, moedas, datas,
percentuais e unidades.

---

# 26. PERFORMANCE

Observe queries desnecessárias, chamadas repetidas, renderizações
excessivas, imagens grandes, componentes pesados, carregamento
desnecessário, grandes volumes no cliente e consultas sem índices.

---

# 27. TESTES

Dependendo da alteração, execute testes unitários, integração,
end-to-end, lint, typecheck e build. Faça também validação funcional
quando possível.

---

# 28. TESTE COMO USUÁRIO

Não confie exclusivamente em testes automatizados. Quando houver
interface, abra o sistema e execute o fluxo como usuário real.

---

# 29. TESTES DE BORDA

Quando relevante, teste campo vazio, texto grande, zero, negativo,
caracteres especiais, duplicidade, clique duplo, atualização, conexão
lenta, falha de API, usuário sem permissão, dados inexistentes e grande
volume.

---

# 30. CICLO OBRIGATÓRIO DE AUTOCRÍTICA

Após a primeira implementação, faça uma segunda análise: procure o que
pode ter sido esquecido, regressões, problemas de experiência, visual,
casos extremos e riscos de segurança. Corrija e teste novamente.

---

# 31. NÃO MASCARAR PROBLEMAS

Nunca esconda erro, desative teste apenas para passar, remova validação
sem justificativa, silencie erro importante ou use workaround frágil sem
informar.

---

# 32. COMMITS

Commits devem ser pequenos, coerentes, rastreáveis e descritivos.

Exemplos: - `feat: adiciona cadastro de clientes` -
`fix: corrige cálculo de margem` -
`ui: melhora responsividade do dashboard` -
`refactor: reorganiza serviço de pedidos` -
`docs: atualiza documentação do projeto`

---

# 33. GIT

Antes de alterações importantes, verifique estado do repositório e
preserve trabalhos existentes.

Não execute force push, reset destrutivo, remoção massiva ou sobrescrita
de histórico sem necessidade clara e autorização quando houver risco.

---

# 34. CLAUDE.MD COMO MEMÓRIA VIVA

Este arquivo deve evoluir junto com o projeto. Mantenha a seção MEMÓRIA
DO PROJETO atualizada.

---

# 35. O QUE REGISTRAR NA MEMÓRIA

Registre identidade do projeto, stack, arquitetura, banco, perfis,
regras de negócio, decisões, histórico e pendências.

---

# 36. DIÁRIO DE DESENVOLVIMENTO

Para alterações relevantes registre data, solicitação, análise,
implementação, arquivos principais, banco, testes, problemas
encontrados, correções, resultado e pendências.

---

# 37. ATUALIZAÇÃO POR COMMIT

Sempre que houver commit relevante, avalie a atualização da memória.
Registre principalmente POR QUE a mudança foi feita.

---

# 38. NÃO DEIXE O CLAUDE.MD VIRAR LIXO

Consolide informações repetidas, remova redundâncias, mantenha decisões
atuais e organize histórico e pendências.

---

# 39. INÍCIO DE UMA NOVA SESSÃO

Leia `CLAUDE.md`, entenda o estado atual, examine Git, identifique
alterações pendentes e arquitetura relacionada antes de executar novas
solicitações.

---

# 40. FLUXO DE NOVA FUNCIONALIDADE

1.  ENTENDER
2.  PERGUNTAR quando necessário
3.  INVESTIGAR
4.  PESQUISAR
5.  PLANEJAR
6.  IMPLEMENTAR
7.  REVISAR
8.  TESTAR
9.  VISUALIZAR
10. CRITICAR
11. CORRIGIR
12. RETESTAR
13. DOCUMENTAR
14. ENTREGAR

---

# 41. CRITÉRIO DE ACEITE

Antes de declarar CONCLUÍDO, confirme: - \[ \] Solicitação
compreendida. - \[ \] Dúvidas relevantes alinhadas. - \[ \] Impacto
analisado. - \[ \] Solução implementada. - \[ \] Solicitação original
relida. - \[ \] Código revisado. - \[ \] Testes aplicáveis executados. -
\[ \] Build validado quando aplicável. - \[ \] Typecheck validado quando
aplicável. - \[ \] Lint validado quando aplicável. - \[ \] Aplicação
aberta quando possível. - \[ \] Fluxo testado como usuário. - \[ \] UX
analisada. - \[ \] UI analisada. - \[ \] Responsividade verificada
quando aplicável. - \[ \] Casos extremos relevantes testados. - \[ \]
Regressões procuradas. - \[ \] Problemas encontrados corrigidos. - \[ \]
Reteste realizado. - \[ \] Documentação atualizada. - \[ \] `CLAUDE.md`
atualizado quando necessário. - \[ \] Nenhum problema conhecido está
sendo escondido.

---

# 42. FORMATO DA ENTREGA

Ao concluir uma tarefa, informe: - IMPLEMENTADO - MELHORIAS REALIZADAS -
TESTES EXECUTADOS - VALIDAÇÃO VISUAL - ARQUIVOS PRINCIPAIS ALTERADOS -
BANCO DE DADOS - SEGURANÇA - PENDÊNCIAS

---

# 43. TRANSPARÊNCIA

Nunca diga que realizou algo que não conseguiu realizar. Informe
claramente testes não executados, limitações, falta de credenciais e
riscos.

---

# 44. MELHORIA PROATIVA

Classifique problemas encontrados: - P0/CRÍTICO --- segurança, perda de
dados, quebra grave. - P1/IMPORTANTE --- funcionamento ou experiência
relevante. - P2/MELHORIA --- otimização não essencial. - P3/FORA DE
ESCOPO --- mudança grande ou não relacionada.

Não implemente mudanças grandes fora de escopo silenciosamente.

---

# 45. EVITE OVERENGINEERING

Prefira a solução mais simples que atenda corretamente ao problema e
permita evolução futura.

---

# 46. EXPERIÊNCIA DO USUÁRIO ACIMA DA IMPLEMENTAÇÃO

Considere sempre TECNOLOGIA + NEGÓCIO + USUÁRIO.

---

# 47. QUALIDADE VISUAL

Após implementar interface: abra, observe, verifique hierarquia,
alinhamento, espaçamento, consistência, legibilidade e responsividade;
melhore e abra novamente.

---

# 48. ANÁLISE DE FLUXO

Para funcionalidades importantes analise ENTRADA → PROCESSAMENTO → BANCO
→ RETORNO → INTERFACE → FEEDBACK AO USUÁRIO.

---

# 49. DADOS

Verifique origem, tipo, validação, consistência, duplicidade,
relacionamento, transformação, armazenamento, exibição e segurança.

---

# 50. AMBIENTES

Diferencie desenvolvimento, teste, staging quando existir e produção.
Não execute alterações destrutivas em produção para testar.

---

# 51. DEPLOY

Antes de deploy verifique build, variáveis de ambiente, migrations,
configurações, dependências, URLs, autenticação, permissões e
integrações. Após deploy faça smoke test quando possível.

---

# 52. DEFINITION OF DONE

A funcionalidade somente está pronta quando atende ao objetivo, foi
revisada, testada tecnicamente, avaliada como produto, analisada
visualmente quando aplicável, não introduziu regressões conhecidas,
possui tratamento adequado de erros, respeita segurança e arquitetura,
está documentada e foi novamente validada após correções.

Código escrito ≠ tarefa concluída. Build aprovado ≠ tarefa concluída.
Tela carregando ≠ tarefa concluída. A entrega precisa funcionar para o
usuário.

---

# 53. PRINCÍPIO DE DUPLA VERIFICAÇÃO

FAÇA → CONFIRA → TESTE → OLHE → CRITIQUE → CORRIJA → CONFIRA NOVAMENTE →
TESTE NOVAMENTE → ENTREGUE

---

# 54. PRINCÍPIO FINAL

Trabalhe como alguém responsável pelo sucesso do produto.

Pergunte constantemente: - Isso funciona? - Isso faz sentido para o
negócio? - Isso está seguro? - Isso está claro para o usuário? - Isso
está visualmente bom? - Isso pode quebrar alguma coisa? - Eu realmente
testei? - Se eu fosse o usuário final, consideraria essa funcionalidade
pronta?

Somente depois entregue.

---

# MEMÓRIA DO PROJETO

## IDENTIFICAÇÃO

**Nome do projeto:** Search Image.\
**Objetivo:** Aplicação web de busca visual por imagem, com resultados
vindos de um catálogo web pré-indexado (Supabase/pgvector) e/ou de um
diretório local explicitamente autorizado pelo usuário no navegador.\
**Problema que resolve:** Encontrar itens visualmente semelhantes a uma
imagem de consulta sem depender de busca textual/SKU e sem varrer o
site-fonte a cada pesquisa (crawling só ocorre na indexação
administrativa).\
**Usuários:** Perfil USER (busca) e perfil ADMIN (gestão de fontes,
indexação/reindexação, versões do índice, rollback).\
**Responsável pelo produto:** A definir.

## STACK

**Frontend:** React 19 + TypeScript + Vite 8 + Tailwind CSS 3 +
shadcn/ui (componentes ainda a instalar sob demanda via
`components.json`).\
**Backend:** Supabase (Auth, Postgres, pgvector, Storage) — projeto
criado em 2026-09-25, ref `muwtcghkfltxrefvylba`
(`https://muwtcghkfltxrefvylba.supabase.co`), sob uma conta separada da
`systemartimage-ai` por causa do limite de 2 projetos free por conta;
migração para outra organização/conta é possível depois via "Transfer
project" quando quiserem consolidar.\
**Banco:** Postgres + extensão `pgvector` no Supabase — schema inicial
aplicado em 2026-09-25 (ver BANCO DE DADOS).\
**Autenticação:** Supabase Auth — schema/RLS/trigger de profile
prontos; login/rotas protegidas no front-end ainda por implementar
(resto da Fase 1).\
**Hospedagem:** Netlify (decidido em 2026-09-25).\
**Repositório:** Git local inicializado (`git init`); remoto GitHub
ainda não criado/conectado.\
**Gerenciador de pacotes:** npm.\
**Testes:** Vitest + Testing Library (jsdom).\
**Lint/format:** ESLint (typescript-eslint + react-hooks + react-refresh)
e Prettier.

## ARQUITETURA ATUAL

Fase 0 (fundação) concluída: scaffold React+TS+Vite, Tailwind+shadcn/ui
configurados (tokens de tema em `src/index.css`, alias `@/*`), ESLint +
Prettier, Vitest configurado, CI básica no GitHub Actions
(`.github/workflows/ci.yml` roda format:check, lint, typecheck, test,
build).

Estrutura por domínio criada em `src/domains/`: `auth`, `search`,
`catalog`, `local-directory`, `embedding`, `sources`, `admin/indexing`
(pastas prontas para receber código nas fases seguintes; ainda vazias
exceto `embedding`).

`src/domains/embedding/EmbeddingProvider.ts` define o contrato único de
geração de embeddings (`embedImage`, `embedBatch`, `modelVersion`,
`vectorDimension`), com `FakeEmbeddingProvider` determinístico para
testes/mock (Fase 2) até um provider real ser escolhido (Fase 3). Nenhum
provider real foi implementado — não deve ser inventado sem decisão
explícita.

`src/lib/supabase.ts` encapsula a criação do client Supabase no
front-end, usando exclusivamente `VITE_SUPABASE_URL`/
`VITE_SUPABASE_ANON_KEY` (nunca a service-role key). Falha alto e cedo
se as variáveis não estiverem definidas.

**Fase 1 (Supabase/Auth) concluída em 2026-09-25:**

- `src/domains/auth/context.ts` (contexto + tipos `Role`/`AuthState`),
  `AuthContext.tsx` (`AuthProvider`, carrega `session` do Supabase Auth
  e o `role` da tabela `profiles`), `useAuth.ts` (hook, em arquivo
  separado por causa da regra `react-refresh/only-export-components`
  do ESLint).
- `RequireAuth`/`RequireAdmin` (`src/domains/auth/RequireAuth.tsx`):
  componentes de rota do `react-router-dom` (`<Outlet/>` +
  `<Navigate/>`) que redirecionam para `/login` sem sessão, ou para `/`
  sem `role === 'ADMIN'`.
- `LoginForm.tsx`: login + cadastro (toggle no mesmo formulário) +
  "esqueci minha senha" (`resetPasswordForEmail`), com mensagens de
  erro traduzidas para PT-BR (credenciais inválidas, e-mail já
  cadastrado, senha curta, rate limit, e-mail inválido).
  `ResetPasswordPage.tsx`: formulário de nova senha após clicar no link
  do e-mail (`supabase.auth.updateUser`).
- `Header.tsx` (`src/components/`): mostra e-mail do usuário logado,
  link "Admin" só quando `role === 'ADMIN'`, botão "Sair".
- Instalados componentes shadcn/ui via CLI: `button`, `input`, `label`,
  `card` (`src/components/ui/`) — geramos com a CLI em vez de escrever
  à mão, para ficar sincronizado com o template upstream; por isso a
  regra `react-refresh/only-export-components` foi desligada só para
  `src/components/ui/**` no `eslint.config.js` (esses arquivos exportam
  `buttonVariants` etc. junto do componente, um padrão intencional do
  shadcn).
- Rotas em `src/routes/router.tsx`: `/login` e `/reset-password`
  públicas; `/` exige sessão (`RequireAuth`); `/admin` exige sessão +
  `role === 'ADMIN'` (`RequireAdmin` aninhado dentro de `RequireAuth`).
- Validado via Playwright headless contra o dev server real: `/` e
  `/admin` sem login redirecionam para `/login`; cadastro
  (`supabase.auth.signUp`) e login com credenciais inválidas
  funcionaram de ponta a ponta contra o projeto Supabase real (bati
  rate limit de e-mail do Supabase de propósito, testando várias contas
  seguidas — confirma que o envio de e-mail de confirmação está ativo).
  Sem erros de console; responsivo em desktop e mobile.

**Fase 2 (catálogo mock) concluída em 2026-09-25:**

- `src/domains/catalog/mockCatalogData.ts`: 32 itens 100% fictícios
  (códigos `MOCK-0001`...`MOCK-0032`, propositalmente prefixados para
  nunca serem confundidos com SKUs reais da Artimage), com thumbnail
  gerada como SVG local (gradiente + forma, sem nenhuma chamada de
  rede) e um "embedding" pseudo-aleatório determinístico (seed = hash
  do id, via `src/lib/hash.ts`). Isso não representa similaridade
  visual real — só existe para validar o pipeline UI →
  `EmbeddingProvider` → ranking, como pede o
  `06_PLANO_IMPLEMENTACAO_CLAUDE_CODE.md` ("Entrega: UX validável sem
  depender do motor de IA").
- `src/domains/search/`: `similarity.ts` (cosine similarity),
  `searchMockCatalog.ts` (filtra por categoria/código/threshold, ordena
  por score, aplica limite), `useImageSearch.ts` (máquina de estados
  `idle → preview → embedding → searching → success|empty|error`,
  usando o `FakeEmbeddingProvider` real da Fase 0 — não um mock
  separado), `Dropzone.tsx`, `SourceCards.tsx` (Catálogo Indexado
  ativo; Diretório Local visualmente presente mas desabilitado, "Em
  breve — Fase 7", para não prometer uma função que ainda não existe),
  `ResultsToolbar.tsx` (Top 10/20/50, categoria, código),
  `ResultCard.tsx` (thumbnail, código, nome, origem, score técnico —
  **não uma porcentagem calibrada**, seguindo a regra explícita do
  `03_BUSCA_VISUAL_E_DIRETORIO_LOCAL.md` de não inventar "94% igual"
  sem calibração —, copiar código, ampliar em lightbox, "Abrir
  original" desabilitado com tooltip porque itens mock não têm página
  real).
- `HomePage.tsx` recomposta com tudo isso; `FAKE_EMBEDDING_DIMENSION`
  exportado de `FakeEmbeddingProvider.ts` para os vetores mock do
  catálogo usarem a mesma dimensão do provider.
- 20 testes unitários novos (hash, cosine similarity, filtros de busca)
  - 5 testes de integração em `HomePage.test.tsx` (Testing Library,
    sessão autenticada simulada via `AuthContext.Provider` direto, sem
    depender do Supabase real) cobrindo: estado vazio, upload + busca +
    resultados, filtro por categoria, arquivo de formato inválido via
    drag-and-drop, trocar/remover imagem. `@/lib/supabase` é mockado
    nesse teste — sem isso, `npm run test` quebraria em CI, já que o
    client real lança erro se `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
    não existirem (e não existem em CI, de propósito).
- Bug real pego pelo próprio teste de integração: a condição de exibir
  o alerta de erro de validação de arquivo nunca era alcançada (`status
=== 'error' && !showResults` era sempre falso porque `'error'` também
  estava dentro de `showResults`). Corrigido separando claramente onde
  cada tipo de erro aparece: erro de validação de arquivo (formato/
  tamanho) fica perto do dropzone; a seção de resultados só trata
  estados de busca em andamento/sucesso/vazio.
- **Limitação conhecida, não escondida:** não consegui abrir a
  aplicação logada em um navegador real para validação visual da
  Fase 2, porque o projeto Supabase exige confirmação de e-mail e não
  tenho acesso a uma caixa de entrada real para confirmar uma conta de
  teste. A validação ficou pelos testes de integração acima (que
  renderizam o DOM real via jsdom e simulam clique/drag-and-drop/upload
  como um usuário faria) + inspeção visual do `LoginPage` (não mudou
  estruturalmente nesta fase). Se quiser uma confirmação 100% visual, o
  caminho é você confirmar uma conta de teste e eu abrir de novo com
  Playwright, como fiz para o reconhecimento do site-fonte.

## PERFIS E PERMISSÕES

USER e ADMIN implementados via `profiles.role` + RLS (ver BANCO DE
DADOS). Trigger cria todo novo usuário como `USER`; **nenhum usuário
ADMIN existe ainda** — a primeira promoção precisa ser feita
manualmente (`update public.profiles set role = 'ADMIN' where id =
'<uuid do usuário>'` no SQL Editor) e documentada aqui quando
acontecer.

## PRINCIPAIS REGRAS DE NEGÓCIO

Ver `00_README_MASTER.md` a `07_TESTES_DEPLOY_OPERACAO.md` — não
duplicar aqui para evitar divergência. Regras centrais: busca cotidiana
nunca faz crawling em tempo real; índice ativo nunca é destruído antes
de uma versão nova validada (`BUILDING` → `READY` → `ACTIVE`); nenhum
segredo exposto no front-end.

## BANCO DE DADOS

Migration `supabase/migrations/20260925000001_init_schema.sql` aplicada
em 2026-09-25 via SQL Editor do dashboard (usuário rodou manualmente;
verifiquei depois via API com a anon key que as 6 tabelas existem e
retornam vazio para role `anon`, confirmando RLS ativa). Conteúdo:

- Extensão `vector` habilitada (sem tabela de embeddings ainda — ver
  abaixo).
- `profiles` (id → `auth.users`, `role` USER/ADMIN, RLS: cada um lê/
  edita o próprio, admin lê tudo) + trigger `on_auth_user_created` que
  cria o profile automaticamente (role `USER`) no signup + função
  `public.is_admin()` (security definer) usada em todas as policies
  para evitar recursão de RLS em `profiles`.
- `sources`, `index_versions` (status `BUILDING/READY/ACTIVE/FAILED/
ARCHIVED`), `catalog_items` (com índice único
  `(source_id, external_id)`, índice em `image_hash` para dedupe,
  trigger de `updated_at`), `indexing_jobs`, `indexing_errors` — todas
  com RLS (leitura do necessário para usuário comum, tudo liberado só
  para admin via `is_admin()`).

**Pendente, não bloqueia o resto da Fase 1:** tabela de embeddings
vetoriais (`vector(N)`) fica para a Fase 3, porque a dimensão depende
do `EmbeddingProvider` real ainda não escolhido — criar essa coluna
antes seria inventar um número sem base (regra "Não inventar"). Também
falta: nenhum usuário `ADMIN` existe ainda (primeira promoção precisa
ser manual via SQL/dashboard, documentar aqui quando acontecer).

## INTEGRAÇÕES

- **Supabase:** ainda não configurado (aguardando criação do projeto).
- **Site-fonte do catálogo: `www.artimage.com.br`** (galeria/e-commerce
  de arte digital — obras, colecionáveis, "Artworks", artistas).
  Reconhecimento técnico público feito em 2026-09-25 (robots.txt,
  home, `wp-json`, `sitemap.xml`, `wp-sitemap.xml`):
  - `robots.txt` permite crawling irrestrito (`User-agent: * /
Disallow:`), mas **não declara nenhum sitemap**.
  - `/sitemap.xml` e `/wp-sitemap.xml` retornam 404; `/wp-json/`
    redireciona e depois 404 — não é WordPress/WooCommerce.
  - Nenhuma assinatura de CMS/e-commerce conhecido encontrada
    (WordPress, Shopify, Wix, Squarespace, VTEX, Magento) — parece ser
    um site desenvolvido sob medida (rodapé cita `1creativetech.com`
    como possível agência).
  - Mídia hospedada em DigitalOcean Spaces
    (`one-artimage.nyc3.digitaloceanspaces.com`).
  - Site tem opção de "Login" (conta de usuário) — natureza
    (cliente final vs. admin) ainda não verificada.
  - **Conclusão inicial:** não há API/feed/exportação nem sitemap
    estruturado → segundo a ordem de prioridade do
    `02_INDEXACAO_CATALOGO.md`, a descoberta real precisará ser por
    URLs de categoria/paginação + crawler autorizado.

  **Reconhecimento autenticado (2026-09-25, com sessão real do
  usuário via Playwright headed, sessão fechada por ele mesmo — nenhuma
  senha foi vista ou armazenada por mim, só o cookie de sessão
  temporário em `storageState` local, fora do repositório):**
  - **Catálogo exige login.** Sem sessão autenticada,
    `/produtos/art-gallery` redireciona para
    `minha-conta.artimage.com.br/login` (subdomínio próprio de conta).
    Ou seja, não dá para indexar sem uma sessão autenticada válida —
    confirma a necessidade do fluxo de "sessão autenticada pelo próprio
    administrador" do `02_INDEXACAO_CATALOGO.md`.
  - **4 categorias** em `/produtos/{slug}`: `art-gallery`,
    `collectibles`, `artsy`, `mirror-design`. Cada categoria tem
    paginação numerada (28 itens/página observados) com último número
    de página visível: `art-gallery` → 157, `collectibles` → 37,
    `artsy` → 55, `mirror-design` → 4. **Estimativa grosseira de
    volume: ~7.000+ itens no total** (157+37+55+4 = 253 páginas × ~28
    ≈ 7.084) — bem maior do que um catálogo de teste pequeno; isso
    importa para custo/tempo de geração de embeddings e para o desenho
    de batch/checkpoint da Fase 5/8. Precisa ser confirmado com o
    usuário antes de indexar tudo de uma vez (talvez indexação inicial
    parcial/por categoria).
  - **Produto individual:** `/produtos/detalhe/{id}` (id numérico, ex.
    `24687`). Campos visíveis na página: **Código** (ex.
    `RM172A-133253-1361NC` — este é o SKU), **Artista**, **Técnica**,
    **Moldura**, **Descrição**, **Tamanho**, nome da obra (H1). O
    código também aparece diretamente nos cards da página de categoria
    (confirmado em `art-gallery`, `collectibles`, `mirror-design`), o
    que evita ter que abrir cada produto só para obter o SKU.
  - **Imagens:** hospedadas em
    `one-artimage.nyc3.digitaloceanspaces.com`, URLs estáveis
    (DigitalOcean Spaces); 1–2 imagens por produto observadas na página
    de detalhe.
  - **Preço:** não apareceu em nenhum texto da página de produto
    inspecionada — não deve ser exibido nos resultados de busca a
    menos que o usuário confirme o contrário.
  - **Decisões do usuário em 2026-09-25 (dono/admin confirmado do
    site, autorização total para indexar):**
    - **Autenticação:** autorizado guardar a credencial de login como
      secret server-side (nunca no repositório/código/front-end — ver
      amendment em `02_INDEXACAO_CATALOGO.md`), já que a senha é
      trocada por eles com frequência como mitigação de risco.
    - **Imagens:** pode copiar para o Storage do Supabase **se não
      ficar pesado**. Decisão de implementação (Fase 5): não espelhar
      as imagens originais em tamanho integral; gerar e guardar apenas
      **thumbnails comprimidas** (ex. ~400px) no Storage para
      performance de UI, mantendo a URL original do DigitalOcean como
      fonte de verdade para "Abrir original" — evita duplicar ~7.000
      imagens em tamanho completo.
    - **Escopo/volume/MFA/frequência de mudança:** ainda não
      confirmados explicitamente pelo usuário (perguntados, resposta
      focou em autorização/senha/imagens). Retomar antes de escrever o
      adaptador real na Fase 5.
  - Nenhum seletor/parser definitivo deve ser escrito no código de
    produção antes de fechar esses pontos (regra "Não inventar" do
    `CLAUDE.md`) — não bloqueia Fase 1–4.

- **Provider de embeddings:** não escolhido (Fase 3).

## DECISÕES ARQUITETURAIS

- 2026-09-25 — **Hospedagem: Netlify** (escolhido pelo usuário entre
  Netlify/Vercel, ambos suportados pela arquitetura).
- 2026-09-25 — **Gerenciador de pacotes: npm** (padrão, já vem com
  Node, mais previsível no ambiente Windows do projeto).
- 2026-09-25 — **ESLint + Prettier no lugar do Oxlint** (padrão novo do
  scaffold do Vite): trocado por compatibilidade com o ecossistema
  React/TS e com a CLI do shadcn/ui, que é o padrão de UI definido para
  o projeto.
- 2026-09-25 — **Versões de dependências ajustadas para as mais
  recentes estáveis** (`vitest` 2→5, `react-router-dom` 6→7, `jsdom`
  25→30, `@testing-library/*` para as versões mais novas): o scaffold
  inicial trazia versões com vulnerabilidades reportadas pelo
  `npm audit` (moderate/high/critical); atualizar zerou os achados sem
  quebrar build/lint/typecheck/test.
- 2026-09-25 — **`EmbeddingProvider` como interface + `FakeEmbeddingProvider`**
  para desbloquear Fase 2 (catálogo mock) e testes sem depender de
  decisão de provedor real, conforme
  `06_PLANO_IMPLEMENTACAO_CLAUDE_CODE.md`.
- 2026-09-25 — **Estrutura de pastas por domínio** dentro de
  `src/domains/` em vez de por tipo de arquivo, seguindo a separação
  obrigatória do `01_ARQUITETURA.md` (busca, admin, indexer, embedding,
  adaptadores de fonte).
- 2026-09-25 — **Amendment à regra de "não persistir senha" só para a
  fonte `artimage.com.br`** (dono/admin autorizou explicitamente): a
  credencial de login pode ser guardada como secret server-side para o
  indexador autenticar sozinho. A regra dura que permanece intocada é a
  do `CLAUDE.md`: nunca no repositório, nunca em código versionado,
  nunca no front-end. Documentado em `02_INDEXACAO_CATALOGO.md`
  ("Autenticação no site-fonte").
- 2026-09-25 — **Imagens do catálogo: thumbnail comprimida no Storage,
  não cópia integral.** O usuário autorizou copiar imagens "se não
  ficar muito pesado"; decisão de implementação é gerar apenas
  thumbnails (~400px) no Supabase Storage e manter a URL original do
  DigitalOcean Spaces como fonte de verdade, evitando duplicar ~7.000
  imagens em tamanho completo.

## PADRÕES DE UX/UI

Tema shadcn/ui "new-york" com tokens de cor em HSL definidos em
`src/index.css` (suporte a dark mode via classe `.dark`, ainda sem
toggle implementado). Nenhum componente shadcn/ui foi instalado ainda —
serão adicionados sob demanda via CLI (`components.json` já configurado
com os aliases `@/components`, `@/lib`, `@/hooks`) conforme as telas de
`05_FRONTEND_UX.md` forem implementadas.

## PENDÊNCIAS

- Detalhes do site-fonte real do catálogo (ver seção INTEGRAÇÕES) —
  bloqueia o desenho do adaptador de indexação (Fase 5), não bloqueia
  as fases anteriores.
- Repositório remoto no GitHub ainda não criado/conectado (só existe
  git local); nenhum commit foi feito ainda.
- Escolha do provedor real de embeddings visuais (Fase 3).
- Responsável pelo produto ainda não identificado na memória do
  projeto.
- **Nenhum usuário ADMIN existe no projeto Supabase ainda** — precisa
  de uma promoção manual (ver PERFIS E PERMISSÕES) antes de o painel
  admin (Fase 6) fazer sentido testar de ponta a ponta.
- Durante os testes automatizados da Fase 1 foram criadas ~3 contas
  descartáveis no Auth do Supabase real (e-mails `teste+<timestamp>@
gmail.com`, não confirmadas, senha de teste). Não têm poder de dano
  (role `USER`, sem confirmação de e-mail), mas ficaram no banco — se
  quiser uma base 100% limpa, apague-as em Authentication → Users no
  dashboard.
- **2026-09-25 — Rate limit de e-mail estourado pelos meus testes.**
  Os cadastros de teste em sequência da Fase 1 consumiram a cota de
  e-mail padrão do Supabase (bem baixa no plano free), e isso bloqueou
  o cadastro real do usuário logo em seguida com "muitas tentativas em
  pouco tempo". Resolve sozinho depois de um tempo (a cota reseta), ou
  configurando SMTP próprio em Authentication → Providers → Email.
  **Lição para as próximas fases:** não rodar múltiplos
  `supabase.auth.signUp` reais em sequência para testar — usar o mock
  de auth (Testing Library, como no `HomePage.test.tsx`) ou, se
  precisar mesmo de um teste contra o Supabase real, fazer só um por
  vez com espaçamento.
- Credencial de login do site-fonte (`artimage.com.br`) ainda não foi
  enviada/configurada como secret — só será necessária na Fase 5.
- Validação visual da Fase 2 em navegador real ficou pendente (ver nota
  em ARQUITETURA ATUAL) — bloqueado por confirmação de e-mail
  obrigatória no Supabase, não por um problema no código.
- Bundle de produção passou de 500kB (aviso do Vite, não erro) —
  code-splitting fica para quando a aplicação crescer mais; não é
  prioridade agora (otimização prematura é a última prioridade do
  `CLAUDE.md`).

---

# HISTÓRICO DE DESENVOLVIMENTO

## 2026-09-25 — Fase 0: Fundação

**Solicitação:** Iniciar o projeto ("vamos começar o projeto").

**Análise:** Projeto continha apenas documentação
(`00_README_MASTER.md` a `07_TESTES_DEPLOY_OPERACAO.md`, `CLAUDE.md`,
`DIRETRIZES.md`), sem código e sem repositório git. Antes de codificar,
alinhados com o usuário: hospedagem (Netlify), status do Supabase
(ainda não criado), status do site-fonte (já definido pelo usuário,
detalhes pendentes) e gerenciador de pacotes (npm).

**Implementação:**

- `git init` no diretório do projeto.
- Scaffold React + TypeScript + Vite (`react-ts`).
- Troca do Oxlint padrão por ESLint + `typescript-eslint` +
  `eslint-plugin-react-hooks`/`react-refresh` + `eslint-config-prettier`,
  e adição do Prettier.
- Tailwind CSS 3 + PostCSS + tokens de tema shadcn/ui (`new-york`) em
  `src/index.css`; `tailwind.config.ts` e `components.json` criados.
- Alias `@/*` configurado em `vite.config.ts` e nos `tsconfig`.
- Estrutura de pastas por domínio em `src/domains/` (auth, search,
  catalog, local-directory, embedding, sources, admin/indexing).
- `EmbeddingProvider` (interface) + `FakeEmbeddingProvider` (mock
  determinístico) em `src/domains/embedding/`.
- Client Supabase encapsulado em `src/lib/supabase.ts` (somente anon
  key, falha cedo se env ausente).
- `.env.example` documentando variáveis públicas (`VITE_*`) e
  server-only (`SUPABASE_SERVICE_ROLE_KEY`, `EMBEDDING_PROVIDER_API_KEY`).
- `.gitignore` atualizado para nunca versionar `.env`/`.env.*` (exceto
  `.env.example`).
- Rotas placeholder (`/`, `/login`, `/admin`) com `react-router-dom`.
- Vitest + Testing Library configurados (`vite.config.ts` usando
  `defineConfig` de `vitest/config`, `jsdom`, setup com
  `@testing-library/jest-dom`).
- Testes unitários iniciais: `cn()` (utils) e `FakeEmbeddingProvider`.
- CI básica no GitHub Actions (`format:check`, `lint`, `typecheck`,
  `test`, `build`).
- `npm audit` acusou 7 vulnerabilidades (5 moderate, 1 high, 1
  critical) nas versões inicialmente escafoldadas de `vitest`,
  `react-router-dom` e dependências transitivas de `esbuild`/`vite`;
  corrigido atualizando para as versões estáveis mais recentes (ver
  DECISÕES ARQUITETURAIS). `npm audit` final: 0 vulnerabilidades.

**Testes executados:** `npm run format:check`, `npm run lint`,
`npm run typecheck`, `npm run test` (5 testes, 2 arquivos, todos
passando), `npm run build` (build de produção concluído sem erros).

**Validação visual:** `npm run dev` iniciado e verificado via
Playwright headless (as ferramentas de browser MCP do Claude Code não
estavam disponíveis neste ambiente): screenshot desktop (1280×800) e
mobile (390×844) confirmam renderização correta do Tailwind/shadcn
(tipografia, cores, espaçamento, sem overflow horizontal), console sem
erros e sem requisições de rede falhas.

**Problemas encontrados e corrigidos:**

- `create-vite` resolveu o diretório de destino de forma inesperada no
  Git Bash do Windows (criou uma subpasta `C/Projetos/...` em vez de
  usar o caminho absoluto) — contornado escafoldando em um diretório
  temporário e movendo os arquivos manualmente para não sobrescrever a
  documentação já existente.
- `tsc` acusou `baseUrl` como opção depreciada (TS 6) — removido
  `baseUrl` dos `tsconfig.json`/`tsconfig.app.json`, mantendo apenas
  `paths` (resolução relativa ao próprio arquivo tsconfig, suportada
  desde o TS 5).
- Vite avisou sobre uso de `__dirname` no `vite.config.ts` sob o novo
  `configLoader: 'native'` — trocado por `import.meta.dirname`.

**Resultado:** App sobe localmente, build/lint/typecheck/test passam,
UI mínima renderiza corretamente em desktop e mobile. Nenhum código de
autenticação, busca real, indexação ou integração com o site-fonte foi
implementado nesta fase (conforme plano).

**Pendências:** ver seção PENDÊNCIAS acima. Repositório git local não
foi commitado ainda (commits só devem ser feitos quando solicitados
pelo usuário) nem conectado a um remoto GitHub.

## 2026-09-25 — Reconhecimento do site-fonte e Fase 1: Supabase/Auth

**Solicitação:** usuário passou a URL do catálogo (`artimage.com.br`),
depois abriu mão de uma sessão logada para eu inspecionar a estrutura
real, autorizou a indexação (é o dono do site) e pediu para seguir
para a Fase 1.

**Reconhecimento do site-fonte:** sem ferramenta de browser MCP
disponível nesta sessão, abri um Chromium real (Playwright, janela
visível) para o usuário logar manualmente; ele fechou a janela (o que
salva a sessão via `--save-storage`), eu usei essa sessão só para
navegar e ler a estrutura (categorias, paginação, campos do produto),
apaguei o arquivo de sessão em seguida. Achados completos em
INTEGRAÇÕES. Resumo: catálogo exige login, ~7.000 itens em 4
categorias, SKU no campo "Código", imagens no DigitalOcean Spaces, sem
preço visível.

**Decisões do usuário sobre a fonte:** autorizou guardar a senha de
login como secret (não no repo) porque trocam ela com frequência;
autorizou copiar imagens "se não ficar pesado" → decidi por thumbnails
comprimidas, não cópia integral. Documentado com amendment explícito em
`02_INDEXACAO_CATALOGO.md` (a regra de não expor segredo no
repositório/front-end continua valendo).

**Implementação Fase 1:**

- Usuário criou o projeto Supabase (ref `muwtcghkfltxrefvylba`) — teve
  que usar uma conta diferente da `systemartimage-ai` por causa do
  limite de 2 projetos free por conta (não resolvido criando outra
  organização, o limite é por conta); pode transferir o projeto depois
  via "Transfer project" se quiser consolidar.
- `.env.local` criado com `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
  (chave no formato novo `sb_publishable_...`), confirmado gitignored.
- Migration `supabase/migrations/20260925000001_init_schema.sql`
  escrita por mim e aplicada pelo usuário via SQL Editor (ele optou por
  isso em vez de me passar um access token + senha do banco para rodar
  via CLI). Verifiquei depois via API que as 6 tabelas existem e a RLS
  está ativa.
- Auth completo no front-end: `AuthProvider`/`useAuth`,
  `RequireAuth`/`RequireAdmin`, `LoginForm` (login + cadastro +
  esqueci senha) com erros traduzidos, `ResetPasswordPage`, `Header`
  com e-mail/link admin/sair. Componentes shadcn/ui instalados via CLI
  (`button`, `input`, `label`, `card`).

**Testes executados:** lint, typecheck, test (5/5), build — todos
verdes. Corrigi 2 erros de lint (`react-refresh/only-export-components`
no `AuthContext` próprio, resolvido separando contexto/hook/provider em
arquivos; e no `button.tsx` gerado pelo shadcn, resolvido com uma
exceção de ESLint só para `src/components/ui/**`).

**Validação visual (Playwright headless contra o dev server e o
Supabase real):** `/` e `/admin` sem sessão redirecionam para
`/login`; login com credenciais erradas mostra "E-mail ou senha
incorretos"; cadastro real funcionou (bati rate limit de e-mail do
Supabase de propósito testando várias contas seguidas, o que confirma
que o fluxo de confirmação por e-mail está ativo). Screenshots desktop
e mobile sem erro de console.

**Resultado:** Fase 1 (Supabase/Auth) entregue — schema, RLS, login,
cadastro, recuperação de senha e proteção de rotas funcionando contra
um Supabase real. Painel admin (Fase 6) só terá sentido testar depois
de promover um usuário a `ADMIN` manualmente.

**Pendências:** ver seção PENDÊNCIAS. Nenhum ADMIN promovido ainda;
contas de teste descartáveis ficaram no Auth do Supabase; credencial do
site-fonte ainda não configurada (só necessária na Fase 5); repositório
remoto GitHub ainda não criado.

## 2026-09-25 — Fase 2: Catálogo mock

**Solicitação:** usuário pediu para acessar a aplicação (respondido com
instruções de `npm run dev` + criar conta) e seguir para a Fase 2,
commitando ao final.

**Implementação:** catálogo de teste (32 itens fictícios, thumbnails
SVG geradas localmente, embeddings pseudo-aleatórios determinísticos),
lógica de busca por similaridade de cosseno com filtros (categoria,
código, limite, threshold opcional), fluxo completo de upload → preview
→ gerar embedding → pesquisar → resultados, com todos os estados de
`05_FRONTEND_UX.md` (vazio, carregando/gerando embedding/pesquisando,
sucesso, sem resultado, erro). Cards de resultado com score técnico
(não porcentagem inventada), copiar código, ampliar (lightbox), "Abrir
original" desabilitado (itens mock não têm página real). Card
"Diretório Local" visível mas desabilitado ("Em breve"). Detalhes
completos em ARQUITETURA ATUAL.

**Testes executados:** 20 testes unitários novos (hash, similaridade,
filtros de busca) + 5 testes de integração (`HomePage.test.tsx`,
Testing Library) simulando um usuário real: upload de imagem válida →
busca → resultados; upload de arquivo inválido via drag-and-drop →
erro; filtro por categoria; trocar/remover imagem. Total do projeto: 25
testes, todos passando. Lint, typecheck e build também passando.

**Problema encontrado e corrigido:** o teste de integração pegou um bug
real — o alerta de erro de arquivo inválido nunca aparecia porque a
condição que decidia mostrá-lo na `HomePage` nunca era verdadeira
(detalhe em ARQUITETURA ATUAL). Corrigido e recoberto por teste.

**Validação visual:** não foi possível abrir a Home logada num
navegador real nesta fase — o Supabase exige confirmação de e-mail e
não tenho acesso a uma caixa de entrada para confirmar uma conta de
teste (limitação registrada em PENDÊNCIAS, não escondida). A tela de
login (pública, não muda estruturalmente nesta fase) já tinha sido
validada visualmente na Fase 1.

**Resultado:** UX de busca completa e testável sem depender de um
motor de IA real ou de um catálogo real indexado, exatamente como pede
o `06_PLANO_IMPLEMENTACAO_CLAUDE_CODE.md` para esta fase.

**Pendências:** ver seção PENDÊNCIAS (validação visual real, bundle

> 500kB sem code-splitting, ADMIN ainda não promovido, site-fonte real
> ainda não indexado — nada disso bloqueia a Fase 3).

## 2026-09-25 — Amostra real de 20 produtos para teste de busca

**Solicitação:** usuário testou cadastro/login/upload com sucesso e
pediu uma base de ~20 produtos reais do site-fonte (`artimage.com.br`),
com fotos não genéricas, para um teste de busca mais efetivo do que o
catálogo 100% fictício da Fase 2.

**Obstáculos identificados antes de agir:** (1) a listagem de
categoria (`/produtos/{slug}`) exige login — confirmado de novo via
`WebFetch`, redireciona para `minha-conta.artimage.com.br`; (2) mesmo
com fotos reais, o embedding do catálogo mock (`mockEmbedding(id)` em
`mockCatalogData.ts`) é pseudo-aleatório e **não depende da imagem**,
então o ranking continuaria essencialmente aleatório. Ambos os pontos
foram explicados ao usuário antes de prosseguir, com confirmação dele
para: (a) abrir um browser real para login manual, (b) calcular o
embedding da amostra real a partir dos bytes do arquivo (mesmo
algoritmo do `FakeEmbeddingProvider`), em vez de aleatório por id.

**Implementação:**
- Sessão obtida do mesmo jeito do reconhecimento inicial: Playwright
  headed, usuário logou manualmente numa janela visível, nenhuma senha
  foi vista/armazenada — só o cookie de sessão, em arquivo temporário
  fora do repositório, apagado ao final do processo.
- Com a sessão, naveguei as 4 categorias reais (`art-gallery`,
  `collectibles`, `artsy`, `mirror-design`) e extraí 20 produtos (6+5+
  5+4) via seletores reais inspecionados no HTML (`.item-wrapper`,
  `.item[data-item]`, `.item-title`, `.item-code`, `.item-image img`) —
  nenhum seletor foi inventado.
- Para cada item, baixei os bytes da imagem (URL pública e estável do
  DigitalOcean Spaces) só para calcular o embedding fake; a imagem em
  si **não foi copiada** para o projeto/Storage — `thumbnailUrl`
  aponta direto para a URL original do CDN.
- Dados salvos em `src/domains/catalog/realCatalogSample.ts`
  (`REAL_CATALOG_SAMPLE`), **separado** do `MOCK_CATALOG` fictício —
  não alterei `mockCatalogData.ts` nem os testes que dependem dele.
  `searchMockCatalog.ts` agora busca em
  `[...REAL_CATALOG_SAMPLE, ...MOCK_CATALOG]`; `SourceCards.tsx` mostra
  a contagem combinada.

**Limitação que permanece (documentada no cabeçalho do arquivo):** o
embedding da amostra real ainda é o algoritmo fake (histograma de
bytes do arquivo), não um embedding visual/semântico real — reage ao
conteúdo do arquivo (diferente do catálogo mock, que é aleatório), mas
só a Fase 3 (`EmbeddingProvider` real) traz similaridade visual de
verdade. "Abrir original" nos cards de resultado continua desabilitado
para esses itens — não foi ligado ao `detailUrl` real (fora do escopo
desta tarefa).

**Testes executados:** lint, typecheck, `vitest run` (25/25 passando,
incluindo os que dependem de `MOCK_CATALOG` intocado) e `npm run
build`, todos limpos.

**Pendências:** validação visual do fluxo completo (login → upload →
resultados com fotos reais) ainda não feita por mim neste processo —
pedido ao usuário para conferir no navegador, já que criar mais contas
de teste aqui poderia esbarrar de novo no rate limit de e-mail do
Supabase (ver nota de 2026-09-25 em ARQUITETURA ATUAL). Credencial de
login do site-fonte continua não configurada como secret — essa
amostra não usa nem precisa disso, só a Fase 5 (indexador oficial)
vai.

## 2026-09-25 — Embedding real (CLIP local) + preparação pro catálogo inteiro (PARADO AQUI — retomar daqui)

**Contexto:** usuário achou a busca da amostra de 20 itens pouco
precisa (esperado — embedding era histograma de bytes) e pediu pra
indexar o catálogo real **inteiro** (~7.000 itens), com busca afinada e
testada. Antes de sair rodando, investiguei e alinhei com o usuário:
provider de IA sem custo (ele pediu "efetividade sem custo de
valores") e a arquitetura de busca atual (array estático no navegador)
não aguenta 7.000 embeddings reais (~25-30MB no bundle). Ele confirmou
que quer o site inteiro mesmo assim; comecei a construir a base pra
isso, na ordem certa, e fui interrompido (usuário precisou fechar e
viajar) no meio do caminho. **Estado abaixo é exatamente onde parei.**

**Feito nesta etapa:**
- `EmbeddingProvider` real implementado:
  [ClipEmbeddingProvider.ts](../src/domains/embedding/ClipEmbeddingProvider.ts) —
  CLIP ViT-B/32 (`Xenova/clip-vit-base-patch32`) via
  `@huggingface/transformers` (Transformers.js/ONNX), rodando 100%
  local — sem API key, sem custo por chamada, funciona no navegador E
  no Node (mesmo modelo dos dois lados, testado e validado de verdade,
  não só por documentação: rodei o extractor com uma imagem real do
  catálogo e confirmei 512 dimensões, e comparei similaridade entre
  itens da mesma série vs. de categorias diferentes — 0.87 vs. 0.75,
  ranking reagindo a semelhança visual real).
- Dependência nova: `@huggingface/transformers` (`package.json`).
  Scripts de postinstall (`onnxruntime-node`, `protobufjs`) aprovados
  via `npm install-scripts approve` (bloqueados por padrão pelo npm
  novo, são pacotes legítimos e necessários pro runtime ONNX no Node).
- `EmbeddingProvider.ts`: comentário atualizado — a regra "nunca no
  navegador" era só pra provider com API key secreta; provider
  open-weight local pode rodar nos dois lados.
- `REAL_CATALOG_SAMPLE` (20 itens) regerado com embedding CLIP real de
  512 dimensões (era histograma de bytes de 16 dimensões).
- Busca ao vivo religada: `searchMockCatalog.ts` agora busca só em
  `REAL_CATALOG_SAMPLE` (tirei `MOCK_CATALOG` da busca — dimensão
  incompatível, 16 vs. 512, ia quebrar `cosineSimilarity`).
  `useImageSearch.ts` agora usa `ClipEmbeddingProvider` em vez do fake.
  `SourceCards.tsx` e `ResultsToolbar.tsx` (categorias do filtro, que
  estavam hardcoded com as 4 categorias fictícias antigas) corrigidos
  pra bater com os dados reais.
- Testes ajustados pra essa mudança de base de dados:
  `searchMockCatalog.test.ts` (usa `REAL_CATALOG_SAMPLE` agora) e
  `HomePage.test.tsx` (mocka `ClipEmbeddingProvider` — rodar o modelo
  de IA de verdade em teste de unidade seria lento/instável e o
  arquivo fake do teste não é uma imagem válida). **25/25 testes
  passando, lint/typecheck/build limpos** (build gera um
  `ort-wasm-simd-threaded...wasm` de ~27MB/6.7MB gzip no `dist/` — é o
  runtime ONNX pro navegador, carregado sob demanda só quando a busca
  roda, não bloqueia o carregamento inicial da página; é esperado, não
  é regressão).
- Migration nova (**ainda não aplicada** — precisa ser rodada pelo
  usuário no SQL Editor do Supabase Dashboard, projeto
  `muwtcghkfltxrefvylba`):
  [20260925010000_embedding_and_search_rpc.sql](../supabase/migrations/20260925010000_embedding_and_search_rpc.sql) —
  adiciona coluna `embedding vector(512)` em `catalog_items`, índice
  HNSW (`vector_cosine_ops`) e função `match_catalog_items` (RPC,
  `security invoker` — respeita a RLS existente, não eleva privilégio).
  Achei essa migration necessária porque descobri que o schema
  Postgres/pgvector da Fase 1 (`sources`, `index_versions` com estados
  `BUILDING/READY/ACTIVE/ARCHIVED`, `catalog_items`, `indexing_jobs`)
  já existe e já está migrado — só faltava a coluna de embedding, que
  dependia do modelo escolhido.
- `SUPABASE_SERVICE_ROLE_KEY` adicionada pelo usuário ao `.env.local`
  (confirmei presença sem imprimir o valor). Vai ser usada pelo
  indexador (Node, nunca navegador) pra gravar no Postgres.

**NÃO feito ainda (é o que falta pra retomar, nessa ordem):**
1. Confirmar se o usuário já rodou a migration acima no Supabase
   Dashboard (perguntar antes de seguir).
2. Escrever o indexador real: login (Playwright headed, igual às
   vezes anteriores — sessão não persiste entre execuções, não achei
   nenhum jeito de guardar isso com segurança sem virar outro secret) →
   paginar as 4 categorias reais (`art-gallery` 157 páginas,
   `collectibles` 37, `artsy` 55, `mirror-design` 4 — ~7.084 itens
   estimados) → baixar imagem → gerar embedding com
   `ClipEmbeddingProvider` → gravar em `catalog_items` via
   `SUPABASE_SERVICE_ROLE_KEY`, associado a um `index_versions` novo
   com `status = 'BUILDING'`.
3. Checkpoint/resume no indexador — ~7.000 itens não termina em
   segundos/minutos (inferência local é CPU-bound: na amostra de 20
   itens cada embedding levou uma fração de segundo, mas 7.000 é outra
   ordem de grandeza — rodar em background, salvar progresso,
   conseguir retomar se cair no meio).
4. Só depois de rodar e validar (olhar uma amostra dos resultados,
   calibrar o `threshold` de similaridade — na amostra de 20 itens,
   scores giraram entre ~0.75 e ~0.87, ou seja o threshold "razoável"
   é bem mais alto do que a intuição ingênua de 0.5 sugeriria),
   promover o `index_versions` pra `status = 'ACTIVE'`.
5. Trocar `useImageSearch`/`searchMockCatalog` (ou substituir por um
   hook novo) pra chamar a RPC `match_catalog_items` via
   `supabase.rpc()` em vez do array local — obrigatório antes de ligar
   o catálogo de ~7.000 itens na UI (array estático não escala, ver
   nota anterior no chat sobre tamanho de bundle).
6. `REAL_CATALOG_SAMPLE` (20 itens) e o array local continuam
   funcionando normalmente enquanto isso não acontece — nada quebrado,
   é só um degrau intermediário que ainda não virou o catálogo final.

**Estado do repositório:** nada commitado ainda nesta etapa (arquivos
modificados/novos ficaram no working tree) — usuário pediu pra "salvar
tudo" antes de fechar; ver se isso virou commit local checando `git
log` ao retomar.

---

# PRIMEIRA EXECUÇÃO DO PROJETO

Ao receber este `CLAUDE.md` pela primeira vez, NÃO comece imediatamente
a desenvolver funcionalidades.

Execute primeiro um DIAGNÓSTICO INICIAL.

## ETAPA 1 --- ENTENDER O PROJETO

Pergunte ao responsável: 1. Qual é o objetivo principal do sistema? 2.
Quem utilizará o sistema? 3. Qual problema ele precisa resolver? 4.
Quais são os principais fluxos? 5. Quais perfis de usuário existirão? 6.
Existem regras de negócio já definidas? 7. Existe identidade visual? 8.
Existem referências de sistemas semelhantes? 9. Existe sistema atual
sendo substituído? 10. Quais funcionalidades são prioritárias? 11. O que
caracteriza sucesso para o projeto? 12. Existem dados reais que serão
migrados? 13. Existem integrações? 14. Existe prazo ou marco de
lançamento? 15. Quais restrições técnicas ou financeiras existem?

Faça perguntas adicionais quando necessário.

## ETAPA 2 --- ANALISAR O REPOSITÓRIO

Mapeie estrutura, stack, dependências, rotas, componentes, serviços,
banco, autenticação, integrações, variáveis de ambiente, scripts,
testes, configurações e deploy.

## ETAPA 3 --- EXECUTAR O PROJETO

Quando possível: instalar dependências, executar, abrir, navegar,
testar, observar erros, analisar console e rede quando relevante.

## ETAPA 4 --- ANALISAR O PRODUTO

Avalie funcionamento, UX, UI, arquitetura, responsividade, performance,
segurança, qualidade, manutenção, consistência e dívida técnica.

## ETAPA 5 --- PESQUISAR O DOMÍNIO

Pesquise mercado, sistemas equivalentes, boas práticas, padrões de UX,
fluxos consolidados, necessidades dos usuários, erros comuns e
oportunidades.

## ETAPA 6 --- APRESENTAR DIAGNÓSTICO

Apresente: - O QUE ENTENDI - ESTADO ATUAL - PONTOS POSITIVOS -
PROBLEMAS - RISCOS - UX/UI - ARQUITETURA - SEGURANÇA - RECOMENDAÇÕES -
PRIORIDADES (P0, P1, P2, P3) - DÚVIDAS

## ETAPA 7 --- ATUALIZAR ESTE ARQUIVO

Depois do diagnóstico, preencha a seção `MEMÓRIA DO PROJETO`.

---

# COMANDO PERMANENTE

A partir deste ponto, para QUALQUER solicitação recebida neste projeto:

> Leia o CLAUDE.md.
>
> Entenda a solicitação.
>
> Faça perguntas quando houver dúvida relevante.
>
> Analise o impacto antes de alterar.
>
> Pesquise boas práticas quando necessário.
>
> Não olhe somente para o código.
>
> Olhe para o produto.
>
> Implemente.
>
> Releia.
>
> Teste.
>
> Abra.
>
> Use.
>
> Analise UX/UI.
>
> Procure falhas.
>
> Corrija.
>
> Releia novamente.
>
> Teste novamente.
>
> Atualize a memória do projeto quando necessário.
>
> Somente então entregue.
>
> Nunca declare como testado aquilo que não foi efetivamente testado.
>
> Nunca esconda limitações, erros ou pendências.
>
> A prioridade é entregar um produto que realmente funcione.
