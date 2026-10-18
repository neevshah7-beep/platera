/**
 * Adds the Rings category and the rings in prisma/seed-data/rings.ts to a database.
 * Add-only: a category or ring that already exists (by slug / SKU) is left exactly as
 * it is, and nothing is ever updated or deleted, so it is safe to run more than once.
 *
 *   npx tsx scripts/add-rings.ts                 the database in DATABASE_URL, local only
 *   npx tsx scripts/add-rings.ts --hosted        the hosted database in .env.neon
 *
 * Needs `npm run images` first, for the cut-outs in src/data/media-manifest.json.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import manifest from '../src/data/media-manifest.json'
import { RINGS, RINGS_CATEGORY } from '../prisma/seed-data/rings'

const hosted = process.argv.includes('--hosted')
const url = hosted
  ? readFileSync('.env.neon', 'utf8').trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '')
  : process.env.DATABASE_URL ?? ''
if (!hosted && !/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error('DATABASE_URL is not a local database. Pass --hosted to add to the hosted one on purpose.')
  process.exit(1)
}
const db = new PrismaClient({ datasources: { db: { url } } })

async function main() {
  const category =
    (await db.category.findUnique({ where: { slug: RINGS_CATEGORY.slug } })) ??
    (await db.category.create({ data: { ...RINGS_CATEGORY } }))

  const last = await db.product.aggregate({ _max: { position: true } })
  let position = last._max.position ?? 0
  let added = 0

  for (const r of RINGS) {
    if (await db.product.findFirst({ where: { OR: [{ sku: r.sku }, { slug: r.slug }] } })) {
      console.log('exists, left alone:', r.sku)
      continue
    }
    const name = `${r.sku}-01` as keyof typeof manifest
    const m = manifest[name]
    if (!m) throw new Error(`No processed image for ${name}. Run npm run images.`)
    position += 1
    await db.product.create({
      data: {
        sku: r.sku,
        slug: r.slug,
        name: r.name,
        summary: r.summary,
        description: r.description,
        status: 'PUBLISHED',
        categoryId: category.id,
        metal: 'SILVER_925',
        pricingMode: 'LIVE',
        makingPct: 0,
        netWeightMg: r.netWeightMg,
        weightVerified: r.netWeightMg !== null,
        hallmarked: true,
        stoneType: 'MIXED',
        stock: 1,
        availability: 'IN_STOCK',
        returnable: true,
        position,
        publishedAt: new Date(),
        images: {
          create: {
            kind: 'PHOTO',
            index: 1,
            src: `products/${name}`,
            width: m.width,
            height: m.height,
            lqip: m.lqip,
            alt: `${r.name} in 925 sterling silver`,
          },
        },
      },
    })
    added += 1
    console.log('added', r.sku, r.name)
  }
  console.log(`${added} rings added to ${hosted ? 'the hosted' : 'the local'} database.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
