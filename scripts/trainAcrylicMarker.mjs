// Treina o "marcador visual" de acrílico: uma regressão logística sobre os
// embeddings CLIP (512 dimensões), com a tag `acrilico` (regra objetiva em
// src/domains/catalog/acrylicRule.ts) como rótulo.
//
// SOMENTE LEITURA no banco (SELECT de id/title/embedding/tags). Nada é gravado
// no Supabase e nenhum dado sai da máquina; a única saída é um arquivo pequeno
// com os pesos (512 números + viés) e um resumo da avaliação.
//
// Uso: node scripts/trainAcrylicMarker.mjs [--out caminho.json]
// (sem --out, regrava src/domains/catalog/acrylicMarker.json — o arquivo usado pelo app)
// Requer .env.local com VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const DIM = 512
const TAG = 'acrilico'

function loadEnv() {
  const env = {}
  for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=')
    if (i > 0 && !line.trim().startsWith('#')) env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, '')
  }
  return env
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : fallback
}

// Mulberry32 — sorteio reprodutível.
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

async function fetchAll(supabase) {
  // Paginação por chave (id > último lido): o OFFSET ficava mais lento a cada
  // página e estourava o statement_timeout por volta de 12 mil itens.
  const rows = []
  const pageSize = 500
  let lastId = null
  for (;;) {
    let query = supabase
      .from('catalog_items')
      .select('id, title, embedding, tags')
      .not('embedding', 'is', null)
      .order('id')
      .limit(pageSize)
    if (lastId) query = query.gt('id', lastId)
    let data = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await query
      if (!res.error) {
        data = res.data
        break
      }
      if (attempt === 3) throw new Error('Falha lendo itens: ' + res.error.message)
      await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
    rows.push(...data)
    if (rows.length % 5000 < pageSize) console.log(`lendo itens... ${rows.length}`)
    if (data.length < pageSize) break
    lastId = data[data.length - 1].id
  }
  console.log(`itens lidos: ${rows.length}`)
  return rows
}

function auc(scores, labels) {
  const idx = scores.map((_, i) => i).sort((a, b) => scores[a] - scores[b])
  let rankSum = 0
  let pos = 0
  for (let r = 0; r < idx.length; r++) {
    if (labels[idx[r]] === 1) {
      rankSum += r + 1
      pos++
    }
  }
  const neg = idx.length - pos
  return (rankSum - (pos * (pos + 1)) / 2) / (pos * neg)
}

async function main() {
  const env = loadEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
  const rows = await fetchAll(supabase)
  const n = rows.length
  const X = new Float32Array(n * DIM)
  const y = new Uint8Array(n)
  const group = new Array(n)
  for (let i = 0; i < n; i++) {
    const e = typeof rows[i].embedding === 'string' ? JSON.parse(rows[i].embedding) : rows[i].embedding
    for (let d = 0; d < DIM; d++) X[i * DIM + d] = e[d]
    y[i] = (rows[i].tags ?? []).includes(TAG) ? 1 : 0
    // Mesmo produto em tamanhos/versões diferentes (LN1188A-1515-AC, -3030-AC...)
    // tem de cair do mesmo lado da divisão, senão o teste fica otimista.
    group[i] = String(rows[i].title ?? rows[i].id).split('-')[0].toUpperCase()
  }
  const totalPos = y.reduce((a, b) => a + b, 0)
  console.log(`itens: ${n} | acrílicos: ${totalPos} | outros: ${n - totalPos}`)

  // Divisão 80/20 por grupo (produto-base).
  const rand = rng(42)
  const groupSide = new Map()
  for (const g of group) if (!groupSide.has(g)) groupSide.set(g, rand() < 0.2 ? 'teste' : 'treino')
  const train = []
  const test = []
  for (let i = 0; i < n; i++) (groupSide.get(group[i]) === 'teste' ? test : train).push(i)
  console.log(`treino: ${train.length} | teste: ${test.length} | produtos-base: ${groupSide.size}`)

  // Padronização (z-score) calculada só no treino.
  const mu = new Float64Array(DIM)
  const sd = new Float64Array(DIM)
  for (const i of train) for (let d = 0; d < DIM; d++) mu[d] += X[i * DIM + d]
  for (let d = 0; d < DIM; d++) mu[d] /= train.length
  for (const i of train) for (let d = 0; d < DIM; d++) sd[d] += (X[i * DIM + d] - mu[d]) ** 2
  for (let d = 0; d < DIM; d++) sd[d] = Math.sqrt(sd[d] / train.length) || 1

  // Regressão logística (Adam), classes balanceadas por peso.
  const w = new Float64Array(DIM)
  let b = 0
  const m1 = new Float64Array(DIM)
  const v1 = new Float64Array(DIM)
  let mb = 0
  let vb = 0
  const trainPos = train.filter((i) => y[i] === 1).length
  const wPos = train.length / (2 * trainPos)
  const wNeg = train.length / (2 * (train.length - trainPos))
  const lr = 0.01
  const l2 = 1e-4
  const epochs = Number(arg('--epochs', 30))
  const batch = 512
  let step = 0
  const order = train.slice()
  for (let ep = 0; ep < epochs; ep++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    let loss = 0
    for (let s = 0; s < order.length; s += batch) {
      const gw = new Float64Array(DIM)
      let gb = 0
      const end = Math.min(s + batch, order.length)
      for (let k = s; k < end; k++) {
        const i = order[k]
        let z = b
        for (let d = 0; d < DIM; d++) z += w[d] * ((X[i * DIM + d] - mu[d]) / sd[d])
        const p = 1 / (1 + Math.exp(-z))
        const cw = y[i] === 1 ? wPos : wNeg
        const err = (p - y[i]) * cw
        loss += -cw * (y[i] === 1 ? Math.log(p + 1e-12) : Math.log(1 - p + 1e-12))
        for (let d = 0; d < DIM; d++) gw[d] += err * ((X[i * DIM + d] - mu[d]) / sd[d])
        gb += err
      }
      const size = end - s
      step++
      const c1 = 1 - 0.9 ** step
      const c2 = 1 - 0.999 ** step
      for (let d = 0; d < DIM; d++) {
        const g = gw[d] / size + l2 * w[d]
        m1[d] = 0.9 * m1[d] + 0.1 * g
        v1[d] = 0.999 * v1[d] + 0.001 * g * g
        w[d] -= (lr * (m1[d] / c1)) / (Math.sqrt(v1[d] / c2) + 1e-8)
      }
      const g = gb / size
      mb = 0.9 * mb + 0.1 * g
      vb = 0.999 * vb + 0.001 * g * g
      b -= (lr * (mb / c1)) / (Math.sqrt(vb / c2) + 1e-8)
    }
    if (ep % 5 === 4 || ep === epochs - 1) console.log(`época ${ep + 1}/${epochs} | perda média ${(loss / order.length).toFixed(4)}`)
  }

  // Pesos para o espaço original: z = Σ w_d (x_d - mu_d)/sd_d + b
  const wRaw = Array.from(w, (wd, d) => wd / sd[d])
  const bRaw = b - Array.from(w).reduce((a, wd, d) => a + (wd * mu[d]) / sd[d], 0)
  const score = (i) => {
    let z = bRaw
    for (let d = 0; d < DIM; d++) z += wRaw[d] * X[i * DIM + d]
    return z
  }

  const ts = test.map(score)
  const tl = test.map((i) => y[i])
  const testPos = tl.reduce((a, c) => a + c, 0)
  console.log(`\nTESTE (produtos que o modelo nunca viu): ${test.length} itens, ${testPos} acrílicos`)
  console.log(`AUC: ${auc(ts, tl).toFixed(4)}`)
  console.log('limiar(prob) | recall | precisão | falsos positivos')
  const rows2 = []
  for (const t of [0.5, 0.6, 0.7, 0.8, 0.9, 0.95]) {
    const zt = Math.log(t / (1 - t))
    let tp = 0
    let fp = 0
    for (let k = 0; k < ts.length; k++) {
      if (ts[k] >= zt) tl[k] === 1 ? tp++ : fp++
    }
    const rec = tp / testPos
    const prec = tp + fp ? tp / (tp + fp) : 0
    rows2.push({ limiar: t, recall: +rec.toFixed(3), precisao: +prec.toFixed(3), falsos_positivos: fp })
    console.log(`${t.toFixed(2)}         | ${(rec * 100).toFixed(1)}% | ${(prec * 100).toFixed(1)}% | ${fp}`)
  }

  const out = arg('--out', path.join(ROOT, 'src/domains/catalog/acrylicMarker.json'))
  fs.writeFileSync(
    out,
    JSON.stringify({
      note: 'Regressão logística sobre embedding CLIP (512). prob = 1/(1+exp(-(b + w·x))). Gerado por scripts/trainAcrylicMarker.mjs',
      b: +bRaw.toFixed(6),
      w: wRaw.map((x) => +x.toFixed(6)),
      avaliacao: { auc: +auc(ts, tl).toFixed(4), teste_itens: test.length, teste_acrilicos: testPos, limiares: rows2 },
    }),
  )
  console.log(`\npesos gravados em ${out}`)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
