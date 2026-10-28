export type InstallPlatform = 'ios' | 'android' | 'windows' | 'mac' | 'other'

/**
 * Sistema do aparelho, a partir do user agent. iPadOS 13+ se identifica como
 * "Macintosh": o que o distingue de um Mac é a tela de toque.
 */
export function detectPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios'
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  if (/Windows/.test(userAgent)) return 'windows'
  if (/Macintosh/.test(userAgent)) return 'mac'
  return 'other'
}

/** Celular ou tablet (iPhone, iPad, Android): aparelhos que têm câmera e tela de toque. */
export function isMobileDevice(userAgent: string, maxTouchPoints = 0): boolean {
  const platform = detectPlatform(userAgent, maxTouchPoints)
  return platform === 'ios' || platform === 'android'
}

/** Safari de verdade: os demais navegadores também dizem "Safari" no user agent. */
export function isSafariBrowser(userAgent: string): boolean {
  return (
    /Safari/.test(userAgent) &&
    !/Chrome|Chromium|CriOS|Edg|EdgiOS|FxiOS|OPR|SamsungBrowser/.test(userAgent)
  )
}

export function platformLabel(platform: InstallPlatform): string {
  switch (platform) {
    case 'ios':
      return 'iPhone/iPad'
    case 'android':
      return 'Android'
    case 'windows':
      return 'Windows'
    case 'mac':
      return 'Mac'
    default:
      return 'computador'
  }
}

/**
 * iOS e o Safari do Mac não têm botão de instalar acionável pelo site: o
 * usuário instala pelo menu do navegador. Devolve o passo a passo, ou null
 * quando o navegador oferece instalação direta (Chrome/Edge no Windows,
 * Android e Mac).
 */
export function manualInstallSteps(platform: InstallPlatform, userAgent: string): string | null {
  if (platform === 'ios') {
    return 'toque em Compartilhar (o quadrado com a seta para cima) e depois em "Adicionar à Tela de Início".'
  }
  if (platform === 'mac' && isSafariBrowser(userAgent)) {
    return 'no menu Arquivo do Safari, escolha "Adicionar ao Dock".'
  }
  return null
}

/** O app já está aberto como aplicativo instalado (não numa aba do navegador)? */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (iosStandalone) return true
  if (typeof window.matchMedia !== 'function') return false
  return ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
  )
}
