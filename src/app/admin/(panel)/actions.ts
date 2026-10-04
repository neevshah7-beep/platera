'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/auth/admin'
import { formatINR } from '@/lib/pricing/format'
import { rateSchema } from '@/lib/validation'

export type RateState = { ok: boolean; message: string } | null

/** The ten-second job: type today's rate, press Update. Everything re-prices. */
export async function updateRate(_: RateState, form: FormData): Promise<RateState> {
  const user = await requireAdmin('OWNER')
  const parsed = rateSchema.safeParse({ metal: form.get('metal') ?? 'SILVER_925', rupeesPerGram: form.get('rate') })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const { metal, rupeesPerGram: paise } = parsed.data
  const previous = await db.metalRate.findFirst({ where: { metal, effectiveAt: { lte: new Date() } }, orderBy: { effectiveAt: 'desc' } })

  // Guard against a slip of the finger: a move of more than 15% needs a second press.
  if (previous && Math.abs(paise - previous.paisePerGram) / previous.paisePerGram > 0.15 && form.get('confirmBigMove') !== 'yes') {
    return {
      ok: false,
      message: `That’s a big change, from ${formatINR(previous.paisePerGram)} to ${formatINR(paise)}. If it’s right, press Update again.`,
    }
  }

  const rate = await db.metalRate.create({ data: { metal, paisePerGram: paise, setById: user.id } })
  await audit(user.id, 'rate.set', 'MetalRate', rate.id, { metal, paise, previous: previous?.paisePerGram })
  revalidatePath('/', 'layout')
  return { ok: true, message: `Done. Every piece is now priced at ${formatINR(paise)} per gram.` }
}
