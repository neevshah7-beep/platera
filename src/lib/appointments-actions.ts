'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/catalogue'
import { bookableDates, slotsForDay, takenSlots } from '@/lib/appointments'
import { rateLimit } from '@/lib/rate-limit'
import { appointmentSchema, enquirySchema, fieldErrors } from '@/lib/validation'

export type FormState = { ok: boolean; errors: Record<string, string>; message?: string; values?: Record<string, string> } | null

const values = (form: FormData) =>
  Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')) as Record<string, string>

export async function requestAppointment(_: FormState, form: FormData): Promise<FormState> {
  const v = values(form)
  if (!(await rateLimit('appointment', 5, 600))) return { ok: false, errors: {}, message: 'Too many requests. Please call or WhatsApp us instead.', values: v }

  const parsed = appointmentSchema.safeParse({
    kind: form.get('kind'),
    date: form.get('date'),
    slot: form.get('slot'),
    name: form.get('name'),
    phone: form.get('phone'),
    email: form.get('email') ?? '',
    notes: form.get('notes') ?? '',
    pieces: form.getAll('pieces').filter((p) => typeof p === 'string'),
  })
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: 'Please check the highlighted fields.', values: v }
  const a = parsed.data

  const closed = ((await getSetting('closedWeekdays')) as number[] | null) ?? []
  if (!bookableDates(closed).some((d) => d.value === a.date) || !slotsForDay().includes(a.slot)) {
    return { ok: false, errors: { date: 'That day or time isn’t available. Please choose another.' }, values: v }
  }
  if ((await takenSlots([a.date])).has(`${a.date} ${a.slot}`)) {
    return { ok: false, errors: { slot: 'Someone has just taken that time. Please choose another.' }, values: v }
  }

  const products = a.pieces.length ? await db.product.findMany({ where: { slug: { in: a.pieces } }, select: { id: true } }) : []
  await db.appointment.create({
    data: {
      kind: a.kind,
      date: new Date(`${a.date}T00:00:00Z`),
      slot: a.slot,
      name: a.name,
      phone: a.phone,
      email: a.email || null,
      notes: a.notes || null,
      productIds: products.map((p) => p.id),
    },
  })
  revalidatePath('/admin/appointments')
  return { ok: true, errors: {}, message: 'requested' }
}

export async function sendEnquiry(_: FormState, form: FormData): Promise<FormState> {
  const v = values(form)
  if (!(await rateLimit('enquiry', 5, 600))) return { ok: false, errors: {}, message: 'Too many messages. Please WhatsApp us instead.', values: v }
  const parsed = enquirySchema.safeParse({
    kind: form.get('kind'),
    productSlug: form.get('productSlug') || undefined,
    name: form.get('name'),
    phone: form.get('phone'),
    email: form.get('email') ?? '',
    message: form.get('message'),
  })
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: 'Please check the highlighted fields.', values: v }
  const e = parsed.data
  const product = e.productSlug ? await db.product.findUnique({ where: { slug: e.productSlug }, select: { id: true } }) : null
  await db.enquiry.create({
    data: { kind: e.kind, productId: product?.id, name: e.name, phone: e.phone, email: e.email || null, message: e.message },
  })
  revalidatePath('/admin/enquiries')
  return { ok: true, errors: {}, message: 'sent' }
}
