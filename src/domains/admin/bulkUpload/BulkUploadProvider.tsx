import type { ReactNode } from 'react'
import { useBulkUpload } from './useBulkUpload'
import { BulkUploadContext } from './context'

/**
 * Instancia `useBulkUpload` UMA VEZ só, montado em App.tsx acima do
 * <RouterProvider> — achado real: o loop de upload (runBulkUpload.ts)
 * não tem AbortController nem depende do ciclo de vida do componente,
 * então navegar pra fora de /admin e voltar não parava o upload de
 * verdade, só desconectava a tela dele (o hook antigo ficava órfão,
 * atualizando state que ninguém mais lia, e a tela remontava com um
 * hook novo, zerado). Ver plano `deep-scribbling-rossum.md`.
 */
export function BulkUploadProvider({ children }: { children: ReactNode }) {
  const bulkUpload = useBulkUpload()
  return <BulkUploadContext.Provider value={bulkUpload}>{children}</BulkUploadContext.Provider>
}
