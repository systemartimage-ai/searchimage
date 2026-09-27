// Compressão pro upload permanente (Storage) — mesma técnica de
// src/domains/localDirectory/thumbnail.ts (canvas/OffscreenCanvas, sem
// dependência de servidor), mas com os parâmetros de armazenamento
// (480px/qualidade 0.72, iguais ao scripts/uploadLocalPhotos.mjs) em
// vez dos 320px/0.8 usados pra miniatura efêmera de busca local —
// propósitos diferentes, por isso um arquivo à parte em vez de mudar
// thumbnail.ts (evita regressão no recurso de busca local já validado).
const MAX_DIMENSION = 480
const QUALITY = 0.72

export async function compressForStorage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 2D não disponível neste navegador.')
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.convertToBlob({ type: 'image/webp', quality: QUALITY })
}
