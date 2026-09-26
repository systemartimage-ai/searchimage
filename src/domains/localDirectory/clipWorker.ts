// Web Worker: roda o embedding CLIP fora da thread principal, pra
// indexar milhares de fotos locais sem travar a aba/UI. O
// Transformers.js suporta Web Worker nativamente (createImageBitmap +
// OffscreenCanvas, disponíveis em Worker) — não precisa de DOM.
import { ClipEmbeddingProvider } from '@/domains/embedding'

export interface WorkerRequest {
  type: 'embed'
  id: string
  blob: Blob
}

export type WorkerResponse =
  | { type: 'result'; id: string; embedding: number[] }
  | { type: 'error'; id: string; message: string }

const provider = new ClipEmbeddingProvider()

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, id, blob } = event.data
  if (type !== 'embed') return

  try {
    const embedding = await provider.embedImage(blob)
    const response: WorkerResponse = { type: 'result', id, embedding }
    self.postMessage(response)
  } catch (err) {
    const response: WorkerResponse = {
      type: 'error',
      id,
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    }
    self.postMessage(response)
  }
}
