import {
  pipeline,
  AutoTokenizer,
  CLIPTextModelWithProjection,
  type TranslationPipeline,
  type PreTrainedTokenizer,
} from '@huggingface/transformers'
import { CLIP_MODEL_ID } from './ClipEmbeddingProvider'
import { TAG_CATEGORIES } from '@/domains/catalog/tagTaxonomy'

const TRANSLATOR_MODEL_ID = 'Xenova/opus-mt-ROMANCE-en'

// Achado real: "espelho organico" (sem acento) não batia com nenhum
// acento nem stopword do heurístico antigo, então ficava sem traduzir
// e ia pro CLIP em português direto — resultado ruim (CLIP é fraco em
// português, ver comentário da classe abaixo). Sem acento, essas
// palavras de decoração/produto (o vocabulário de verdade que um
// usuário desse app digita) não tinham como ser pegas só por
// acento/stopword.
//
// Além do heurístico de acento/stopword (cobre frases genéricas),
// agora também casa a consulta contra o vocabulário REAL do app: as
// palavras da própria taxonomia de tags (tema/categoria/cor/animal,
// sempre atualizado — ver tagTaxonomy.ts) mais um punhado de palavras
// de decoração que não são mais tag (tipo/moldura/formato foram
// removidos da taxonomia, mas continuam sendo português de verdade que
// alguém pode digitar). Comparação sem acento nos dois lados, pra
// "organico"/"orgânico" darem match do mesmo jeito.
const EXTRA_PORTUGUESE_WORDS = [
  'espelho',
  'espelhos',
  'quadro',
  'quadros',
  'escultura',
  'esculturas',
  'moldura',
  'molduras',
  'organico',
  'redondo',
  'redonda',
  'retangular',
  'oval',
  'parede',
  'decoracao',
  'ambiente',
]

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const PORTUGUESE_WORD_SET = new Set(
  [...EXTRA_PORTUGUESE_WORDS, ...Object.values(TAG_CATEGORIES).flatMap((cat) => cat.labels.flatMap(([pt]) => pt.split(' ')))].map(
    (w) => stripAccents(w).toLowerCase(),
  ),
)

// Heurística de detecção de idioma pra não traduzir texto que já está
// em inglês — achado na prática: o tradutor assume que a entrada é uma
// língua românica (português, espanhol...) e, quando recebe inglês,
// produz lixo (ex.: "lion painting" virou "million-dollar"). Combina
// acentos/stopwords típicos do português com o vocabulário real do app
// (acima) — sem um detector de idioma de verdade, se nenhum dos dois
// bater, assume inglês e pula a tradução.
const PORTUGUESE_HINT = /[ãõçáéíóúâêôà]|(?:^|\s)(de|da|do|das|dos|um|uma|com|para|que|não|é|foto|imagem)(?:\s|$)/i

/** Exportada só pra teste isolado (ver ClipTextEmbeddingProvider.test.ts). */
export function looksPortuguese(text: string): boolean {
  if (PORTUGUESE_HINT.test(text)) return true
  const words = stripAccents(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  return words.some((w) => PORTUGUESE_WORD_SET.has(w))
}

// "quadro" é ambíguo em português fora do nicho de decoração (pode
// virar "box"/"chart"/"table" em outros contextos) — achado real,
// testado: o tradutor geral (MarianMT) traduzia "quadro azul" como
// "Blue box". Testado e descartado: substituir a palavra no meio da
// frase (mistura PT/EN) confunde o tradutor ainda mais (ex. virou
// "Blue flask", pior que antes). O que funciona: tirar a palavra
// ambígua ANTES de traduzir — o resto da frase já traduz bem sozinho
// (confirmado nos testes) — e prefixar com a tradução certa depois,
// certa por definição de negócio (esse nicho é sempre quadro de
// parede decorativo), não por adivinhação do modelo genérico.
const DOMAIN_GLOSSARY: Record<string, string> = {
  quadros: 'paintings',
  quadro: 'painting',
}

/**
 * Achado real: o tradutor (MarianMT) diferencia maiúsculas de minúsculas.
 * "CEU AZUL" virava "THE SILVER" (o app buscava prata/cinza em vez de céu
 * azul), enquanto "ceu azul" e "céu azul" viravam "blue sky". Usuários
 * digitam em caixa alta; o CLIP já ignora a caixa, então só normalizamos
 * espaços e caixa antes de detectar idioma/traduzir.
 */
export function normalizeQueryText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

// Achado real: buscar só "girl and woman" no CLIP trazia sobretudo arte
// abstrata/praia (similaridade máx. 0,31); a frase "a painting of a
// woman/girl" trouxe retratos e ilustrações de mulheres nas primeiras
// posições (conferido visualmente no catálogo real). O CLIP responde melhor
// a descrição de imagem do que a palavra solta. Restrito às palavras
// validadas — outros termos não foram testados com esse prefixo.
const PERSON_WORDS = new Set(['menina', 'meninas', 'mulher', 'mulheres'])

/** Prefixa a frase em inglês só para buscas por menina/mulher (ver PERSON_WORDS). */
export function withPersonPrompt(originalText: string, englishText: string): string {
  const words = stripAccents(originalText).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  return words.some((w) => PERSON_WORDS.has(w)) ? `a painting of ${englishText}` : englishText
}

/** Lógica pura (sem carregar nenhum modelo) — testável isoladamente. */
export function stripDomainGlossaryWord(text: string): { englishWord: string | null; rest: string } {
  for (const [pt, en] of Object.entries(DOMAIN_GLOSSARY)) {
    const re = new RegExp(`\\b${pt}\\b`, 'gi')
    if (re.test(text)) {
      const rest = text.replace(re, '').replace(/\s+/g, ' ').trim()
      return { englishWord: en, rest }
    }
  }
  return { englishWord: null, rest: text }
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

  // Achado real: se o carregamento de um modelo falhar uma vez (ex. rede
  // instável), guardar a Promise REJEITADA em cache fazia toda busca por
  // texto seguinte falhar na hora, pra sempre, sem tentar carregar de
  // novo — só um F5 resolvia (usuário via a mensagem de erro, clicava em
  // "Buscar" de novo, e nada acontecia). Limpa o cache no erro pra a
  // próxima chamada tentar do zero.
  private getTranslator(): Promise<TranslationPipeline> {
    if (!this.translatorPromise) {
      this.translatorPromise = pipeline('translation', TRANSLATOR_MODEL_ID, { dtype: 'fp32' }).catch(
        (err: unknown) => {
          this.translatorPromise = null
          throw err
        },
      )
    }
    return this.translatorPromise
  }

  private getTokenizer(): Promise<PreTrainedTokenizer> {
    if (!this.tokenizerPromise) {
      this.tokenizerPromise = AutoTokenizer.from_pretrained(CLIP_MODEL_ID).catch((err: unknown) => {
        this.tokenizerPromise = null
        throw err
      })
    }
    return this.tokenizerPromise
  }

  private getTextModel(): Promise<CLIPTextModelWithProjection> {
    if (!this.textModelPromise) {
      this.textModelPromise = CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID, {
        dtype: 'fp32',
      }).catch((err: unknown) => {
        this.textModelPromise = null
        throw err
      })
    }
    return this.textModelPromise
  }

  async embedText(rawText: string): Promise<number[]> {
    const text = normalizeQueryText(rawText)
    const [tokenizer, textModel] = await Promise.all([this.getTokenizer(), this.getTextModel()])

    let englishText = text
    if (looksPortuguese(text)) {
      const { englishWord, rest } = stripDomainGlossaryWord(text)
      if (englishWord && !rest) {
        englishText = englishWord
      } else if (englishWord) {
        const translator = await this.getTranslator()
        const translated = (await translator(rest))[0]
        const restEnglish = 'translation_text' in translated ? translated.translation_text : rest
        englishText = `${englishWord} ${restEnglish}`.trim()
      } else {
        const translator = await this.getTranslator()
        const translated = (await translator(text))[0]
        englishText = 'translation_text' in translated ? translated.translation_text : text
      }
    }

    englishText = withPersonPrompt(text, englishText)

    const inputs = tokenizer([englishText], { padding: true, truncation: true })
    const { text_embeds } = await textModel(inputs)
    const vector = Array.from(text_embeds.data as Float32Array)
    const norm = Math.hypot(...vector) || 1
    return vector.map((v) => v / norm)
  }
}
