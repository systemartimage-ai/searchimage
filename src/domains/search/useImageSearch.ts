import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipEmbeddingProvider, ClipTextEmbeddingProvider } from '@/domains/embedding'
import type { CatalogItem } from '@/domains/catalog/types'
import { searchCatalog } from './searchCatalog'
import { searchLocalDirectory } from './searchLocalDirectory'
import type { SearchResult } from './searchMockCatalog'

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

/** Combina Catálogo Indexado (Postgres) + Diretório Local (memória) num único ranking. */
async function searchAllSources(
  embedding: number[],
  options: SearchOptions,
  localItems: CatalogItem[],
): Promise<SearchResult[]> {
  const [remote, local] = await Promise.all([
    searchCatalog(embedding, options),
    Promise.resolve(searchLocalDirectory(localItems, embedding, options)),
  ])
  return [...remote, ...local].sort((a, b) => b.score - a.score).slice(0, options.limit)
}

export function useImageSearch(localItems: CatalogItem[] = []) {
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const embeddingRef = useRef<number[] | null>(null)
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
      setStatus('embedding')

      try {
        const embedding = await provider.embedImage(file)
        embeddingRef.current = embedding
        setStatus('searching')

        const found = await searchAllSources(embedding, options, localItemsRef.current)
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
    setStatus('embedding')

    try {
      const embedding = await textProvider.embedText(text)
      embeddingRef.current = embedding
      setStatus('searching')

      const found = await searchAllSources(embedding, options, localItemsRef.current)
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
      const found = await searchAllSources(embeddingRef.current, options, localItemsRef.current)
      setResults(found)
      setStatus(found.length === 0 ? 'empty' : 'success')
    } catch {
      setErrorMessage('Não foi possível pesquisar. Tente novamente.')
      setStatus('error')
    }
  }, [])

  return {
    status,
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
