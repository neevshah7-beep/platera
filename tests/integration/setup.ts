import { execSync } from 'node:child_process'

export default function setup() {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'postgresql://platera:platera@localhost:5433/platera_test' },
  })
}
