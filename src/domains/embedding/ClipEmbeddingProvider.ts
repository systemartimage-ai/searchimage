import {
  pipeline,
  RawImage,
  type ImageFeatureExtractionPipeline,
  type ZeroShotObjectDetectionPipeline,
} from '@huggingface/transformers'
import type { EmbeddingProvider } from './EmbeddingProvider'

export const CLIP_MODEL_ID = 'Xenova/clip-vit-base-patch32'
export const CLIP_VECTOR_DIMENSION = 512

// Modelo de detecção zero-shot (mesma família Transformers.js do CLIP, sem
// API/custo) usado só pra achar a REGIÃO da peça antes de embedar — ver
// computeCropBox() e cropToArtwork() abaixo.
const DETECTION_MODEL_ID = 'Xenova/owlvit-base-patch32'
const DETECTION_LABELS = ['picture frame', 'wall mirror', 'sculpture']
// Abaixo disso, a detecção não é confiável o bastante pra recortar — validado
// visualmente numa amostra real antes de aplicar em produção (ver
// scripts/reembedCatalogImages.mjs).
const DETECTION_THRESHOLD = 0.1
// Margem ao redor da caixa detectada — o modelo tende a marcar só a peça em
// si, não a moldura inteira até a borda.
const CROP_PADDING_RATIO = 0.06

interface Detection {
  score: number
  box: { xmin: number; ymin: number; xmax: number; ymax: number }
}

/**
 * Calcula a caixa de recorte a partir das detecções: união de TODAS as
 * detecções acima do limiar (não só a melhor) — cobre composições de mais
 * de uma peça (ex. dois quadros lado a lado) sem risco de cortar metade da
 * composição. Sem detecção confiável, retorna `null` (achado real: fotos
 * ambientadas diluem a similaridade do CLIP — sofá/parede/piso entram no
 * embedding junto com a peça; mas recortar errado é pior que não recortar,
 * mesma filosofia de classifyTipoByPrototype.ts).
 */
export function computeCropBox(
  detections: Detection[],
  imageWidth: number,
  imageHeight: number,
): [number, number, number, number] | null {
  const confident = detections.filter((d) => d.score >= DETECTION_THRESHOLD)
  if (confident.length === 0) return null

  const xmin = Math.min(...confident.map((d) => d.box.xmin))
  const ymin = Math.min(...confident.map((d) => d.box.ymin))
  const xmax = Math.max(...confident.map((d) => d.box.xmax))
  const ymax = Math.max(...confident.map((d) => d.box.ymax))

  const padX = (xmax - xmin) * CROP_PADDING_RATIO
  const padY = (ymax - ymin) * CROP_PADDING_RATIO

  return [
    Math.max(0, Math.floor(xmin - padX)),
    Math.max(0, Math.floor(ymin - padY)),
    Math.min(imageWidth, Math.ceil(xmax + padX)),
    Math.min(imageHeight, Math.ceil(ymax + padY)),
  ]
}

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
 *
 * O detector de objeto (getDetector/cropToArtwork abaixo) NÃO força
 * fp32 de propósito — diferente do CLIP, seu resultado usado é só a
 * CAIXA de recorte (coordenadas), não um vetor comparado por cosseno;
 * uma pequena variação de alguns pixels entre navegador/Node não
 * compromete a comparabilidade dos embeddings finais (que continuam
 * fp32 nos dois lados), e evita baixar peso extra no navegador sem
 * necessidade real.
 */
export class ClipEmbeddingProvider implements EmbeddingProvider {
  readonly modelVersion = CLIP_MODEL_ID
  readonly vectorDimension = CLIP_VECTOR_DIMENSION

  private extractorPromise: Promise<ImageFeatureExtractionPipeline> | null = null
  private detectorPromise: Promise<ZeroShotObjectDetectionPipeline> | null = null

  private getExtractor(): Promise<ImageFeatureExtractionPipeline> {
    if (!this.extractorPromise) {
      this.extractorPromise = pipeline('image-feature-extraction', CLIP_MODEL_ID, { dtype: 'fp32' })
    }
    return this.extractorPromise
  }

  private getDetector(): Promise<ZeroShotObjectDetectionPipeline> {
    if (!this.detectorPromise) {
      this.detectorPromise = pipeline('zero-shot-object-detection', DETECTION_MODEL_ID)
    }
    return this.detectorPromise
  }

  /**
   * Isola a peça do cenário antes de embedar — achado real: a maioria
   * das fotos do catálogo é ambientada (sofá, parede, piso, às vezes
   * uma pessoa), e o CLIP embeda a cena inteira, diluindo a
   * similaridade entre duas fotos da MESMA peça em cenários diferentes
   * (caso real medido: 0.85, abaixo de itens sem nenhuma relação).
   * Qualquer falha aqui (detecção sem confiança, erro do modelo) cai
   * no fallback: usa a imagem inteira, nunca quebra a busca.
   */
  private async cropToArtwork(raw: RawImage): Promise<RawImage> {
    try {
      const detector = await this.getDetector()
      const detections = (await detector(raw, DETECTION_LABELS, {
        threshold: DETECTION_THRESHOLD,
        top_k: 5,
      })) as unknown as Detection[]
      const box = computeCropBox(detections, raw.width, raw.height)
      if (!box) return raw
      return await raw.crop(box)
    } catch {
      return raw
    }
  }

  async embedImage(image: Blob): Promise<number[]> {
    const extractor = await this.getExtractor()
    const raw = await RawImage.read(image)
    const cropped = await this.cropToArtwork(raw)
    const output = await extractor(cropped)
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
