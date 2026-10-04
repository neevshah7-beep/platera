import 'server-only'
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { AdminRole } from '@prisma/client'
import { db } from '@/lib/db'

/**
 * Admin sign-in: a six-digit code sent to an approved email address. No passwords.
 * Codes are stored hashed, expire in 10 minutes and allow 5 attempts. Sessions are
 * random tokens in an httpOnly cookie, stored hashed, lasting 12 hours.
 */
const COOKIE = 'plt_admin'
const AUDIENCE = 'admin'
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

export async function issueAdminCode(email: string): Promise<{ code: string } | null> {
  const user = await db.adminUser.findUnique({ where: { email: email.toLowerCase() } })
  if (!user || !user.active) return null
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await db.otpCode.create({
    data: { identifier: user.email, audience: AUDIENCE, codeHash: sha(`${user.email}:${code}`), expiresAt: new Date(Date.now() + 10 * 60_000) },
  })
  return { code }
}

export async function verifyAdminCode(email: string, code: string): Promise<boolean> {
  const identifier = email.toLowerCase()
  const otp = await db.otpCode.findFirst({
    where: { identifier, audience: AUDIENCE, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!otp || otp.attempts >= 5) return false
  await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
  const a = Buffer.from(otp.codeHash)
  const b = Buffer.from(sha(`${identifier}:${code.trim()}`))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false

  await db.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
  const user = await db.adminUser.findUniqueOrThrow({ where: { email: identifier } })
  const token = randomBytes(32).toString('base64url')
  await db.session.create({
    data: { tokenHash: sha(token), audience: AUDIENCE, subjectId: user.id, expiresAt: new Date(Date.now() + 12 * 3600_000) },
  })
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 12 * 3600,
  })
  return true
}

export const currentAdmin = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const session = await db.session.findUnique({ where: { tokenHash: sha(token) } })
  if (!session || session.audience !== AUDIENCE || session.expiresAt < new Date()) return null
  const user = await db.adminUser.findUnique({ where: { id: session.subjectId } })
  return user?.active ? user : null
})

/** Use at the top of every admin page and server action. Staff can't reach owner-only screens. */
export async function requireAdmin(role: AdminRole = 'STAFF') {
  const user = await currentAdmin()
  if (!user) redirect('/admin/login')
  if (role === 'OWNER' && user.role !== 'OWNER') redirect('/admin?denied=1')
  return user
}

export async function signOutAdmin() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) await db.session.deleteMany({ where: { tokenHash: sha(token) } })
  jar.delete(COOKIE)
}

export async function audit(actorId: string, action: string, entity: string, entityId?: string, data?: object) {
  await db.auditLog.create({ data: { actorId, action, entity, entityId, data: data as object | undefined } })
}
