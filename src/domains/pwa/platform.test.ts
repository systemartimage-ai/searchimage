import { describe, expect, it } from 'vitest'
import { detectPlatform, isSafariBrowser, manualInstallSteps, platformLabel } from './platform'
import { UA } from './userAgents'

describe('detectPlatform', () => {
  it('reconhece iPhone (Safari e Chrome), Android, Windows e Mac', () => {
    expect(detectPlatform(UA.iphone)).toBe('ios')
    expect(detectPlatform(UA.iphoneChrome)).toBe('ios')
    expect(detectPlatform(UA.android)).toBe('android')
    expect(detectPlatform(UA.windowsChrome)).toBe('windows')
    expect(detectPlatform(UA.windowsEdge)).toBe('windows')
    expect(detectPlatform(UA.macSafari)).toBe('mac')
    expect(detectPlatform(UA.macChrome)).toBe('mac')
  })

  it('iPad em modo desktop (diz "Macintosh", mas tem tela de toque) é iOS', () => {
    expect(detectPlatform(UA.ipadDesktopMode, 5)).toBe('ios')
    expect(detectPlatform(UA.ipadDesktopMode, 0)).toBe('mac')
  })

  it('sistema desconhecido', () => {
    expect(detectPlatform('Mozilla/5.0 (X11; Linux x86_64) Firefox/120.0')).toBe('other')
  })
})

describe('isSafariBrowser', () => {
  it('só o Safari de verdade', () => {
    expect(isSafariBrowser(UA.macSafari)).toBe(true)
    expect(isSafariBrowser(UA.macChrome)).toBe(false)
    expect(isSafariBrowser(UA.windowsEdge)).toBe(false)
    expect(isSafariBrowser(UA.iphoneChrome)).toBe(false)
  })
})

describe('manualInstallSteps', () => {
  it('iPhone/iPad: Compartilhar > Adicionar à Tela de Início', () => {
    expect(manualInstallSteps('ios', UA.iphone)).toMatch(/Compartilhar.*Adicionar à Tela de Início/)
    expect(manualInstallSteps('ios', UA.iphoneChrome)).toMatch(/Adicionar à Tela de Início/)
  })

  it('Safari do Mac: Arquivo > Adicionar ao Dock', () => {
    expect(manualInstallSteps('mac', UA.macSafari)).toMatch(/Adicionar ao Dock/)
  })

  it('Chrome/Edge (Windows, Android, Mac) usam o botão nativo, sem passo a passo', () => {
    expect(manualInstallSteps('windows', UA.windowsChrome)).toBeNull()
    expect(manualInstallSteps('android', UA.android)).toBeNull()
    expect(manualInstallSteps('mac', UA.macChrome)).toBeNull()
  })
})

describe('platformLabel', () => {
  it('nomes mostrados ao usuário', () => {
    expect(platformLabel('windows')).toBe('Windows')
    expect(platformLabel('android')).toBe('Android')
    expect(platformLabel('ios')).toBe('iPhone/iPad')
    expect(platformLabel('mac')).toBe('Mac')
    expect(platformLabel('other')).toBe('computador')
  })
})
