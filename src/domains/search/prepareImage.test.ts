import { afterEach, describe, expect, it, vi } from 'vitest'
import { downscaleImage, mayNeedDownscale, MAX_IMAGE_SIDE, SMALL_IMAGE_BYTES } from './prepareImage'

const MB = 1024 * 1024

function bigPhoto(name = 'IMG_2043.HEIC.jpg', bytes = 4 * MB) {
  return new File([new Uint8Array(bytes)], name, { type: 'image/jpeg' })
}

function mockCanvas(resultBytes = 300_000) {
  const drawImage = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
    callback(new Blob([new Uint8Array(resultBytes)], { type: 'image/jpeg' }))
  })
  return { drawImage }
}

function mockBitmap(width: number, height: number) {
  const bitmap = { width, height, close: vi.fn() }
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))
  return bitmap
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('mayNeedDownscale', () => {
  it('arquivos pequenos passam direto; só os grandes (câmera) são reprocessados', () => {
    expect(mayNeedDownscale(new File([new Uint8Array(100_000)], 'a.jpg'))).toBe(false)
    expect(mayNeedDownscale(new File([new Uint8Array(SMALL_IMAGE_BYTES)], 'a.jpg'))).toBe(false)
    expect(mayNeedDownscale(bigPhoto())).toBe(true)
  })
})

describe('downscaleImage', () => {
  it('reduz uma foto de 12 MP para no máximo 1280 px, em JPEG e menor que a original', async () => {
    const bitmap = mockBitmap(4000, 3000)
    const { drawImage } = mockCanvas()
    const original = bigPhoto()

    const result = await downscaleImage(original)

    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, MAX_IMAGE_SIDE, 960)
    expect(bitmap.close).toHaveBeenCalled()
    expect(result).not.toBe(original)
    expect(result.type).toBe('image/jpeg')
    expect(result.name).toBe('IMG_2043.HEIC.jpg')
    expect(result.size).toBeLessThan(original.size)
  })

  it('aplica a rotação da câmera (EXIF) ao decodificar', async () => {
    mockBitmap(3000, 4000)
    mockCanvas()
    await downscaleImage(bigPhoto())
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(File), { imageOrientation: 'from-image' })
  })

  it('foto em pé (retrato) também respeita o maior lado', async () => {
    const bitmap = mockBitmap(3000, 4000)
    const { drawImage } = mockCanvas()
    await downscaleImage(bigPhoto())
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 960, MAX_IMAGE_SIDE)
  })

  it('imagem já pequena em pixels e em bytes volta intacta', async () => {
    const bitmap = mockBitmap(800, 600)
    const original = new File([new Uint8Array(200_000)], 'a.jpg', { type: 'image/jpeg' })
    expect(await downscaleImage(original)).toBe(original)
    expect(bitmap.close).toHaveBeenCalled()
  })

  it('se o resultado não ficou menor, mantém a original', async () => {
    mockBitmap(4000, 3000)
    mockCanvas(9 * MB)
    const original = bigPhoto()
    expect(await downscaleImage(original)).toBe(original)
  })

  it('qualquer falha devolve a original, sem impedir a busca', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('formato')))
    const original = bigPhoto()
    expect(await downscaleImage(original)).toBe(original)
  })

  it('navegador sem createImageBitmap: devolve a original', async () => {
    vi.stubGlobal('createImageBitmap', undefined)
    const original = bigPhoto()
    expect(await downscaleImage(original)).toBe(original)
  })

  it('sem contexto 2D no canvas: devolve a original', async () => {
    const bitmap = mockBitmap(4000, 3000)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const original = bigPhoto()
    expect(await downscaleImage(original)).toBe(original)
    expect(bitmap.close).toHaveBeenCalled()
  })
})
