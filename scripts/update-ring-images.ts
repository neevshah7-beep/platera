/**
 * After a ring's main cut-out (assets/prepared/<SKU>-01.png) is replaced, sets its main image
 * row's width, height and lqip to the new picture's (from src/data/media-manifest.json).
 * Touches only the index-1 image of the SKUs given; nothing else is changed.
 *
 *   npx tsx scripts/update-ring-images.ts --hosted [--dry-run] PLT-RNG-001 PLT-RNG-002 ...
 *   npx tsx scripts/update-ring-images.ts --hosted [--dry-run] --range 1-21
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import manifest from '../src/data/media-manifest.json'

const args = process.argv.slice(2)
const hosted = args.includes('--hosted')
const dryRun = args.includes('--dry-run')
const range = args[args.indexOf('--range') + 1]
const skus = args.includes('--range')
  ? (() => {
      const [a, b] = range.split('-').map(Number)
      return Array.from({ length: b - a + 1 }, (_, k) => `PLT-RNG-${String(a + k).padStart(3, '0')}`)
    })()
  : args.filter((a) => a.startsWith('PLT-'))
const url = hosted
  ? readFileSync('.env.neon', 'utf8').trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '').replace('-pooler', '') + '&connect_timeout=30'
  : process.env.DATABASE_URL ?? ''
const db = new PrismaClient({ datasources: { db: { url } } })

async function main() {
  for (const sku of skus) {
    const m = (manifest as Record<string, { width: number; height: number; lqip: string }>)[`${sku}-01`]
    if (!m) throw new Error(`No processed image for ${sku}-01`)
    const p = await db.product.findUnique({ where: { sku }, include: { images: { where: { index: 1 } } } })
    const img = p?.images[0]
    if (!img) {
      console.log('no main image row, skipped:', sku)
      continue
    }
    console.log(sku, `${img.width}x${img.height} -> ${m.width}x${m.height}`, dryRun ? '(dry run)' : '')
    if (!dryRun) await db.productImage.update({ where: { id: img.id }, data: { width: m.width, height: m.height, lqip: m.lqip } })
  }
}
main().finally(() => db.$disconnect())
