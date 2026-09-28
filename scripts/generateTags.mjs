// Gera tags estruturadas (tipo, tema, categoria/ambiente, cores,
// animal, moldura, formato) pra cada item já indexado — usando o
// embedding CLIP JÁ SALVO de cada item (nada de reprocessar imagem,
// baixar de novo, etc.). Classificação "zero-shot": embeda uma vez
// cada rótulo candidato (em inglês, mesmo motivo da busca por texto —
// CLIP entende inglês melhor), compara por similaridade de cosseno com
// o embedding do item, e guarda como tag (em português) os rótulos
// cuja similaridade passa do limiar da categoria.
//
// Taxonomia compartilhada com o app (src/domains/catalog/tagTaxonomy.ts
// + tagClassifier.ts) — fonte única: já teve bug real de a categoria
// "tipo" aqui e no app divergirem sobre ter ou não uma opção "nenhuma
// das anteriores", gerando tag errada (ex. foto de flor virando
// "espelho") que a busca depois usava pra filtrar.
//
// Uso:
//   node --experimental-strip-types scripts/generateTags.mjs --limit 50   (smoke test)
//   node --experimental-strip-types scripts/generateTags.mjs              (todos os itens sem tag)
//   node --experimental-strip-types scripts/generateTags.mjs --source "Fotos locais"
//   node --experimental-strip-types scripts/generateTags.mjs --source "Fotos locais" --force   (reclassifica mesmo quem já tem tag)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { AutoTokenizer, CLIPTextModelWithProjection } from '@huggingface/transformers'
import { createClient } from '@supabase/supabase-js'
import { CLIP_MODEL_ID } from '../src/domains/embedding/ClipEmbeddingProvider.ts'
import { TAG_CATEGORIES } from '../src/domains/catalog/tagTaxonomy.ts'
import { classifyCategory } from '../src/domains/catalog/tagClassifier.ts'
import { resolveTipoTag } from '../src/domains/catalog/classifyTipoByPrototype.ts'

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
    sourceName: get('--source'),
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

async function embed(tokenizer, textModel, text) {
  const inputs = tokenizer([text], { padding: true, truncation: true })
  const { text_embeds } = await textModel(inputs)
  const v = Array.from(text_embeds.data)
  const norm = Math.hypot(...v) || 1
  return v.map((x) => x / norm)
}

async function main() {
  const { limit, sourceName, force } = parseArgs()
  const env = loadEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const tipoPrototypes = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/domains/catalog/tipoPrototypes.json'), 'utf8'),
  )

  console.log('Carregando modelo de texto CLIP...')
  const tokenizer = await AutoTokenizer.from_pretrained(CLIP_MODEL_ID)
  const textModel = await CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID, { dtype: 'fp32' })

  console.log('Pré-calculando embeddings dos rótulos candidatos...')
  const labelEmbeddingsByCategory = {}
  for (const [catName, catDef] of Object.entries(TAG_CATEGORIES)) {
    labelEmbeddingsByCategory[catName] = await Promise.all(
      catDef.labels.map(([, enLabel]) => embed(tokenizer, textModel, enLabel)),
    )
  }
  console.log('Rótulos prontos.\n')

  let sourceId = null
  if (sourceName) {
    const { data: source } = await supabase.from('sources').select('id').eq('name', sourceName).maybeSingle()
    if (!source) throw new Error(`Fonte "${sourceName}" não encontrada.`)
    sourceId = source.id
  }

  // Supabase/PostgREST limita a 1000 linhas por request por padrão —
  // sem paginar, um catálogo de ~28 mil itens ficava truncado nos
  // primeiros 1000 silenciosamente (achado rodando de verdade).
  const items = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from('catalog_items')
      .select('id, embedding, metadata, tags')
      .not('embedding', 'is', null)
      .range(from, from + pageSize - 1)
    if (sourceId) query = query.eq('source_id', sourceId)
    const { data, error } = await query
    if (error) throw new Error('Falha buscando itens: ' + error.message)
    items.push(...data)
    console.log(`  buscando itens... ${items.length}`)
    if (data.length < pageSize) break
    if (limit && items.length >= limit) break
  }
  const targetItems = limit ? items.slice(0, limit) : items
  console.log(
    `Classificando ${targetItems.length} itens${force ? ' (--force: reclassificando mesmo quem já tem tag)' : ''}...`,
  )

  let processed = 0
  let skipped = 0
  for (const item of targetItems) {
    // Já classificado (rodada anterior) — pula, não reprocessa à toa,
    // a não ser que --force peça reclassificação (ex.: corrigindo uma
    // regra que gerou tag errada antes).
    if (!force && item.tags && item.tags.length > 0) {
      skipped++
      continue
    }

    const embedding = typeof item.embedding === 'string' ? JSON.parse(item.embedding) : item.embedding

    const tags = []
    const tipo = resolveTipoTag(embedding, tipoPrototypes, item.metadata?.category)
    if (tipo) tags.push(tipo)
    for (const [catName, catDef] of Object.entries(TAG_CATEGORIES)) {
      if (catDef.onlyIfHasTag && !tags.includes(catDef.onlyIfHasTag)) continue
      tags.push(...classifyCategory(embedding, catDef, labelEmbeddingsByCategory[catName]))
    }

    const { error: updateError } = await supabase.from('catalog_items').update({ tags }).eq('id', item.id)
    if (updateError) {
      console.log(`Erro salvando item ${item.id}: ${updateError.message}`)
    }

    processed++
    if (processed % 200 === 0 || processed + skipped === targetItems.length) {
      console.log(`  ${processed} classificados, ${skipped} já feitos antes (de ${targetItems.length} total)`)
    }
  }

  console.log('\n=== FIM ===')
  console.log('Itens classificados nesta rodada:', processed)
  console.log('Já estavam classificados (pulados):', skipped)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
