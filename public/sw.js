// Service worker do Artimage Search (PWA).
//
// Objetivo: deixar o app instalável e mostrar uma página amigável sem internet.
// A busca depende do Supabase e dos modelos de IA, então NÃO há cache de
// dados nem de arquivos do app: um cache aqui poderia servir uma versão antiga
// depois de um deploy (já houve problema com versões antigas em produção).
//
// - Navegação: sempre pela rede; só se falhar (sem internet) mostra /offline.html.
// - O ícone da página offline é servido do cache que o próprio service worker guarda.
// - Qualquer outra requisição (API do Supabase, fontes, modelos de IA, arquivos
//   com hash em /assets): passa direto, sem interceptar.
const CACHE = 'artimage-offline-v2'
const OFFLINE_URL = '/offline.html'
const ICON_URL = '/icons/icon-192.png'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, ICON_URL]))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // O ícone da página "sem conexão" já está guardado: sem isto ele falharia offline.
  const url = new URL(request.url)
  if (url.origin === self.location.origin && url.pathname === ICON_URL) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)))
  }
})
