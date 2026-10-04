import 'server-only'
import { headers } from 'next/headers'

/**
 * Fixed-window rate limit per client IP and action. In-memory, which suits a single
 * Vercel region at this shop's traffic; swap the Map for Upstash Redis
 * (UPSTASH_REDIS_REST_URL) if the site ever runs on several instances.
 */
const windows = new Map<string, { count: number; resetAt: number }>()

export async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'local'
}

export async function rateLimit(action: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `${action}:${await clientIp()}`
  const now = Date.now()
  const w = windows.get(key)
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    if (windows.size > 10_000) for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k)
    return true
  }
  w.count += 1
  return w.count <= limit
}
