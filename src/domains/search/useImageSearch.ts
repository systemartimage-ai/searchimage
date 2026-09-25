import { useCallback, useRef, useState } from 'react'
import { ClipEmbeddingProvider } from '@/domains/embedding'
import { searchMockCatalog, type SearchResult } from './searchMockCatalog'

export type SearchStatus =
  'idle' | 'preview' | 'embedding' | 'searching' | 'success' | 'empty' | 'error'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// CLIP local (Transformers.js) — mesmo modelo usado para gerar os
// embeddings de REAL_CATALOG_SAMPLE, senão a comparação não faz
// sentido. Sem API key: pode rodar no navegador (ver EmbeddingProvider.ts).
const provider = new ClipEmbeddingProvider()

export interface SearchOptions {
  limit: number
  category?: string
  code?: string
  threshold?: number
}

export function useImageSearch() {
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const embeddingRef = useRef<number[] | null>(null)

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
        // Pequeno atraso simulado: no mock não há round-trip real de rede,
        // mas os estados "gerando embedding"/"pesquisando" precisam ser
        // visíveis e testáveis (05_FRONTEND_UX.md).
        await new Promise((resolve) => setTimeout(resolve, 400))

        const found = searchMockCatalog(embedding, options)
        setResults(found)
        setStatus(found.length === 0 ? 'empty' : 'success')
      } catch {
        setErrorMessage('Não foi possível processar a imagem. Tente novamente.')
        setStatus('error')
      }
    },
    [file],
  )

  /** Reaplica filtros (limite/categoria/código) sem regerar o embedding. */
  const applyFilters = useCallback((options: SearchOptions) => {
    if (!embeddingRef.current) return
    const found = searchMockCatalog(embeddingRef.current, options)
    setResults(found)
    setStatus(found.length === 0 ? 'empty' : 'success')
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
    applyFilters,
  }
}
