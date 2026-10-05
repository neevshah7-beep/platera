import { STATUS_LABEL } from '@/lib/orders/labels'
import Link from 'next/link'
import type { OrderStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/admin'
import { formatINRWhole } from '@/lib/pricing/format'


const TABS: [string, string][] = [
  ['CONFIRMED', 'To pack'],
  ['PACKED', 'Packed'],
  ['SHIPPED', 'Shipped'],
  ['RETURN_REQUESTED', 'Returns'],
  ['all', 'All paid'],
]

const date = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin()
  const { status = 'CONFIRMED' } = await searchParams
  const orders = await db.order.findMany({
    where: status === 'all' ? { status: { not: 'PENDING_PAYMENT' } } : { status: status as OrderStatus },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { items: { select: { name: true } } },
  })

  return (
    <div>
      <h1 className="text-step-4">Orders</h1>
      <nav aria-label="Order status" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-step--1">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin/orders?status=${k}`} aria-current={status === k ? 'true' : undefined} className={status === k ? 'underline underline-offset-4' : 'text-ink-light-muted'}>
            {label}
          </Link>
        ))}
      </nav>
      {orders.length ? (
        <ul className="mt-6">
          {orders.map((o) => (
            <li key={o.id} className="border-b border-rule-light">
              <Link href={`/admin/orders/${o.id}`} className="grid gap-1 py-4 hover:bg-[rgb(11_36_32/0.04)] sm:grid-cols-[10rem_1fr_8rem_9rem] sm:items-baseline sm:gap-4">
                <span className="num">{o.number}</span>
                <span>
                  {o.name} <span className="text-ink-light-muted">· {o.items.map((i) => i.name).join(', ')}</span>
                </span>
                <span className="num sm:text-right">{formatINRWhole(o.totalPaise)}</span>
                <span className="text-step--1 text-ink-light-muted sm:text-right">{STATUS_LABEL[o.status]} · {date.format(o.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-ink-light-muted">Nothing here right now.</p>
      )}
    </div>
  )
}
