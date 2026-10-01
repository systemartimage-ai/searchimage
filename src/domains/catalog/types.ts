export interface CatalogItem {
  id: string
  title: string
  code: string
  category: string
  source: string
  thumbnailUrl: string
  /** Ativo na última indexação publicada do site Artimage; não é uma consulta ao site em tempo real. */
  activeOnSite?: boolean
  /** Vetor mock (não é um embedding visual real — ver mockCatalogData.ts). */
  embedding: number[]
}
