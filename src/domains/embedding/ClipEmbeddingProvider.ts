import { pipeline, type ImageFeatureExtractionPipeline } from '@huggingface/transformers'
import type { EmbeddingProvider } from './EmbeddingProvider'

export const CLIP_MODEL_ID = 'Xenova/clip-vit-base-patch32'
export const CLIP_VECTOR_DIMENSION = 512

/**
 * Embedding visual real (CLIP ViT-B/32, via Transformers.js/ONNX).
 * Modelo open-weight rodando localmente — sem API key, sem custo por
 * chamada, funciona tanto no navegador (imagem de consulta) quanto no
 * indexador Node (catálogo). Por isso, diferente do que o comentário
 * original de `EmbeddingProvider.ts` previa para "implementações
 * reais", esta pode rodar no front-end: não há segredo para vazar.
 *
 * O pipeline é baixado e cacheado na primeira chamada, uma única vez
 * por ambiente (navegador: Cache API; Node: disco local) — não é
 * reempacotado no bundle da aplicação.
 *
 * `dtype: 'fp32'` é obrigatório aqui: sem isso, o Transformers.js
 * escolhe a precisão do modelo por ambiente — no navegador (backend
 * WASM) o padrão é "q8" (quantizado em 8 bits, ~4x menor/mais rápido,
 * mas com perda real de precisão), enquanto no Node o padrão já é
 * fp32. Isso foi um bug real medido em produção: a mesma imagem, sem
 * forçar fp32, gerava embeddings diferentes no navegador (busca) e no
 * Node (indexador) — um item idêntico ao catálogo caía de ~0.93 pra
 * ~0.82 de similaridade só por causa da quantização, o suficiente pra
 * sumir do Top 10. Forçar fp32 nos dois lados custa um download maior
 * do modelo no navegador (pesos em precisão total), mas é necessário
 * pra query e catálogo serem comparáveis de verdade.
 */
export class ClipEmbeddingProvider implements EmbeddingProvider {
  readonly modelVersion = CLIP_MODEL_ID
  readonly vectorDimension = CLIP_VECTOR_DIMENSION

  private extractorPromise: Promise<ImageFeatureExtractionPipeline> | null = null

  private getExtractor(): Promise<ImageFeatureExtractionPipeline> {
    if (!this.extractorPromise) {
      this.extractorPromise = pipeline('image-feature-extraction', CLIP_MODEL_ID, { dtype: 'fp32' })
    }
    return this.extractorPromise
  }

  async embedImage(image: Blob): Promise<number[]> {
    const extractor = await this.getExtractor()
    const output = await extractor(image)
    const vector = Array.from(output.data as Float32Array)
    const norm = Math.hypot(...vector) || 1
    return vector.map((v) => v / norm)
  }

  async embedBatch(images: Blob[]): Promise<number[][]> {
    // Sequencial de propósito: é inferência local (CPU-bound), rodar em
    // paralelo só disputa o mesmo recurso sem ganho real, e mantém
    // progresso previsível para o indexador (checkpoint por item).
    const results: number[][] = []
    for (const image of images) {
      results.push(await this.embedImage(image))
    }
    return results
  }
}
