import { createContext } from 'react'
import type { useImageSearch } from './useImageSearch'

export type ImageSearchState = ReturnType<typeof useImageSearch>

export const ImageSearchContext = createContext<ImageSearchState | undefined>(undefined)
