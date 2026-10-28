// Chrome/Edge (Windows, Android, Mac) avisam que o app pode ser instalado
// pelo evento `beforeinstallprompt`. O evento pode chegar antes de o React
// montar a tela, então ele é capturado aqui, no carregamento do módulo (este
// arquivo é importado em main.tsx), e a tela só lê o estado guardado.

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export interface InstallState {
  /** O navegador liberou o botão nativo de instalar. */
  canPrompt: boolean
  /** O app acabou de ser instalado (evento `appinstalled`). */
  installed: boolean
}

let deferred: BeforeInstallPromptEvent | null = null
let snapshot: InstallState = { canPrompt: false, installed: false }
const listeners = new Set<() => void>()

function update(next: Partial<InstallState>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Sem isto o Chrome mostra a barrinha dele; a nossa faixa assume o convite.
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    update({ canPrompt: true })
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    update({ canPrompt: false, installed: true })
  })
}

export function subscribeInstallState(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getInstallState(): InstallState {
  return snapshot
}

/** Abre a janela nativa de instalação. O evento só pode ser usado uma vez. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  const event = deferred
  deferred = null
  update({ canPrompt: false })
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}
