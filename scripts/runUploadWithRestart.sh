#!/bin/bash
# Uma rodada de milhares de fotos pode levar horas; se o processo cair
# sozinho no meio (rede, crash nativo, etc.), reinicia automaticamente.
# Seguro porque uploadLocalPhotos.mjs é stateless: cada execução busca
# no banco o que já foi feito antes de processar qualquer coisa, então
# reiniciar do zero nunca duplica trabalho.
#
# Uso: mesmos argumentos do uploadLocalPhotos.mjs
#   ./scripts/runUploadWithRestart.sh --folder "C:/Fotos/Produto1" --label "Fotos locais"

while true; do
  node --experimental-strip-types scripts/uploadLocalPhotos.mjs "$@"
  code=$?
  if [ $code -eq 0 ]; then
    echo "=== upload terminou com sucesso ==="
    break
  fi
  echo "=== processo caiu (exit $code), reiniciando em 5s ==="
  sleep 5
done
