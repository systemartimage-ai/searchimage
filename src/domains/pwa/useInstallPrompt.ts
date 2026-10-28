import { useState, useSyncExternalStore } from 'react'
import { getInstallState, promptInstall, subscribeInstallState } from './installEvent'
import {
  detectPlatform,
  isStandaloneDisplay,
  manualInstallSteps,
  platformLabel,
} from './platform'

export type InstallMode = 'hidden' | 'native' | 'manual'

/**
 * Decide como convidar para instalar o app, a cada vez que ele é aberto no
 * navegador:
 *  - 'native': Chrome/Edge liberaram o botão de instalar (Windows, Android, Mac);
 *  - 'manual': iOS e Safari do Mac — mostra o passo a passo do menu do navegador;
 *  - 'hidden': já instalado/aberto como aplicativo, ou o usuário fechou o convite.
 * "Agora não" vale só até recarregar a página: o convite volta no próximo acesso.
 */
export function useInstallPrompt() {
  const state = useSyncExternalStore(subscribeInstallState, getInstallState, getInstallState)
  const [dismissed, setDismissed] = useState(false)

  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent
  const maxTouchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints
  const platform = detectPlatform(userAgent, maxTouchPoints)
  const steps = manualInstallSteps(platform, userAgent)

  let mode: InstallMode = 'hidden'
  if (!dismissed && !state.installed && !isStandaloneDisplay()) {
    if (state.canPrompt) mode = 'native'
    else if (steps) mode = 'manual'
  }

  return {
    mode,
    platformName: platformLabel(platform),
    steps,
    install: async () => {
      const outcome = await promptInstall()
      if (outcome === 'dismissed') setDismissed(true)
    },
    dismiss: () => setDismissed(true),
  }
}
