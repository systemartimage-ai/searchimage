/**
 * Regra objetiva que identifica produtos de acrílico (confirmada pelo usuário
 * em 2026-10-02) — a mesma aplicada no banco pela migration
 * 20261002000000_tag_acrilico.sql. Usada para marcar itens novos (upload e
 * indexador do site) com a tag `acrilico`.
 *
 *  1. pasta do Storage `Artsy_ACRILICO`;
 *  2. código com `AC` + até 3 letras no fim, ou antes de um traço
 *     (-AC, -ACBZ, -ACDB-L, .AC, -AC-AMB). `AC` no início do código NÃO conta
 *     (é inicial de autor, ex.: AC03-80100);
 *  3. site Artimage, categoria `Colecionáveis`.
 */
export const ACRYLIC_TAG = 'acrilico'

const ACRYLIC_CODE = /[-.]AC[A-Z]{0,3}(-|$)/i
const ACRYLIC_FOLDER = '/Artsy_ACRILICO/'
const ACRYLIC_SITE_CATEGORY = 'Colecionáveis'

export interface AcrylicRuleInput {
  /** Título/código do item (ex.: "LN1188A-1515-AC"). */
  title?: string | null
  /** Caminho no Storage, quando o item veio de upload. */
  storagePath?: string | null
  /** Categoria de origem no site-fonte, quando o item veio do catálogo web. */
  sourceCategory?: string | null
}

export function isAcrylic({ title, storagePath, sourceCategory }: AcrylicRuleInput): boolean {
  if (storagePath?.includes(ACRYLIC_FOLDER)) return true
  if (sourceCategory === ACRYLIC_SITE_CATEGORY) return true
  return !!title && ACRYLIC_CODE.test(title)
}
