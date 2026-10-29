/**
 * Pede ao navegador que mantenha os dados do app (os modelos de IA, centenas de
 * MB, ficam no cache). Sem isso o navegador pode recusar ou apagar o cache quando
 * falta espaço, e a IA seria baixada de novo a cada busca. Navegadores que não
 * suportam, ou que negam o pedido, seguem funcionando — só podem baixar mais vezes.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    const storage = typeof navigator === 'undefined' ? undefined : navigator.storage
    if (!storage?.persist) return false
    if (await storage.persisted?.()) return true
    return await storage.persist()
  } catch {
    return false
  }
}
