import { supabase } from '@/lib/supabase'

/**
 * Busca TODOS os external_id já gravados dessa fonte, paginado — sem
 * paginar, o PostgREST corta silenciosamente em 1000 linhas (bug real
 * já visto neste projeto, ver generateTags.mjs). É essa checagem que
 * dá retomada entre sessões: fechar a aba e reabrir na mesma pasta
 * pula direto quem já foi enviado, sem precisar de checkpoint separado
 * — a base é a fonte de verdade.
 */
export async function fetchExistingExternalIds(sourceId: string): Promise<Set<string>> {
  const ids = new Set<string>()
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('external_id')
      .eq('source_id', sourceId)
      .range(from, from + pageSize - 1)
    if (error) throw new Error('Falha buscando itens existentes: ' + error.message)
    for (const row of data) {
      if (row.external_id) ids.add(row.external_id)
    }
    if (data.length < pageSize) break
  }
  return ids
}
