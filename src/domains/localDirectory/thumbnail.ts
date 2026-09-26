// Gera uma miniatura reduzida (em vez de manter o arquivo original em
// tamanho real na memória do navegador) — importante com pastas de
// milhares de fotos, onde manter tudo em resolução original poderia
// esgotar a memória da aba.

const MAX_DIMENSION = 320

export async function createThumbnailUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return URL.createObjectURL(file)
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.8 })
  return URL.createObjectURL(blob)
}
