import type { ProcessEntryResult, ScannedEntry } from './types'
import { processEntry, type ProcessEntryDeps } from './processEntry'

// Mesma constante do script Node (uploadLocalPhotos.mjs) — abortar
// depois de N falhas de upload seguidas é o sinal mais provável de ter
// estourado a cota de Storage, não vale a pena continuar tentando os
// milhares de arquivos restantes.
const MAX_CONSECUTIVE_UPLOAD_ERRORS = 5

export interface RunBulkUploadCallbacks {
  onProgress: (done: number, total: number, result: ProcessEntryResult) => void
  shouldStop: () => boolean
}

export interface RunBulkUploadSummary {
  uploaded: number
  skipped: number
  errors: number
  stoppedEarly: boolean
}

/** Laço sequencial de propósito — mesma razão de indexLocalDirectory.ts/clipWorkerClient.ts: só uma inferência CLIP por vez. */
export async function runBulkUpload(
  entries: ScannedEntry[],
  deps: ProcessEntryDeps,
  callbacks: RunBulkUploadCallbacks,
): Promise<RunBulkUploadSummary> {
  let uploaded = 0
  let skipped = 0
  let errors = 0
  let consecutiveUploadErrors = 0
  let stoppedEarly = false

  for (let i = 0; i < entries.length; i++) {
    if (callbacks.shouldStop()) {
      stoppedEarly = true
      break
    }

    const result = await processEntry(entries[i], deps)

    if (result.status === 'uploaded') {
      uploaded++
      consecutiveUploadErrors = 0
    } else if (result.status === 'skipped-duplicate') {
      skipped++
    } else {
      errors++
      if (result.errorStage === 'upload') consecutiveUploadErrors++
    }

    callbacks.onProgress(i + 1, entries.length, result)

    if (consecutiveUploadErrors >= MAX_CONSECUTIVE_UPLOAD_ERRORS) {
      stoppedEarly = true
      break
    }
  }

  return { uploaded, skipped, errors, stoppedEarly }
}
