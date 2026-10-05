import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { checkOrderToken } from '@/lib/orders/token'
import { paymentsConfigured, simulatedPayments } from '@/lib/payments/razorpay'
import { formatINR } from '@/lib/pricing/format'
import { mediaBase } from '@/components/media/PieceImage'
import maps from '@/data/maps-manifest.json'
import { checkServiceability, shiprocketConfigured } from '@/lib/shipping/shiprocket'
import { CeremonyPay } from './CeremonyPay'

export const metadata: Metadata = { title: 'Payment', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function PayPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params
  const { t } = await searchParams
  const order = await db.order.findUnique({ where: { number }, include: { items: { include: { product: { include: { images: { orderBy: { index: 'asc' } } } } } } } })
  if (!order || !checkOrderToken(order.id, t)) notFound()
  if (order.paymentStatus !== 'PENDING' && order.paymentStatus !== 'FAILED') redirect(`/order/${order.number}?t=${t}`)

  const address = order.shippingAddress as { city?: string; state?: string; pincode?: string }
  const pincode = address.pincode ?? ''
  // Delivery estimate: Shiprocket's own when connected; otherwise by distance from Mumbai.
  let days: [number, number] = address.state === 'Maharashtra' ? [2, 4] : [4, 7]
  if (shiprocketConfigured() && pincode) {
    const s = await checkServiceability(pincode).catch(() => null)
    if (s?.etdDays) days = [s.etdDays, s.etdDays + 1]
  }
  const fmt = (d: number) => new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(Date.now() + d * 86_400_000))
  const pieces = order.items.flatMap((it) => {
    const img = it.product.images.find((i) => i.kind === 'PHOTO')
    if (!img) return []
    const key = img.src.split('/').pop() ?? ''
    return [{ base: mediaBase(img.src), width: img.width, height: img.height, maps: Boolean((maps as Record<string, { maps?: boolean }>)[key]?.maps) }]
  })

  return (
    <CeremonyPay
      ceremony={{ pieces, names: order.items.map((i) => i.name), city: address.city ?? 'your door', pincode, eta: `${fmt(days[0])} – ${fmt(days[1])}`, total: formatINR(order.totalPaise) }}
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
