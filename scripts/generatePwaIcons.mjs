// Gera os ícones do PWA e o favicon: uma LUPA com o "A" da Artimage dentro da
// lente, em creme (#f5f3ef) sobre o preto da marca (#0e0d0b). A lupa diz "busca"
// e o conjunto não se confunde com o "A" solto de outros aplicativos.
// Saída: public/icons/*.png e public/favicon.svg.
//
// Uso: node scripts/generatePwaIcons.mjs
//
// - icon-192.png / icon-512.png: ícones "any".
// - icon-maskable-512.png: "maskable" — o Android recorta em círculo/quadrado
//   arredondado; o desenho é reduzido para caber na zona segura (círculo de 80%).
// - apple-touch-icon.png (180): iOS/Safari aplica os cantos arredondados sozinho.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public', 'icons')
const BG = '#0e0d0b'
const FG = '#f5f3ef'
const GLASS = '#1a1813' // lente levemente mais clara que o fundo

// Símbolo oficial (mesmo caminho de ArtimageSymbol.tsx, viewBox 113,1 x 120).
const SYMBOL_PATH =
  'M40.3 80.9L26.9 120H.9l44-120h25.4l42 119.9H86.7l-46.4-39zm7.8-22.3L73 79.5 57.2 31.9l-9.1 26.7z'
const SYMBOL_W = 113.1
const SYMBOL_H = 120

// Geometria em uma tela de 512 x 512. O conjunto (lente + cabo) fica centrado.
const LENS = { cx: 226, cy: 226, r: 130, stroke: 28 }
const HANDLE = { x1: 318, y1: 318, x2: 410, y2: 410, stroke: 44 }
const SYMBOL_HEIGHT = 150 // altura do "A" dentro da lente (raio interno = 116; a diagonal cabe)

function drawing() {
  const k = SYMBOL_HEIGHT / SYMBOL_H
  const sx = LENS.cx - (SYMBOL_W * k) / 2
  const sy = LENS.cy - (SYMBOL_H * k) / 2
  return `
    <circle cx="${LENS.cx}" cy="${LENS.cy}" r="${LENS.r}" fill="${GLASS}" stroke="${FG}" stroke-width="${LENS.stroke}"/>
    <line x1="${HANDLE.x1}" y1="${HANDLE.y1}" x2="${HANDLE.x2}" y2="${HANDLE.y2}" stroke="${FG}" stroke-width="${HANDLE.stroke}" stroke-linecap="round"/>
    <path fill="${FG}" transform="translate(${sx} ${sy}) scale(${k})" d="${SYMBOL_PATH}"/>`
}

/** `scale` encolhe o desenho em torno do centro (zona segura do ícone maskable). */
export function iconSvg(size, scale = 1) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${drawing()}
  </g>
</svg>`
}

const targets = [
  { file: 'icon-192.png', size: 192, scale: 1 },
  { file: 'icon-512.png', size: 512, scale: 1 },
  { file: 'icon-maskable-512.png', size: 512, scale: 0.8 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.92 },
]

fs.mkdirSync(OUT, { recursive: true })
for (const { file, size, scale } of targets) {
  await sharp(Buffer.from(iconSvg(size, scale))).png().toFile(path.join(OUT, file))
  console.log(`gerado public/icons/${file} (${size}x${size})`)
}

fs.writeFileSync(path.join(ROOT, 'public', 'favicon.svg'), iconSvg(64, 0.94) + '\n')
console.log('gerado public/favicon.svg')
