import {
  pipeline,
  AutoTokenizer,
  CLIPTextModelWithProjection,
  type TranslationPipeline,
  type PreTrainedTokenizer,
} from '@huggingface/transformers'
import { CLIP_MODEL_ID } from './ClipEmbeddingProvider'

const TRANSLATOR_MODEL_ID = 'Xenova/opus-mt-ROMANCE-en'

// Heurística simples pra não traduzir texto que já está em inglês —
// achado na prática: o tradutor assume que a entrada é uma língua
// românica (português, espanhol...) e, quando recebe inglês, produz
// lixo (ex.: "lion painting" virou "million-dollar"). Sem um detector
// de idioma de verdade, olhamos por acentos/caracteres típicos do
// português e por stopwords comuns — se nenhum aparecer, assume
// inglês e pula a tradução.
const PORTUGUESE_HINT = /[ãõçáéíóúâêôà]|(?:^|\s)(de|da|do|das|dos|um|uma|com|para|que|não|é|quadro|foto|imagem)(?:\s|$)/i

function looksPortuguese(text: string): boolean {
  return PORTUGUESE_HINT.test(text)
}

/**
 * Busca por texto: mesmo espaço de embedding do CLIP usado nas imagens
 * (Xenova/clip-vit-base-patch32) — a torre de texto do próprio CLIP,
 * não um modelo separado, senão a comparação com o catálogo não faria
 * sentido.
 *
 * O CLIP original (OpenAI) foi treinado majoritariamente em inglês —
 * testado na prática: buscar "um espelho redondo" direto (sem
 * traduzir) não encontra os espelhos redondos reais do catálogo, mas
 * "a round mirror" encontra. Por isso: traduz pt→en primeiro
 * (Xenova/opus-mt-ROMANCE-en, cobre português) e só depois gera o
 * embedding — validado comparando os dois caminhos com o catálogo
 * real antes de implementar.
 */
export class ClipTextEmbeddingProvider {
  readonly modelVersion = CLIP_MODEL_ID

  private translatorPromise: Promise<TranslationPipeline> | null = null
  private tokenizerPromise: Promise<PreTrainedTokenizer> | null = null
  private textModelPromise: Promise<CLIPTextModelWithProjection> | null = null

  private getTranslator(): Promise<TranslationPipeline> {
    if (!this.translatorPromise) {
      this.translatorPromise = pipeline('translation', TRANSLATOR_MODEL_ID, { dtype: 'fp32' })
    }
    return this.translatorPromise
  }

  private getTokenizer(): Promise<PreTrainedTokenizer> {
    if (!this.tokenizerPromise) {
      this.tokenizerPromise = AutoTokenizer.from_pretrained(CLIP_MODEL_ID)
    }
    return this.tokenizerPromise
  }

  private getTextModel(): Promise<CLIPTextModelWithProjection> {
    if (!this.textModelPromise) {
      this.textModelPromise = CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID, {
        dtype: 'fp32',
      })
    }
    return this.textModelPromise
  }

  async embedText(text: string): Promise<number[]> {
    const [tokenizer, textModel] = await Promise.all([this.getTokenizer(), this.getTextModel()])

    let englishText = text
    if (looksPortuguese(text)) {
      const translator = await this.getTranslator()
      const translated = (await translator(text))[0]
      englishText = 'translation_text' in translated ? translated.translation_text : text
    }

    const inputs = tokenizer([englishText], { padding: true, truncation: true })
    const { text_embeds } = await textModel(inputs)
    const vector = Array.from(text_embeds.data as Float32Array)
    const norm = Math.hypot(...vector) || 1
    return vector.map((v) => v / norm)
  }
}
