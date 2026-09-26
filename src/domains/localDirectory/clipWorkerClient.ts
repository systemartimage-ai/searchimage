import type { WorkerRequest, WorkerResponse } from './clipWorker'

// Client (thread principal) do Worker de embedding. Um único Worker
// compartilhado por toda a indexação de diretório local — mantém as
// chamadas em fila (uma de cada vez) para não arriscar duas inferências
// concorrentes na mesma sessão ONNX dentro do Worker.
let worker: Worker | null = null
let queue: Promise<unknown> = Promise.resolve()

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./clipWorker.ts', import.meta.url), { type: 'module' })
  }
  return worker
}

export function embedInWorker(blob: Blob): Promise<number[]> {
  const run = () =>
    new Promise<number[]>((resolve, reject) => {
      const w = getWorker()
      const id = crypto.randomUUID()

      function onMessage(event: MessageEvent<WorkerResponse>) {
        if (event.data.id !== id) return
        w.removeEventListener('message', onMessage)
        if (event.data.type === 'result') {
          resolve(event.data.embedding)
        } else {
          reject(new Error(event.data.message))
        }
      }

      w.addEventListener('message', onMessage)
      const request: WorkerRequest = { type: 'embed', id, blob }
      w.postMessage(request)
    })

  // Encadeia na fila: só inicia depois que a chamada anterior terminar.
  const result = queue.then(run, run)
  queue = result.catch(() => {})
  return result
}
