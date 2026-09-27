import { supabase } from '@/lib/supabase'

const SOURCE_NAME = 'Upload Admin'

export interface AdminUploadSource {
  sourceId: string
  indexVersionId: string
}

/**
 * Acha ou cria a fonte "Upload Admin" e seu index_version — direto
 * como ACTIVE (sem fase BUILDING/promote, diferente do script Node):
 * upload por essa ferramenta é uma ação deliberada de admin revisando
 * as imagens no momento da escolha, decisão de deixar visível na busca
 * imediatamente. Fonte separada de "Fotos locais" (essa pertence ao
 * fluxo BUILDING→--promote do script) pra não misturar os dois modelos
 * de state no mesmo index_version.
 */
export async function ensureAdminUploadSource(): Promise<AdminUploadSource> {
  const { data: existingSource, error: sourceSelectError } = await supabase
    .from('sources')
    .select('id')
    .eq('name', SOURCE_NAME)
    .maybeSingle()
  if (sourceSelectError) throw new Error('Falha buscando fonte: ' + sourceSelectError.message)

  let sourceId = existingSource?.id as string | undefined
  if (!sourceId) {
    const { data, error } = await supabase
      .from('sources')
      .insert({ name: SOURCE_NAME, type: 'admin-upload', base_url: 'local://' + SOURCE_NAME, enabled: true })
      .select('id')
      .single()
    if (error) throw new Error('Falha criando fonte: ' + error.message)
    sourceId = data.id as string
  }

  const { data: existingVersion, error: versionSelectError } = await supabase
    .from('index_versions')
    .select('id')
    .eq('source_id', sourceId)
    .eq('status', 'ACTIVE')
    .maybeSingle()
  if (versionSelectError) throw new Error('Falha buscando index_version: ' + versionSelectError.message)

  let indexVersionId = existingVersion?.id as string | undefined
  if (!indexVersionId) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('index_versions')
      .insert({
        source_id: sourceId,
        status: 'ACTIVE',
        embedding_model: 'Xenova/clip-vit-base-patch32',
        vector_dimension: 512,
        completed_at: now,
        activated_at: now,
      })
      .select('id')
      .single()
    if (error) throw new Error('Falha criando index_version: ' + error.message)
    indexVersionId = data.id as string
  }

  return { sourceId, indexVersionId }
}
