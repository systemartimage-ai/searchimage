// Progresso do download dos modelos de IA (Transformers.js). Na primeira busca o
// aparelho baixa centenas de MB (CLIP em precisão total ~335 MB; no texto, +242 MB
// do CLIP de texto e ~425 MB do tradutor). Sem indicação parecia que a busca
// tinha travado. Os arquivos ficam no cache do navegador, então só a primeira
// vez é demorada.
//
// Cada `pipeline()`/`from_pretrained()` recebe `progress_callback: reportModelProgress`.

export interface ModelProgress {
  loadedMB: number
  totalMB: number
  /** 0 a 100, do modelo que está sendo baixado agora. */
  percent: number
  /** Qual modelo é este dentro da busca atual (1, 2, 3...): cada um começa do 0%. */
  stage: number
}

interface ProgressEvent {
  status?: string
  file?: string
  name?: string
  loaded?: number
  total?: number
}

type Listener = (progress: ModelProgress | null) => void

const MB = 1024 * 1024
// Arquivos pequenos (config, tokenizer) não contam para a porcentagem.
const MIN_TRACKED_BYTES = 1 * MB

const files = new Map<string, { loaded: number; total: number }>()
const models = new Set<string>()
const listeners = new Set<Listener>()
let current: ModelProgress | null = null

function sameProgress(a: ModelProgress | null, b: ModelProgress | null): boolean {
  if (a === null || b === null) return a === b
  return (
    a.loadedMB === b.loadedMB &&
    a.totalMB === b.totalMB &&
    a.percent === b.percent &&
    a.stage === b.stage
  )
}

// O download dispara milhares de eventos; só avisa a tela quando algo visível mudou
// (a cada MB), para o celular não redesenhar a página sem necessidade.
function emit(next: ModelProgress | null) {
  if (sameProgress(current, next)) return
  current = next
  listeners.forEach((listener) => listener(next))
}

function aggregate(): ModelProgress | null {
  let loaded = 0
  let total = 0
  for (const entry of files.values()) {
    if (entry.total < MIN_TRACKED_BYTES) continue
    loaded += Math.min(entry.loaded, entry.total)
    total += entry.total
  }
  if (total === 0) return null
  return {
    loadedMB: Math.round(loaded / MB),
    totalMB: Math.round(total / MB),
    percent: Math.min(100, Math.round((loaded / total) * 100)),
    stage: Math.max(1, models.size),
  }
}

export function reportModelProgress(event: ProgressEvent): void {
  const key = `${event.name ?? ''}/${event.file ?? ''}`
  if (event.status === 'progress' && typeof event.total === 'number' && event.total > 0) {
    if (event.total >= MIN_TRACKED_BYTES && event.name) models.add(event.name)
    files.set(key, { loaded: event.loaded ?? 0, total: event.total })
    emit(aggregate())
  } else if (event.status === 'done') {
    const entry = files.get(key)
    if (entry) files.set(key, { loaded: entry.total, total: entry.total })
    emit(aggregate())
  } else if (event.status === 'ready') {
    // Este modelo terminou de carregar: o próximo (se houver) começa do 0%.
    files.clear()
    emit(null)
  }
}

/**
 * Zera tudo: no início de cada busca (para a contagem de modelos recomeçar) e
 * quando um modelo falha ao carregar (não sobra "baixando" parado na tela).
 */
export function resetModelProgress(): void {
  files.clear()
  models.clear()
  emit(null)
}

export function getModelProgress(): ModelProgress | null {
  return current
}

export function subscribeModelProgress(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
