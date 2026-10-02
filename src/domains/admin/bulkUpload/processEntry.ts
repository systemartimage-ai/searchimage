import { supabase } from '@/lib/supabase'
import { TAG_CATEGORIES } from '@/domains/catalog/tagTaxonomy'
import { classifyTags, type TagLabelEmbeddings } from '@/domains/catalog/tagClassifier'
import { resolveTipoTag, type TipoPrototypes } from '@/domains/catalog/classifyTipoByPrototype'
import { ACRYLIC_TAG, isAcrylic } from '@/domains/catalog/acrylicRule'
import { embedInWorker } from '@/domains/localDirectory/clipWorkerClient'
import { compressForStorage } from './compressForStorage'
import { buildExternalId, buildStoragePath, deriveMetadataFromPath } from './bulkUploadLogic'
import type { ProcessEntryResult, ScannedEntry } from './types'

const BUCKET = 'catalog-thumbnails'

export interface ProcessEntryDeps {
  sourceId: string
  indexVersionId: string
  rootFolderName: string
  isDuplicate: (externalId: string) => boolean
  labelEmbeddings: TagLabelEmbeddings
  tipoPrototypes: TipoPrototypes
  userId: string | undefined
  /** Injetável pra teste — por padrão usa o Worker real de embedding CLIP. */
  embed?: (blob: Blob) => Promise<number[]>
}

/**
 * Pipeline de 1 arquivo: dedup → comprime → embeda (a partir da imagem
 * JÁ COMPRIMIDA, não do arquivo original — mesma ordem do script Node,
 * senão os vetores não ficam comparáveis ao resto do catálogo) →
 * classifica TODAS as tags (mesma taxonomia completa do
 * generateTags.mjs) → sobe pro Storage → grava em catalog_items já
 * ativo (visibilidade imediata, decisão do admin).
 */
export async function processEntry(
  entry: ScannedEntry,
  deps: ProcessEntryDeps,
): Promise<ProcessEntryResult> {
  const externalId = buildExternalId(deps.rootFolderName, entry.relativePath)

  if (deps.isDuplicate(externalId)) {
    return { status: 'skipped-duplicate', externalId, relativePath: entry.relativePath }
  }

  let compressed: Blob
  try {
    const file = await entry.handle.getFile()
    compressed = await compressForStorage(file)
  } catch (err) {
    return {
      status: 'error',
      externalId,
      relativePath: entry.relativePath,
      errorStage: 'compress',
      errorMessage: err instanceof Error ? err.message : String(err),
    }
  }

  let embedding: number[]
  try {
    embedding = await (deps.embed ?? embedInWorker)(compressed)
  } catch (err) {
    return {
      status: 'error',
      externalId,
      relativePath: entry.relativePath,
      errorStage: 'embed',
      errorMessage: err instanceof Error ? err.message : String(err),
    }
  }

  const metadata = deriveMetadataFromPath(entry)

  let tags: string[]
  try {
    tags = classifyTags(embedding, TAG_CATEGORIES, deps.labelEmbeddings)
    const tipo = resolveTipoTag(embedding, deps.tipoPrototypes, metadata.category)
    if (tipo) tags.push(tipo)
    // Material por regra objetiva (pasta/código), não pelo CLIP — ver acrylicRule.ts.
    // A barra inicial faz a pasta casar mesmo quando é a raiz do envio.
    if (isAcrylic({ title: metadata.title, storagePath: `/${externalId}` })) tags.push(ACRYLIC_TAG)
  } catch (err) {
    return {
      status: 'error',
      externalId,
      relativePath: entry.relativePath,
      errorStage: 'tag',
      errorMessage: err instanceof Error ? err.message : String(err),
    }
  }

  const storagePath = buildStoragePath(deps.sourceId, externalId)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, compressed, { contentType: 'image/webp', upsert: true })
  if (uploadError) {
    return {
      status: 'error',
      externalId,
      relativePath: entry.relativePath,
      errorStage: 'upload',
      errorMessage: uploadError.message,
    }
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  const { error: insertError } = await supabase.from('catalog_items').insert({
    source_id: deps.sourceId,
    index_version_id: deps.indexVersionId,
    external_id: externalId,
    title: metadata.title,
    page_url: null,
    image_url: publicUrlData.publicUrl,
    image_storage_path: storagePath,
    metadata: {
      code: metadata.code,
      category: metadata.category,
      relativePath: entry.relativePath,
      uploaded_by: deps.userId ?? null,
    },
    embedding,
    tags,
    active: true,
  })
  if (insertError) {
    // 23505 = unique_violation — o mesmo external_id já foi gravado
    // nesse meio-tempo (ex. duas execuções concorrentes, ou reprocessar
    // antes do snapshot de dedup pegar o que acabou de ser inserido).
    // Não é falha de verdade: a constraint fez o trabalho dela e
    // impediu duplicata — trata como já-enviado, não como erro.
    if (insertError.code === '23505') {
      return { status: 'skipped-duplicate', externalId, relativePath: entry.relativePath }
    }
    return {
      status: 'error',
      externalId,
      relativePath: entry.relativePath,
      errorStage: 'insert',
      errorMessage: insertError.message,
    }
  }

  return {
    status: 'uploaded',
    externalId,
    relativePath: entry.relativePath,
    bytesUploaded: compressed.size,
  }
}
