#!/bin/bash
# Rodada de ~7.000 itens leva horas; o processo pode cair sozinho no
# meio (OOM/crash nativo do Chromium headless de longa duração — sem
# stack trace de JS, ver DIRETRIZES.md). Como o indexador tem
# checkpoint (.indexer-checkpoint.json), reiniciar do zero é seguro:
# páginas já gravadas são puladas.
while true; do
  node --experimental-strip-types scripts/indexCatalog.mjs
  code=$?
  if [ $code -eq 0 ]; then
    echo "=== indexador terminou com sucesso (todas as paginas feitas) ==="
    break
  fi
  echo "=== indexador caiu (exit $code), reiniciando em 5s a partir do checkpoint ==="
  sleep 5
done
