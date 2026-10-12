import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { getProduct } from '@/lib/catalogue'

/**
 * The card a shared piece shows. WhatsApp, where every sale begins, wants a JPEG of modest
 * weight, so the piece's own photograph is laid on the viewing room's warm bronze, where
 * silver reads clearly, with the house name beneath, at 1200 × 630.
 */
const W = 1200
const H = 630
const GROUND = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="44%" r="75%"><stop offset="0" stop-color="#96703b"/><stop offset="0.6" stop-color="#6a4c24"/><stop offset="1" stop-color="#553b1a"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="#e2c47c" stroke-opacity="0.55" stroke-width="1.5"/><text x="${W / 2}" y="${H - 50}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="26" letter-spacing="12" fill="#f4e2b4">PLATERA</text></svg>`,
)

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug)
  const image = product?.images[0]
  if (!image) return new Response(null, { status: 404 })
  let source: Buffer
  try {
    source = image.src.startsWith('http')
      ? Buffer.from(await (await fetch(`${image.src}-960.webp`)).arrayBuffer())
      : await readFile(path.join(process.cwd(), 'public', 'media', `${image.src}-960.webp`)).catch(async () =>
          Buffer.from(await (await fetch(new URL(`/media/${image.src}-960.webp`, req.url))).arrayBuffer()),
        )
  } catch {
    return new Response(null, { status: 404 })
  }
  const piece = await sharp(source).resize(1060, 470, { fit: 'inside' }).toBuffer()
  const card = await sharp(GROUND)
    .composite([{ input: piece, top: 40 + Math.round((470 - ((await sharp(piece).metadata()).height ?? 470)) / 2), left: Math.round((W - ((await sharp(piece).metadata()).width ?? 1060)) / 2) }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer()
  return new Response(new Uint8Array(card), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400' },
  })
}
