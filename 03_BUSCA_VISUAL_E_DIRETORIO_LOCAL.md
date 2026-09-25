# SEARCH IMAGE --- BUSCA VISUAL E DIRETÓRIO LOCAL

## Consulta por imagem

Entrada: - JPG/PNG/WebP e formatos aprovados. - Drag-and-drop, seletor
de arquivo e mobile camera/upload quando possível.

Pipeline: 1. Validar arquivo. 2. Normalizar imagem. 3. Gerar embedding
usando o mesmo espaço/modelo do índice. 4. Consultar vetor. 5. Aplicar
filtros. 6. Retornar Top K. 7. Exibir resultado.

## Similaridade

Não apresentar um "94% igual" sem calibração. Distância vetorial não é
automaticamente uma porcentagem humana. No MVP, preferir: -
`Mais semelhante` - score técnico ou uma porcentagem somente após criar
função de normalização/calibração validada com exemplos reais.

## Filtros

Preparar: - fonte; - categoria; - código; - limite de resultados; -
threshold opcional.

## Diretório local

O navegador não pode varrer arbitrariamente o computador. O usuário
precisa selecionar/autorizar explicitamente uma pasta.

Fluxo: 1. Clicar `Conectar diretório`. 2. Selecionar pasta. 3. Aplicação
enumera imagens permitidas pelo navegador. 4. Gera índice local. 5.
Exibe progresso. 6. Usuário pesquisa naquela base. 7. Nenhum arquivo
fora da autorização é acessado.

## Persistência local

Projetar em camadas: - MVP: índice da sessão. - Evolução: IndexedDB para
metadados/vetores quando tecnicamente adequado. - Evolução avançada:
pequeno agente desktop/local se for necessária persistência robusta,
monitoramento automático de pastas ou volumes muito grandes.

## Duas fontes na UI

Opções: - Catálogo Indexado - Diretório Local

Permitir uma ou ambas quando a arquitetura estiver pronta.

## Privacidade

Para diretório local, informar claramente se a imagem: - fica somente no
dispositivo; - é enviada a um serviço de embeddings; - é armazenada ou
não.

Não prometer processamento 100% local se o modelo de embeddings
utilizado for remoto.

## UX de resultados

Card: - miniatura; - código; - nome; - origem; - score; -
`Abrir original`.

Ações: - copiar código; - abrir item; - ampliar imagem.
