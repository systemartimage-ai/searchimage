import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipEmbeddingProvider, ClipTextEmbeddingProvider } from '@/domains/embedding'
import type { CatalogItem } from '@/domains/catalog/types'
import { TAG_CATEGORIES } from '@/domains/catalog/tagTaxonomy'
import { classifyTags } from '@/domains/catalog/tagClassifier'
import { loadTagLabelEmbeddings } from '@/domains/catalog/loadTagLabelEmbeddings'
import { classifyTipoByPrototype } from '@/domains/catalog/classifyTipoByPrototype'
import { loadTipoPrototypes } from '@/domains/catalog/loadTipoPrototypes'
import { searchCatalog } from './searchCatalog'
import { searchLocalDirectory } from './searchLocalDirectory'
import { extractTagKeywords } from './extractTagKeywords'
import type { SearchResult } from './searchMockCatalog'

// Categorias usadas pra classificar a FOTO de busca (não o texto) com
// as mesmas tags do catálogo — só "animal" (identidade específica,
// ex. leão), que se mostrou estável entre uma foto direta do produto e
// uma foto "ambientada" (pendurada numa sala decorada). "tipo"
// (quadro/espelho) não usa mais rótulo de texto genérico (ver
// tagTaxonomy.ts) — agora é classifyTipoByPrototype, comparado contra
// fotos reais confirmadas, aplicado à parte logo abaixo.
const IMAGE_TAG_CATEGORIES = ['animal']

export type SearchStatus =
  'idle' | 'preview' | 'embedding' | 'searching' | 'success' | 'empty' | 'error'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// CLIP local (Transformers.js) — mesmo modelo usado para gerar os
// embeddings de REAL_CATALOG_SAMPLE, senão a comparação não faz
// sentido. Sem API key: pode rodar no navegador (ver EmbeddingProvider.ts).
const provider = new ClipEmbeddingProvider()
const textProvider = new ClipTextEmbeddingProvider()

export interface SearchOptions {
  limit: number
  category?: string
  code?: string
  threshold?: number
}

const MAX_ATTEMPTS = 3

/**
 * Roda `fn` e, se falhar, tenta de novo (até `MAX_ATTEMPTS` vezes no
 * total) antes de desistir — a maioria dos erros aqui (download do
 * modelo CLIP na primeira vez, chamada de rede pro Postgres) é
 * transitória: o próprio usuário clicando de novo "resolve" o
 * problema, o que é uma experiência ruim quando uma nova tentativa
 * teria funcionado sozinha. Loga o erro real no console em toda
 * tentativa — a mensagem que aparece pro usuário é sempre genérica,
 * então sem isso não dava pra saber o que de fato estava falhando.
 */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const isLast = attempt === MAX_ATTEMPTS
      console.error(
        `[${label}] tentativa ${attempt}/${MAX_ATTEMPTS} falhou${isLast ? ', desistindo' : ', tentando de novo'}:`,
        err,
      )
      if (isLast) throw err
    }
  }
  throw new Error('unreachable')
}

/** Combina Catálogo Indexado (Postgres) + Diretório Local (memória) num único ranking. */
async function searchAllSources(
  embedding: number[],
  options: SearchOptions,
  localItems: CatalogItem[],
  tagKeywords?: string[],
): Promise<SearchResult[]> {
  const [remote, local] = await Promise.all([
    searchCatalog(embedding, options, tagKeywords),
    Promise.resolve(searchLocalDirectory(localItems, embedding, options)),
  ])
  return [...remote, ...local].sort((a, b) => b.score - a.score).slice(0, options.limit)
}

/** Qual caixa disparou a busca em andamento — evita o overlay de scan aparecer nas duas ao mesmo tempo. */
export type SearchMode = 'image' | 'text' | null

export function useImageSearch(localItems: CatalogItem[] = []) {
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [searchMode, setSearchMode] = useState<SearchMode>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const embeddingRef = useRef<number[] | null>(null)
  const tagKeywordsRef = useRef<string[]>([])
  const localItemsRef = useRef<CatalogItem[]>(localItems)
  useEffect(() => {
    localItemsRef.current = localItems
  }, [localItems])

  const clear = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    embeddingRef.current = null
    setFile(null)
    setPreviewUrl(null)
    setResults([])
    setErrorMessage(null)
    setSearchMode(null)
    setStatus('idle')
  }, [])

  const selectFile = useCallback((candidate: File) => {
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setErrorMessage('Formato não suportado. Envie uma imagem JPG, PNG ou WebP.')
      setStatus('error')
      return
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setErrorMessage('Imagem muito grande (máximo 10MB).')
      setStatus('error')
      return
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(candidate)
    previewUrlRef.current = url
    embeddingRef.current = null

    setFile(candidate)
    setPreviewUrl(url)
    setResults([])
    setErrorMessage(null)
    setStatus('preview')
  }, [])

  /** Primeira pesquisa: gera o embedding (async) e então filtra. */
  const runSearch = useCallback(
    async (options: SearchOptions) => {
      if (!file) return
      setErrorMessage(null)
      setSearchMode('image')
      setStatus('embedding')

      try {
        const { found, embedding, tagKeywords } = await withRetry(async () => {
          setStatus('embedding')
          const embedding = await provider.embedImage(file)
          // Classifica a própria foto de busca com as mesmas tags do
          // catálogo (ver IMAGE_TAG_CATEGORIES) — sinal exato, robusto a
          // itens "ambientados" (pendurados numa sala) cuja similaridade
          // visual pura fica diluída pelo cenário.
          const [labelEmbeddings, tipoPrototypes] = await Promise.all([
            loadTagLabelEmbeddings(),
            loadTipoPrototypes(),
          ])
          const tagKeywords = classifyTags(
            embedding,
            TAG_CATEGORIES,
            labelEmbeddings,
            IMAGE_TAG_CATEGORIES,
          )
          const tipo = classifyTipoByPrototype(embedding, tipoPrototypes)
          if (tipo) tagKeywords.push(tipo)
          setStatus('searching')
          const found = await searchAllSources(embedding, options, localItemsRef.current, tagKeywords)
          return { found, embedding, tagKeywords }
        }, 'busca por imagem')

        embeddingRef.current = embedding
        tagKeywordsRef.current = tagKeywords
        setResults(found)
        setStatus(found.length === 0 ? 'empty' : 'success')
      } catch {
        setErrorMessage('Não foi possível processar a imagem. Tente novamente.')
        setStatus('error')
      }
    },
    [file],
  )

  /** Busca por texto (tema/descrição) — mesma pipeline, embedding vem do texto. */
  const runTextSearch = useCallback(async (text: string, options: SearchOptions) => {
    if (!text.trim()) return
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setFile(null)
    setPreviewUrl(null)
    setErrorMessage(null)
    setSearchMode('text')
    setStatus('embedding')

    try {
      const { found, embedding, tagKeywords } = await withRetry(async () => {
        setStatus('embedding')
        const embedding = await textProvider.embedText(text)
        // Palavras-chave que batem com tags conhecidas (ex. "leão" ->
        // `leao`) — busca prioriza esse sinal exato antes do semântico
        // puro (ver searchCatalog.ts). Robusto a como cada usuário
        // escreve, não depende de frase descritiva.
        const tagKeywords = extractTagKeywords(text)
        setStatus('searching')
        const found = await searchAllSources(embedding, options, localItemsRef.current, tagKeywords)
        return { found, embedding, tagKeywords }
      }, 'busca por texto')

      embeddingRef.current = embedding
      tagKeywordsRef.current = tagKeywords
      setResults(found)
      setStatus(found.length === 0 ? 'empty' : 'success')
    } catch {
      setErrorMessage('Não foi possível processar o texto. Tente novamente.')
      setStatus('error')
    }
  }, [])

  /** Reaplica filtros (limite/categoria/código) sem regerar o embedding. */
  const applyFilters = useCallback(async (options: SearchOptions) => {
    if (!embeddingRef.current) return
    try {
      const found = await withRetry(
        () => searchAllSources(embeddingRef.current!, options, localItemsRef.current, tagKeywordsRef.current),
        'reaplicar filtros',
      )
      setResults(found)
      setStatus(found.length === 0 ? 'empty' : 'success')
    } catch {
      setErrorMessage('Não foi possível pesquisar. Tente novamente.')
      setStatus('error')
    }
  }, [])

  return {
    status,
    searchMode,
    file,
    previewUrl,
    results,
    errorMessage,
    selectFile,
    clear,
    runSearch,
    runTextSearch,
    applyFilters,
  }
}
