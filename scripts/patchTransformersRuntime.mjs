// Transformers.js 4.3.0 mantém duas filas globais rejeitadas após uma
// falha de sessão/inferência no navegador. Um erro opcional do OWL-ViT
// passava a quebrar também o carregamento do CLIP de texto.
//
// Correção restrita e reproduzível: continuar a fila tanto após sucesso
// quanto após falha, preservando o erro da chamada que falhou. Sem alterar
// modelos, operadores ONNX, precisão dos vetores ou execução concorrente.
// Remover quando uma versão upstream corrigir ambas as filas e os testes
// de regressão passarem sem este patch.
import { readFile, writeFile } from 'node:fs/promises'

const packageRoot = new URL('../node_modules/@huggingface/transformers/', import.meta.url)
const metadata = JSON.parse(await readFile(new URL('package.json', packageRoot), 'utf8'))
if (metadata.version !== '4.3.0') {
  throw new Error(`Revisar patch de recuperação ONNX para Transformers.js ${metadata.version}`)
}

const replacements = [
  ['webInitChain.then(load)', 'webInitChain.then(load, load)'],
  ['webInferenceChain.then(run)', 'webInferenceChain.then(run, run)'],
]
const updates = []
// O bundle web é usado pelo Vite (inclusive Workers); o source é usado
// pelos testes de regressão das filas. Node nativo não usa essas filas.
for (const relativePath of ['dist/transformers.web.js', 'src/backends/onnx.js']) {
  const path = new URL(relativePath, packageRoot)
  const original = await readFile(path, 'utf8')
  let patched = original
  for (const [before, after] of replacements) {
    const oldCount = patched.split(before).length - 1
    const newCount = patched.split(after).length - 1
    if (oldCount === 1 && newCount === 0) patched = patched.replace(before, after)
    else if (oldCount !== 0 || newCount !== 1) {
      throw new Error(`Patch ONNX não reconheceu ${relativePath}: ${before}`)
    }
  }
  if (patched !== original) updates.push({ path, patched })
}
// Valida todos os alvos antes de escrever. Reexecutar é seguro.
for (const { path, patched } of updates) await writeFile(path, patched)
console.log(
  `Transformers.js: recuperação das filas ONNX verificada (${updates.length} arquivos corrigidos).`,
)
