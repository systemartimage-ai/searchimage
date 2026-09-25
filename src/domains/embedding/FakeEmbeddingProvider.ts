import type { EmbeddingProvider } from './EmbeddingProvider'

export const FAKE_EMBEDDING_DIMENSION = 16

/**
 * Implementação determinística para Fase 2 (catálogo mock) e testes.
 * Não gera embeddings visuais reais — apenas um vetor estável derivado
 * do conteúdo do arquivo, suficiente para validar UI, pipeline e
 * contrato antes de um provider real ser escolhido (Fase 3).
 */
export class FakeEmbeddingProvider implements EmbeddingProvider {
  readonly modelVersion = 'fake-v1'
  readonly vectorDimension: number

  constructor(vectorDimension = FAKE_EMBEDDING_DIMENSION) {
    this.vectorDimension = vectorDimension
  }

  async embedImage(image: Blob): Promise<number[]> {
    const bytes = new Uint8Array(await image.arrayBuffer())
    const vector = new Array<number>(this.vectorDimension).fill(0)

    for (let i = 0; i < bytes.length; i++) {
      const bucket = i % this.vectorDimension
      vector[bucket] += bytes[i]
    }

    const norm = Math.hypot(...vector) || 1
    return vector.map((v) => v / norm)
  }

  async embedBatch(images: Blob[]): Promise<number[][]> {
    return Promise.all(images.map((image) => this.embedImage(image)))
  }
}
