// Gera os ícones do PWA a partir do símbolo oficial da Artimage
// (src/components/ArtimageSymbol.tsx): símbolo creme (#f5f3ef) sobre o fundo
// preto da marca (#0e0d0b). Saída em public/icons/.
//
// Uso: node scripts/generatePwaIcons.mjs
//
// - icon-192.png / icon-512.png: ícones "any" (símbolo ~60% da altura).
// - icon-maskable-512.png: ícone "maskable" — o Android recorta em círculo/
//   quadrado arredondado; o símbolo fica na zona segura (~50% da altura).
// - apple-touch-icon.png (180): iOS/Safari aplica os cantos arredondados sozinho.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public', 'icons')
const BG = '#0e0d0b'
const FG = '#f5f3ef'
// Mesmo caminho de ArtimageSymbol.tsx (viewBox 113.1 x 120).
const SYMBOL_PATH =
  'M40.3 80.9L26.9 120H.9l44-120h25.4l42 119.9H86.7l-46.4-39zm7.8-22.3L73 79.5 57.2 31.9l-9.1 26.7z'
const SYMBOL_W = 113.1
const SYMBOL_H = 120

function svg(size, symbolHeightRatio) {
  const scale = (size * symbolHeightRatio) / SYMBOL_H
  const x = (size - SYMBOL_W * scale) / 2
  const y = (size - SYMBOL_H * scale) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <path fill="${FG}" transform="translate(${x} ${y}) scale(${scale})" d="${SYMBOL_PATH}"/>
</svg>`
}

const targets = [
  { file: 'icon-192.png', size: 192, ratio: 0.6 },
  { file: 'icon-512.png', size: 512, ratio: 0.6 },
  { file: 'icon-maskable-512.png', size: 512, ratio: 0.5 },
  { file: 'apple-touch-icon.png', size: 180, ratio: 0.6 },
]

fs.mkdirSync(OUT, { recursive: true })
for (const { file, size, ratio } of targets) {
  await sharp(Buffer.from(svg(size, ratio))).png().toFile(path.join(OUT, file))
  console.log(`gerado public/icons/${file} (${size}x${size})`)
}
