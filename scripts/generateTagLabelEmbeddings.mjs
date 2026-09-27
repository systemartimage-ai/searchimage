// Pré-computa os embeddings (CLIP, modelo de texto) de todos os
// rótulos em inglês da taxonomia (tagTaxonomy.ts) e salva em
// src/domains/catalog/tagLabelEmbeddings.json — um asset estático que
// o navegador importa direto, sem precisar carregar o modelo de texto
// CLIP durante a busca por imagem (que hoje só usa o modelo de
// imagem). Usado pra classificar a FOTO de busca com as mesmas tags
// estruturadas do catálogo (ver useImageSearch.ts).
//
// Reexecutar sempre que tagTaxonomy.ts mudar (rótulo novo/removido) —
// senão o JSON fica com rótulos fora de ordem/desatualizados em
// relação à taxonomia (a ordem dos embeddings por categoria precisa
// bater 1:1 com `TAG_CATEGORIES[categoria].labels`).
//
// Uso: node --experimental-strip-types scripts/generateTagLabelEmbeddings.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { AutoTokenizer, CLIPTextModelWithProjection } from '@huggingface/transformers'
import { CLIP_MODEL_ID } from '../src/domains/embedding/ClipEmbeddingProvider.ts'
import { TAG_CATEGORIES } from '../src/domains/catalog/tagTaxonomy.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT_PATH = path.join(ROOT, 'src/domains/catalog/tagLabelEmbeddings.json')

function round(v) {
  return Math.round(v * 1e6) / 1e6
}

async function embed(tokenizer, textModel, text) {
  const inputs = tokenizer([text], { padding: true, truncation: true })
  const { text_embeds } = await textModel(inputs)
  const v = Array.from(text_embeds.data)
  const norm = Math.hypot(...v) || 1
  return v.map((x) => round(x / norm))
}

async function main() {
  console.log('Carregando modelo de texto CLIP...')
  const tokenizer = await AutoTokenizer.from_pretrained(CLIP_MODEL_ID)
  const textModel = await CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID, { dtype: 'fp32' })

  const result = {}
  for (const [catName, catDef] of Object.entries(TAG_CATEGORIES)) {
    console.log(`Embedando categoria "${catName}" (${catDef.labels.length} rótulos)...`)
    result[catName] = await Promise.all(
      catDef.labels.map(([, enLabel]) => embed(tokenizer, textModel, enLabel)),
    )
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(result))
  console.log('Salvo em', OUT_PATH)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
