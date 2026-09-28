import { useContext } from 'react'
import { LocalDirectoryContext } from './context'

/**
 * Lê o state de "Diretório Local" do Provider montado em
 * SearchSessionProvider.tsx (acima do <RouterProvider>, ver App.tsx) —
 * não instancia um hook novo a cada página, senão o progresso de
 * indexação e as pastas já conectadas somem ao navegar pra outra
 * página do site e voltar (ver achado real documentado em
 * SearchSessionProvider.tsx).
 */
export function useLocalDirectoryContext() {
  const ctx = useContext(LocalDirectoryContext)
  if (!ctx) throw new Error('useLocalDirectoryContext precisa estar dentro de <SearchSessionProvider>')
  return ctx
}
