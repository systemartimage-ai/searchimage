import { useContext } from 'react'
import { ImageSearchContext } from './context'

/**
 * Lê o state de busca (resultados, preview, status) do Provider montado
 * em SearchSessionProvider.tsx (acima do <RouterProvider>, ver
 * App.tsx) — não instancia um hook novo a cada página, senão uma busca
 * já finalizada some ao navegar pra outra página do site e voltar.
 */
export function useImageSearchContext() {
  const ctx = useContext(ImageSearchContext)
  if (!ctx) throw new Error('useImageSearchContext precisa estar dentro de <SearchSessionProvider>')
  return ctx
}
