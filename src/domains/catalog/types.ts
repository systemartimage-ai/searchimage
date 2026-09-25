export interface CatalogItem {
  id: string
  title: string
  code: string
  category: string
  source: string
  thumbnailUrl: string
  /** Vetor mock (não é um embedding visual real — ver mockCatalogData.ts). */
  embedding: number[]
}
