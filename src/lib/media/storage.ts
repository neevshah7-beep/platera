import 'server-only'
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const WIDTHS = [480, 960, 1600] as const

/**
 * Stores a product photograph and its web derivatives. With BLOB_READ_WRITE_TOKEN set
 * (production on Vercel) files go to Vercel Blob; otherwise to public/media for local
 * development. Returns the `src` base that <PieceImage> appends "-{width}.{ext}" to:
 * "products/NAME" locally, or the full Blob URL base in production.
 */
export async function storeProductImage(name: string, input: Buffer) {
  const image = sharp(input).rotate()
  const meta = await image.metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (width < 800 || height < 800) throw new Error(`The photo is ${width}×${height}. Please upload one at least 800 pixels on each side; 2000 or more is better.`)

  const files: { key: string; body: Buffer; type: string }[] = []
  for (const w of WIDTHS) {
    const resized = image.clone().resize({ width: Math.min(w, width) })
    files.push({ key: `products/${name}-${w}.avif`, body: await resized.clone().avif({ quality: 58, effort: 5 }).toBuffer(), type: 'image/avif' })
    files.push({ key: `products/${name}-${w}.webp`, body: await resized.clone().webp({ quality: 80 }).toBuffer(), type: 'image/webp' })
  }
  const lqip = `data:image/webp;base64,${(await image.clone().resize({ width: 20 }).webp({ quality: 40 }).toBuffer()).toString('base64')}`

  let src: string
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    let base = ''
    for (const f of files) {
      const res = await put(f.key, f.body, { access: 'public', contentType: f.type, addRandomSuffix: false, allowOverwrite: true })
      base = res.url.replace(/-\d+\.(avif|webp)$/, '')
    }
    src = base
  } else {
    const dir = path.join(process.cwd(), 'public', 'media', 'products')
    await mkdir(dir, { recursive: true })
    await Promise.all(files.map((f) => writeFile(path.join(process.cwd(), 'public', 'media', f.key), f.body)))
    src = `products/${name}`
  }
  return { src, width, height, lqip }
}

/** PLT-NKS-001-03.jpg → { kind: 'PHOTO', index: 3 }; PLT-NKS-001-360-07.jpg → TURNTABLE 7; -model, -scale. */
export function classifyUpload(filename: string, sku: string): { kind: 'PHOTO' | 'TURNTABLE' | 'MODEL' | 'SCALE'; index: number | null } {
  const stem = path.parse(filename).name.toUpperCase()
  const rest = stem.startsWith(sku.toUpperCase()) ? stem.slice(sku.length) : ''
  let m: RegExpMatchArray | null
  if ((m = rest.match(/^-360-(\d{2})$/))) return { kind: 'TURNTABLE', index: Number(m[1]) }
  if (rest === '-MODEL') return { kind: 'MODEL', index: 1 }
  if (rest === '-SCALE') return { kind: 'SCALE', index: 1 }
  if ((m = rest.match(/^-(\d{2})$/))) return { kind: 'PHOTO', index: Number(m[1]) }
  return { kind: 'PHOTO', index: null }
}
