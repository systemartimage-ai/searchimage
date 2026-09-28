// Reprocessa o embedding de cada item já indexado usando o novo
// ClipEmbeddingProvider (que agora recorta a peça do cenário antes de
// embedar — ver src/domains/embedding/ClipEmbeddingProvider.ts). Necessário
// porque os embeddings salvos até agora foram gerados da cena inteira
// (sofá/parede/piso incluídos), então não são comparáveis com o novo jeito
// de embedar — sem reprocessar, a busca ficaria misturando os dois esquemas.
//
// Marca `metadata.crop_reembedded = true` em cada item feito com sucesso —
// resumível: uma nova execução pula quem já foi reprocessado (a não ser que
// rode com --force). Depois de rodar isto pra todo o catálogo, é preciso
// rodar (nesta ordem): generateTipoPrototypes.mjs (os protótipos de
// espelho/quadro foram calculados com embeddings antigos) e depois
// generateTags.mjs --force (as tags também dependem do embedding).
//
// Uso:
//   node --experimental-strip-types scripts/reembedCatalogImages.mjs --limit 50   (smoke test)
//   node --experimental-strip-types scripts/reembedCatalogImages.mjs              (todos os itens pendentes)
//   node --experimental-strip-types scripts/reembedCatalogImages.mjs --force      (reprocessa mesmo quem já foi feito)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { ClipEmbeddingProvider } from '../src/domains/embedding/ClipEmbeddingProvider.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : null
  }
  return {
    limit: get('--limit') ? Number(get('--limit')) : null,
    force: args.includes('--force'),
  }
}

function loadEnv() {
  const content = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const idx = line.indexOf('=')
    if (idx === -1) continue
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
  return env
}

async function main() {
  const { limit, force } = parseArgs()
  const env = loadEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const provider = new ClipEmbeddingProvider()

  // Supabase/PostgREST limita a 1000 linhas por request por padrão — sem
  // paginar, um catálogo grande fica truncado silenciosamente (achado
  // real já documentado em generateTags.mjs).
  const items = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('id, image_url, metadata')
      .not('image_url', 'is', null)
      .range(from, from + pageSize - 1)
    if (error) throw new Error('Falha buscando itens: ' + error.message)
    items.push(...data)
    console.log(`  buscando itens... ${items.length}`)
    if (data.length < pageSize) break
  }
  // Busca SEMPRE o catálogo inteiro (--limit não corta aqui) — precisa
  // saber quem já está feito antes de aplicar o limite ao que falta de
  // verdade (ver comentário abaixo).
  // --limit se aplica ao trabalho PENDENTE (não ao total bruto buscado) —
  // achado real: rodando o catálogo inteiro numa única sessão Node, o
  // backend nativo de imagem (libvips, usado por baixo dos panos pelo
  // Transformers.js no Node) vaza memória e derruba o processo por volta
  // de ~2-3 mil imagens processadas, sem nem logar erro (morte nativa, não
  // uma exceção JS capturável). Como o progresso já é resumível via
  // `metadata.crop_reembedded`, a saída segura é processar em lotes,
  // reiniciando o processo Node entre eles (ver instrução de uso no topo
  // do arquivo) — por isso --limit precisa contar só quem falta de
  // verdade, senão sempre bateria nos mesmos itens já feitos no início da
  // lista.
  const pending = force ? items : items.filter((item) => !item.metadata?.crop_reembedded)
  const skippedUpfront = items.length - pending.length
  const targetItems = limit ? pending.slice(0, limit) : pending
  console.log(
    `Reprocessando embedding de ${targetItems.length} itens (${skippedUpfront} já feitos antes, de ${items.length} no total)${force ? ' [--force]' : ''}...`,
  )

  let processed = 0
  let skipped = skippedUpfront
  let errors = 0
  for (const item of targetItems) {
    try {
      const res = await fetch(item.image_url)
      if (!res.ok) throw new Error(`fetch falhou: ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      const blob = new Blob([buffer])
      const embedding = await provider.embedImage(blob)

      const { error: updateError } = await supabase
        .from('catalog_items')
        .update({ embedding, metadata: { ...item.metadata, crop_reembedded: true } })
        .eq('id', item.id)
      if (updateError) throw new Error(updateError.message)

      processed++
    } catch (err) {
      errors++
      console.log(`Erro no item ${item.id} (${item.image_url}): ${err.message}`)
    }

    if ((processed + errors) % 100 === 0 || processed + errors === targetItems.length) {
      console.log(`  ${processed} reprocessados, ${errors} erros (de ${targetItems.length} nesta rodada)`)
    }
  }

  console.log('\n=== FIM ===')
  console.log('Reprocessados nesta rodada:', processed)
  console.log('Já estavam feitos antes desta rodada (pulados):', skipped)
  console.log('Erros:', errors)
  console.log('Ainda faltam (fora deste lote, se --limit foi usado):', pending.length - targetItems.length)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
