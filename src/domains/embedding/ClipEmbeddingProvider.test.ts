import { describe, expect, it } from 'vitest'
import { computeCropBox } from './ClipEmbeddingProvider'

// Achado real: a maioria das fotos do catálogo é ambientada (sofá, parede,
// piso), e o CLIP embeda a cena inteira — computeCropBox isola a lógica
// (testável sem baixar nenhum modelo) que decide a região da peça a
// recortar antes de embedar, ver ClipEmbeddingProvider.ts.
describe('computeCropBox', () => {
  it('sem detecção nenhuma, não recorta (retorna null)', () => {
    expect(computeCropBox([], 800, 600)).toBeNull()
  })

  it('detecção abaixo do limiar é ignorada, não recorta', () => {
    const detections = [{ score: 0.05, box: { xmin: 100, ymin: 100, xmax: 200, ymax: 200 } }]
    expect(computeCropBox(detections, 800, 600)).toBeNull()
  })

  it('uma detecção confiável gera caixa com margem, limitada às bordas da imagem', () => {
    const detections = [{ score: 0.5, box: { xmin: 100, ymin: 100, xmax: 300, ymax: 300 } }]
    const box = computeCropBox(detections, 800, 600)
    expect(box).not.toBeNull()
    const [xmin, ymin, xmax, ymax] = box!
    // margem de 6% da largura/altura da caixa (200px) = 12px de cada lado
    expect(xmin).toBe(88)
    expect(ymin).toBe(88)
    expect(xmax).toBe(312)
    expect(ymax).toBe(312)
  })

  it('duas detecções confiáveis geram a caixa UNIÃO das duas (composição de mais de uma peça)', () => {
    const detections = [
      { score: 0.5, box: { xmin: 50, ymin: 50, xmax: 150, ymax: 150 } },
      { score: 0.4, box: { xmin: 400, ymin: 60, xmax: 500, ymax: 160 } },
    ]
    const box = computeCropBox(detections, 800, 600)
    expect(box).not.toBeNull()
    const [xmin, ymin, xmax, ymax] = box!
    // união bruta seria [50,50,500,160] + margem de 6% de (450x110)
    expect(xmin).toBeLessThan(50)
    expect(ymin).toBeLessThan(50)
    expect(xmax).toBeGreaterThan(500)
    expect(ymax).toBeGreaterThan(160)
  })

  it('nunca extrapola as bordas da imagem mesmo com margem', () => {
    const detections = [{ score: 0.9, box: { xmin: 0, ymin: 0, xmax: 800, ymax: 600 } }]
    const box = computeCropBox(detections, 800, 600)
    expect(box).toEqual([0, 0, 800, 600])
  })
})
