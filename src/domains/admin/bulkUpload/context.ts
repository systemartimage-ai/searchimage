import { createContext } from 'react'
import type { useBulkUpload } from './useBulkUpload'

export type BulkUploadState = ReturnType<typeof useBulkUpload>

export const BulkUploadContext = createContext<BulkUploadState | undefined>(undefined)
