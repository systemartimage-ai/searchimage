/**
 * Registra o service worker (public/sw.js) só em produção: em desenvolvimento
 * ele atrapalharia o HMR do Vite. O service worker não guarda dados nem
 * arquivos do app (ver comentário em sw.js) — serve para a instalação e para
 * a página "sem conexão".
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('Não foi possível registrar o service worker:', error)
    })
  })
}
