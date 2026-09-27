// Gera os protótipos de "espelho" e "quadro" a partir de exemplos
// REAIS do catálogo, confirmados visualmente (por Claude, olhando cada
// foto uma por uma) — não são rótulos de texto genéricos tipo "a
// mirror". Achado real: comparar contra uma frase em inglês (CLIP
// zero-shot) tinha margem de separação de só 0.01–0.03 entre
// quadro/espelho/escultura (praticamente ruído) — comparar contra a
// MÉDIA de embeddings de fotos reais confirmadas separa muito melhor
// (margem de 0.05–0.12 na validação cruzada com os próprios exemplos).
//
// Uso: node --experimental-strip-types scripts/generateTipoPrototypes.mjs
//
// Pra adicionar mais exemplos confirmados no futuro: olhe a foto de
// verdade (não confie só numa tag ou no nome do produto), pegue o id
// em catalog_items, e acrescente na lista correspondente abaixo.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// Confirmados visualmente em 27/09 — ver conversa/DIRETRIZES.md.
const MIRROR_IDS = [
  'ec8e1e80-a698-4a15-b745-5606b9f9169e', // STAR
  '0d759cfd-9f21-49ae-b300-12b364d2c796', // LEAF
  'fb48c59e-8f06-49f2-8734-2af57ccf42d9', // AURORA
  '3ee64fe4-22ba-4ad6-82ea-082f578ed22f', // ECO
  '684c6684-cd81-492e-aa23-94ac1a20ce08', // Round (lamina Wengue)
  'f5440ac4-5d86-4762-9060-7e16791ec197', // Round Black Wood
  'e68d9b05-b4a5-4067-bc0b-7c73b5c71c8f', // ORGANIC
  'd944c15b-4d4c-417e-bccb-ecc529b98a00', // ROUND BAMBU
  'ca772e0e-c1c0-47ce-a14f-2209ab10d7c2', // WING
  '2949d864-c005-47b6-9fba-f7ea96f51fde', // KALEIDOSCOPE
  'b524ca9e-871c-40bd-9dab-5777d931cf8f', // BOLD
  'ed8b6d2a-1bde-4601-9ce1-4cf955b4b0e6', // SÉRIE MINERAL
]

const PAINTING_IDS = [
  '9e4cd0c6-5430-48b6-8846-c2e4f1006380', // JARDIM DE CASA
  '549ffa22-c9ce-441a-96ae-df2d94227223', // NUANCES
  '3975456a-dfff-4f2b-acb7-2df565c8b5c1', // HORIZONTE
  'b1c7813d-5472-4d05-9cdb-620ff71a6392', // COMPOSIÇÃO
  '42e96090-dbde-4d75-9921-421b8d1c59ec', // ARTSY
  'a103747a-4062-4cec-a4d1-050951c60adc', // JUST SOME NOTES TO REMEMBER
  'b2782f06-da96-4f7f-86d7-e7df79b3cfa6', // FIT
  // Achado testando em produção: a linha "WAVES" (escultura de madeira
  // ondulada) e "TYPES" (placa de texto/letreiro) puxavam pra
  // "espelho" por engano (superfície lisa/brilhosa confundia o
  // protótipo) — confirmei visualmente que NENHUMA das duas é espelho.
  // Não são "quadro" no sentido literal, mas entram aqui como exemplo
  // de "não é espelho" pra puxar a fronteira de decisão pra longe
  // desse estilo. Amostra pequena de cada linha (não todos os itens),
  // pra não dominar a média sobre os quadros de verdade.
  '164bd177-d103-462c-a13e-1fca140cdc9e', // WAVES (pior caso, margem +0.06 pra espelho)
  'c1d199c9-121a-40b4-9318-5bf9e47ae31f', // WAVES
  'ba53ac97-8aa4-444f-b765-b15efb4c3815', // WAVES
  '29844f6c-9771-4840-9ee9-ce86e7bcb1da', // Types
  '5f7685dc-789f-447d-abe0-a8f9a40f674c', // TYPES
  '3a8463ea-fb5d-4fb1-ba49-d2c07af18ab6', // TYPES
]

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

function average(vectors) {
  const dim = vectors[0].length
  const avg = new Array(dim).fill(0)
  for (const v of vectors) for (let i = 0; i < dim; i++) avg[i] += v[i] / vectors.length
  const norm = Math.hypot(...avg) || 1
  return avg.map((x) => x / norm)
}

async function main() {
  const env = loadEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  async function fetchEmbeddings(ids) {
    const { data, error } = await supabase.from('catalog_items').select('id, embedding').in('id', ids)
    if (error) throw new Error(error.message)
    return ids.map((id) => {
      const row = data.find((d) => d.id === id)
      if (!row) throw new Error(`Item ${id} não encontrado — foi apagado?`)
      return typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding
    })
  }

  const mirrorEmbeddings = await fetchEmbeddings(MIRROR_IDS)
  const paintingEmbeddings = await fetchEmbeddings(PAINTING_IDS)

  const result = {
    espelho: average(mirrorEmbeddings),
    quadro: average(paintingEmbeddings),
  }

  const outPath = path.join(ROOT, 'src/domains/catalog/tipoPrototypes.json')
  fs.writeFileSync(outPath, JSON.stringify(result))
  console.log(`Protótipos gerados a partir de ${MIRROR_IDS.length} espelhos + ${PAINTING_IDS.length} quadros confirmados.`)
  console.log('Salvo em', outPath)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
