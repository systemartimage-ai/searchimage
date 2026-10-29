import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestPersistentStorage } from './persistStorage'

function setStorage(storage: unknown) {
  Object.defineProperty(window.navigator, 'storage', { value: storage, configurable: true })
}

afterEach(() => setStorage(undefined))

describe('requestPersistentStorage', () => {
  it('pede persistência e devolve o que o navegador respondeu', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    setStorage({ persisted: vi.fn().mockResolvedValue(false), persist })
    await expect(requestPersistentStorage()).resolves.toBe(true)
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('já persistente: não pede de novo', async () => {
    const persist = vi.fn()
    setStorage({ persisted: vi.fn().mockResolvedValue(true), persist })
    await expect(requestPersistentStorage()).resolves.toBe(true)
    expect(persist).not.toHaveBeenCalled()
  })

  it('navegador que nega: devolve false, sem erro', async () => {
    setStorage({ persisted: vi.fn().mockResolvedValue(false), persist: vi.fn().mockResolvedValue(false) })
    await expect(requestPersistentStorage()).resolves.toBe(false)
  })

  it('sem suporte ou com erro: devolve false, sem lançar', async () => {
    setStorage(undefined)
    await expect(requestPersistentStorage()).resolves.toBe(false)
    setStorage({ persist: vi.fn().mockRejectedValue(new Error('negado')) })
    await expect(requestPersistentStorage()).resolves.toBe(false)
  })
})
