/**
 * Seeds categories, the launch pieces and their images, a starting silver rate,
 * the owner's admin account and default settings. Safe to run repeatedly.
 *
 *   npm run db:seed                       pieces seeded as unweighed (not purchasable)
 *   SEED_DEMO_WEIGHTS=1 npm run db:seed   demo weights, marked verified — for reviewing
 *                                         the storefront only, never for production
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { CATEGORIES } from './seed-data/categories'
import { PIECES } from './seed-data/pieces'
import manifest from '../src/data/media-manifest.json'

const db = new PrismaClient()
const demo = process.env.SEED_DEMO_WEIGHTS === '1'

type InventoryRow = { sku: string; display: string; launch: string }

function readInventory(): Map<string, InventoryRow> {
  const [header, ...lines] = readFileSync('assets/inventory.csv', 'utf8').trim().split(/\r?\n/)
  const cols = header.split(',')
  const rows = lines.map((line) => {
    // Notes may contain commas, but they come last; split only the leading fields.
    const parts = line.split(',')
    const row: Record<string, string> = {}
    cols.forEach((c, i) => (row[c] = parts[i] ?? ''))
    row.display = parts[parts.length - 2]
    row.launch = parts[parts.length - 1]
    return row as unknown as InventoryRow
  })
  return new Map(rows.map((r) => [r.sku, r]))
}

async function main() {
  const inventory = readInventory()

  for (const c of CATEGORIES) {
    await db.category.upsert({ where: { slug: c.slug }, update: { ...c }, create: { ...c } })
  }
  const categories = new Map((await db.category.findMany()).map((c) => [c.slug, c.id]))

  let position = 0
  for (const p of PIECES) {
    const inv = inventory.get(p.sku)
    if (!inv || inv.launch !== 'yes') continue
    position += 1
    const [cat, num] = p.sku.split('-')
    const sku = `PLT-${cat}-${num}`

    const data = {
      slug: p.slug,
      name: p.name,
      summary: p.summary,
      description: p.description,
      categoryId: categories.get(p.category)!,
      status: 'PUBLISHED' as const,
      metal: 'SILVER_925' as const,
      pricingMode: 'LIVE' as const,
      finish: p.finish ?? null,
      makingPct: 15,
      netWeightMg: demo ? p.demoWeightMg : null,
      grossWeightMg: demo ? p.demoWeightMg + 400 : null,
      weightVerified: demo,
      hallmarked: true,
      stoneType: p.stoneType,
      stoneDetails: p.stoneDetails ?? null,
      returnable: p.returnable ?? true,
      returnNote: p.returnNote ?? null,
      featured: p.featured ?? false,
      position,
      stock: 1,
      publishedAt: new Date(),
    }

    const product = await db.product.upsert({ where: { sku }, update: data, create: { sku, ...data } })

    await db.productImage.deleteMany({ where: { productId: product.id } })
    const indices = inv.display.split('|')
    for (const [i, idx] of indices.entries()) {
      const name = `${sku}-${idx}` as keyof typeof manifest
      const m = manifest[name]
      if (!m) throw new Error(`No processed image for ${name}. Run npm run images.`)
      await db.productImage.create({
        data: {
          productId: product.id,
          kind: 'PHOTO',
          index: i + 1,
          src: `products/${name}`,
          width: m.width,
          height: m.height,
          lqip: m.lqip,
          alt:
            i === 0
              ? `${p.name} in ${p.finish ? `${p.finish.toLowerCase()} ` : ''}925 sterling silver, laid flat on a dark surface`
              : `${p.name}, another view`,
        },
      })
    }
  }

  const hasRate = await db.metalRate.count({ where: { metal: 'SILVER_925' } })
  if (!hasRate) {
    await db.metalRate.create({
      data: { metal: 'SILVER_925', paisePerGram: 16_000, note: 'Starting rate from setup. Replace with today’s rate.' },
    })
  }

  const ownerEmail = process.env.ADMIN_OWNER_EMAIL
  if (ownerEmail) {
    await db.adminUser.upsert({
      where: { email: ownerEmail.toLowerCase() },
      update: { role: 'OWNER', active: true },
      create: { email: ownerEmail.toLowerCase(), name: 'Owner', role: 'OWNER' },
    })
  }

  const settings: Record<string, unknown> = {
    shipping: { flatPaise: 0, freeAbovePaise: 0, note: 'Delivery across India by courier' },
    buyback: { deductionPct: null, text: 'Buyback is available under Platera’s buyback policy. Ask us for the current terms.' },
    hero: {
      productSku: 'PLT-NKS-005',
      heading: 'Enter the House of Platera.',
      body: 'Hallmarked 925 silver, chosen piece by piece, weighed and priced in the open. Scroll to walk through the rooms.',
    },
  }
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value: value as object } })
  }

  const count = await db.product.count({ where: { status: 'PUBLISHED' } })
  console.log(`Seeded ${count} published pieces${demo ? ' with DEMO weights' : ' (unweighed)'}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
