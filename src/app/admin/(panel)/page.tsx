import Link from 'next/link'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/admin'
import { getCurrentRates } from '@/lib/catalogue'
import { todayInIndia } from '@/lib/appointments'
import { formatINR } from '@/lib/pricing/format'
import { RateForm } from './RateForm'

const when = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

export default async function AdminToday({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireAdmin()
  const { denied } = await searchParams
  const today = new Date(`${todayInIndia()}T00:00:00Z`)
  const [rates, lastRate, toPack, apptsToday, apptsToConfirm, newEnquiries, unweighed, services] = await Promise.all([
    getCurrentRates(),
    db.metalRate.findFirst({ where: { metal: 'SILVER_925' }, orderBy: { effectiveAt: 'desc' }, include: { setBy: true } }),
    db.order.count({ where: { status: 'CONFIRMED' } }),
    db.appointment.count({ where: { date: today, status: { in: ['REQUESTED', 'CONFIRMED'] } } }),
    db.appointment.count({ where: { status: 'REQUESTED' } }),
    db.enquiry.count({ where: { status: 'NEW' } }),
    db.product.count({ where: { status: 'PUBLISHED', pricingMode: 'LIVE', weightVerified: false } }),
    db.serviceRequest.count({ where: { status: { in: ['RECEIVED', 'QUOTED', 'IN_PROGRESS', 'READY'] } } }),
  ])
  const silver = rates.SILVER_925
  const setToday = lastRate && todayInIndia(lastRate.effectiveAt) === todayInIndia()

  const tiles = [
    { n: toPack, label: toPack === 1 ? 'order to pack' : 'orders to pack', href: '/admin/orders?status=CONFIRMED' },
    { n: apptsToday, label: apptsToday === 1 ? 'appointment today' : 'appointments today', href: '/admin/appointments' },
    { n: apptsToConfirm, label: 'to confirm', href: '/admin/appointments?status=REQUESTED' },
    { n: newEnquiries, label: newEnquiries === 1 ? 'new enquiry' : 'new enquiries', href: '/admin/enquiries' },
    { n: services, label: 'repairs in progress', href: '/admin/services' },
    ...(user.role === 'OWNER' ? [{ n: unweighed, label: unweighed === 1 ? 'piece to weigh' : 'pieces to weigh', href: '/admin/products?filter=unweighed' }] : []),
  ]

  return (
    <div className="space-y-16">
      {denied && <p role="alert" className="border-l-2 border-garnet pl-4">That page is for the owner only.</p>}

      {user.role === 'OWNER' && (
        <section aria-labelledby="rate-h" className="max-w-2xl">
          <h1 id="rate-h" className="text-step-4">Today’s silver rate</h1>
          <p className="mt-2 text-ink-light-muted">
            {silver ? (
              <>
                Now <span className="num">{formatINR(silver.paisePerGram)}</span> per gram, set {when.format(silver.effectiveAt)}
                {lastRate?.setBy ? ` by ${lastRate.setBy.name}` : ''}.{' '}
                {!setToday && <strong className="font-medium text-garnet">Not yet updated today.</strong>}
              </>
            ) : (
              'No rate set yet. Pieces can’t be priced until you set one.'
            )}
          </p>
          <div className="mt-8">
            <RateForm currentRupees={silver ? (silver.paisePerGram / 100).toFixed(2) : ''} />
          </div>
        </section>
      )}

      <section aria-labelledby="today-h">
        <h2 id="today-h" className="text-step-3">{user.role === 'OWNER' ? 'Waiting for you' : `Good day, ${user.name.split(' ')[0]}`}</h2>
        <ul className="mt-6 grid grid-cols-2 gap-px bg-rule-light sm:grid-cols-3">
          {tiles.map((t) => (
            <li key={t.href} className="bg-alabaster">
              <Link href={t.href} className="block p-5 hover:bg-[rgb(14_13_12/0.03)]">
                <span className={`num block font-display text-step-5 ${t.n ? '' : 'text-ink-light-muted'}`}>{t.n}</span>
                <span className="text-step--1 text-ink-light-muted">{t.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
