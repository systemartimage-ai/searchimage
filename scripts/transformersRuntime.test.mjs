import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const { create } = vi.hoisted(() => ({ create: vi.fn() }))
// Ponto de injeção público da biblioteca; jsdom ativa IS_WEB_ENV.
const runtimeKey = Symbol.for('onnxruntime')
const previousRuntime = globalThis[runtimeKey]
globalThis[runtimeKey] = { InferenceSession: { create }, env: {} }
afterAll(() => {
  if (previousRuntime === undefined) delete globalThis[runtimeKey]
  else globalThis[runtimeKey] = previousRuntime
})

beforeEach(() => {
  vi.resetModules()
  create.mockReset()
})

const runtime = () => import('../node_modules/@huggingface/transformers/src/backends/onnx.js')

describe('Transformers.js — recuperação das filas usadas no navegador', () => {
  it('uma falha no detector não contamina o carregamento do modelo de texto', async () => {
    const { createInferenceSession } = await runtime()
    const failure = new Error(
      "Could not find an implementation for Cast(13) node '/class_head/Cast'",
    )
    const textSession = {}
    create.mockRejectedValueOnce(failure).mockResolvedValueOnce(textSession)

    await expect(createInferenceSession('detector', {}, {})).rejects.toBe(failure)
    await expect(createInferenceSession('text', {}, {})).resolves.toBe(textSession)
    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[1][0]).toBe('text')
  })

  it('mantém carregamentos serializados, inclusive após uma falha', async () => {
    const { createInferenceSession } = await runtime()
    let rejectFirst
    create
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectFirst = reject
          }),
      )
      .mockResolvedValueOnce({})
    const first = createInferenceSession('first', {}, {})
    const firstRejected = expect(first).rejects.toThrow('failed')
    const second = createInferenceSession('second', {}, {})
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    rejectFirst(new Error('failed'))
    await firstRejected
    await second
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('uma inferência com erro não impede a próxima inferência', async () => {
    const { runInferenceSession } = await runtime()
    const failure = new Error('inference failed')
    const session = {
      run: vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce({ output: 42 }),
    }
    await expect(runInferenceSession(session, {})).rejects.toBe(failure)
    await expect(runInferenceSession(session, {})).resolves.toEqual({ output: 42 })
    expect(session.run).toHaveBeenCalledTimes(2)
  })

  it('o bundle entregue ao navegador inclui as duas recuperações', async () => {
    const bundle = await readFile(
      resolve('node_modules/@huggingface/transformers/dist/transformers.web.js'),
      'utf8',
    )
    expect(bundle).toContain('webInitChain.then(load, load)')
    expect(bundle).toContain('webInferenceChain.then(run, run)')
    expect(bundle).not.toContain('webInitChain.then(load)')
    expect(bundle).not.toContain('webInferenceChain.then(run)')
  })
})
