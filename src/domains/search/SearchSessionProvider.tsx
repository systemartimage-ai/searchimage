import type { ReactNode } from 'react'
import { useLocalDirectory } from '@/domains/localDirectory/useLocalDirectory'
import { LocalDirectoryContext } from '@/domains/localDirectory/context'
import { useImageSearch } from './useImageSearch'
import { ImageSearchContext } from './context'

/**
 * Instancia `useLocalDirectory`/`useImageSearch` UMA VEZ só, montado em
 * App.tsx acima do <RouterProvider> — antes disso, esses hooks eram
 * chamados direto dentro de HomePage.tsx, então navegar pra `/admin` e
 * voltar pra `/` desmontava/remontava HomePage e zerava tudo (pastas
 * indexadas, resultados de uma busca já feita). O trabalho assíncrono
 * em si (indexLocalDirectory, o Worker de embedding) nunca parava de
 * verdade — só ficava órfão, atualizando um hook de um componente já
 * desmontado. Ver plano `deep-scribbling-rossum.md` para o diagnóstico
 * completo.
 */
export function SearchSessionProvider({ children }: { children: ReactNode }) {
  const localDirectory = useLocalDirectory()
  const imageSearch = useImageSearch(localDirectory.items)

  return (
    <LocalDirectoryContext.Provider value={localDirectory}>
      <ImageSearchContext.Provider value={imageSearch}>{children}</ImageSearchContext.Provider>
    </LocalDirectoryContext.Provider>
  )
}
