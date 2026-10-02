import { describe, expect, it } from 'vitest'
import { isAcrylic } from './acrylicRule'

describe('isAcrylic', () => {
  it('código terminado em AC (e variações com cor/acabamento)', () => {
    for (const title of [
      'LN1188A-1515-AC',
      'GB038A-151515-ACGR',
      'CL056A-2530-CX.AC',
      'MP1056A-2525-ACDB-VM',
      'BD218A-1818P-ACBR-L',
      'KJ261A-4030-AC-BR-CV',
      'MP1050E-7070-AC-AMB',
      'cn245a-2525cx.acdob',
    ]) {
      expect(isAcrylic({ title }), title).toBe(true)
    }
  })

  it('AC no início do código (inicial de autor) não conta', () => {
    for (const title of ['AC03-80100', 'AC110014A', 'AD - AC-F', 'AD1209395A-AC103118']) {
      expect(isAcrylic({ title }), title).toBe(false)
    }
  })

  it('objetos e outros materiais não são acrílico', () => {
    for (const title of ['IB026A-2508-OBJT', 'KJ455A-1515-OBJ', 'TA050A-PEND-COMP', 'IB226A-1712-CV', 'GVI-ATY2032A-2828-1']) {
      expect(isAcrylic({ title }), title).toBe(false)
    }
  })

  it('pasta Artsy_ACRILICO e categoria Colecionáveis do site', () => {
    expect(isAcrylic({ title: 'IAC-ATY2000X-2525', storagePath: 'u/Artsy_ACRILICO/JPEG/IAC-ATY2000X-2525.jpg.webp' })).toBe(true)
    expect(isAcrylic({ title: 'Qualquer nome', sourceCategory: 'Colecionáveis' })).toBe(true)
    expect(isAcrylic({ title: 'Qualquer nome', sourceCategory: 'Quadros' })).toBe(false)
  })
})
