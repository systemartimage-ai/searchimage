import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UA } from '@/domains/pwa/userAgents'

// O estado do convite fica no módulo (o evento chega antes do React): cada teste
// recarrega os módulos para começar do zero.
async function mount(options: { userAgent: string; touchPoints?: number; standalone?: boolean }) {
  vi.resetModules()
  Object.defineProperty(window.navigator, 'userAgent', { value: options.userAgent, configurable: true })
  Object.defineProperty(window.navigator, 'maxTouchPoints', {
    value: options.touchPoints ?? 0,
    configurable: true,
  })
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: !!options.standalone && query.includes('standalone'),
  })) as unknown as typeof window.matchMedia
  await import('@/domains/pwa/installEvent')
  const { InstallPrompt } = await import('./InstallPrompt')
  render(<InstallPrompt />)
}

function fireInstallable() {
  const prompt = vi.fn().mockResolvedValue(undefined)
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
  })
  act(() => {
    window.dispatchEvent(event)
  })
  return { prompt, event }
}

const region = () => screen.queryByRole('region', { name: /instalar aplicativo/i })

afterEach(() => vi.restoreAllMocks())

describe('InstallPrompt — Windows, Android e Mac (Chrome/Edge)', () => {
  it('Windows: convida com o botão Instalar assim que o navegador libera a instalação', async () => {
    await mount({ userAgent: UA.windowsChrome })
    expect(region()).toBeNull()

    const { prompt, event } = fireInstallable()

    expect(region()).toHaveTextContent('Windows')
    expect(event.defaultPrevented).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Instalar' }))
    expect(prompt).toHaveBeenCalledTimes(1)
  })

  it('Android: texto próprio do aparelho', async () => {
    await mount({ userAgent: UA.android, touchPoints: 5 })
    fireInstallable()
    expect(region()).toHaveTextContent('Android')
  })

  it('Chrome no Mac: botão Instalar', async () => {
    await mount({ userAgent: UA.macChrome })
    fireInstallable()
    expect(screen.getByRole('button', { name: 'Instalar' })).toBeInTheDocument()
  })

  it('"Agora não" fecha o convite desta visita', async () => {
    await mount({ userAgent: UA.windowsEdge })
    fireInstallable()
    await userEvent.click(screen.getByRole('button', { name: /agora não/i }))
    expect(region()).toBeNull()
  })

  it('sem o evento do navegador (ex.: já instalado) não mostra o convite', async () => {
    await mount({ userAgent: UA.windowsChrome })
    expect(region()).toBeNull()
  })

  it('some quando o app é instalado', async () => {
    await mount({ userAgent: UA.windowsChrome })
    fireInstallable()
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(region()).toBeNull()
  })
})

describe('InstallPrompt — iPhone/iPad e Safari do Mac (passo a passo)', () => {
  it('iPhone: mostra como instalar, sem botão Instalar', async () => {
    await mount({ userAgent: UA.iphone, touchPoints: 5 })
    expect(region()).toHaveTextContent('iPhone/iPad')
    expect(region()).toHaveTextContent('Adicionar à Tela de Início')
    expect(screen.queryByRole('button', { name: 'Instalar' })).toBeNull()
  })

  it('iPad em modo desktop também recebe o passo a passo do iOS', async () => {
    await mount({ userAgent: UA.ipadDesktopMode, touchPoints: 5 })
    expect(region()).toHaveTextContent('Adicionar à Tela de Início')
  })

  it('Safari do Mac: Arquivo > Adicionar ao Dock', async () => {
    await mount({ userAgent: UA.macSafari })
    expect(region()).toHaveTextContent('Adicionar ao Dock')
  })

  it('"Entendi" fecha o aviso', async () => {
    await mount({ userAgent: UA.iphone, touchPoints: 5 })
    await userEvent.click(screen.getByRole('button', { name: /entendi/i }))
    expect(region()).toBeNull()
  })
})

describe('InstallPrompt — app já instalado', () => {
  it('aberto como aplicativo (standalone): nunca convida', async () => {
    await mount({ userAgent: UA.iphone, touchPoints: 5, standalone: true })
    expect(region()).toBeNull()
  })

  it('aberto como aplicativo no Windows: ignora o evento de instalação', async () => {
    await mount({ userAgent: UA.windowsChrome, standalone: true })
    fireInstallable()
    expect(region()).toBeNull()
  })
})
