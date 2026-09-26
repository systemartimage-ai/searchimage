// Sobe fotos de uma pasta local pro Supabase como uma fonte própria
// e permanente (separada do catálogo do site) — gera uma versão leve
// (WebP, redimensionada) de cada imagem, calcula o embedding real
// (CLIP local) e grava em catalog_items. Rodar quantas vezes precisar
// (uma por pasta); todas acumulam na MESMA source/index_version
// enquanto ela não for promovida — promoção é manual (--promote),
// pra dar tempo de subir várias pastas antes de ir ao ar.
//
// Deduplicação: antes de processar qualquer arquivo, busca no banco
// TODOS os external_id já gravados dessa fonte (paginado) e monta um
// mapa em memória. Arquivo cujo nome já está nesse mapa nem é aberto —
// zero custo (sem reprocessar, sem re-upload). A fonte de verdade é o
// banco, não um checkpoint local (funciona mesmo trocando de máquina).
//
// Uso:
//   node --experimental-strip-types scripts/uploadLocalPhotos.mjs --folder "C:/Fotos/Produto1" --label "Fotos locais"
//   node --experimental-strip-types scripts/uploadLocalPhotos.mjs --folder "C:/Fotos/Produto2" --label "Fotos locais" --promote
//   node --experimental-strip-types scripts/uploadLocalPhotos.mjs --folder "..." --label "..." --no-recursive
//   node --experimental-strip-types scripts/uploadLocalPhotos.mjs --folder "..." --label "..." --limit-files 20
//   node --experimental-strip-types scripts/uploadLocalPhotos.mjs --folder "..." --label "..." --max-dimension 400 --quality 70

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { ClipEmbeddingProvider } from '../src/domains/embedding/ClipEmbeddingProvider.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BUCKET = 'catalog-thumbnails'
const ACCEPTED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const STORAGE_FREE_TIER_BYTES = 1 * 1024 * 1024 * 1024 // 1GB (Supabase free tier, Storage)
const MAX_CONSECUTIVE_UPLOAD_ERRORS = 5

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : null
  }
  const folder = get('--folder')
  const label = get('--label')
  if (!folder || !label) {
    console.error(
      'Uso: --folder <pasta> --label <nome da fonte> [--no-recursive] [--limit-files N] [--promote] [--max-dimension N] [--quality N]',
    )
    process.exit(1)
  }
  return {
    folder: path.resolve(folder),
    label,
    recursive: !args.includes('--no-recursive'),
    limitFiles: get('--limit-files') ? Number(get('--limit-files')) : null,
    promote: args.includes('--promote'),
    // Padrão bem agressivo de propósito: são fotos de produto pra
    // busca por similaridade, não pra ampliar em tela cheia — 480px/
    // qualidade 72 já fica visualmente bom em card pequeno e ocupa
    // uma fração do tamanho de qualidade 82/640px.
    maxDimension: get('--max-dimension') ? Number(get('--max-dimension')) : 480,
    quality: get('--quality') ? Number(get('--quality')) : 72,
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

function* walkFiles(dir, recursive, rootLabel) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (recursive) yield* walkFiles(full, recursive, rootLabel)
    } else {
      const ext = path.extname(entry.name).toLowerCase()
      if (ACCEPTED_EXT.has(ext)) {
        const relative = path.relative(rootLabel, full).split(path.sep).join('/')
        yield { fullPath: full, relativePath: relative }
      }
    }
  }
}

async function ensureSource(supabase, label) {
  const { data: existing } = await supabase.from('sources').select('*').eq('name', label).maybeSingle()
  if (existing) return existing

  const { data, error } = await supabase
    .from('sources')
    .insert({ name: label, type: 'local-directory', base_url: 'local://' + label, enabled: true })
    .select()
    .single()
  if (error) throw new Error('Falha criando source: ' + error.message)
  return data
}

async function ensureIndexVersion(supabase, sourceId) {
  const { data: existing } = await supabase
    .from('index_versions')
    .select('id')
    .eq('source_id', sourceId)
    .eq('status', 'BUILDING')
    .maybeSingle()
  if (existing) return existing.id

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
  return data.id
}

/** Busca TODOS os external_id já gravados dessa fonte, paginado (evita o limite de linhas por request). */
async function fetchExistingExternalIds(supabase, sourceId) {
  const ids = new Set()
  const pageSize = 1000
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('external_id')
      .eq('source_id', sourceId)
      .range(from, from + pageSize - 1)
    if (error) throw new Error('Falha buscando itens existentes: ' + error.message)
    for (const row of data) ids.add(row.external_id)
    if (data.length < pageSize) break
    from += pageSize
  }
  return ids
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function main() {
  const { folder, label, recursive, limitFiles, promote, maxDimension, quality } = parseArgs()
  const env = loadEnv()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const source = await ensureSource(supabase, label)
  const indexVersionId = await ensureIndexVersion(supabase, source.id)

  console.log('Mapeando arquivos já existentes no banco para essa fonte...')
  const existingIds = await fetchExistingExternalIds(supabase, source.id)
  console.log(`${existingIds.size} já estavam no banco antes de começar.`)

  const provider = new ClipEmbeddingProvider()

  let allFiles = Array.from(walkFiles(folder, recursive, folder)).map(({ fullPath, relativePath }) => ({
    fullPath,
    relativePath,
    externalId: `${path.basename(folder)}::${relativePath}`,
  }))
  console.log(`Encontrados ${allFiles.length} arquivos em "${folder}" (recursivo: ${recursive}).`)

  const newFiles = allFiles.filter((f) => !existingIds.has(f.externalId))
  const alreadyThere = allFiles.length - newFiles.length
  console.log(`${alreadyThere} já estavam gravados (pulados sem reprocessar) — ${newFiles.length} novos a processar.`)

  const filesToProcess = limitFiles ? newFiles.slice(0, limitFiles) : newFiles

  let processed = 0
  let errors = 0
  let consecutiveUploadErrors = 0
  let totalBytesUploaded = 0

  for (const { fullPath, relativePath, externalId } of filesToProcess) {
    try {
      const original = fs.readFileSync(fullPath)
      const resized = await sharp(original)
        .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer()

      const blob = new Blob([resized], { type: 'image/webp' })
      const embedding = await provider.embedImage(blob)

      const storagePath = `${source.id}/${externalId.replace(/[^a-zA-Z0-9/._-]+/g, '_')}.webp`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, resized, { contentType: 'image/webp', upsert: true })
      if (uploadError) {
        consecutiveUploadErrors++
        throw new Error('upload: ' + uploadError.message)
      }
      consecutiveUploadErrors = 0
      totalBytesUploaded += resized.length

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

      const { error: writeError } = await supabase.from('catalog_items').insert({
        source_id: source.id,
        index_version_id: indexVersionId,
        external_id: externalId,
        title: path.basename(relativePath, path.extname(relativePath)),
        page_url: null,
        image_url: publicUrlData.publicUrl,
        image_storage_path: storagePath,
        metadata: { relativePath },
        embedding,
        active: true,
      })
      if (writeError) throw new Error('gravação no banco: ' + writeError.message)

      processed++
      if (processed % 20 === 0 || processed === filesToProcess.length) {
        const avg = totalBytesUploaded / processed
        const projected = avg * newFiles.length
        console.log(
          `  ${processed}/${filesToProcess.length} | subiu ${formatBytes(totalBytesUploaded)} | ` +
            `média ${formatBytes(avg)}/foto | projeção pra essa pasta: ${formatBytes(projected)} ` +
            `(${((projected / STORAGE_FREE_TIER_BYTES) * 100).toFixed(1)}% do free tier de 1GB de Storage)`,
        )
      }
    } catch (err) {
      console.log(`Erro em "${relativePath}": ${err.message}`)
      errors++
      if (consecutiveUploadErrors >= MAX_CONSECUTIVE_UPLOAD_ERRORS) {
        console.log(
          `\n${MAX_CONSECUTIVE_UPLOAD_ERRORS} falhas de upload seguidas — parando aqui (provável cota de Storage ` +
            `estourada). O que já subiu está salvo; rode de novo depois pra continuar de onde parou.`,
        )
        break
      }
    }
  }

  console.log('\n=== FIM ===')
  console.log('Processados nesta rodada:', processed)
  console.log('Já estavam no banco (pulados sem reprocessar):', alreadyThere)
  console.log('Erros:', errors)
  console.log('Total enviado ao Storage nesta rodada:', formatBytes(totalBytesUploaded))
  console.log('source_id:', source.id, '| index_version_id:', indexVersionId, '(status: BUILDING)')

  if (promote) {
    const { error } = await supabase
      .from('index_versions')
      .update({ status: 'ACTIVE', activated_at: new Date().toISOString(), completed_at: new Date().toISOString() })
      .eq('id', indexVersionId)
    console.log(error ? 'Erro ao promover: ' + error.message : 'index_version promovida para ACTIVE.')
  } else {
    console.log(
      'Ainda BUILDING (não aparece na busca). Rode com --promote quando terminar de subir todas as pastas dessa fonte.',
    )
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
