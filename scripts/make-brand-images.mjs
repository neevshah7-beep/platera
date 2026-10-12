// The house's icons and the card a shared link shows (WhatsApp, Instagram, Google).
// Run once, and again whenever the campaign photograph changes: node scripts/make-brand-images.mjs [shoot-id]
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

const IVORY = '#f8f3ea'
const ESPRESSO = '#2b1d0e'
const GOLD = '#a87a34'
const shoot = process.argv[2] ?? 'merreeda-1'

const mark = (size, pad = 0) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" fill="${IVORY}"/><rect x="${5 + pad}" y="${5 + pad}" width="${54 - pad * 2}" height="${54 - pad * 2}" fill="none" stroke="${GOLD}" stroke-width="0.8"/><text x="32" y="44.5" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${36 - pad * 2}" fill="${ESPRESSO}">P</text></svg>`,
)
await sharp(mark(192)).png().toFile('public/icon-192.png')
await sharp(mark(512, 6)).png().toFile('public/icon-512.png')
await sharp(mark(180)).png().toFile('src/app/apple-icon.png')
await writeFile('src/app/icon.svg', mark(64).toString().replace(' width="64" height="64" viewBox', ' viewBox'))

const W = 1200, H = 630, PHOTO = 500
const photo = await sharp(`public/media/shoot/${shoot}-1600.webp`).resize(PHOTO, H, { fit: 'cover', position: 'attention' }).toBuffer()
const words = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W - PHOTO}" height="${H}"><rect width="100%" height="100%" fill="${IVORY}"/>
  <rect x="48" y="48" width="${W - PHOTO - 96}" height="${H - 96}" fill="none" stroke="${GOLD}" stroke-width="1.5"/>
  <text x="${(W - PHOTO) / 2}" y="290" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="84" letter-spacing="22" fill="${ESPRESSO}">PLATERA</text>
  <rect x="${(W - PHOTO) / 2 - 40}" y="330" width="80" height="1.5" fill="${GOLD}"/>
  <text x="${(W - PHOTO) / 2}" y="388" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="27" letter-spacing="7" fill="${GOLD}">JEWELLERS</text>
  <text x="${(W - PHOTO) / 2}" y="492" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="26" fill="${ESPRESSO}">Hallmarked 925 silver, chosen piece by piece</text>
  <text x="${(W - PHOTO) / 2}" y="532" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" letter-spacing="4" fill="${ESPRESSO}" opacity="0.7">GORAI 1 · BORIVALI WEST · MUMBAI</text></svg>`,
)
await sharp({ create: { width: W, height: H, channels: 3, background: IVORY } })
  .composite([{ input: words, left: 0, top: 0 }, { input: photo, left: W - PHOTO, top: 0 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('src/app/opengraph-image.jpg')
await writeFile('src/app/opengraph-image.alt.txt', 'Platera Jewellers: hallmarked 925 silver jewellery, Gorai 1, Borivali West, Mumbai')
console.log('made icons and share card')
