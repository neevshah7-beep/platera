// Local Postgres 16 for development and the integration tests, without Docker.
// Data lives in .pgdata/ (git-ignored). Production uses Neon/Supabase via DATABASE_URL.
import EmbeddedPostgres from 'embedded-postgres'
import { existsSync } from 'node:fs'

const pg = new EmbeddedPostgres({
  databaseDir: './.pgdata',
  user: 'platera',
  password: 'platera',
  port: 5433,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
})

if (!existsSync('./.pgdata/PG_VERSION')) await pg.initialise()
await pg.start()
for (const db of ['platera', 'platera_test']) {
  try { await pg.createDatabase(db) } catch { /* already exists */ }
}
console.log('Postgres 16 ready on postgresql://platera:platera@localhost:5433 (Ctrl+C to stop)')

const stop = async () => { await pg.stop(); process.exit(0) }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
setInterval(() => {}, 1 << 30)
