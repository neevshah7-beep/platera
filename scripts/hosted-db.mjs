// Prepares the hosted database from the local one. Reads the hosted link from .env.neon
// (never printed). Steps: `migrate` applies the schema; `counts` lists local row counts;
// `copy` copies the catalogue tables (never orders, customers or other personal data).
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import pg from 'pg'
const raw = readFileSync('.env.neon', 'utf8').trim().replace(/^DATABASE_URL=/, '').replace(/^['"]|['"]$/g, '')
const direct = raw.replace('-pooler', '')
const LOCAL = 'postgresql://platera:platera@localhost:5433/platera'
const step = process.argv[2]
const SKIP = /^(_prisma_migrations|AdminUser|OtpCode|Order|OrderItem|OrderEvent|Customer|Address|Payment|Refund|Shipment|Appointment|Enquiry|Cart|CartItem|Bag|BagItem|WebhookEvent|Session|Notification|AuditLog|StockHold|Reservation)/
if (step === 'migrate') {
  try { console.log(execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: direct }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).replaceAll(direct, '<hosted>').split('\n').filter((l) => !/neon\.tech/.test(l)).join('\n')) }
  catch (e) { console.log('migrate failed:', String(e.stdout || '').replace(/postgres\S+/g, '<url>').slice(-600), String(e.stderr || '').replace(/postgres\S+/g, '<url>').slice(-600)); process.exit(1) }
} else {
  const local = new pg.Client({ connectionString: process.env.LOCAL_URL ?? LOCAL }); await local.connect()
  const tables = (await local.query(`select tablename from pg_tables where schemaname='public' order by 1`)).rows.map((r) => r.tablename)
  const fks = (await local.query(`select c.conrelid::regclass::text as child, c.confrelid::regclass::text as parent from pg_constraint c where c.contype='f'`)).rows.map((r) => ({ child: r.child.replace(/"/g, ''), parent: r.parent.replace(/"/g, '') }))
  const counts = {}
  for (const t of tables) counts[t] = Number((await local.query(`select count(*) from "${t}"`)).rows[0].count)
  if (step === 'counts') { console.log(tables.map((t) => `${SKIP.test(t) ? 'skip' : 'copy'} ${t} ${counts[t]}`).join('\n')); await local.end(); process.exit(0) }
  const want = tables.filter((t) => !SKIP.test(t))
  const order = []; const seen = new Set()
  const visit = (t) => { if (seen.has(t)) return; seen.add(t); for (const f of fks) if (f.child === t && f.parent !== t && want.includes(f.parent)) visit(f.parent); order.push(t) }
  want.forEach(visit)
  const remote = new pg.Client({ connectionString: direct }); await remote.connect()
  await remote.query('begin')
  for (const t of [...order].reverse()) await remote.query(`delete from "${t}"`)
  for (const t of order) {
    const { rows, fields } = await local.query(`select * from "${t}"`)
    const types = Object.fromEntries((await local.query(`select column_name, data_type from information_schema.columns where table_name=$1`, [t])).rows.map((r) => [r.column_name, r.data_type]))
    for (const row of rows) {
      const cols = fields.map((f) => f.name)
      const vals = cols.map((c) => (row[c] !== null && /json/.test(types[c]) ? JSON.stringify(row[c]) : row[c]))
      await remote.query(`insert into "${t}" (${cols.map((c) => `"${c}"`).join(',')}) values (${cols.map((_, i) => `$${i + 1}`).join(',')})`, vals)
    }
    console.log('copied', t, rows.length)
  }
  await remote.query('commit')
  await remote.end(); await local.end()
}
