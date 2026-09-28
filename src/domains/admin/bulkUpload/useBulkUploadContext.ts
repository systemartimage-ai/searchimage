import { useContext } from 'react'
import { BulkUploadContext } from './context'

/**
 * Lê o state de upload em massa do Provider montado em App.tsx (acima
 * do <RouterProvider>) — não instancia um hook novo a cada visita a
 * /admin, senão o progresso de um upload em andamento some ao navegar
 * pra outra página do site e voltar (o upload em si continua rodando
 * em background; ver BulkUploadProvider.tsx).
 */
export function useBulkUploadContext() {
  const ctx = useContext(BulkUploadContext)
  if (!ctx) throw new Error('useBulkUploadContext precisa estar dentro de <BulkUploadProvider>')
  return ctx
}
