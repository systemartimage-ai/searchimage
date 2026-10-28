import { useInstallPrompt } from '@/domains/pwa/useInstallPrompt'

/**
 * Faixa no topo que convida a instalar o app (PWA) a cada acesso pelo
 * navegador: botão "Instalar" no Windows, Android e Mac (Chrome/Edge) e passo
 * a passo no iPhone/iPad e no Safari do Mac. Some quando o app já está aberto
 * como aplicativo instalado.
 */
export function InstallPrompt() {
  const { mode, platformName, steps, install, dismiss } = useInstallPrompt()
  if (mode === 'hidden') return null

  return (
    <section
      aria-label="Instalar aplicativo"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-[#0e0d0b] px-4 py-2.5 text-center text-sm text-[#f5f3ef] sm:px-6"
    >
      {mode === 'native' ? (
        <p>
          <strong className="font-semibold">Instale o Artimage Search</strong> no seu {platformName}
          {' '}para abrir direto, como um aplicativo.
        </p>
      ) : (
        <p>
          <strong className="font-semibold">Instale o Artimage Search</strong> no seu {platformName}:{' '}
          {steps}
        </p>
      )}
      <div className="flex items-center gap-2">
        {mode === 'native' && (
          <button
            type="button"
            onClick={install}
            className="bg-[#f5f3ef] px-4 py-1.5 text-sm font-semibold text-[#0e0d0b] hover:bg-white"
          >
            Instalar
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="px-3 py-1.5 text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
        >
          {mode === 'native' ? 'Agora não' : 'Entendi'}
        </button>
      </div>
    </section>
  )
}
