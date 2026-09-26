// Gera tags estruturadas (tipo, tema, categoria/ambiente, cores,
// animal, moldura, formato) pra cada item já indexado — usando o
// embedding CLIP JÁ SALVO de cada item (nada de reprocessar imagem,
// baixar de novo, etc.). Classificação "zero-shot": embeda uma vez
// cada rótulo candidato (em inglês, mesmo motivo da busca por texto —
// CLIP entende inglês melhor), compara por similaridade de cosseno com
// o embedding do item, e guarda como tag (em português) os rótulos
// cuja similaridade passa do limiar da categoria.
//
// Uso:
//   node --experimental-strip-types scripts/generateTags.mjs --limit 50   (smoke test)
//   node --experimental-strip-types scripts/generateTags.mjs              (todos os itens)
//   node --experimental-strip-types scripts/generateTags.mjs --source "Fotos locais"

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { AutoTokenizer, CLIPTextModelWithProjection } from '@huggingface/transformers'
import { createClient } from '@supabase/supabase-js'
import { CLIP_MODEL_ID } from '../src/domains/embedding/ClipEmbeddingProvider.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// Cada categoria: rótulo em pt (o que vira tag), frase em inglês (o
// que é embedado — CLIP entende melhor), e o limiar mínimo de
// similaridade pra aceitar a tag (calibrado observando o teste real do
// leão: "a lion" bateu 0.295 contra um item que É um leão, e itens sem
// relação nenhuma ficam abaixo de ~0.20).
const CATEGORIES = {
  tipo: {
    threshold: 0.22,
    topN: 1,
    labels: [
      ['quadro', 'a painting or framed art print'],
      ['espelho', 'a mirror'],
      ['escultura', 'a sculpture or decorative object'],
    ],
  },
  tema: {
    threshold: 0.22,
    topN: 2,
    // "generic decorative art" compete como baseline — sem isso, o
    // CLIP sempre escolhe "a menos ruim" das opções, mesmo quando
    // nenhuma se aplica de verdade (só ranking relativo, não é uma
    // pergunta sim/não por rótulo).
    requireBeatsBaseline: 'nenhum',
    labels: [
      ['nenhum', 'generic decorative art with no specific theme'],
      ['floresta', 'forest theme'],
      ['praia', 'beach theme'],
      ['paisagem', 'landscape scenery'],
      ['abstrato', 'abstract art'],
      ['retrato', 'portrait'],
      ['natureza morta', 'still life'],
      ['urbano', 'urban city scene'],
      ['vida selvagem', 'wildlife photography'],
      ['preto e branco', 'black and white photography'],
      ['minimalista', 'minimalist design'],
      ['geometrico', 'geometric pattern'],
    ],
  },
  categoria: {
    threshold: 0.22,
    topN: 1,
    requireBeatsBaseline: 'nenhum',
    labels: [
      ['nenhum', 'generic decorative item with no specific room theme'],
      ['cozinha', 'kitchen themed art'],
      ['infantil', 'kids room art'],
      ['animais', 'animal themed art'],
      ['arquitetura', 'architecture photography'],
      ['contemporaneo', 'contemporary art'],
      ['fotografia', 'photography art'],
      ['rustico', 'rustic style'],
      ['natureza', 'nature themed art'],
      ['jardim', 'garden themed art'],
      ['carros', 'cars themed art'],
      ['cidades', 'cityscape art'],
    ],
  },
  cor: {
    threshold: 0.2,
    topN: 1,
    labels: [
      ['tons de azul', 'predominantly blue tones'],
      ['tons quentes', 'warm earthy tones'],
      ['preto e branco', 'black and white'],
      ['colorido', 'colorful and vibrant'],
      ['tons neutros', 'neutral beige tones'],
      ['tons verdes', 'green tones'],
      ['dourado', 'gold or metallic tones'],
    ],
  },
  animal: {
    threshold: 0.24,
    topN: 1,
    requireBeatsBaseline: 'sem animal',
    labels: [
      ['sem animal', 'no animal, not a photo of an animal'],
      ['leao', 'a lion'],
      ['tigre', 'a tiger'],
      ['girafa', 'a giraffe'],
      ['zebra', 'a zebra'],
      ['elefante', 'an elephant'],
      ['passaro', 'a bird'],
      ['cavalo', 'a horse'],
      ['cachorro', 'a dog'],
      ['gato', 'a cat'],
      ['peixe', 'a fish'],
    ],
  },
  moldura: {
    threshold: 0.22,
    topN: 1,
    requireBeatsBaseline: 'sem moldura',
    onlyIfHasTag: 'quadro',
    labels: [
      ['sem moldura', 'frameless canvas print'],
      ['moldura preta', 'black picture frame'],
      ['moldura de madeira', 'wooden picture frame'],
      ['moldura dourada', 'gold picture frame'],
    ],
  },
  formato_espelho: {
    threshold: 0.22,
    topN: 1,
    onlyIfHasTag: 'espelho',
    labels: [
      ['espelho redondo', 'a round mirror'],
      ['espelho organico', 'an organic irregular shaped mirror'],
      ['espelho retangular', 'a rectangular mirror'],
      ['espelho oval', 'an oval mirror'],
    ],
  },
}

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : null
  }
  return {
    limit: get('--limit') ? Number(get('--limit')) : null,
    sourceName: get('--source'),
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

function cosine(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

async function embed(tokenizer, textModel, text) {
  const inputs = tokenizer([text], { padding: true, truncation: true })
  const { text_embeds } = await textModel(inputs)
  const v = Array.from(text_embeds.data)
  const norm = Math.hypot(...v) || 1
  return v.map((x) => x / norm)
}

function classify(itemEmbedding, categoryDef, labelEmbeddings) {
  const scored = categoryDef.labels.map(([ptTag], i) => ({
    ptTag,
    score: cosine(itemEmbedding, labelEmbeddings[i]),
  }))
  scored.sort((a, b) => b.score - a.score)

  const baselineScore = categoryDef.requireBeatsBaseline
    ? (scored.find((s) => s.ptTag === categoryDef.requireBeatsBaseline)?.score ?? -1)
    : -1

  return scored
    .filter(
      (s) =>
        s.score >= categoryDef.threshold &&
        s.ptTag !== categoryDef.requireBeatsBaseline &&
        s.score > baselineScore,
    )
    .slice(0, categoryDef.topN)
    .map((s) => s.ptTag)
}

async function main() {
  const { limit, sourceName } = parseArgs()
  const env = loadEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  console.log('Carregando modelo de texto CLIP...')
  const tokenizer = await AutoTokenizer.from_pretrained(CLIP_MODEL_ID)
  const textModel = await CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID, { dtype: 'fp32' })

  console.log('Pré-calculando embeddings dos rótulos candidatos...')
  const labelEmbeddingsByCategory = {}
  for (const [catName, catDef] of Object.entries(CATEGORIES)) {
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

  let query = supabase.from('catalog_items').select('id, embedding, metadata').not('embedding', 'is', null)
  if (sourceId) query = query.eq('source_id', sourceId)
  if (limit) query = query.limit(limit)

  const { data: items, error } = await query
  if (error) throw new Error('Falha buscando itens: ' + error.message)
  console.log(`Classificando ${items.length} itens...`)

  let processed = 0
  for (const item of items) {
    const embedding = typeof item.embedding === 'string' ? JSON.parse(item.embedding) : item.embedding

    const tags = []
    for (const [catName, catDef] of Object.entries(CATEGORIES)) {
      if (catDef.onlyIfHasTag && !tags.includes(catDef.onlyIfHasTag)) continue
      tags.push(...classify(embedding, catDef, labelEmbeddingsByCategory[catName]))
    }

    const { error: updateError } = await supabase.from('catalog_items').update({ tags }).eq('id', item.id)
    if (updateError) {
      console.log(`Erro salvando item ${item.id}: ${updateError.message}`)
    }

    processed++
    if (processed % 20 === 0 || processed === items.length) {
      console.log(`  ${processed}/${items.length}`)
    }
  }

  console.log('\n=== FIM ===')
  console.log('Itens classificados:', processed)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
