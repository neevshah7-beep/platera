import 'server-only'

/**
 * Shiprocket (apiv2.shiprocket.in/v1/external). Used for PIN code serviceability,
 * creating the shipment once an order is packed, assigning the courier (AWB),
 * requesting pickup, the label, and tracking. Without credentials every function
 * reports "not connected" and the admin falls back to entering courier and AWB by hand.
 */
const BASE = 'https://apiv2.shiprocket.in/v1/external'
let cached: { token: string; expires: number } | null = null

export function shiprocketConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD && process.env.SHIPROCKET_PICKUP_LOCATION)
}

async function token(): Promise<string> {
  if (cached && cached.expires > Date.now()) return cached.token
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Shiprocket login failed (${res.status})`)
  const { token } = (await res.json()) as { token: string }
  cached = { token, expires: Date.now() + 8 * 86_400_000 } // tokens last 10 days
  return token
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}`, ...(init.headers ?? {}) },
    cache: 'no-store',
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Shiprocket ${path}: ${res.status} ${body.slice(0, 300)}`)
  return JSON.parse(body) as T
}

export type Serviceability = { serviceable: boolean; etdDays?: number; courier?: string }

export async function checkServiceability(pincode: string, weightKg = 0.5, declaredValueRupees = 5000): Promise<Serviceability | null> {
  if (!shiprocketConfigured()) return null
  const pickup = process.env.SHIPROCKET_PICKUP_PINCODE ?? '400091'
  const q = new URLSearchParams({ pickup_postcode: pickup, delivery_postcode: pincode, weight: String(weightKg), cod: '0', declared_value: String(declaredValueRupees) })
  const r = await call<{ data?: { available_courier_companies?: { courier_name: string; etd_hours?: number; estimated_delivery_days?: string }[]; recommended_courier_company_id?: number } }>(
    `/courier/serviceability/?${q}`,
  )
  const couriers = r.data?.available_courier_companies ?? []
  if (!couriers.length) return { serviceable: false }
  const best = couriers[0]
  const days = Number(best.estimated_delivery_days) || (best.etd_hours ? Math.ceil(best.etd_hours / 24) : undefined)
  return { serviceable: true, etdDays: days, courier: best.courier_name }
}

type ShipInput = {
  number: string
  createdAt: Date
  name: string
  email: string
  phone: string
  address: { line1: string; line2?: string; city: string; state: string; pincode: string }
  items: { name: string; sku: string; qty: number; unitTotalPaise: number }[]
  totalPaise: number
  weightKg: number
}

export async function createShipment(o: ShipInput): Promise<{ shiprocketOrderId: string; shipmentId: string; awb?: string; courier?: string; labelUrl?: string }> {
  const [first, ...rest] = o.name.trim().split(/\s+/)
  const created = await call<{ order_id: number; shipment_id: number }>('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify({
      order_id: o.number,
      order_date: o.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
      billing_customer_name: first,
      billing_last_name: rest.join(' ') || '.',
      billing_address: o.address.line1,
      billing_address_2: o.address.line2 ?? '',
      billing_city: o.address.city,
      billing_pincode: o.address.pincode,
      billing_state: o.address.state,
      billing_country: 'India',
      billing_email: o.email,
      billing_phone: o.phone,
      shipping_is_billing: true,
      order_items: o.items.map((i) => ({ name: i.name, sku: i.sku, units: i.qty, selling_price: (i.unitTotalPaise / 100).toFixed(2) })),
      payment_method: 'Prepaid',
      sub_total: (o.totalPaise / 100).toFixed(2),
      length: 15,
      breadth: 12,
      height: 6,
      weight: o.weightKg,
    }),
  })
  const shipmentId = String(created.shipment_id)
  const out: Awaited<ReturnType<typeof createShipment>> = { shiprocketOrderId: String(created.order_id), shipmentId }

  try {
    const awb = await call<{ response?: { data?: { awb_code?: string; courier_name?: string } } }>('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentId }),
    })
    out.awb = awb.response?.data?.awb_code
    out.courier = awb.response?.data?.courier_name
    await call('/courier/generate/pickup', { method: 'POST', body: JSON.stringify({ shipment_id: [shipmentId] }) })
    const label = await call<{ label_url?: string }>('/courier/generate/label', { method: 'POST', body: JSON.stringify({ shipment_id: [shipmentId] }) })
    out.labelUrl = label.label_url
  } catch (e) {
    // The shipment exists; the courier can be assigned from the Shiprocket panel.
    console.error('Shiprocket AWB/pickup/label step failed', e)
  }
  return out
}

export type TrackingEvent = { at: string; status: string; location?: string }

export async function trackAwb(awb: string): Promise<{ status: string; events: TrackingEvent[]; delivered: boolean } | null> {
  if (!shiprocketConfigured()) return null
  const r = await call<{ tracking_data?: { shipment_status?: number; shipment_track?: { current_status?: string }[]; shipment_track_activities?: { date: string; activity: string; location?: string }[] } }>(
    `/courier/track/awb/${encodeURIComponent(awb)}`,
  )
  const t = r.tracking_data
  const status = t?.shipment_track?.[0]?.current_status ?? 'In transit'
  return {
    status,
    delivered: /delivered/i.test(status),
    events: (t?.shipment_track_activities ?? []).map((a) => ({ at: a.date, status: a.activity, location: a.location })),
  }
}
