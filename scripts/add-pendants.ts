/**
 * Adds the Pendants category and the pendants in prisma/seed-data/pendants.ts to a database
 * (scripts/add-rings.ts, pointed at the pendant data).
 * Add-only: a category or ring that already exists (by slug / SKU) is left exactly as
 * it is, and nothing is ever updated or deleted, so it is safe to run more than once.
 * Everything is written in one transaction: if any ring fails, nothing is added.
 *
 *   npx tsx scripts/add-rings.ts [--dry-run]            the database in DATABASE_URL, local only
 *   npx tsx scripts/add-rings.ts --hosted [--dry-run]   the hosted database in .env.neon
 *
 * --dry-run only reads: it lists what would be added and writes nothing.
 * The hosted link is used without "-pooler" (a direct connection, as in hosted-db.mjs),
 * so the transaction runs on one server session. The link is never printed.
 *
 * Needs `npm run images` first, for the cut-outs in src/data/media-manifest.json.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import manifest from '../src/data/media-manifest.json'
import { PENDANTS as RINGS, PENDANTS_CATEGORY as RINGS_CATEGORY } from '../prisma/seed-data/pendants'

const hosted = process.argv.includes('--hosted')
const dryRun = process.argv.includes('--dry-run')
// --pooled keeps Neon's pooler (the address the live site uses), in case the direct
// address can't be reached from this network; pgbouncer=true makes Prisma pooler-safe.
const pooled = process.argv.includes('--pooled')
const withParams = (u: string, extra: string) => u + (u.includes('?') ? '&' : '?') + extra
const hostedUrl = () => {
  const raw = readFileSync('.env.neon', 'utf8').trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '')
  // A sleeping Neon database takes a few seconds to wake; wait up to 30 s, not Prisma's 5.
  return pooled ? withParams(raw, 'pgbouncer=true&connect_timeout=30') : withParams(raw.replace('-pooler', ''), 'connect_timeout=30')
}
const url = hosted ? hostedUrl() : process.env.DATABASE_URL ?? ''
if (!hosted && !/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error('DATABASE_URL is not a local database. Pass --hosted to add to the hosted one on purpose.')
  process.exit(1)
}
const db = new PrismaClient({ datasources: { db: { url } } })
const where = hosted ? 'the hosted' : 'the local'

// Every image is checked before anything is written.
for (const r of RINGS) {
  if (!manifest[`${r.sku}-01` as keyof typeof manifest]) throw new Error(`No processed image for ${r.sku}-01. Run npm run images.`)
}

async function main() {
  const added = await db.$transaction(
    async (tx) => {
      let category = await tx.category.findUnique({ where: { slug: RINGS_CATEGORY.slug } })
      if (category) console.log('category exists, left alone:', category.slug)
      else if (dryRun) console.log('would add category:', RINGS_CATEGORY.slug)
      else {
        category = await tx.category.create({ data: { ...RINGS_CATEGORY } })
        console.log('added category:', category.slug)
      }

      const last = await tx.product.aggregate({ _max: { position: true } })
      let position = last._max.position ?? 0
      const done: string[] = []

      for (const r of RINGS) {
        if (await tx.product.findFirst({ where: { OR: [{ sku: r.sku }, { slug: r.slug }] } })) {
          console.log('exists, left alone:', r.sku)
          continue
        }
        position += 1
        done.push(r.sku)
        if (dryRun || !category) {
          console.log('would add', r.sku, r.name, `(position ${position})`)
          continue
        }
        const name = `${r.sku}-01` as keyof typeof manifest
        const m = manifest[name]
        await tx.product.create({
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
            stoneType: 'NONE',
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
        console.log('added', r.sku, r.name)
      }
      return done
    },
    { timeout: 120_000, maxWait: 20_000 },
  )
  console.log(dryRun ? `Dry run: ${added.length} pendants would be added to ${where} database. Nothing was written.` : `${added.length} pendants added to ${where} database.`)
}

main()
  .catch((e) => {
    console.error(e)
    console.error(`Nothing was added to ${where} database.`)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
