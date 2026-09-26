// Indexador real do catálogo (Fase 5). Roda como script Node isolado
// (nunca no navegador) porque usa SUPABASE_SERVICE_ROLE_KEY.
//
// Fluxo: login manual (janela visível, sessão salva localmente e
// apagada ao final) → paginar as 4 categorias reais → extrair
// título/código/categoria/imagem (mesmos seletores já validados em
// DIRETRIZES.md) → gerar embedding real (ClipEmbeddingProvider) →
// upsert em catalog_items, associado a um index_versions com
// status='BUILDING'.
//
// Checkpoint: grava progresso em .indexer-checkpoint.json (gitignored)
// a cada página processada, pra poder retomar sem reprocessar tudo se
// o processo cair no meio (~7.000 itens não termina em segundos).
//
// Uso:
//   node scripts/indexCatalog.mjs                  # roda tudo
//   node scripts/indexCatalog.mjs --limit-pages 2   # smoke test (2 páginas/categoria)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { ClipEmbeddingProvider } from '../src/domains/embedding/ClipEmbeddingProvider.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const STATE_PATH = path.join(ROOT, '.indexer-session.json')
const CHECKPOINT_PATH = path.join(ROOT, '.indexer-checkpoint.json')

const CATEGORIES = [
  { slug: 'art-gallery', label: 'Quadros', maxPage: 157 },
  { slug: 'collectibles', label: 'Colecionáveis', maxPage: 37 },
  { slug: 'artsy', label: 'Artsy', maxPage: 55 },
  { slug: 'mirror-design', label: 'Espelhos', maxPage: 4 },
]

const args = process.argv.slice(2)
const limitPagesArg = args.indexOf('--limit-pages')
const LIMIT_PAGES = limitPagesArg !== -1 ? Number(args[limitPagesArg + 1]) : null

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

function loadCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_PATH)) return { indexVersionId: null, done: {} }
  return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf8'))
}

function saveCheckpoint(checkpoint) {
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2))
}

async function ensureLoggedInSession() {
  if (fs.existsSync(STATE_PATH)) {
    console.log('Sessão salva encontrada, reaproveitando (sem novo login).')
    return
  }
  console.log('Nenhuma sessão salva. Abrindo janela pra login manual...')
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('https://artimage.com.br/login')
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 5 * 60 * 1000 })
  await context.storageState({ path: STATE_PATH })
  console.log('Login ok, sessão salva.')
  await browser.close()
}

async function ensureIndexVersion(supabase, sourceId, checkpoint) {
  if (checkpoint.indexVersionId) {
    const { data } = await supabase
      .from('index_versions')
      .select('*')
      .eq('id', checkpoint.indexVersionId)
      .single()
    if (data && data.status === 'BUILDING') {
      console.log('Retomando index_version existente:', data.id)
      return data.id
    }
  }
  const { data, error } = await supabase
    .from('index_versions')
    .insert({
      source_id: sourceId,
      status: 'BUILDING',
      embedding_model: 'Xenova/clip-vit-base-patch32',
      vector_dimension: 512,
    })
    .select()
    .single()
  if (error) throw new Error('Falha criando index_version: ' + error.message)
  console.log('index_version nova criada:', data.id)
  checkpoint.indexVersionId = data.id
  saveCheckpoint(checkpoint)
  return data.id
}

async function extractCategoryPage(browserPage, slug, pageNumber) {
  const url = `https://artimage.com.br/produtos/${slug}?grid=mini&page=${pageNumber}&order=1`
  // 'networkidle' trava nesse site (tráfego de fundo/analytics nunca
  // fica ocioso) — 'domcontentloaded' + esperar o seletor real dos
  // itens é suficiente e confirmado por teste manual (~8.6s/página).
  await browserPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await browserPage.waitForSelector('.item-wrapper', { timeout: 15000 })
  return browserPage.$$eval('.item-wrapper', (nodes) =>
    nodes.map((node) => {
      const a = node.querySelector('a[href*="detalhe"]')
      const item = node.querySelector('.item[data-item]')
      const img = node.querySelector('.item-image img')
      const title = node.querySelector('.item-title')
      const code = node.querySelector('.item-code')
      return {
        detailUrl: a ? a.getAttribute('href') : null,
        id: item ? item.getAttribute('data-item') : null,
        imageUrl: img ? img.getAttribute('src') : null,
        title: title ? title.textContent.trim() : null,
        code: code ? code.textContent.trim() : null,
      }
    }),
  )
}

async function main() {
  const env = loadEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const checkpoint = loadCheckpoint()

  const { data: source, error: sourceError } = await supabase
    .from('sources')
    .select('*')
    .eq('base_url', 'https://artimage.com.br')
    .single()
  if (sourceError) throw new Error('Fonte não encontrada: ' + sourceError.message)

  const indexVersionId = await ensureIndexVersion(supabase, source.id, checkpoint)

  await ensureLoggedInSession()

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ storageState: STATE_PATH })
  let browserPage = await context.newPage()

  const provider = new ClipEmbeddingProvider()

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  let totalProcessed = 0
  let totalSkipped = 0
  let totalErrors = 0
  let totalEmbedMs = 0

  for (const cat of CATEGORIES) {
    const maxPage = LIMIT_PAGES ? Math.min(LIMIT_PAGES, cat.maxPage) : cat.maxPage
    checkpoint.done[cat.slug] = checkpoint.done[cat.slug] || []

    for (let pageNumber = 1; pageNumber <= maxPage; pageNumber++) {
      if (checkpoint.done[cat.slug].includes(pageNumber)) {
        console.log(`[${cat.slug}] página ${pageNumber}/${maxPage} já feita, pulando.`)
        continue
      }

      let items = null
      let lastErr = null
      // Uma página que falha deixa às vezes a mesma aba num estado
      // travado, e cada goto() seguinte falha em cascata ("interrupted
      // by another navigation"). Por isso: até 3 tentativas com pausa,
      // e se todas falharem, descarta a aba e abre uma nova antes de
      // seguir — evita que um problema de rede pontual derrube o resto
      // da execução inteira.
      for (let attempt = 1; attempt <= 3 && !items; attempt++) {
        try {
          items = await extractCategoryPage(browserPage, cat.slug, pageNumber)
        } catch (err) {
          lastErr = err
          console.log(
            `[${cat.slug}] página ${pageNumber}: tentativa ${attempt}/3 falhou (${err.message.split('\n')[0]}).`,
          )
          await sleep(3000)
        }
      }

      if (!items) {
        console.log(`[${cat.slug}] página ${pageNumber}: desistindo após 3 tentativas (${lastErr?.message.split('\n')[0]}), abrindo aba nova e seguindo.`)
        totalErrors++
        await browserPage.close().catch(() => {})
        browserPage = await context.newPage()
        continue
      }

      let pageHadError = false

      for (const p of items) {
        if (!p.id || !p.imageUrl || !p.title || !p.code) {
          totalSkipped++
          continue
        }
        try {
          const t0 = Date.now()
          let blob = null
          for (let attempt = 1; attempt <= 2 && !blob; attempt++) {
            try {
              const res = await fetch(p.imageUrl)
              blob = await res.blob()
            } catch (fetchErr) {
              if (attempt === 2) throw fetchErr
              await sleep(2000)
            }
          }
          const embedding = await provider.embedImage(blob)
          const embedMs = Date.now() - t0

          const row = {
            source_id: source.id,
            index_version_id: indexVersionId,
            external_id: p.id,
            title: p.title,
            page_url: p.detailUrl,
            image_url: p.imageUrl,
            metadata: { code: p.code, category: cat.label },
            embedding,
            active: true,
          }

          // upsert manual: o índice único de (source_id, external_id) é
          // parcial (where external_id is not null), e o PostgREST não
          // consegue usar índice parcial como alvo de ON CONFLICT — por
          // isso select-then-insert/update em vez de .upsert().
          const { data: existing } = await supabase
            .from('catalog_items')
            .select('id')
            .eq('source_id', source.id)
            .eq('external_id', p.id)
            .maybeSingle()

          const { error: writeError } = existing
            ? await supabase.from('catalog_items').update(row).eq('id', existing.id)
            : await supabase.from('catalog_items').insert(row)

          if (writeError) {
            console.log(`[${cat.slug}] item ${p.id} (${p.code}): erro no ${existing ? 'update' : 'insert'} — ${writeError.message}`)
            totalErrors++
            pageHadError = true
          } else {
            totalProcessed++
            totalEmbedMs += embedMs
          }
        } catch (err) {
          console.log(`[${cat.slug}] item ${p.id} (${p.code}): erro — ${err.message}`)
          totalErrors++
          pageHadError = true
        }
      }

      // Só marca a página como "feita" se todos os itens foram
      // gravados sem erro — senão o resume pularia página com item
      // não salvo (checkpoint é sobre dado persistido, não sobre
      // página só visitada).
      if (!pageHadError) {
        checkpoint.done[cat.slug].push(pageNumber)
        saveCheckpoint(checkpoint)
      }
      console.log(
        `[${cat.slug}] página ${pageNumber}/${maxPage} ${pageHadError ? 'COM ERRO (não marcada como feita)' : 'ok'} (${items.length} itens). Total processado: ${totalProcessed}, pulados: ${totalSkipped}, erros: ${totalErrors}`,
      )
    }
  }

  await browser.close()

  console.log('\n=== FIM ===')
  console.log('Total processado:', totalProcessed)
  console.log('Total pulado (dado incompleto):', totalSkipped)
  console.log('Total erros:', totalErrors)
  if (totalProcessed > 0) {
    const avgMs = totalEmbedMs / totalProcessed
    console.log(`Tempo médio por item (download + embedding): ${avgMs.toFixed(0)}ms`)
    console.log(`Projeção pro catálogo inteiro (~7084 itens): ${((avgMs * 7084) / 1000 / 60).toFixed(1)} min`)
  }
  console.log('index_version_id (ainda BUILDING, não promovida):', indexVersionId)
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
