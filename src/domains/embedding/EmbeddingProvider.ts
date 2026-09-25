/**
 * Contrato único de geração de embeddings visuais (01_ARQUITETURA.md).
 * Nenhuma chamada a um fornecedor específico deve acontecer fora de uma
 * implementação deste contrato — isso é o que permite trocar de provedor
 * sem reescrever SearchEngine, Indexer ou UI.
 *
 * Implementações que dependem de uma API paga (chave secreta) rodam
 * server-side (Edge Function / indexer), nunca no navegador. Já uma
 * implementação com modelo open-weight local (sem chave nenhuma, ex.
 * `ClipEmbeddingProvider`) pode rodar nos dois lados — não há segredo
 * para vazar, e isso é o que permite comparar a imagem de consulta
 * (navegador) com o catálogo (indexador) usando exatamente o mesmo
 * modelo.
 */
export interface EmbeddingProvider {
  readonly modelVersion: string
  readonly vectorDimension: number

  embedImage(image: Blob): Promise<number[]>
  embedBatch(images: Blob[]): Promise<number[][]>
}
