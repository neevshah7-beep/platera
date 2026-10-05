import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { checkOrderToken } from '@/lib/orders/token'
import { paymentsConfigured, simulatedPayments } from '@/lib/payments/razorpay'
import { formatINR } from '@/lib/pricing/format'
import { CeremonyPay } from './CeremonyPay'

export const metadata: Metadata = { title: 'Payment', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function PayPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params
  const { t } = await searchParams
  const order = await db.order.findUnique({ where: { number }, })
  if (!order || !checkOrderToken(order.id, t)) notFound()
  if (order.paymentStatus !== 'PENDING' && order.paymentStatus !== 'FAILED') redirect(`/order/${order.number}?t=${t}`)

  return (
    <CeremonyPay
      ceremony={{ total: formatINR(order.totalPaise) }}
      launcher={{
        mode: paymentsConfigured() ? 'razorpay' : simulatedPayments() ? 'simulate' : 'unavailable',
        keyId: process.env.RAZORPAY_KEY_ID ?? '',
        razorpayOrderId: order.razorpayOrderId,
        amountPaise: order.totalPaise,
        orderNumber: order.number,
        token: t!,
        prefill: { name: order.name, email: order.email, contact: `+91${order.phone}` },
      }}
    />
  )
}
