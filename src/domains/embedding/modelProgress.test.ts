import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getModelProgress,
  reportModelProgress,
  resetModelProgress,
  subscribeModelProgress,
} from './modelProgress'

const MB = 1024 * 1024

beforeEach(() => resetModelProgress())

describe('modelProgress', () => {
  it('começa sem progresso', () => {
    expect(getModelProgress()).toBeNull()
  })

  it('calcula a porcentagem e os MB do arquivo que está baixando', () => {
    reportModelProgress({ status: 'progress', name: 'clip', file: 'vision_model.onnx', loaded: 100 * MB, total: 335 * MB })
    expect(getModelProgress()).toEqual({ loadedMB: 100, totalMB: 335, percent: 30, stage: 1 })
  })

  it('soma vários arquivos grandes do mesmo modelo e ignora os pequenos (config, tokenizer)', () => {
    reportModelProgress({ status: 'progress', name: 'm', file: 'config.json', loaded: 1000, total: 2000 })
    reportModelProgress({ status: 'progress', name: 'm', file: 'a.onnx', loaded: 100 * MB, total: 200 * MB })
    reportModelProgress({ status: 'progress', name: 'm', file: 'b.onnx', loaded: 0, total: 200 * MB })
    expect(getModelProgress()).toEqual({ loadedMB: 100, totalMB: 400, percent: 25, stage: 1 })
  })

  it('arquivo concluído conta como 100%', () => {
    reportModelProgress({ status: 'progress', name: 'm', file: 'a.onnx', loaded: 10 * MB, total: 100 * MB })
    reportModelProgress({ status: 'done', name: 'm', file: 'a.onnx' })
    expect(getModelProgress()?.percent).toBe(100)
  })

  it('quando um modelo fica pronto o indicador some; o próximo modelo é a "parte 2" e recomeça do 0%', () => {
    reportModelProgress({ status: 'progress', name: 'clip', file: 'a.onnx', loaded: 335 * MB, total: 335 * MB })
    reportModelProgress({ status: 'ready' })
    expect(getModelProgress()).toBeNull()

    reportModelProgress({ status: 'progress', name: 'tradutor', file: 'b.onnx', loaded: 10 * MB, total: 200 * MB })
    expect(getModelProgress()).toEqual({ loadedMB: 10, totalMB: 200, percent: 5, stage: 2 })
  })

  it('resetModelProgress zera a contagem de partes (início de cada busca)', () => {
    reportModelProgress({ status: 'progress', name: 'clip', file: 'a.onnx', loaded: 10 * MB, total: 20 * MB })
    resetModelProgress()
    expect(getModelProgress()).toBeNull()

    reportModelProgress({ status: 'progress', name: 'outro', file: 'b.onnx', loaded: 10 * MB, total: 20 * MB })
    expect(getModelProgress()?.stage).toBe(1)
  })

  it('não avisa a tela de novo enquanto nada visível mudou (milhares de eventos por MB)', () => {
    const listener = vi.fn()
    subscribeModelProgress(listener)

    for (let bytes = 0; bytes < MB; bytes += 4096) {
      reportModelProgress({ status: 'progress', name: 'm', file: 'a.onnx', loaded: 50 * MB + bytes, total: 100 * MB })
    }

    expect(listener.mock.calls.length).toBeLessThanOrEqual(2)
  })

  it('avisa quem está assinando e para de avisar depois de cancelar a assinatura', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeModelProgress(listener)
    reportModelProgress({ status: 'progress', name: 'm', file: 'a.onnx', loaded: 50 * MB, total: 100 * MB })
    expect(listener).toHaveBeenLastCalledWith({ loadedMB: 50, totalMB: 100, percent: 50, stage: 1 })

    unsubscribe()
    listener.mockClear()
    reportModelProgress({ status: 'ready' })
    expect(listener).not.toHaveBeenCalled()
  })

  it('eventos desconhecidos não quebram', () => {
    expect(() => reportModelProgress({ status: 'initiate', name: 'm', file: 'a.onnx' })).not.toThrow()
    expect(getModelProgress()).toBeNull()
  })
})
