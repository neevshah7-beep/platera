import 'server-only'
import { db } from '@/lib/db'
import { STORE } from '@/lib/store'

/** Hour-long viewings starting on the hour inside each of the store's two sittings. */
export function slotsForDay(): string[] {
  const out: string[] = []
  for (const h of STORE.hours) {
    const [open] = h.opens.split(':').map(Number)
    const [close] = h.closes.split(':').map(Number)
    for (let hour = open; hour + 1 <= close; hour++) out.push(`${String(hour).padStart(2, '0')}:00`)
  }
  return out
}

/** Today's date in India as YYYY-MM-DD. */
export function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now)
}

export function bookableDates(closedWeekdays: number[] = [], days = 21, now = new Date()): { value: string; label: string }[] {
  const start = new Date(`${todayInIndia(now)}T00:00:00Z`)
  const fmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  const out: { value: string; label: string }[] = []
  // Same-day bookings aren't offered: the store needs time to set pieces aside.
  for (let i = 1; out.length < days && i < days * 2; i++) {
    const d = new Date(start.getTime() + i * 86_400_000)
    if (closedWeekdays.includes(d.getUTCDay())) continue
    out.push({ value: d.toISOString().slice(0, 10), label: fmt.format(d) })
  }
  return out
}

export async function takenSlots(dates: string[]): Promise<Set<string>> {
  const rows = await db.appointment.findMany({
    where: { date: { in: dates.map((d) => new Date(`${d}T00:00:00Z`)) }, status: { in: ['REQUESTED', 'CONFIRMED'] } },
    select: { date: true, slot: true },
  })
  return new Set(rows.map((r) => `${r.date.toISOString().slice(0, 10)} ${r.slot}`))
}
