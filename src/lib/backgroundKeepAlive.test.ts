import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// jsdom não implementa Web Audio API — Fake mínimo controlável pra validar
// o contador de referência e o fallback silencioso sem depender de áudio
// de verdade.
class FakeOscillator {
  static instances: FakeOscillator[] = []
  started = false
  stopped = false
  disconnected = false
  frequency = { value: 0 }
  constructor() {
    FakeOscillator.instances.push(this)
  }
  connect() {}
  start() {
    this.started = true
  }
  stop() {
    this.stopped = true
  }
  disconnect() {
    this.disconnected = true
  }
}

class FakeGain {
  static instances: FakeGain[] = []
  disconnected = false
  gain = { value: 0 }
  constructor() {
    FakeGain.instances.push(this)
  }
  connect() {}
  disconnect() {
    this.disconnected = true
  }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  closed = false
  destination = {}
  constructor() {
    FakeAudioContext.instances.push(this)
  }
  createOscillator() {
    return new FakeOscillator()
  }
  createGain() {
    return new FakeGain()
  }
  close() {
    this.closed = true
  }
}

describe('backgroundKeepAlive', () => {
  beforeEach(() => {
    FakeOscillator.instances.length = 0
    FakeGain.instances.length = 0
    FakeAudioContext.instances.length = 0
    vi.stubGlobal('AudioContext', FakeAudioContext)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('inicia o tom silencioso ao chamar start e para ao chamar stop', async () => {
    const { startBackgroundKeepAlive, stopBackgroundKeepAlive } = await import('./backgroundKeepAlive')
    startBackgroundKeepAlive()

    expect(FakeAudioContext.instances).toHaveLength(1)
    expect(FakeOscillator.instances[0].started).toBe(true)
    // Ganho praticamente zero -- tecnicamente audível, imperceptível na prática.
    expect(FakeGain.instances[0].gain.value).toBeLessThan(0.001)

    stopBackgroundKeepAlive()
    expect(FakeOscillator.instances[0].stopped).toBe(true)
    expect(FakeAudioContext.instances[0].closed).toBe(true)
  })

  it('não duplica o contexto de áudio se chamado várias vezes seguidas (contador de referência)', async () => {
    const { startBackgroundKeepAlive, stopBackgroundKeepAlive } = await import('./backgroundKeepAlive')
    startBackgroundKeepAlive()
    startBackgroundKeepAlive()
    expect(FakeAudioContext.instances).toHaveLength(1)

    stopBackgroundKeepAlive() // ainda tem 1 pendente, não deve parar
    expect(FakeAudioContext.instances[0].closed).toBe(false)

    stopBackgroundKeepAlive() // agora sim, todos pararam
    expect(FakeAudioContext.instances[0].closed).toBe(true)
  })

  it('degrada silenciosamente se o navegador não suportar/bloquear Web Audio', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('autoplay bloqueado')
        }
      },
    )
    const { startBackgroundKeepAlive, stopBackgroundKeepAlive } = await import('./backgroundKeepAlive')
    expect(() => startBackgroundKeepAlive()).not.toThrow()
    expect(() => stopBackgroundKeepAlive()).not.toThrow()
  })
})
