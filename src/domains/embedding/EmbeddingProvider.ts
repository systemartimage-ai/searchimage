/**
 * Contrato único de geração de embeddings visuais (01_ARQUITETURA.md).
 * Nenhuma chamada a um fornecedor específico deve acontecer fora de uma
 * implementação deste contrato — isso é o que permite trocar de provedor
 * sem reescrever SearchEngine, Indexer ou UI.
 *
 * Implementações reais (ex.: chamando uma API de embeddings) rodam
 * server-side (Edge Function / indexer), nunca no navegador, porque
 * exigem uma API key que não pode ser exposta no front-end.
 */
export interface EmbeddingProvider {
  readonly modelVersion: string
  readonly vectorDimension: number

  embedImage(image: Blob): Promise<number[]>
  embedBatch(images: Blob[]): Promise<number[][]>
}
