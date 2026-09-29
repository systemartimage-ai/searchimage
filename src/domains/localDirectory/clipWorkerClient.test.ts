import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Achado real: upload em massa/indexação de pasta local travava pra
// sempre (sem erro) quando a aba ficava muito tempo em segundo plano —
// a Promise esperava uma resposta do Worker que nunca chegava. Esses
// testes usam um Worker FALSO controlável (não dá pra rodar um Worker de
// verdade em jsdom) pra validar que, sem resposta dentro do prazo, a
// chamada rejeita (destrava o chamador) em vez de ficar pendurada
// indefinidamente.
class FakeWorker {
  static instances: FakeWorker[] = []
  listeners: Array<(event: { data: unknown }) => void> = []
  terminated = false
  posted: unknown[] = []

  constructor() {
    FakeWorker.instances.push(this)
  }

  addEventListener(_type: string, listener: (event: { data: unknown }) => void) {
    this.listeners.push(listener)
  }

  removeEventListener(_type: string, listener: (event: { data: unknown }) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }

  postMessage(message: unknown) {
    this.posted.push(message)
  }

  terminate() {
    this.terminated = true
  }

  emit(data: unknown) {
    for (const listener of this.listeners) listener({ data })
  }
}

describe('embedInWorker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeWorker.instances.length = 0
    vi.stubGlobal('Worker', FakeWorker)
    vi.stubGlobal('crypto', { randomUUID: () => 'fixed-id' })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.resetModules()
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  it('resolve normalmente quando o Worker responde a tempo', async () => {
    const { embedInWorker } = await import('./clipWorkerClient')
    const promise = embedInWorker(new Blob())
    await vi.advanceTimersByTimeAsync(0) // deixa o run() da fila rodar e criar o Worker
    const w = FakeWorker.instances[0]
    w.emit({ id: 'fixed-id', type: 'result', embedding: [1, 2, 3] })
    await expect(promise).resolves.toEqual([1, 2, 3])
  })

  it('rejeita e reinicia o Worker quando não chega resposta dentro do prazo (aba congelada)', async () => {
    const { embedInWorker } = await import('./clipWorkerClient')
    const promise = embedInWorker(new Blob())
    await vi.advanceTimersByTimeAsync(0)

    const assertion = expect(promise).rejects.toThrow(/tempo esgotado/i)
    await vi.advanceTimersByTimeAsync(60_000)
    await assertion

    expect(FakeWorker.instances[0].terminated).toBe(true)
  })

  it('depois de um timeout, a próxima chamada cria um Worker novo (não reaproveita o travado)', async () => {
    const { embedInWorker } = await import('./clipWorkerClient')
    const first = embedInWorker(new Blob())
    await vi.advanceTimersByTimeAsync(0)
    const firstAssertion = expect(first).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(60_000)
    await firstAssertion

    const second = embedInWorker(new Blob())
    await vi.advanceTimersByTimeAsync(0)
    expect(FakeWorker.instances).toHaveLength(2)
    FakeWorker.instances[1].emit({ id: 'fixed-id', type: 'result', embedding: [9] })
    await expect(second).resolves.toEqual([9])
  })

  // Achado real (2ª rodada, depois que a correção acima já estava no ar):
  // esperar os 60s inteiros toda vez que volta pra aba era demais — o
  // usuário não quer ficar olhando a tela até o timeout estourar. Voltar a
  // ficar visível com uma chamada pendente há mais que alguns segundos
  // força a recuperação na hora, sem esperar o resto do prazo total.
  function setVisibility(state: 'visible' | 'hidden') {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  }

  it('recupera na hora quando a aba volta a ficar visível com uma chamada travada há mais de 5s', async () => {
    const { embedInWorker } = await import('./clipWorkerClient')
    const promise = embedInWorker(new Blob())
    await vi.advanceTimersByTimeAsync(0)

    setVisibility('hidden')
    await vi.advanceTimersByTimeAsync(6_000) // fica "presa" há mais de 5s

    const assertion = expect(promise).rejects.toThrow(/tempo esgotado/i)
    setVisibility('visible') // não precisa esperar até os 60s — recupera na hora
    await assertion
  })

  it('não força recuperação se a chamada pendente é recente (< 5s) quando a aba volta a ficar visível', async () => {
    const { embedInWorker } = await import('./clipWorkerClient')
    const promise = embedInWorker(new Blob())
    await vi.advanceTimersByTimeAsync(0)

    await vi.advanceTimersByTimeAsync(1_000) // só 1s, ainda dentro do normal
    setVisibility('visible')

    const w = FakeWorker.instances[0]
    w.emit({ id: 'fixed-id', type: 'result', embedding: [7] })
    await expect(promise).resolves.toEqual([7])
  })
})
