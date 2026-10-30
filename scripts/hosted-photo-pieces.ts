/**
 * The hosted catalogue for the photograph rooms (2026-10-30), in one transaction:
 *  · Rings category: title and description now cover men's rings too.
 *  · Bangles category added, if missing.
 *  · Rings (prisma/seed-data/rings.ts) and bangles (bangles.ts) added where the SKU is missing,
 *    as scripts/add-rings.ts adds them.
 *  · Every ring, pendant and bangle: main image row (index 1) set to the new framed
 *    photograph's width, height and placeholder (src/data/media-manifest.json).
 * Add and update only: nothing is deleted. Writes nothing with --dry-run.
 *
 *   npx tsx scripts/hosted-photo-pieces.ts [--dry-run]
 *
 * Connects to the hosted database in .env.neon with node-postgres. Certificates are verified
 * as normal; the host's address is looked up through public DNS (8.8.8.8, 1.1.1.1) because
 * this machine's own DNS has been failing to resolve Neon's host names. The link is never printed.
 */
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import dns from 'node:dns'
import net from 'node:net'
import pg from 'pg'
import manifest from '../src/data/media-manifest.json'
import { RINGS, RINGS_CATEGORY } from '../prisma/seed-data/rings'
import { BANGLES, BANGLES_CATEGORY } from '../prisma/seed-data/bangles'
import { PENDANTS } from '../prisma/seed-data/pendants'

const dryRun = process.argv.includes('--dry-run')
const raw = readFileSync('.env.neon', 'utf8').trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '')
const url = new URL(raw)
url.hostname = url.hostname.replace('-pooler', '') // a direct session for the transaction
const host = url.hostname

const resolver = new dns.Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])
const lookup: net.LookupFunction = (hostname, options, cb) =>
  resolver.resolve4(hostname, (err, addrs) => {
    if (err || !addrs.length) return dns.lookup(hostname, options, cb)
    if ((options as dns.LookupOptions).all) return (cb as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, addrs.map((address) => ({ address, family: 4 })))
    cb(null, addrs[0], 4)
  })
class PublicDnsSocket extends net.Socket {
  connect(...args: unknown[]): this {
    const [port, h] = args as [number, string]
    return super.connect({ port, host: h, lookup })
  }
}

const client = new pg.Client({
  host,
  port: Number(url.port || 5432),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true, servername: host },
  stream: () => new PublicDnsSocket(),
  connectionTimeoutMillis: 30_000,
})

const id = () => 'c' + randomBytes(12).toString('hex')
type M = { width: number; height: number; lqip: string }
const m = (sku: string) => {
  const e = (manifest as Record<string, M>)[`${sku}-01`]
  if (!e) throw new Error(`No processed image for ${sku}-01. Run npm run images.`)
  return e
}

async function main() {
  for (const r of [...RINGS, ...BANGLES, ...PENDANTS]) m(r.sku) // every image checked first
  await client.connect()
  await client.query('BEGIN')
  try {
    const cats = new Map((await client.query('SELECT id, slug FROM "Category"')).rows.map((r: { id: string; slug: string }) => [r.slug as string, r.id as string]))

    console.log('rings category: title and description for men and women')
    await client.query('UPDATE "Category" SET "seoTitle" = $1, "seoDescription" = $2 WHERE slug = $3', [RINGS_CATEGORY.seoTitle, RINGS_CATEGORY.seoDescription, 'rings'])

    if (!cats.has('bangles')) {
      const cid = id()
      console.log('add category: bangles')
      await client.query('INSERT INTO "Category" (id, slug, name, summary, guide, "seoTitle", "seoDescription", position) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [cid, BANGLES_CATEGORY.slug, BANGLES_CATEGORY.name, BANGLES_CATEGORY.summary, BANGLES_CATEGORY.guide, BANGLES_CATEGORY.seoTitle, BANGLES_CATEGORY.seoDescription, BANGLES_CATEGORY.position])
      cats.set('bangles', cid)
    } else console.log('category exists, left alone: bangles')

    const existing = new Set((await client.query('SELECT sku FROM "Product"')).rows.map((r: { sku: string }) => r.sku as string))
    const slugs = new Set((await client.query('SELECT slug FROM "Product"')).rows.map((r: { slug: string }) => r.slug as string))
    let position = (await client.query('SELECT COALESCE(MAX(position), 0) AS p FROM "Product"')).rows[0].p as number
    let added = 0
    for (const [list, cat] of [[RINGS, 'rings'], [BANGLES, 'bangles']] as const) {
      for (const r of list) {
        if (existing.has(r.sku)) continue
        if (slugs.has(r.slug)) throw new Error(`Slug taken by another product: ${r.slug}`)
        const pid = id()
        const e = m(r.sku)
        position += 1
        added += 1
        await client.query(
          `INSERT INTO "Product" (id, sku, slug, name, summary, description, status, "categoryId", metal, "pricingMode", "makingPct", "netWeightMg", "weightVerified", hallmarked, "stoneType", stock, availability, returnable, position, "publishedAt", "createdAt", "updatedAt")
           VALUES ($1,$2,$3,$4,$5,$6,'PUBLISHED',$7,'SILVER_925','LIVE',0,$8,$9,true,'MIXED',1,'IN_STOCK',true,$10,now(),now(),now())`,
          [pid, r.sku, r.slug, r.name, r.summary, r.description, cats.get(cat), r.netWeightMg, r.netWeightMg !== null, position],
        )
        await client.query('INSERT INTO "ProductImage" (id, "productId", kind, index, src, width, height, alt, lqip) VALUES ($1,$2,\'PHOTO\',1,$3,$4,$5,$6,$7)', [id(), pid, `products/${r.sku}-01`, e.width, e.height, `${r.name} in 925 sterling silver`, e.lqip])
      }
    }
    console.log(`${added} pieces to add`)

    let updated = 0
    for (const r of [...RINGS, ...PENDANTS, ...BANGLES]) {
      const e = m(r.sku)
      const res = await client.query(
        `UPDATE "ProductImage" i SET width = $1, height = $2, lqip = $3 FROM "Product" p
          WHERE i."productId" = p.id AND p.sku = $4 AND i.kind = 'PHOTO' AND i.index = 1`,
        [e.width, e.height, e.lqip, r.sku],
      )
      updated += res.rowCount ?? 0
    }
    console.log(`${updated} main images given their framed photograph's size`)

    if (dryRun) {
      await client.query('ROLLBACK')
      console.log('Dry run: rolled back. Nothing was written.')
    } else {
      await client.query('COMMIT')
      console.log('Committed.')
    }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  console.error('Nothing was written to the hosted database.')
  process.exit(1)
})
