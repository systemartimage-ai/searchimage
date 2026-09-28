import { createContext } from 'react'
import type { useLocalDirectory } from './useLocalDirectory'

export type LocalDirectoryState = ReturnType<typeof useLocalDirectory>

export const LocalDirectoryContext = createContext<LocalDirectoryState | undefined>(undefined)
