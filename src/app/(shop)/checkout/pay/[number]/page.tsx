import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { checkOrderToken } from '@/lib/orders/token'
import { paymentsConfigured, simulatedPayments } from '@/lib/payments/razorpay'
import { formatINR } from '@/lib/pricing/format'
import { PayLauncher } from './PayLauncher'

export const metadata: Metadata = { title: 'Payment', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function PayPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params
  const { t } = await searchParams
  const order = await db.order.findUnique({ where: { number } })
  if (!order || !checkOrderToken(order.id, t)) notFound()
  if (order.paymentStatus !== 'PENDING' && order.paymentStatus !== 'FAILED') redirect(`/order/${order.number}?t=${t}`)

  return (
    <div className="mx-auto max-w-[720px] px-[var(--gutter)] py-20">
      <p className="num text-step--1 text-ink-muted">Order {order.number}</p>
      <h1 className="mt-2 text-step-5">Secure payment</h1>
      <p className="num mt-6 font-display text-step-4">{formatINR(order.totalPaise)}</p>
      <p className="measure mt-4 text-ink-muted">
        Razorpay’s payment window will open. Pay by UPI, card or net banking. We never see your card or bank details.
      </p>
      <PayLauncher
        mode={paymentsConfigured() ? 'razorpay' : simulatedPayments() ? 'simulate' : 'unavailable'}
        keyId={process.env.RAZORPAY_KEY_ID ?? ''}
        razorpayOrderId={order.razorpayOrderId}
        amountPaise={order.totalPaise}
        orderNumber={order.number}
        token={t!}
        prefill={{ name: order.name, email: order.email, contact: `+91${order.phone}` }}
      />
    </div>
  )
}
