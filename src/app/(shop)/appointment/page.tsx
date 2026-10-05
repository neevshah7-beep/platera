import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/catalogue'
import { bookableDates, slotsForDay, takenSlots } from '@/lib/appointments'
import { STORE } from '@/lib/store'
import { AppointmentForm } from './AppointmentForm'

export const metadata: Metadata = {
  title: 'Book a Viewing in Borivali West or on Video',
  description:
    'See any piece in your hand before you decide. Book a time at our store in Gorai 1, Borivali West, or a video call where we show each piece under good light.',
  alternates: { canonical: '/appointment' },
}
export const dynamic = 'force-dynamic'

export default async function AppointmentPage({ searchParams }: { searchParams: Promise<{ piece?: string; kind?: string }> }) {
  const sp = await searchParams
  const closed = ((await getSetting('closedWeekdays')) as number[] | null) ?? []
  const dates = bookableDates(closed)
  const taken = await takenSlots(dates.map((d) => d.value))
  const piece = sp.piece ? await db.product.findUnique({ where: { slug: sp.piece }, select: { slug: true, name: true } }) : null

  return (
    <div className="mx-auto grid max-w-[1440px] gap-16 px-[var(--gutter)] pt-12 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <h1 className="text-step-6">Book a viewing</h1>
        <p className="measure mt-6 text-step-1 text-ink-muted">
          Jewellery should be held before it’s bought. Choose a time to come to the store, or a video call where we bring each piece
          to the light for you.
        </p>
        <dl className="mt-10 space-y-5 text-step--1">
          <div>
            <dt className="text-ink-muted">The store</dt>
            <dd className="mt-1">{STORE.address.line1}, {STORE.address.line2}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Hours</dt>
            <dd className="num mt-1">{STORE.hoursText}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">How it works</dt>
            <dd className="mt-1">We confirm every booking on WhatsApp before the day. There’s no charge and no obligation to buy.</dd>
          </div>
        </dl>
      </div>
      <div className="lg:col-span-7 lg:col-start-6">
        <AppointmentForm
          dates={dates}
          slots={slotsForDay()}
          taken={[...taken]}
          piece={piece}
          defaultKind={sp.kind === 'video' ? 'VIDEO_CALL' : 'STORE_VISIT'}
        />
      </div>
    </div>
  )
}
