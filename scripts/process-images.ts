/**
 * Builds the web derivatives for every product photo.
 *
 *   assets/prepared/PLT-{CAT}-{SKU}-{nn}.jpg
 *     → public/media/products/PLT-{CAT}-{SKU}-{nn}-{480|960|1600}.{avif|webp}
 *     → src/data/media-manifest.json  { name: { width, height, lqip } }
 *
 * The manifest gives every <Image> its intrinsic size (zero layout shift) and a
 * 20px blur placeholder. Files that don't follow the naming scheme are refused.
 *
 * Usage: npm run images [-- --force]
 */
import sharp from 'sharp'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const WIDTHS = [480, 960, 1600] as const
const NAME = /^PLT-[A-Z]{3}-\d{3}-(\d{2}|360-\d{2}|model|scale|cert)$/

const SRC = 'assets/prepared'
const OUT = 'public/media/products'
const MANIFEST = 'src/data/media-manifest.json'

async function main() {
  const force = process.argv.includes('--force')
  mkdirSync(OUT, { recursive: true })
  mkdirSync(path.dirname(MANIFEST), { recursive: true })

  const manifest: Record<string, { width: number; height: number; lqip: string }> = {}
  const rejected: string[] = []

  for (const file of readdirSync(SRC).sort()) {
    const name = path.parse(file).name
    if (!NAME.test(name)) {
      rejected.push(file)
      continue
    }
    const input = sharp(path.join(SRC, file)).rotate()
    const { width = 0, height = 0 } = await input.metadata()

    for (const w of WIDTHS) {
      const target = Math.min(w, width)
      const avif = path.join(OUT, `${name}-${w}.avif`)
      const webp = path.join(OUT, `${name}-${w}.webp`)
      if (force || !existsSync(avif)) await input.clone().resize({ width: target }).avif({ quality: 58, effort: 4 }).toFile(avif)
      if (force || !existsSync(webp)) await input.clone().resize({ width: target }).webp({ quality: 80 }).toFile(webp)
    }

    const lqip = await input.clone().resize({ width: 20 }).webp({ quality: 40 }).toBuffer()
    manifest[name] = { width, height, lqip: `data:image/webp;base64,${lqip.toString('base64')}` }
    process.stdout.write('.')
  }

  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`\n${Object.keys(manifest).length} images processed.`)
  if (rejected.length) {
    console.error(`Refused (name must be PLT-{CAT}-{SKU}-{nn}): ${rejected.join(', ')}`)
    process.exitCode = 1
  }
}

main()
