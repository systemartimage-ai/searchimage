# SEARCH IMAGE --- FRONT-END E UX

## Identidade

Visual moderno, claro, tecnológico, orientado a inteligência visual.
Interface simples: a busca é o protagonista.

## Tela Login

- marca Search Image;
- e-mail/senha ou método definido;
- recuperação;
- feedback de erro.

## Home / Busca

### Header

- logo;
- usuário;
- histórico opcional;
- admin apenas para ADMIN;
- sair.

### Hero de consulta

Grande dropzone: `Arraste uma imagem aqui ou clique para selecionar`

Após upload: - preview; - trocar; - remover; - pesquisar.

### Onde pesquisar?

Card 1 --- `Catálogo Indexado` - status pronto; - quantidade; - última
atualização.

Card 2 --- `Diretório Local` - `Conectar pasta`; - nome da pasta; -
quantidade indexada; - progresso.

### Resultado

Grid responsivo. Controles: - Top 10/20/50; - fonte; - ordenação por
similaridade.

## Estados obrigatórios

- vazio;
- carregando;
- gerando embedding;
- pesquisando;
- sem resultado;
- erro;
- diretório sendo indexado;
- catálogo indisponível.

## Admin

Dashboard: - cards de saúde; - fontes; - versão ativa; - última
indexação; - total de imagens; - erros.

Página de indexação: - `Iniciar nova indexação`; - modo; - progresso; -
etapas; - log; - cancelar; - ativar versão; - rollback.

## Mobile

Busca deve funcionar bem em celular: - upload por galeria/câmera quando
o dispositivo oferecer; - cards em uma coluna; - botões grandes; -
resultado visual.

## Acessibilidade

- teclado;
- foco visível;
- labels;
- alt text;
- contraste;
- não depender apenas de cor.
