import { describe, expect, it } from 'vitest'
import {
  averageBytes,
  buildErrorCsv,
  buildExternalId,
  buildStoragePath,
  deriveMetadataFromPath,
  formatBytes,
  projectFromAverage,
  sanitizeExternalId,
} from './bulkUploadLogic'

describe('sanitizeExternalId', () => {
  it('troca espaços, acentos e :: por underscore, mantém barras/pontos/hífens', () => {
    // "::" não está entre os caracteres permitidos (mesma regra do script já validado
    // uploadLocalPhotos.mjs) — vira um único "_", assim como espaço/acento.
    expect(sanitizeExternalId('Fotos::Quadros/leão nº1.jpg')).toBe('Fotos_Quadros/le_o_n_1.jpg')
  })
})

describe('buildStoragePath', () => {
  it('monta caminho sourceId/externalId-saneado.webp', () => {
    expect(buildStoragePath('abc-123', 'Fotos::leão.jpg')).toBe('abc-123/Fotos_le_o.jpg.webp')
  })
})

describe('buildExternalId', () => {
  it('prefixa com o nome da pasta raiz, separado por ::', () => {
    expect(buildExternalId('Fotos 2026', 'Quadros/a.jpg')).toBe('Fotos 2026::Quadros/a.jpg')
  })
})

describe('deriveMetadataFromPath', () => {
  it('usa o nome do arquivo (sem extensão) como título/código, e a subpasta como categoria', () => {
    expect(deriveMetadataFromPath({ relativePath: 'Quadros/leao-preto.jpg', topLevelGroup: 'Quadros' })).toEqual({
      title: 'leao-preto',
      code: 'leao-preto',
      category: 'Quadros',
    })
  })

  it('categoria fica null pra arquivo direto na raiz', () => {
    expect(deriveMetadataFromPath({ relativePath: 'solo.png', topLevelGroup: '' })).toEqual({
      title: 'solo',
      code: 'solo',
      category: null,
    })
  })
})

describe('formatBytes', () => {
  it('mostra KB abaixo de 1MB', () => {
    expect(formatBytes(500 * 1024)).toBe('500 KB')
  })

  it('mostra MB a partir de 1MB', () => {
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })
})

describe('averageBytes / projectFromAverage', () => {
  it('calcula a média de uma amostra', () => {
    expect(averageBytes([100, 200, 300])).toBe(200)
  })

  it('retorna 0 pra amostra vazia', () => {
    expect(averageBytes([])).toBe(0)
  })

  it('projeta o total e o percentual do free tier a partir da média', () => {
    const projection = projectFromAverage(1024 * 1024, 1024) // 1MB * 1024 = 1GB
    expect(projection.avgBytesPerFile).toBe(1024 * 1024)
    expect(projection.projectedBytes).toBe(1024 * 1024 * 1024)
    expect(projection.pctOfFreeTier).toBeCloseTo(100)
  })
})

describe('buildErrorCsv', () => {
  it('monta CSV com cabeçalho e escapa aspas', () => {
    const csv = buildErrorCsv([
      { status: 'error', externalId: 'x', relativePath: 'a/b.jpg', errorStage: 'upload', errorMessage: 'falhou "feio"' },
    ])
    expect(csv).toBe('arquivo,etapa,mensagem\n"a/b.jpg","upload","falhou ""feio"""')
  })

  it('lista vazia gera só o cabeçalho', () => {
    expect(buildErrorCsv([])).toBe('arquivo,etapa,mensagem')
  })
})
