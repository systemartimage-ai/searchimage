// Fotos de câmera de celular têm 12 megapixels ou mais (3 a 10+ MB). Para a busca
// isso é desperdício: o CLIP trabalha em 224 px e o detector em 768 px, mas o
// navegador ainda decodifica a foto inteira — no celular isso gasta memória e
// tempo, e fotos acima de 10 MB eram recusadas. Aqui a foto é reduzida antes de
// entrar na busca.

/** Maior lado da imagem usada na busca (o catálogo também é indexado em tamanho reduzido). */
export const MAX_IMAGE_SIDE = 1280
/** Arquivos até este tamanho e dentro do limite de lado passam sem reprocessar. */
export const SMALL_IMAGE_BYTES = 1.5 * 1024 * 1024

/** A imagem precisa de redução? (arquivo grande: o tamanho real só se sabe ao decodificar) */
export function mayNeedDownscale(file: File): boolean {
  return file.size > SMALL_IMAGE_BYTES
}

/**
 * Reduz a imagem para no máximo `maxSide` px no maior lado, já com a rotação da
 * câmera (EXIF) aplicada, e regrava em JPEG. Qualquer falha devolve o arquivo
 * original: reduzir é uma melhoria, nunca pode impedir a busca.
 */
export async function downscaleImage(file: File, maxSide = MAX_IMAGE_SIDE): Promise<File> {
  try {
    if (typeof createImageBitmap !== 'function') return file
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= SMALL_IMAGE_BYTES) {
      bitmap.close()
      return file
    }

    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    )
    // Se o resultado não ficou menor, não vale trocar.
    if (!blob || blob.size >= file.size) return file

    const baseName = file.name.replace(/\.[^./\\]+$/, '') || 'foto'
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
  } catch (error) {
    console.warn('Não foi possível reduzir a foto; usando a original:', error)
    return file
  }
}
