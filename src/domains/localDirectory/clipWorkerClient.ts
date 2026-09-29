import type { WorkerRequest, WorkerResponse } from './clipWorker'

// Client (thread principal) do Worker de embedding. Um único Worker
// compartilhado por toda a indexação de diretório local — mantém as
// chamadas em fila (uma de cada vez) para não arriscar duas inferências
// concorrentes na mesma sessão ONNX dentro do Worker.
let worker: Worker | null = null
let queue: Promise<unknown> = Promise.resolve()

// Achado real: upload em massa/indexação de pasta local travava pra sempre
// (sem erro nenhum) quando o usuário trocava de aba por um tempo — o
// navegador pode congelar/atrasar tanto a thread principal quanto o Worker
// numa aba em segundo plano, e a Promise ficava esperando uma resposta que
// nunca chegava, mesmo depois de voltar pra aba. Generoso (uma imagem só
// nunca deveria demorar isso em uso normal) — existe só pra destravar esse
// caso, não pra apertar o caso comum.
const EMBED_TIMEOUT_MS = 60_000

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./clipWorker.ts', import.meta.url), { type: 'module' })
  }
  return worker
}

/** Mata e descarta o Worker travado — a próxima chamada cria um novo do zero, evitando que uma resposta atrasada do Worker antigo se sobreponha à próxima tarefa. */
function resetWorker(): void {
  worker?.terminate()
  worker = null
}

export function embedInWorker(blob: Blob): Promise<number[]> {
  const run = () =>
    new Promise<number[]>((resolve, reject) => {
      const w = getWorker()
      const id = crypto.randomUUID()
      let settled = false

      const timeoutId = setTimeout(() => {
        if (settled) return
        settled = true
        w.removeEventListener('message', onMessage)
        resetWorker()
        reject(
          new Error(
            'Tempo esgotado esperando o processamento da imagem (a aba pode ter ficado muito tempo em segundo plano)',
          ),
        )
      }, EMBED_TIMEOUT_MS)

      function onMessage(event: MessageEvent<WorkerResponse>) {
        if (event.data.id !== id || settled) return
        settled = true
        clearTimeout(timeoutId)
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
