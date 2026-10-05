// A small tile of film grain: transparent, with faint dark and light specks. Tiled over the
// whole site at very low strength, it gives flat colour the tooth of printed paper.
import sharp from 'sharp'
const S = 180
const px = Buffer.alloc(S * S * 4)
let s = 12345
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
for (let i = 0; i < S * S; i++) {
  const v = rnd()
  const dark = v < 0.5
  const a = Math.round(Math.abs(v - 0.5) * 2 * 30) // 0..30 of 255
  px[i * 4] = dark ? 43 : 255
  px[i * 4 + 1] = dark ? 29 : 248
  px[i * 4 + 2] = dark ? 14 : 230
  px[i * 4 + 3] = a
}
await sharp(px, { raw: { width: S, height: S, channels: 4 } }).png({ compressionLevel: 9 }).toFile('public/media/grain.png')
console.log('grain.png')
