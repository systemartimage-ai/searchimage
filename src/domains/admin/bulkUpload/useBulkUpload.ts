import { useCallback, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { loadTagLabelEmbeddings } from '@/domains/catalog/loadTagLabelEmbeddings'
import { loadTipoPrototypes } from '@/domains/catalog/loadTipoPrototypes'
import { scanDirectory, groupByTopLevel } from './scanFolder'
import { ensureAdminUploadSource } from './ensureAdminUploadSource'
import { fetchExistingExternalIds } from './existingExternalIds'
import { compressForStorage } from './compressForStorage'
import { averageBytes, buildErrorCsv } from './bulkUploadLogic'
import { runBulkUpload } from './runBulkUpload'
import type { BulkUploadStatus, ProcessEntryResult, ScanGroup, ScannedEntry } from './types'

const SUPPORTED = typeof window !== 'undefined' && 'showDirectoryPicker' in window
// Amostra real (comprime de verdade, não chuta) pra projetar o
// tamanho do lote inteiro — sempre projetar antes de subir.
const SAMPLE_SIZE = 15

interface ProgressState {
  done: number
  total: number
  uploaded: number
  skipped: number
  errors: number
}

const INITIAL_PROGRESS: ProgressState = { done: 0, total: 0, uploaded: 0, skipped: 0, errors: 0 }

export function useBulkUpload() {
  const [status, setStatus] = useState<BulkUploadStatus>('idle')
  const [rootFolderName, setRootFolderName] = useState<string | null>(null)
  const [totalScanned, setTotalScanned] = useState(0)
  const [groups, setGroups] = useState<ScanGroup[]>([])
  const [excludedGroups, setExcludedGroups] = useState<Set<string>>(new Set())
  const [avgBytesPerFile, setAvgBytesPerFile] = useState(0)
  const [progress, setProgress] = useState<ProgressState>(INITIAL_PROGRESS)
  // Lista completa fica numa ref (evita copiar um array de até ~25 mil
  // itens a cada arquivo processado) — só os erros (bem mais raros)
  // entram em state, pra aparecer ao vivo na tela.
  const [recentErrors, setRecentErrors] = useState<ProcessEntryResult[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const entriesRef = useRef<ScannedEntry[]>([])
  const allResultsRef = useRef<ProcessEntryResult[]>([])
  const stopRequestedRef = useRef(false)

  const totalSelected = useMemo(
    () => groups.reduce((sum, g) => (excludedGroups.has(g.key) ? sum : sum + g.fileCount), 0),
    [groups, excludedGroups],
  )

  const toggleGroup = useCallback((key: string) => {
    setExcludedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const pickFolder = useCallback(async () => {
    if (!SUPPORTED) return

    let dirHandle: FileSystemDirectoryHandle
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API ainda não tem tipos padrão do TS/lib.dom
      dirHandle = await (window as any).showDirectoryPicker()
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      return
    }

    setStatus('scanning')
    setErrorMessage(null)
    setRootFolderName(dirHandle.name)

    try {
      const entries = await scanDirectory(dirHandle)
      entriesRef.current = entries
      allResultsRef.current = []
      setTotalScanned(entries.length)
      setGroups(groupByTopLevel(entries))
      setExcludedGroups(new Set())
      setAvgBytesPerFile(0)
      setProgress(INITIAL_PROGRESS)
      setRecentErrors([])
      setStatus('scanned')

      const sample = entries.slice(0, SAMPLE_SIZE)
      const sampleSizes: number[] = []
      for (const entry of sample) {
        try {
          const file = await entry.handle.getFile()
          const compressed = await compressForStorage(file)
          sampleSizes.push(compressed.size)
        } catch {
          // amostra: uma falha pontual só reduz a amostra, não é erro do escaneamento
        }
      }
      setAvgBytesPerFile(averageBytes(sampleSizes))
    } catch {
      setErrorMessage('Não foi possível escanear essa pasta.')
      setStatus('idle')
    }
  }, [])

  const confirmAndUpload = useCallback(async () => {
    const entries = entriesRef.current.filter((e) => !excludedGroups.has(e.topLevelGroup))
    if (entries.length === 0 || !rootFolderName) return

    stopRequestedRef.current = false
    allResultsRef.current = []
    setStatus('uploading')
    setErrorMessage(null)
    setRecentErrors([])
    setProgress({ done: 0, total: entries.length, uploaded: 0, skipped: 0, errors: 0 })

    try {
      const [{ sourceId, indexVersionId }, labelEmbeddings, tipoPrototypes, { data: userData }] =
        await Promise.all([
          ensureAdminUploadSource(),
          loadTagLabelEmbeddings(),
          loadTipoPrototypes(),
          supabase.auth.getUser(),
        ])
      const existingIds = await fetchExistingExternalIds(sourceId)

      const summary = await runBulkUpload(
        entries,
        {
          sourceId,
          indexVersionId,
          rootFolderName,
          isDuplicate: (externalId) => existingIds.has(externalId),
          labelEmbeddings,
          tipoPrototypes,
          userId: userData.user?.id,
        },
        {
          shouldStop: () => stopRequestedRef.current,
          onProgress: (done, total, result) => {
            allResultsRef.current.push(result)
            setProgress((prev) => ({
              done,
              total,
              uploaded: prev.uploaded + (result.status === 'uploaded' ? 1 : 0),
              skipped: prev.skipped + (result.status === 'skipped-duplicate' ? 1 : 0),
              errors: prev.errors + (result.status === 'error' ? 1 : 0),
            }))
            if (result.status === 'error') {
              setRecentErrors((prev) => [...prev.slice(-49), result])
            }
          },
        },
      )

      setStatus('done')
      if (summary.stoppedEarly && !stopRequestedRef.current) {
        setErrorMessage(
          'Muitas falhas de upload seguidas — parou aqui (provável cota de Storage). O que já subiu está salvo; clique em enviar de novo pra continuar.',
        )
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha inesperada no upload.')
      setStatus('done')
    }
  }, [excludedGroups, rootFolderName])

  const stop = useCallback(() => {
    stopRequestedRef.current = true
  }, [])

  const reset = useCallback(() => {
    entriesRef.current = []
    allResultsRef.current = []
    stopRequestedRef.current = false
    setStatus('idle')
    setRootFolderName(null)
    setTotalScanned(0)
    setGroups([])
    setExcludedGroups(new Set())
    setAvgBytesPerFile(0)
    setProgress(INITIAL_PROGRESS)
    setRecentErrors([])
    setErrorMessage(null)
  }, [])

  const downloadErrorLog = useCallback(() => {
    const errors = allResultsRef.current.filter((r) => r.status === 'error')
    if (errors.length === 0) return
    const csv = buildErrorCsv(errors)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'erros-upload.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return {
    supported: SUPPORTED,
    status,
    rootFolderName,
    totalScanned,
    groups,
    excludedGroups,
    totalSelected,
    avgBytesPerFile,
    progress,
    recentErrors,
    errorMessage,
    pickFolder,
    toggleGroup,
    confirmAndUpload,
    stop,
    reset,
    downloadErrorLog,
  }
}
