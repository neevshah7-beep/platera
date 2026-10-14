// Copies the category copy (titles, descriptions, guides) from prisma/seed-data into a
// database. node scripts/sync-categories.mjs [hosted]   — hosted reads .env.neon.
import { readFileSync } from 'node:fs'
import pg from 'pg'
const src = readFileSync('prisma/seed-data/categories.ts', 'utf8').replace(/^export const CATEGORIES = /m, 'return ').replace(/ as const\s*$/m, '')
const CATEGORIES = new Function(src)()
const url = process.argv[2] === 'hosted'
  ? readFileSync('.env.neon', 'utf8').trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '').replace('-pooler', '')
  : 'postgresql://platera:platera@localhost:5433/platera'
const db = new pg.Client({ connectionString: url }); await db.connect()
for (const c of CATEGORIES) {
  const r = await db.query('update "Category" set "seoTitle"=$2, "seoDescription"=$3, guide=$4, summary=$5 where slug=$1', [c.slug, c.seoTitle, c.seoDescription, c.guide, c.summary])
  console.log(c.slug, r.rowCount, c.seoTitle.length, c.seoDescription.length)
}
await db.end()
