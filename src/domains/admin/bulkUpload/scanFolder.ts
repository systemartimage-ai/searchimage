import type { ScannedEntry, ScanGroup } from './types'

const ACCEPTED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

/**
 * Caminha a pasta recursivamente sem abrir nenhum arquivo (filtra só
 * pelo nome/extensão) — leve mesmo com dezenas de milhares de itens,
 * já que só abrir/ler cada arquivo acontece depois, na hora de
 * processar de verdade. `topLevelGroup` é capturado uma vez ao descer
 * da raiz pro primeiro nível de subpasta e propagado sem mudar daí pra
 * baixo — é assim que uma sub-subpasta soma no total da subpasta-pai
 * em vez de virar um grupo próprio.
 */
async function* walk(
  dirHandle: FileSystemDirectoryHandle,
  relativePath: string,
  topLevelGroup: string | null,
): AsyncGenerator<ScannedEntry> {
  for await (const entry of dirHandle.values()) {
    const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name
    if (entry.kind === 'directory') {
      yield* walk(entry, childRelativePath, topLevelGroup ?? entry.name)
    } else if (entry.kind === 'file' && ACCEPTED_EXT.has(extensionOf(entry.name))) {
      yield {
        handle: entry,
        relativePath: childRelativePath,
        topLevelGroup: topLevelGroup ?? '',
        name: entry.name,
      }
    }
  }
}

export async function scanDirectory(root: FileSystemDirectoryHandle): Promise<ScannedEntry[]> {
  const entries: ScannedEntry[] = []
  for await (const entry of walk(root, '', null)) entries.push(entry)
  return entries
}

/**
 * Agrupa por subpasta de PRIMEIRO NÍVEL apenas — usado pro resumo que
 * o admin vê e pode desmarcar. Arquivos direto na raiz da pasta
 * escolhida formam o grupo `''`, rotulado à parte, sempre primeiro.
 */
export function groupByTopLevel(entries: Pick<ScannedEntry, 'topLevelGroup'>[]): ScanGroup[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    counts.set(entry.topLevelGroup, (counts.get(entry.topLevelGroup) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([key, fileCount]) => ({
      key,
      label: key === '' ? 'Arquivos na raiz da pasta' : key,
      fileCount,
    }))
    .sort((a, b) => {
      if (a.key === '') return -1
      if (b.key === '') return 1
      return a.key.localeCompare(b.key, 'pt-BR')
    })
}
